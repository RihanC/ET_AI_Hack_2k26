import { Router } from "express";
import multer from "multer";
import { ingestUpload } from "../rag/ragService.js";
import { documentStore } from "../rag/documentStore.js";
import { vectorStore } from "../rag/vectorStore.js";
import { detectFileType } from "../rag/loaders/loaderRegistry.js";
import { conversationStore } from "../store/conversationStore.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 10 }, // 25MB/file, 10 files/request
});

export const documentRouter = Router();

// Multiple uploads per request, associated with a conversation.
documentRouter.post("/conversations/:id/documents", upload.array("files", 10), async (req, res) => {
  const conversation = conversationStore.get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded. Attach one or more files under field 'files'." });
  }

  const results = [];
  for (const file of files) {
    const fileType = detectFileType(file.originalname);
    if (!fileType) {
      results.push({ fileName: file.originalname, error: "Unsupported file type" });
      continue;
    }
    const record = await ingestUpload(req.params.id, file.originalname, fileType, file.buffer);
    results.push({ fileName: file.originalname, documentId: record.id, status: record.status });
  }

  // 202: ingestion continues in the background; poll GET /documents/:docId for status.
  res.status(202).json({ uploaded: results });
});

documentRouter.get("/conversations/:id/documents", (req, res) => {
  res.json({ documents: documentStore.listByConversation(req.params.id) });
});

documentRouter.get("/documents/:docId", (req, res) => {
  const doc = documentStore.get(req.params.docId);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json({ document: doc });
});

documentRouter.delete("/documents/:docId", (req, res) => {
  const doc = documentStore.get(req.params.docId);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  vectorStore.removeByDocumentId(req.params.docId);
  documentStore.remove(req.params.docId);
  res.status(204).send();
});
