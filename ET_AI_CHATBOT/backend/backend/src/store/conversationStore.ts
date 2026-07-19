import { v4 as uuid } from "uuid";
import type { ChatMessage, Conversation, ConversationSummaryDTO } from "../types.js";

/**
 * In-memory conversation store, keyed by conversation (session) id.
 * Swap this for a real DB (Postgres/Redis) later — the interface below
 * (`ConversationStore`) is the contract the rest of the app depends on,
 * so that swap doesn't ripple through the routes/services layers.
 */

const MAX_MESSAGES_IN_CONTEXT = 24; // sliding window: last N messages sent to the model
const MAX_CHARS_PER_MESSAGE_IN_CONTEXT = 4000; // guard against one giant message blowing the budget

export interface ConversationStore {
  create(title?: string): Conversation;
  get(id: string): Conversation | undefined;
  list(): ConversationSummaryDTO[];
  appendMessage(id: string, message: ChatMessage): Conversation;
  getContextWindow(id: string): ChatMessage[];
  remove(id: string): boolean;
}

class InMemoryConversationStore implements ConversationStore {
  private conversations = new Map<string, Conversation>();

  create(title = "New conversation"): Conversation {
    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: uuid(),
      title,
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  get(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  list(): ConversationSummaryDTO[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt,
        messageCount: c.messages.length,
      }));
  }

  appendMessage(id: string, message: ChatMessage): Conversation {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      throw new Error(`Conversation ${id} not found`);
    }
    conversation.messages.push(message);
    conversation.updatedAt = message.createdAt;

    // Auto-title from the first user message, so the sidebar isn't full of "New conversation".
    if (conversation.title === "New conversation" && message.role === "user") {
      conversation.title = message.content.slice(0, 60);
    }
    return conversation;
  }

  /**
   * Returns a bounded slice of message history suitable for sending to the model:
   * last MAX_MESSAGES_IN_CONTEXT messages, each truncated to a character budget.
   * This is intentionally simple (sliding window) rather than semantic summarization —
   * summarization is a reasonable phase-2 upgrade once conversations run long enough
   * to need it, without changing this interface.
   */
  getContextWindow(id: string): ChatMessage[] {
    const conversation = this.conversations.get(id);
    if (!conversation) return [];
    const windowed = conversation.messages.slice(-MAX_MESSAGES_IN_CONTEXT);
    return windowed.map((m) => ({
      ...m,
      content:
        m.content.length > MAX_CHARS_PER_MESSAGE_IN_CONTEXT
          ? m.content.slice(0, MAX_CHARS_PER_MESSAGE_IN_CONTEXT) + " …[truncated]"
          : m.content,
    }));
  }

  remove(id: string): boolean {
    return this.conversations.delete(id);
  }
}

export const conversationStore: ConversationStore = new InMemoryConversationStore();
