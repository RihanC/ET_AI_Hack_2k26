import { v4 as uuid } from "uuid";
import { loadFile } from "./loaders/loaderRegistry.js";
import { splitText } from "./textSplitter.js";
import { LocalHashEmbeddingProvider } from "./embeddings/localHashEmbeddingProvider.js";
import type { EmbeddingProvider } from "./embeddings/embeddingProvider.js";
import { vectorStore } from "./vectorStore.js";
import { documentStore } from "./documentStore.js";
import type { Chunk, DocumentRecord, RagCitation, RetrievedChunk, SupportedFileType } from "./types.js";

// Default provider works fully offline (see file for tradeoffs). Swap for
// OpenAIEmbeddingProvider/VoyageEmbeddingProvider in environments with network access.
const embeddingProvider: EmbeddingProvider = new LocalHashEmbeddingProvider();

/**
 * Ingests one uploaded file: loads -> splits -> embeds -> stores chunks.
 * Registers a DocumentRecord immediately in "queued" status and updates it
 * as processing proceeds, so the client can poll /documents/:id for progress
 * instead of holding the upload request open for the whole pipeline.
 */
export async function ingestUpload(
  conversationId: string,
  fileName: string,
  fileType: SupportedFileType,
  buffer: Buffer
): Promise<DocumentRecord> {
  const documentId = uuid();
  const record: DocumentRecord = {
    id: documentId,
    conversationId,
    fileName,
    fileType,
    status: "queued",
    chunkCount: 0,
    uploadedAt: new Date().toISOString(),
  };
  documentStore.create(record);

  // Fire-and-forget background processing; caller gets the record back immediately.
  void processDocument(documentId, conversationId, fileName, buffer).catch((err) => {
    documentStore.update(documentId, {
      status: "failed",
      error: err instanceof Error ? err.message : "Unknown ingestion error",
    });
  });

  return record;
}

async function processDocument(
  documentId: string,
  conversationId: string,
  fileName: string,
  buffer: Buffer
): Promise<void> {
  documentStore.update(documentId, { status: "processing" });

  const loaded = await loadFile(buffer, fileName);
  const allChunks: Chunk[] = [];

  for (const doc of loaded) {
    if (!doc.text.trim()) continue; // e.g. image with no OCR, or empty sheet
    const pieces = splitText(doc.text, { chunkSize: 1000, chunkOverlap: 150 });
    const embeddings = await embeddingProvider.embed(pieces);

    pieces.forEach((text, i) => {
      allChunks.push({
        id: uuid(),
        documentId,
        conversationId,
        fileName: doc.fileName,
        text,
        chunkIndex: i,
        embedding: embeddings[i],
      });
    });
  }

  vectorStore.add(allChunks);
  documentStore.update(documentId, {
    status: "indexed",
    chunkCount: allChunks.length,
    indexedAt: new Date().toISOString(),
  });
}

export interface RetrievalResult {
  contextText: string;
  citations: RagCitation[];
}

/**
 * Retrieves the top-K most relevant chunks for a query within a conversation's
 * uploaded documents, and formats them into both a context block for the LLM
 * and a citation list for the client to render.
 */
export async function retrieveContext(
  conversationId: string,
  query: string,
  topK = 5
): Promise<RetrievalResult> {
  const [queryEmbedding] = await embeddingProvider.embed([query]);
  const results: RetrievedChunk[] = vectorStore.search(conversationId, queryEmbedding, query, topK);

  const contextText = results
    .map((r, i) => `[Source ${i + 1}: ${r.chunk.fileName}, chunk ${r.chunk.chunkIndex}]\n${r.chunk.text}`)
    .join("\n\n");

  const citations: RagCitation[] = results.map((r) => ({
    documentId: r.chunk.documentId,
    fileName: r.chunk.fileName,
    chunkIndex: r.chunk.chunkIndex,
    excerpt: r.chunk.text.slice(0, 200),
  }));

  return { contextText, citations };
}
