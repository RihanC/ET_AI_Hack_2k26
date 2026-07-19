import type { EmbeddingProvider } from "./embeddingProvider.js";

/**
 * A real, deterministic, dependency-free embedding: term-frequency feature
 * hashing into a fixed-size vector, L2-normalized. It is NOT a semantic
 * embedding model (no synonym/paraphrase understanding the way a trained
 * transformer embedding gives you) — but it is a genuine bag-of-words vector
 * space where cosine similarity meaningfully reflects shared vocabulary, and
 * it needs no network access, so it can actually be tested in this sandbox.
 *
 * Swap in a real hosted embedding model (Voyage, OpenAI, etc.) for
 * production semantic quality — same EmbeddingProvider interface, no other
 * code changes required. See openAiEmbeddingProvider.ts for that shape.
 */
export class LocalHashEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions: number;

  constructor(dimensions = 512) {
    this.dimensions = dimensions;
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.embedOne(t));
  }

  private embedOne(text: string): number[] {
    const vector = new Array(this.dimensions).fill(0);
    const tokens = tokenize(text);
    if (tokens.length === 0) return vector;

    for (const token of tokens) {
      const idx = hashToken(token, this.dimensions);
      vector[idx] += 1;
    }

    // Log-scale term frequency, then L2 normalize so cosine similarity is well-behaved.
    for (let i = 0; i < vector.length; i++) {
      if (vector[i] > 0) vector[i] = 1 + Math.log(vector[i]);
    }
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map((v) => v / norm);
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function hashToken(token: string, dimensions: number): number {
  let hash = 2166136261; // FNV-1a offset basis
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % dimensions;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // vectors are already L2-normalized, so dot product == cosine similarity
}
