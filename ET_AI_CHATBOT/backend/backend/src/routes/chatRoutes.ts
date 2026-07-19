import { Router } from "express";
import { conversationStore } from "../store/conversationStore.js";
import { streamChatResponse } from "../services/chatService.js";

export const chatRouter = Router();

// List conversations (sidebar)
chatRouter.get("/conversations", (_req, res) => {
  res.json({ conversations: conversationStore.list() });
});

// Create a new conversation/session
chatRouter.post("/conversations", (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title : undefined;
  const conversation = conversationStore.create(title);
  res.status(201).json({ conversation });
});

// Fetch a single conversation with full message history
chatRouter.get("/conversations/:id", (req, res) => {
  const conversation = conversationStore.get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }
  res.json({ conversation });
});

chatRouter.delete("/conversations/:id", (req, res) => {
  const deleted = conversationStore.remove(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Conversation not found" });
  }
  res.status(204).send();
});

// Streaming chat turn (SSE). Client should read this with EventSource or a fetch+ReadableStream reader.
chatRouter.post("/conversations/:id/messages", async (req, res) => {
  const conversation = conversationStore.get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  const userMessage = req.body?.content;
  if (typeof userMessage !== "string" || !userMessage.trim()) {
    return res.status(400).json({ error: "Request body must include non-empty 'content' string" });
  }

  try {
    await streamChatResponse(req.params.id, userMessage, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
      res.end();
    }
  }
});
