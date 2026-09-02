// Respongo CRM — V2 Revizeler Bölüm E: paylaşılan Excel (xlsx) yardımcıları.
// Hem leads hem customer_pool import/export akışları bunu kullanıyor —
// SheetJS (xlsx) tercih edildi: hafif, bağımlılık ağacı küçük, hem okuma hem
// yazma destekliyor, ek bir sunucu servisi gerektirmiyor.
import * as XLSX from "xlsx";

export function buildXlsxBuffer(
  headers: readonly string[],
  rows: (string | number | null)[][],
  sheetName = "Sayfa1"
): Buffer {
  const data: (string | number | null)[][] = [[...headers], ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet["!cols"] = headers.map(() => ({ wch: 22 }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function parseXlsxBuffer(buffer: ArrayBuffer | Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
}

export function excelResponseHeaders(filename: string): HeadersInit {
  return {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${filename}"`,
  };
}

// Excel hücre değerini güvenle string'e çevirir (null/undefined -> "", trim'li).
export function cellStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}
