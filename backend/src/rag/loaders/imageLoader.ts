import type { LoadedDocument } from "../types.js";

/**
 * OCR requires either a hosted OCR/vision API or a local model with downloadable
 * weights — neither is reachable from this sandbox's network allowlist. Rather
 * than fake extracted text, this loader is honest about the gap and returns an
 * empty-text document with a note, so it fails loudly (chunk count 0) instead
 * of silently poisoning the index with hallucinated content.
 *
 * To make images real: plug a real OCR provider here (Tesseract.js with local
 * language data, Claude/GPT-4V for handwritten/complex layouts, or Textract/
 * Document AI) — same LoadedDocument return shape, no other code changes needed.
 */
export async function loadImage(_buffer: Buffer, fileName: string): Promise<LoadedDocument> {
  return {
    text: "",
    fileName,
    fileType: "image",
    note: "OCR is not available in this environment. Wire a real OCR/vision provider into loadImage() to index image content.",
  };
}
