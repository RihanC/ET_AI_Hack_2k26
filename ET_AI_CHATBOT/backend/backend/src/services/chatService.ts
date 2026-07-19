import type { Response } from "express";
import { toolDefinitions, executeTool } from "../tools/toolRegistry.js";
import { conversationStore } from "../store/conversationStore.js";
import type { ChatMessage, ToolCitation, ToolDefinition } from "../types.js";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
const MAX_TOOL_ITERATIONS = 4; // hard cap so a confused loop can't spin forever

const SAFEMIND_SYSTEM_PROMPT = `You are SafeMind, an industrial safety assistant for plant operators and safety officers.
You have tools to look up regulations (query_safety_regulations), live sensor readings (check_live_scada_sensors),
active work permits (get_active_permits), and passages from documents the user has uploaded to this conversation
(search_uploaded_documents). Use them whenever a question touches on a specific zone, permit, regulatory question,
or anything that might be answered by an uploaded document — do not guess at live data, cite regulations from
memory, or assume what an uploaded file says.

Never evaluate a sensor reading in isolation from active permits in the same zone: a sub-threshold reading
combined with an active hot work or confined space permit can be a compound risk even when no single value
crosses its own alarm threshold. Call out this kind of correlation explicitly when it applies.

Answer conversationally and clearly, in Markdown. When you rely on a tool result, say so in plain language
(e.g. "Per the active permit for Zone 4..."), you do not need to expose raw JSON to the user.`;

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set in the backend environment.");
  }
  return key;
}

// --- Gemini request/response shapes (generateContent / streamGenerateContent) ---

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiCandidate {
  content: GeminiContent;
  finishReason?: string;
}

interface GeminiGenerateContentResponse {
  candidates: GeminiCandidate[];
}

/** Anthropic-shaped ToolDefinition (name/description/input_schema) -> Gemini functionDeclarations shape. */
function toGeminiTools(defs: ToolDefinition[]) {
  return [
    {
      functionDeclarations: defs.map((d) => ({
        name: d.name,
        description: d.description,
        parameters: d.input_schema,
      })),
    },
  ];
}

function toGeminiContents(history: ChatMessage[]): GeminiContent[] {
  return history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

/**
 * Runs the tool-calling loop (non-streaming generateContent) until the model
 * stops requesting functions, then makes a final STREAMING call
 * (streamGenerateContent?alt=sse) for the user-facing answer. Tool-use turns
 * are cheap/short (JSON payloads), so they don't need to stream; the final
 * natural-language answer is what actually benefits from streaming.
 */
export async function streamChatResponse(
  conversationId: string,
  userMessage: string,
  res: Response
): Promise<void> {
  const apiKey = getApiKey();

  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: userMessage,
    createdAt: new Date().toISOString(),
  };
  conversationStore.appendMessage(conversationId, userMsg);

  const collectedCitations: ToolCitation[] = [];
  let contents = toGeminiContents(conversationStore.getContextWindow(conversationId));
  const tools = toGeminiTools(toolDefinitions);

  // --- Tool-calling loop -------------------------------------------------
  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const response = await fetch(`${GEMINI_API_BASE}/${MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents,
        tools,
        systemInstruction: { parts: [{ text: SAFEMIND_SYSTEM_PROMPT }] },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as GeminiGenerateContentResponse;
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];
    const functionCalls = parts.filter((p) => p.functionCall);

    if (functionCalls.length === 0) {
      // No more tools requested — fall through to the streaming final call below.
      break;
    }

    // Append the model's turn (containing the functionCall parts), then run
    // every requested tool and append a single "user" turn carrying all the
    // functionResponse parts, per Gemini's multi-turn function-calling protocol.
    contents.push({ role: "model", parts });

    const functionResponseParts: GeminiPart[] = await Promise.all(
      functionCalls.map(async (p) => {
        const call = p.functionCall!;
        const result = await executeTool(call.name, call.args ?? {}, conversationId);
        collectedCitations.push(result.citation);
        return {
          functionResponse: {
            name: call.name,
            response: { result: result.resultText },
          },
        };
      })
    );

    contents.push({ role: "user", parts: functionResponseParts });
  }

  // --- Final streaming call ----------------------------------------------
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const streamResponse = await fetch(`${GEMINI_API_BASE}/${MODEL}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: SAFEMIND_SYSTEM_PROMPT }] },
    }),
  });

  if (!streamResponse.ok || !streamResponse.body) {
    const errText = await streamResponse.text().catch(() => "");
    res.write(`event: error\ndata: ${JSON.stringify({ message: `Gemini stream error: ${errText}` })}\n\n`);
    res.end();
    return;
  }

  const reader = streamResponse.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;

      try {
        const event = JSON.parse(payload) as GeminiGenerateContentResponse;
        const textPart = event.candidates?.[0]?.content?.parts?.find((p) => typeof p.text === "string");
        if (textPart?.text) {
          fullText += textPart.text;
          res.write(`event: token\ndata: ${JSON.stringify({ text: textPart.text })}\n\n`);
        }
      } catch {
        // Ignore malformed/partial SSE chunks; the buffer logic above re-joins split lines.
      }
    }
  }

  const assistantMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: fullText,
    createdAt: new Date().toISOString(),
    citations: collectedCitations.length ? collectedCitations : undefined,
  };
  conversationStore.appendMessage(conversationId, assistantMsg);

  res.write(`event: done\ndata: ${JSON.stringify({ message: assistantMsg })}\n\n`);
  res.end();
}
