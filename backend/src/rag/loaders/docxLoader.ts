import mammoth from "mammoth";
import type { LoadedDocument } from "../types.js";

export async function loadDocx(buffer: Buffer, fileName: string): Promise<LoadedDocument> {
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value, fileName, fileType: "docx" };
}
