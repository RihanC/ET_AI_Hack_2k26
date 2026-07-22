import type { LoadedDocument } from "../types.js";

export async function loadTxt(buffer: Buffer, fileName: string): Promise<LoadedDocument> {
  return { text: buffer.toString("utf-8"), fileName, fileType: "txt" };
}
