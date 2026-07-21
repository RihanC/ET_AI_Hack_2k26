import type { Chunk, RetrievedChunk } from "./types.js";
import { cosineSimilarity } from "./embeddings/localHashEmbeddingProvider.js";

/**
 * In-memory vector store, scoped by conversationId (each conversation's
 * uploaded documents are only retrievable within that conversation).
 * Swap for Chroma/FAISS/pgvector later — same interface.
 */
export interface VectorStore {
  add(chunks: Chunk[]): void;
  removeByDocumentId(documentId: string): void;
  search(conversationId: string, queryEmbedding: number[], queryText: string, topK: number): RetrievedChunk[];
}

class InMemoryVectorStore implements VectorStore {
  private chunksByConversation = new Map<string, Chunk[]>();

  add(chunks: Chunk[]): void {
    for (const chunk of chunks) {
      const existing = this.chunksByConversation.get(chunk.conversationId) ?? [];
      existing.push(chunk);
      this.chunksByConversation.set(chunk.conversationId, existing);
    }
  }

  removeByDocumentId(documentId: string): void {
    for (const [convId, chunks] of this.chunksByConversation.entries()) {
      this.chunksByConversation.set(convId, chunks.filter((c) => c.documentId !== documentId));
    }
  }

  /**
   * Hybrid retrieval: blends cosine similarity (semantic-ish, via the embedding
   * provider) with a simple keyword overlap score (exact term matches), since
   * bag-of-words hash embeddings and small local corpora both benefit from not
   * relying on vector similarity alone. Weighted 70/30 vector/keyword.
   */
  search(conversationId: string, queryEmbedding: number[], queryText: string, topK: number): RetrievedChunk[] {
    const chunks = this.chunksByConversation.get(conversationId) ?? [];
    const queryTerms = new Set(tokenize(queryText));

    const scored: RetrievedChunk[] = chunks
      .filter((c) => c.embedding)
      .map((chunk) => {
        const vectorScore = cosineSimilarity(chunk.embedding!, queryEmbedding);
        const keywordScore = keywordOverlapScore(chunk.text, queryTerms);
        const score = 0.7 * vectorScore + 0.3 * keywordScore;
        return { chunk, score };
      });

    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

function keywordOverlapScore(text: string, queryTerms: Set<string>): number {
  if (queryTerms.size === 0) return 0;
  const textTerms = new Set(tokenize(text));
  let hits = 0;
  for (const term of queryTerms) {
    if (textTerms.has(term)) hits++;
  }
  return hits / queryTerms.size;
}

export const vectorStore: VectorStore = new InMemoryVectorStore();
