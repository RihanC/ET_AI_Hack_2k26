import { conversationStore } from "../src/store/conversationStore.js";
import { streamChatResponse } from "../src/services/chatService.js";

// Minimal fake Express Response that just records what's written to it.
function makeFakeResponse() {
  const chunks: string[] = [];
  return {
    setHeader: () => {},
    flushHeaders: () => {},
    write: (chunk: string) => { chunks.push(chunk); },
    end: () => {},
    getWritten: () => chunks.join(""),
  } as any;
}

async function main() {
  process.env.GEMINI_API_KEY = "test-key";
  process.env.LIVE_DATA_PROTOCOL = "mock"; // use safetyOrchestrator's mock SCADA/permits

  const conv = conversationStore.create();

  let call = 0;
  const originalFetch = global.fetch;

  // @ts-ignore
  global.fetch = async (url: string, init: any) => {
    const body = JSON.parse(init.body);
    call++;

    if (url.includes(":generateContent") && !url.includes("stream")) {
      // Verify request shape
      if (!body.contents || !body.tools || !body.systemInstruction) {
        throw new Error("generateContent request missing expected fields: " + JSON.stringify(Object.keys(body)));
      }
      if (!body.tools[0].functionDeclarations.some((f: any) => f.name === "check_live_scada_sensors")) {
        throw new Error("Expected check_live_scada_sensors in functionDeclarations");
      }

      if (call === 1) {
        // First turn: model requests a tool call
        return {
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                role: "model",
                parts: [{ functionCall: { name: "check_live_scada_sensors", args: { zoneId: "Zone4" } } }],
              },
              finishReason: "STOP",
            }],
          }),
        };
      }
      // Second turn: model is done calling tools
      return {
        ok: true,
        json: async () => ({
          candidates: [{ content: { role: "model", parts: [{ text: "(non-streaming path not used for final answer)" }] } }],
        }),
      };
    }

    if (url.includes(":streamGenerateContent")) {
      // Verify the tool result made it into contents before the final call
      const lastContent = body.contents[body.contents.length - 1];
      const hasFunctionResponse = lastContent.parts.some((p: any) => p.functionResponse?.name === "check_live_scada_sensors");
      if (!hasFunctionResponse) {
        throw new Error("Expected functionResponse for check_live_scada_sensors in final contents, got: " + JSON.stringify(body.contents));
      }

      const sseFrames = [
        `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "Zone 4 " }] } }] })}\n\n`,
        `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "looks safe." }] } }] })}\n\n`,
      ].join("");

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseFrames));
          controller.close();
        },
      });
      return { ok: true, body: stream };
    }

    throw new Error("Unexpected fetch URL in test: " + url);
  };

  const res = makeFakeResponse();
  await streamChatResponse(conv.id, "Is Zone 4 safe for hot work?", res);

  global.fetch = originalFetch;

  const written = res.getWritten();
  console.log("--- SSE output written to client ---\n" + written);

  if (!written.includes("Zone 4 ") || !written.includes("looks safe.")) {
    throw new Error("Streamed token text was not forwarded to the client correctly");
  }
  if (!written.includes("event: done")) {
    throw new Error("Missing 'done' event");
  }

  const finalConversation = conversationStore.get(conv.id)!;
  const assistantMsg = finalConversation.messages[finalConversation.messages.length - 1];
  if (assistantMsg.content !== "Zone 4 looks safe.") {
    throw new Error("Assembled assistant message content is wrong: " + assistantMsg.content);
  }
  if (!assistantMsg.citations?.some((c) => c.toolName === "check_live_scada_sensors")) {
    throw new Error("Expected a citation for check_live_scada_sensors on the saved assistant message");
  }

  console.log("\nGemini chatService test: PASS");
  console.log("- Tool-calling loop correctly sent functionDeclarations and parsed functionCall");
  console.log("- Tool result correctly round-tripped as functionResponse into the final call");
  console.log("- Streamed SSE text correctly assembled and forwarded to the client");
  console.log("- Citation correctly attached to the saved assistant message");
}

main().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
