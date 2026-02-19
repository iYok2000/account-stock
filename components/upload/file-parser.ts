import * as XLSX from "xlsx";
import Papa from "papaparse";

export interface ParsedData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  fileName: string;
  fileType: "csv" | "xlsx";
  warnings: string[];
}

const MAX_ROWS = 50_000;
const CSV_INJECTION_CHARS = ["=", "+", "-", "@", "\t", "\r"];

function sanitizeCell(value: string): { sanitized: string; wasInjection: boolean } {
  const trimmed = value.trim();
  if (trimmed.length > 0 && CSV_INJECTION_CHARS.includes(trimmed[0])) {
    return { sanitized: "'" + trimmed, wasInjection: true };
  }
  return { sanitized: trimmed, wasInjection: false };
}

export async function parseFile(file: File): Promise<ParsedData> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    return parseCSV(file);
  }
  if (ext === "xlsx" || ext === "xls") {
    return parseExcel(file);
  }

  throw new Error("รูปแบบไฟล์ไม่รองรับ กรุณาใช้ไฟล์ .xlsx หรือ .csv");
}

async function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: (results) => {
        const allRows = results.data as string[][];
        if (allRows.length < 2) {
          reject(new Error("ไฟล์ CSV ว่างหรือมีข้อมูลไม่เพียงพอ (ต้องมีอย่างน้อย 1 header + 1 data row)"));
          return;
        }
        const dataRowCount = allRows.length - 1;
        if (dataRowCount > MAX_ROWS) {
          reject(new Error(`ไฟล์มีข้อมูล ${dataRowCount.toLocaleString()} แถว เกินขีดจำกัด ${MAX_ROWS.toLocaleString()} แถว`));
          return;
        }
        const warnings: string[] = [];
        const headers = allRows[0].map((h) => String(h).trim());
        const rows = allRows.slice(1).map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const { sanitized, wasInjection } = sanitizeCell(String(cell ?? ""));
            if (wasInjection) {
              warnings.push(`แถว ${rowIdx + 2} คอลัมน์ "${headers[colIdx] ?? colIdx + 1}": ตรวจพบสูตรที่อาจเป็นอันตราย ถูกทำให้ปลอดภัยแล้ว`);
            }
            return sanitized;
          })
        );
        resolve({
          headers,
          rows,
          totalRows: rows.length,
          fileName: file.name,
          fileType: "csv",
          warnings,
        });
      },
      error: (err) => {
        reject(new Error(`ไม่สามารถอ่านไฟล์ CSV ได้: ${err.message}`));
      },
    });
  });
}

async function parseExcel(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error("ไฟล์ Excel ไม่มี sheet"));
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: string[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
          rawNumbers: false,
        });
        if (jsonData.length < 2) {
          reject(new Error("ไฟล์ Excel ว่างหรือมีข้อมูลไม่เพียงพอ (ต้องมีอย่างน้อย 1 header + 1 data row)"));
          return;
        }
        const dataRowCount = jsonData.length - 1;
        if (dataRowCount > MAX_ROWS) {
          reject(new Error(`ไฟล์มีข้อมูล ${dataRowCount.toLocaleString()} แถว เกินขีดจำกัด ${MAX_ROWS.toLocaleString()} แถว`));
          return;
        }
        const warnings: string[] = [];
        const headers = jsonData[0].map((h) => String(h).trim());
        const rows = jsonData.slice(1).map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const { sanitized, wasInjection } = sanitizeCell(String(cell ?? ""));
            if (wasInjection) {
              warnings.push(`แถว ${rowIdx + 2} คอลัมน์ "${headers[colIdx] ?? colIdx + 1}": ตรวจพบสูตรที่อาจเป็นอันตราย ถูกทำให้ปลอดภัยแล้ว`);
            }
            return sanitized;
          })
        );
        resolve({
          headers,
          rows,
          totalRows: rows.length,
          fileName: file.name,
          fileType: "xlsx",
          warnings,
        });
      } catch {
        reject(new Error("ไม่สามารถอ่านไฟล์ Excel ได้ ตรวจสอบว่าไฟล์ไม่เสียหาย"));
      }
    };
    reader.onerror = () => reject(new Error("เกิดข้อผิดพลาดในการอ่านไฟล์"));
    reader.readAsArrayBuffer(file);
  });
}

// Column mapping for account-stock-fe: inventory & orders
export const INVENTORY_FIELDS = [
  { field: "name", label: "ชื่อสินค้า", required: true },
  { field: "sku", label: "SKU", required: false },
  { field: "quantity", label: "จำนวน", required: true },
  { field: "status", label: "สถานะ", required: false },
] as const;

export const ORDER_FIELDS = [
  { field: "customerName", label: "ชื่อลูกค้า", required: false },
  { field: "orderDate", label: "วันที่สั่งซื้อ", required: true },
  { field: "totalAmount", label: "ยอดรวม", required: true },
  { field: "status", label: "สถานะ", required: false },
  { field: "productName", label: "ชื่อสินค้า", required: false },
  { field: "quantity", label: "จำนวน", required: false },
  { field: "unitPrice", label: "ราคาต่อชิ้น", required: false },
] as const;

export type DataType = "inventory" | "orders";

export function getFieldsForType(dataType: DataType) {
  switch (dataType) {
    case "inventory":
      return INVENTORY_FIELDS;
    case "orders":
      return ORDER_FIELDS;
  }
}

export function autoDetectMappings(
  headers: string[],
  dataType: DataType
): Map<number, string> {
  const fields = getFieldsForType(dataType);
  const mappings = new Map<number, string>();
  const keywordMap: Record<string, string[]> = {
    name: ["ชื่อ", "name", "สินค้า", "product"],
    sku: ["sku", "รหัส", "code"],
    quantity: ["จำนวน", "qty", "quantity"],
    status: ["สถานะ", "status"],
    customerName: ["ชื่อ", "ลูกค้า", "customer"],
    orderDate: ["วันที่", "date", "order date"],
    totalAmount: ["ยอด", "เงิน", "amount", "total", "รวม"],
    productName: ["สินค้า", "product"],
    unitPrice: ["ราคา", "price", "ต่อชิ้น"],
  };

  headers.forEach((header, index) => {
    const lowerHeader = header.toLowerCase();
    for (const f of fields) {
      if (mappings.has(index)) break;
      const alreadyMapped = Array.from(mappings.values()).includes(f.field);
      if (alreadyMapped) continue;
      const keywords = keywordMap[f.field] ?? [];
      for (const kw of keywords) {
        if (lowerHeader.includes(kw.toLowerCase())) {
          mappings.set(index, f.field);
          break;
        }
      }
    }
  });

  return mappings;
}

export function validateRows(
  rows: string[][],
  mappings: Map<number, string>,
  dataType: DataType
): { validCount: number; invalidRows: number[]; errors: string[]; rowErrors: string[] } {
  const fields = getFieldsForType(dataType);
  const requiredFields = fields.filter((f) => f.required).map((f) => f.field);
  const invalidRows: number[] = [];
  const errors: string[] = [];

  for (const req of requiredFields) {
    const isMapped = Array.from(mappings.values()).includes(req);
    if (!isMapped) {
      const fieldDef = fields.find((f) => f.field === req);
      errors.push(`ฟิลด์ "${fieldDef?.label ?? req}" จำเป็นต้องจับคู่คอลัมน์`);
    }
  }

  if (errors.length > 0) {
    return { validCount: 0, invalidRows: [], errors, rowErrors: [] };
  }

  const rowErrors: string[] = [];
  rows.forEach((row, rowIndex) => {
    const missingFields: string[] = [];
    for (const req of requiredFields) {
      const colIndex = Array.from(mappings.entries()).find(([, field]) => field === req)?.[0];
      if (colIndex !== undefined) {
        const value = row[colIndex]?.trim();
        if (!value) {
          const fieldDef = fields.find((f) => f.field === req);
          missingFields.push(fieldDef?.label ?? req);
        }
      }
    }
    if (missingFields.length > 0) {
      invalidRows.push(rowIndex);
      if (rowErrors.length < 10) {
        rowErrors.push(`แถว ${rowIndex + 2}: ขาดข้อมูล ${missingFields.join(", ")}`);
      }
    }
  });

  return {
    validCount: rows.length - invalidRows.length,
    invalidRows,
    errors,
    rowErrors,
  };
}
