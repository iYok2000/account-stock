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
const MAX_FILE_SIZE_BYTES = 3.5 * 1024 * 1024;
const CSV_INJECTION_CHARS = ["=", "+", "-", "@", "\t", "\r"];

function sanitizeCell(value: string): { sanitized: string; wasInjection: boolean } {
  const trimmed = value.trim();
  if (trimmed.length > 0 && CSV_INJECTION_CHARS.includes(trimmed[0])) {
    return { sanitized: "'" + trimmed, wasInjection: true };
  }
  return { sanitized: trimmed, wasInjection: false };
}

export async function parseFile(file: File): Promise<ParsedData> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("ไฟล์มีขนาดเกิน 3.5MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า");
  }
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

// Column mapping: inventory (legacy) & order_transaction (Phase 1 Import spec)
export const INVENTORY_FIELDS = [
  { field: "name", label: "ชื่อสินค้า", required: true },
  { field: "sku", label: "SKU", required: false },
  { field: "quantity", label: "จำนวน", required: true },
  { field: "status", label: "สถานะ", required: false },
] as const;

/** 60 fields per docs/feature/07-import.md — Order Transaction Column Mapper */
export const ORDER_TRANSACTION_FIELDS = [
  { field: "order_id", label: "Order ID", required: true },
  { field: "order_status", label: "Order Status", required: false },
  { field: "order_substatus", label: "Order Substatus", required: false },
  { field: "cancelation_return_type", label: "Cancelation/Return Type", required: false },
  { field: "normal_or_pre_order", label: "Normal or Pre-order", required: false },
  { field: "sku_id", label: "SKU ID", required: true },
  { field: "seller_sku", label: "Seller SKU", required: false },
  { field: "product_name", label: "Product Name", required: false },
  { field: "variation", label: "Variation", required: false },
  { field: "quantity", label: "Quantity", required: true },
  { field: "sku_quantity_of_return", label: "Sku Quantity of return", required: false },
  { field: "sku_unit_original_price", label: "SKU Unit Original Price", required: false },
  { field: "sku_subtotal_before_discount", label: "SKU Subtotal Before Discount", required: false },
  { field: "sku_platform_discount", label: "SKU Platform Discount", required: false },
  { field: "sku_seller_discount", label: "SKU Seller Discount", required: false },
  { field: "sku_subtotal_after_discount", label: "SKU Subtotal After Discount", required: true },
  { field: "shipping_fee_after_discount", label: "Shipping Fee After Discount", required: false },
  { field: "original_shipping_fee", label: "Original Shipping Fee", required: false },
  { field: "shipping_fee_seller_discount", label: "Shipping Fee Seller Discount", required: false },
  { field: "shipping_fee_platform_discount", label: "Shipping Fee Platform Discount", required: false },
  { field: "payment_platform_discount", label: "Payment platform discount", required: false },
  { field: "taxes", label: "Taxes", required: false },
  { field: "small_order_fee", label: "Small Order Fee", required: false },
  { field: "order_amount", label: "Order Amount", required: false },
  { field: "order_refund_amount", label: "Order Refund Amount", required: false },
  { field: "created_time", label: "Created Time", required: false },
  { field: "paid_time", label: "Paid Time (ไม่ใช้ใน Phase 1)", required: false },
  { field: "rts_time", label: "RTS Time", required: false },
  { field: "shipped_time", label: "Shipped Time", required: false },
  { field: "delivered_time", label: "Delivered Time", required: false },
  { field: "cancelled_time", label: "Cancelled Time", required: false },
  { field: "cancel_by", label: "Cancel By", required: false },
  { field: "cancel_reason", label: "Cancel Reason", required: false },
  { field: "fulfillment_type", label: "Fulfillment Type", required: false },
  { field: "warehouse_name", label: "Warehouse Name", required: false },
  { field: "tracking_id", label: "Tracking ID", required: false },
  { field: "delivery_option", label: "Delivery Option", required: false },
  { field: "shipping_provider_name", label: "Shipping Provider Name", required: false },
  { field: "buyer_message", label: "Buyer Message", required: false },
  { field: "buyer_username", label: "Buyer Username", required: false },
  { field: "recipient", label: "Recipient", required: false },
  { field: "phone", label: "Phone #", required: false },
  { field: "zipcode", label: "Zipcode", required: false },
  { field: "country", label: "Country", required: false },
  { field: "province", label: "Province", required: false },
  { field: "district", label: "District", required: false },
  { field: "detail_address", label: "Detail Address", required: false },
  { field: "additional_address_info", label: "Additional address information", required: false },
  { field: "payment_method", label: "Payment Method", required: false },
  { field: "weight_kg", label: "Weight(kg)", required: false },
  { field: "product_category", label: "Product Category", required: false },
  { field: "package_id", label: "Package ID", required: false },
  { field: "seller_note", label: "Seller Note", required: false },
  { field: "checked_status", label: "Checked Status", required: false },
  { field: "checked_marked_by", label: "Checked Marked by", required: false },
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

export type DataType = "inventory" | "orders" | "order_transaction";

export function getFieldsForType(dataType: DataType) {
  switch (dataType) {
    case "inventory":
      return INVENTORY_FIELDS;
    case "orders":
      return ORDER_FIELDS;
    case "order_transaction":
      return ORDER_TRANSACTION_FIELDS;
  }
}

const ORDER_TRANSACTION_HEADER_KEYWORDS: Record<string, string[]> = {
  order_id: ["order id", "order_id"],
  order_status: ["order status", "order_status"],
  order_substatus: ["order substatus", "order_substatus"],
  cancelation_return_type: ["cancelation", "return type"],
  normal_or_pre_order: ["normal or pre-order", "pre-order"],
  sku_id: ["sku id", "sku_id"],
  seller_sku: ["seller sku", "seller_sku"],
  product_name: ["product name", "product_name"],
  variation: ["variation"],
  quantity: ["quantity", "qty"],
  sku_quantity_of_return: ["quantity of return", "sku quantity of return"],
  sku_unit_original_price: ["unit original price", "sku unit"],
  sku_subtotal_before_discount: ["subtotal before discount"],
  sku_platform_discount: ["platform discount", "sku platform"],
  sku_seller_discount: ["seller discount", "sku seller"],
  sku_subtotal_after_discount: ["subtotal after discount"],
  shipping_fee_after_discount: ["shipping fee after discount"],
  original_shipping_fee: ["original shipping fee"],
  shipping_fee_seller_discount: ["shipping fee seller discount"],
  shipping_fee_platform_discount: ["shipping fee platform discount"],
  payment_platform_discount: ["payment platform discount"],
  taxes: ["taxes"],
  small_order_fee: ["small order fee"],
  order_amount: ["order amount"],
  order_refund_amount: ["order refund amount", "refund amount"],
  created_time: ["created time", "created_time"],
  paid_time: ["paid time", "paid_time"],
  rts_time: ["rts time"],
  shipped_time: ["shipped time"],
  delivered_time: ["delivered time"],
  cancelled_time: ["cancelled time"],
  cancel_by: ["cancel by"],
  cancel_reason: ["cancel reason"],
  fulfillment_type: ["fulfillment type"],
  warehouse_name: ["warehouse name"],
  tracking_id: ["tracking id", "tracking_id"],
  delivery_option: ["delivery option"],
  shipping_provider_name: ["shipping provider"],
  buyer_message: ["buyer message"],
  buyer_username: ["buyer username"],
  recipient: ["recipient"],
  phone: ["phone", "phone #"],
  zipcode: ["zipcode", "zip"],
  country: ["country"],
  province: ["province"],
  district: ["district"],
  detail_address: ["detail address"],
  additional_address_info: ["additional address"],
  payment_method: ["payment method"],
  weight_kg: ["weight", "weight(kg)"],
  product_category: ["product category"],
  package_id: ["package id"],
  seller_note: ["seller note"],
  checked_status: ["checked status"],
  checked_marked_by: ["checked marked by"],
};

export function autoDetectMappings(
  headers: string[],
  dataType: DataType
): Map<number, string> {
  const fields = getFieldsForType(dataType);
  const mappings = new Map<number, string>();

  if (dataType === "order_transaction") {
    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase().trim();
      for (const f of fields) {
        if (mappings.has(index)) break;
        if (Array.from(mappings.values()).includes(f.field)) continue;
        const keywords = ORDER_TRANSACTION_HEADER_KEYWORDS[f.field as keyof typeof ORDER_TRANSACTION_HEADER_KEYWORDS];
        if (!keywords) continue;
        for (const kw of keywords) {
          if (lowerHeader.includes(kw.toLowerCase()) || lowerHeader === kw.toLowerCase().replace(/\s/g, " ")) {
            mappings.set(index, f.field);
            break;
          }
        }
      }
    });
    return mappings;
  }

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

/** Parse numeric cell: trim, remove commas, default 0 if empty/invalid */
function parseNum(val: string): number {
  const s = String(val ?? "").trim().replace(/,/g, "");
  if (s === "") return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/** Get column index for a mapped field */
function getCol(mappings: Map<number, string>, field: string): number | undefined {
  const e = Array.from(mappings.entries()).find(([, f]) => f === field);
  return e?.[0];
}

/** Normalize a row for order_transaction: trim, parse numbers for known numeric fields */
export function normalizeOrderTransactionRow(
  row: string[],
  mappings: Map<number, string>
): Record<string, string | number> {
  const numericFields = new Set([
    "quantity", "sku_quantity_of_return", "sku_unit_original_price", "sku_subtotal_before_discount",
    "sku_platform_discount", "sku_seller_discount", "sku_subtotal_after_discount",
    "shipping_fee_after_discount", "original_shipping_fee", "shipping_fee_seller_discount",
    "shipping_fee_platform_discount", "payment_platform_discount", "taxes", "small_order_fee",
    "order_amount", "order_refund_amount", "weight_kg",
  ]);
  const out: Record<string, string | number> = {};
  for (const f of ORDER_TRANSACTION_FIELDS) {
    const col = getCol(mappings, f.field);
    if (col === undefined) continue;
    const raw = row[col] ?? "";
    if (numericFields.has(f.field)) {
      out[f.field] = parseNum(raw);
    } else {
      out[f.field] = String(raw).trim();
    }
  }
  return out;
}

export type ImportTier = "free" | "paid";

export interface OrderTransactionSummary {
  totalRows: number;
  totalRevenue: number;
  totalRefund: number;
  totalDeductions: number;
  dateFrom: string | null;
  dateTo: string | null;
}

export interface DailyRow {
  date: string;
  revenue: number;
  deductions_breakdown: Record<string, number>;
  refund: number;
  net: number;
}

export interface SkuRow {
  sku_id: string;
  seller_sku?: string;
  product_name?: string;
  variation?: string;
  quantity: number;
  revenue: number;
  deductions: number;
  refund: number;
  net: number;
}

/**
 * Aggregate parsed order transaction rows by SKU (formula A for order-level fees).
 * Returns summary + daily (for free tier) and summary + items (for paid tier).
 */
export function aggregateOrderTransaction(
  rows: string[][],
  mappings: Map<number, string>,
  tier: ImportTier
): { summary: OrderTransactionSummary; daily: DailyRow[]; items: SkuRow[] } {
  const normalized = rows.map((row) => normalizeOrderTransactionRow(row, mappings));

  const byOrderId = new Map<string, typeof normalized>();
  normalized.forEach((row) => {
    const oid = String(row.order_id ?? "").trim() || "_unknown";
    if (!byOrderId.has(oid)) byOrderId.set(oid, []);
    byOrderId.get(oid)!.push(row);
  });

  const orderSubtotals = new Map<string, number>();
  byOrderId.forEach((orderRows, oid) => {
    const sum = orderRows.reduce((s, r) => s + (Number(r.sku_subtotal_after_discount) || 0), 0);
    orderSubtotals.set(oid, sum);
  });

  const bySku = new Map<string, typeof normalized>();
  normalized.forEach((row) => {
    const sku = String(row.sku_id ?? "").trim();
    if (!sku) return;
    if (!bySku.has(sku)) bySku.set(sku, []);
    bySku.get(sku)!.push(row);
  });

  const dailyMap = new Map<string, { revenue: number; refund: number; deductions: number }>();
  let totalRevenue = 0;
  let totalRefund = 0;
  let totalDeductions = 0;
  let dateFrom: string | null = null;
  let dateTo: string | null = null;

  const items: SkuRow[] = [];

  bySku.forEach((skuRows, skuId) => {
    let revenue = 0;
    let refund = 0;
    let platformDiscount = 0;
    let sellerDiscount = 0;
    let orderLevelShare = 0;

    skuRows.forEach((row) => {
      const rev = Number(row.sku_subtotal_after_discount) || 0;
      revenue += rev;
      const rowRefund = Number(row.order_refund_amount) || 0;
      refund += rowRefund;
      platformDiscount += Number(row.sku_platform_discount) || 0;
      sellerDiscount += Number(row.sku_seller_discount) || 0;

      const oid = String(row.order_id ?? "").trim() || "_unknown";
      const orderTotal = orderSubtotals.get(oid) ?? 1;
      let rowOrderShare = 0;
      if (orderTotal > 0 && rev > 0) {
        const shipping = Number(row.shipping_fee_after_discount) || 0;
        const tax = Number(row.taxes) || 0;
        const payDisc = Number(row.payment_platform_discount) || 0;
        const smallFee = Number(row.small_order_fee) || 0;
        const orderLevelTotal = shipping + tax + payDisc + smallFee;
        rowOrderShare = (orderLevelTotal * rev) / orderTotal;
        orderLevelShare += rowOrderShare;
      }

      const created = String(row.created_time ?? "").trim();
      const d = created ? created.slice(0, 10) : "";
      if (d) {
        if (!dailyMap.has(d)) dailyMap.set(d, { revenue: 0, refund: 0, deductions: 0 });
        const day = dailyMap.get(d)!;
        day.revenue += rev;
        day.refund += rowRefund;
        day.deductions += (Number(row.sku_platform_discount) || 0) + (Number(row.sku_seller_discount) || 0) + rowOrderShare;
        if (!dateFrom || d < dateFrom) dateFrom = d;
        if (!dateTo || d > dateTo) dateTo = d;
      }
    });

    totalRevenue += revenue;
    totalRefund += refund;
    const deductions = platformDiscount + sellerDiscount + orderLevelShare;
    totalDeductions += deductions;

    if (tier === "paid") {
      items.push({
        sku_id: skuId,
        seller_sku: skuRows[0] ? String(skuRows[0].seller_sku ?? "").trim() || undefined : undefined,
        product_name: skuRows[0] ? String(skuRows[0].product_name ?? "").trim() || undefined : undefined,
        variation: skuRows[0] ? String(skuRows[0].variation ?? "").trim() || undefined : undefined,
        quantity: skuRows.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
        revenue,
        deductions,
        refund,
        net: revenue - deductions - refund,
      });
    }
  });

  const daily: DailyRow[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      revenue: d.revenue,
      deductions_breakdown: { total: d.deductions },
      refund: d.refund,
      net: d.revenue - d.refund - d.deductions,
    }));

  const summary: OrderTransactionSummary = {
    totalRows: normalized.length,
    totalRevenue,
    totalRefund,
    totalDeductions,
    dateFrom,
    dateTo,
  };

  return { summary, daily, items };
}
