import * as XLSX from "xlsx";
import type { LoadedDocument } from "../types.js";

export async function loadXlsx(buffer: Buffer, fileName: string): Promise<LoadedDocument> {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const sections = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const rowText = rows
      .map((row, i) => {
        const fields = Object.entries(row)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        return `Row ${i + 1} — ${fields}`;
      })
      .join("\n");
    return `## Sheet: ${sheetName}\n${rowText}`;
  });

  return { text: sections.join("\n\n"), fileName, fileType: "xlsx" };
}
