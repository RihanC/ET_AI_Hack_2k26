export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  /** Populated when the assistant's answer relied on a tool call (RAG/telemetry). */
  citations?: ToolCitation[];
}

export interface ToolCitation {
  toolName: string;
  summary: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ConversationSummaryDTO {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

/** Anthropic-shaped tool definition, kept local so tool schemas live next to their handlers. */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

export interface ToolHandlerResult {
  toolName: string;
  resultText: string;
  citation: ToolCitation;
}
