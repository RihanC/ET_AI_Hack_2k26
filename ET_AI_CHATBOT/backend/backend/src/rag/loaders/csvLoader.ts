import Papa from "papaparse";
import type { LoadedDocument } from "../types.js";

export async function loadCsv(buffer: Buffer, fileName: string): Promise<LoadedDocument> {
  const raw = buffer.toString("utf-8");
  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true });

  const text = parsed.data
    .map((row, i) => {
      const fields = Object.entries(row)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      return `Row ${i + 1} — ${fields}`;
    })
    .join("\n");

  return { text, fileName, fileType: "csv" };
}
