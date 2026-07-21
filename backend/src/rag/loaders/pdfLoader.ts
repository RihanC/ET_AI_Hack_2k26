import { PDFParse } from "pdf-parse";
import type { LoadedDocument } from "../types.js";

export async function loadPdf(buffer: Buffer, fileName: string): Promise<LoadedDocument> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return {
    text: result.text,
    fileName,
    fileType: "pdf",
    note: result.text.trim().length === 0
      ? "No extractable text found — this PDF may be scanned/image-based and requires OCR, which is not available in this environment."
      : undefined,
  };
}
