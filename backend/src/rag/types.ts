export type SupportedFileType = "pdf" | "docx" | "txt" | "csv" | "xlsx" | "image" | "zip";

export type DocumentStatus = "queued" | "processing" | "indexed" | "failed";

export interface DocumentRecord {
  id: string;
  conversationId: string;
  fileName: string;
  fileType: SupportedFileType;
  status: DocumentStatus;
  error?: string;
  chunkCount: number;
  uploadedAt: string;
  indexedAt?: string;
}

export interface Chunk {
  id: string;
  documentId: string;
  conversationId: string;
  fileName: string;
  text: string;
  chunkIndex: number;
  /** Present once embedded; absent while a chunk is queued. */
  embedding?: number[];
}

export interface RetrievedChunk {
  chunk: Chunk;
  score: number;
}

export interface RagCitation {
  documentId: string;
  fileName: string;
  chunkIndex: number;
  excerpt: string;
}

export interface LoadedDocument {
  /** Raw extracted text per logical sub-document (a zip yields one entry per file inside it). */
  text: string;
  fileName: string;
  fileType: SupportedFileType;
  note?: string; // e.g. "OCR not available in this environment"
}
