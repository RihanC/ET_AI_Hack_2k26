/**
 * A dependency-free port of the "recursive character text splitter" pattern:
 * try to split on the largest separator first (paragraphs), and only fall
 * back to smaller separators (sentences, words, characters) for chunks that
 * are still too big. This keeps chunks semantically coherent where possible
 * instead of cutting mid-sentence by default.
 */

export interface SplitOptions {
  chunkSize?: number; // target max characters per chunk
  chunkOverlap?: number; // characters of overlap between consecutive chunks
  separators?: string[]; // ordered largest -> smallest
}

const DEFAULT_SEPARATORS = ["\n\n", "\n", ". ", " ", ""];

export function splitText(text: string, options: SplitOptions = {}): string[] {
  const chunkSize = options.chunkSize ?? 1000;
  const chunkOverlap = options.chunkOverlap ?? 150;
  const separators = options.separators ?? DEFAULT_SEPARATORS;

  const rawChunks = recursiveSplit(text, separators, chunkSize);
  return applyOverlap(rawChunks, chunkOverlap, chunkSize);
}

function recursiveSplit(text: string, separators: string[], chunkSize: number): string[] {
  if (text.length <= chunkSize) return text.trim() ? [text] : [];

  const [sep, ...rest] = separators;
  if (sep === undefined) {
    // No more separators to try — hard-cut at chunkSize as a last resort.
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  const pieces = sep === "" ? text.split("") : text.split(sep);
  const merged: string[] = [];
  let current = "";

  for (const piece of pieces) {
    const candidate = current ? current + sep + piece : piece;
    if (candidate.length <= chunkSize) {
      current = candidate;
    } else {
      if (current) merged.push(current);
      if (piece.length > chunkSize) {
        // This single piece is still too big — recurse with the next smaller separator.
        merged.push(...recursiveSplit(piece, rest, chunkSize));
        current = "";
      } else {
        current = piece;
      }
    }
  }
  if (current) merged.push(current);

  return merged.filter((c) => c.trim().length > 0);
}

function applyOverlap(chunks: string[], overlap: number, chunkSize: number): string[] {
  if (overlap <= 0 || chunks.length <= 1) return chunks;

  const result: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    if (i === 0) {
      result.push(chunks[i]);
      continue;
    }
    const prevTail = chunks[i - 1].slice(-overlap);
    const combined = (prevTail + " " + chunks[i]).trim();
    result.push(combined.length > chunkSize + overlap ? combined.slice(0, chunkSize + overlap) : combined);
  }
  return result;
}
