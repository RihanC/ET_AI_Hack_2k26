import AdmZip from "adm-zip";
import type { LoadedDocument, SupportedFileType } from "../types.js";
import { loadPdf } from "./pdfLoader.js";
import { loadDocx } from "./docxLoader.js";
import { loadTxt } from "./textLoader.js";
import { loadCsv } from "./csvLoader.js";
import { loadXlsx } from "./xlsxLoader.js";
import { loadImage } from "./imageLoader.js";

const EXTENSION_MAP: Record<string, SupportedFileType> = {
  pdf: "pdf",
  docx: "docx",
  txt: "txt",
  md: "txt",
  csv: "csv",
  xlsx: "xlsx",
  xls: "xlsx",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  zip: "zip",
};

export function detectFileType(fileName: string): SupportedFileType | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return EXTENSION_MAP[ext] ?? null;
}

/**
 * Loads a single uploaded file into one or more LoadedDocuments.
 * Most types produce exactly one; ZIP produces one per supported file inside it.
 */
export async function loadFile(buffer: Buffer, fileName: string): Promise<LoadedDocument[]> {
  const fileType = detectFileType(fileName);
  if (!fileType) {
    throw new Error(`Unsupported file type for "${fileName}". Supported: pdf, docx, txt, csv, xlsx, images, zip.`);
  }

  switch (fileType) {
    case "pdf":
      return [await loadPdf(buffer, fileName)];
    case "docx":
      return [await loadDocx(buffer, fileName)];
    case "txt":
      return [await loadTxt(buffer, fileName)];
    case "csv":
      return [await loadCsv(buffer, fileName)];
    case "xlsx":
      return [await loadXlsx(buffer, fileName)];
    case "image":
      return [await loadImage(buffer, fileName)];
    case "zip":
      return loadZip(buffer);
  }
}

async function loadZip(buffer: Buffer): Promise<LoadedDocument[]> {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries().filter((e) => !e.isDirectory);

  const results: LoadedDocument[] = [];
  for (const entry of entries) {
    const innerType = detectFileType(entry.entryName);
    if (!innerType || innerType === "zip") continue; // skip unsupported files and nested zips (avoid zip-bomb recursion)
    try {
      const innerDocs = await loadFile(entry.getData(), entry.entryName);
      results.push(...innerDocs);
    } catch (err) {
      results.push({
        text: "",
        fileName: entry.entryName,
        fileType: innerType,
        note: `Failed to extract from zip: ${err instanceof Error ? err.message : "unknown error"}`,
      });
    }
  }
  return results;
}
