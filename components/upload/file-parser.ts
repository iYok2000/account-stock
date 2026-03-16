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

/**
 * Order Transaction — เฉพาะฟิลด์ที่ระบบใช้คำนวณยอด 2 features:
 * 1) สรุปตามวัน (free tier) 2) สรุปตาม SKU (paid tier).
 * คอลัมน์ในไฟล์จับคู่เฉพาะ field เหล่านี้
 */
export const ORDER_TRANSACTION_FIELDS = [
  { field: "order_id", label: "Order ID", required: true },
  { field: "sku_id", label: "SKU ID", required: true },
  { field: "quantity", label: "Quantity", required: true },
  { field: "sku_subtotal_after_discount", label: "SKU Subtotal After Discount (รายได้)", required: true },
  { field: "sku_platform_discount", label: "SKU Platform Discount", required: false },
  { field: "sku_seller_discount", label: "SKU Seller Discount", required: false },
  { field: "shipping_fee_after_discount", label: "Shipping Fee After Discount", required: false },
  { field: "payment_platform_discount", label: "Payment Platform Discount", required: false },
  { field: "taxes", label: "Taxes", required: false },
  { field: "small_order_fee", label: "Small Order Fee", required: false },
  { field: "order_refund_amount", label: "Order Refund Amount", required: false },
  { field: "created_time", label: "Created Time (วันที่)", required: false },
  { field: "seller_sku", label: "Seller SKU", required: false },
  { field: "product_name", label: "Product Name", required: false },
  { field: "variation", label: "Variation", required: false },
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

/**
 * Affiliate orders — ฟิลด์ที่ใช้สำหรับสรุปคอมมิชชันตามร้าน/สินค้า.
 * Mapping จะอิง header จากไฟล์ affiliate เช่นตัวอย่าง TikTok: Shop name, Product name, Items sold, GMV, Total final earned amount ฯลฯ
 */
/**
 * Affiliate columns in use:
 * - Order ID, SKU ID, Price (ยอด + คำนวณ % กับ earn จริง), Product name, Shop name,
 * - Items sold, Content type, Order settlement status; ยอดรายได้ที่นำมาคิด = Est. standard + Est. Shop Ads (ทุกแถว),
 * - Total final earned amount (ยอดสุทธิรายได้), Order date
 */
export const AFFILIATE_FIELDS = [
  { field: "order_id", label: "Order ID", required: true },
  { field: "sku_id", label: "SKU ID", required: false },
  { field: "price", label: "Price", required: false },
  { field: "product_name", label: "Product name", required: true },
  { field: "shop_name", label: "Shop name", required: true },
  { field: "items_sold", label: "Items sold", required: false },
  { field: "content_type", label: "Content type", required: false },
  { field: "commission_amount", label: "Total final earned amount (ยอดสุทธิรายได้)", required: true },
  { field: "commission_status", label: "Order settlement status", required: true },
  { field: "standard_commission", label: "Est. standard commission (ยอดใช้เมื่อ Ineligible)", required: false },
  { field: "shop_ads_commission", label: "Est. Shop Ads commission", required: false },
  { field: "order_date", label: "Order date", required: false },
  // Optional / fallback for GMV if needed
  { field: "gmv", label: "GMV", required: false },
  { field: "commission_base", label: "Actual commission base", required: false },
  { field: "commission_rate", label: "Standard commission rate (%)", required: false },
  { field: "settlement_date", label: "Commission settlement date", required: false },
] as const;

export type DataType = "inventory" | "orders" | "order_transaction" | "affiliate_order";

export function getFieldsForType(dataType: DataType) {
  switch (dataType) {
    case "inventory":
      return INVENTORY_FIELDS;
    case "orders":
      return ORDER_FIELDS;
    case "order_transaction":
      return ORDER_TRANSACTION_FIELDS;
    case "affiliate_order":
      return AFFILIATE_FIELDS;
  }
}

/** คำพ้องความหมายสำหรับจับคู่ชื่อคอลัมน์ในไฟล์ → ฟิลด์ในระบบ (ความหมายตรงกัน) */
const ORDER_TRANSACTION_HEADER_KEYWORDS: Record<string, string[]> = {
  order_id: ["order id", "order_id", "orderid", "order no", "order no.", "คำสั่งซื้อ", "เลขที่"],
  sku_id: ["sku id", "sku_id", "skuid", "skumain", "sku main", "รหัส sku", "รหัสสินค้า", "product id", "product_id", "item id"],
  quantity: ["quantity", "qty", "จำนวน", "จำนวนชิ้น"],
  sku_subtotal_after_discount: ["subtotal after discount", "sku subtotal", "ยอดหลังหักส่วนลด", "รายได้", "revenue"],
  sku_platform_discount: ["platform discount", "sku platform", "ส่วนลดแพลตฟอร์ม"],
  sku_seller_discount: ["seller discount", "sku seller", "ส่วนลดผู้ขาย"],
  shipping_fee_after_discount: ["shipping fee after discount", "shipping fee", "ค่าขนส่ง", "shipping"],
  payment_platform_discount: ["payment platform discount", "payment discount", "ส่วนลดชำระเงิน"],
  taxes: ["taxes", "ภาษี", "tax"],
  small_order_fee: ["small order fee", "ค่าธรรมเนียมเล็ก"],
  order_refund_amount: ["order refund amount", "refund amount", "refund", "คืน", "ยอดคืน"],
  created_time: ["created time", "created_time", "date", "วันที่", "order date", "paid time", "paid_time"],
  seller_sku: ["seller sku", "seller_sku", "รหัสผู้ขาย"],
  product_name: ["product name", "product_name", "ชื่อสินค้า", "product"],
  variation: ["variation", "ตัวเลือก", "variant"],
};

const AFFILIATE_HEADER_KEYWORDS: Record<string, string[]> = {
  order_id: ["order id", "order_id"],
  sku_id: ["sku id", "sku_id", "product id"],
  price: ["price", "ราคา"],
  product_name: ["product name", "product_name", "ชื่อสินค้า"],
  shop_name: ["shop name", "shop_name"],
  items_sold: ["items sold", "items_sold", "quantity"],
  content_type: ["content type", "content_type"],
  commission_amount: ["total final earned amount"],
  commission_status: ["order settlement status"],
  standard_commission: ["est. standard commission", "est.standard commission", "est standard commission"],
  shop_ads_commission: ["est. shop ads commission", "shop ads commission"],
  order_date: ["order date", "order date"],
  gmv: ["gmv"],
  commission_base: ["actual commission base", "commission base"],
  commission_rate: ["standard", "commission rate"],
  settlement_date: ["commission settlement date", "settlement date"],
};

export function autoDetectMappings(
  headers: string[],
  dataType: DataType
): Map<number, string> {
  const fields = getFieldsForType(dataType);
  const mappings = new Map<number, string>();

  if (dataType === "order_transaction" || dataType === "affiliate_order") {
    headers.forEach((header, index) => {
      // ตรงหรือใกล้เคียง: normalize แล้วเทียบ ( _ = ช่องว่าง, ลบช่องว่างซ้ำ)
      const normalizedHeader = header
        .toLowerCase()
        .trim()
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const normalizedHeaderNoSpaces = normalizedHeader.replace(/\s/g, "");

      for (const f of fields) {
        if (mappings.has(index)) break;
        if (Array.from(mappings.values()).includes(f.field)) continue;
        const keywordSource =
          dataType === "order_transaction"
            ? ORDER_TRANSACTION_HEADER_KEYWORDS
            : AFFILIATE_HEADER_KEYWORDS;
        const keywords = keywordSource[f.field as keyof typeof keywordSource];
        if (!keywords) continue;
        for (const kw of keywords) {
          const normKw = kw.toLowerCase().trim().replace(/\s+/g, " ");
          const normKwNoSpaces = normKw.replace(/\s/g, "");
          // ใช้เฉพาะเมื่อหัวคอลัมน์มีคำ keyword ครบ หรือตรงกัน — ไม่ใช้ normKw.includes(header) เพื่อไม่ให้หัวสั้น (เช่น "Status") แย่งแมปคำยาว (เช่น "order settlement status")
          const match =
            normalizedHeader.includes(normKw) ||
            normalizedHeader === normKw ||
            (normalizedHeaderNoSpaces.length >= normKwNoSpaces.length && normalizedHeaderNoSpaces === normKwNoSpaces);
          if (match) {
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

/** Parse number from affiliate/Excel cells that may contain ฿, THB, spaces */
function parseNumAffiliate(val: string): number {
  let s = String(val ?? "").trim();
  s = s.replace(/[,฿\s]/g, "").replace(/THB/gi, "");
  if (s === "" || s === "-") return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/** Normalize date string to YYYY-MM-DD (supports DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, YYYY/MM/DD, DD/MM/YY). */
function normalizeDateString(val: string): string | null {
  const s = String(val ?? "").trim();
  if (!s) return null;
  const isoMatch = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m}-${d}`;
  }
  const dmy = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m}-${d}`;
  }
  const dmy2 = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/);
  if (dmy2) {
    const [, d, m, y2] = dmy2;
    const y = Number(y2);
    const fullYear = y >= 50 ? 1900+y : 2000+y; // assume 00-49 -> 2000+, 50-99 -> 1900+
    const dd = d.padStart(2, "0");
    const mm = m.padStart(2, "0");
    return `${fullYear}-${mm}-${dd}`;
  }
  return null;
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
    "quantity", "sku_subtotal_after_discount", "sku_platform_discount", "sku_seller_discount",
    "shipping_fee_after_discount", "payment_platform_discount", "taxes", "small_order_fee",
    "order_refund_amount",
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

export interface AffiliateStatusSummary {
  status: string;
  amount: number;
  ratio: number;
}

export interface AffiliateShopSummary {
  shopName: string;
  /** ยอดรายได้ของร้าน (เฉพาะที่นำมาคิด) */
  amount: number;
  ratio: number;
  gmv: number;
  /** จำนวนออเดอร์ */
  orderCount: number;
  /** ยอดที่ขาดรายได้ไป (Ineligible) */
  ineligibleAmount: number;
}

export interface AffiliateProductSummary {
  shopName: string;
  productName: string;
  skuId: string;
  itemsSold: number;
  gmv: number;
  commission: number;
  /** ค่าคอมที่ขาดรายได้ไป (Ineligible) รายสินค้า */
  ineligibleAmount: number;
  rate: number;
}

export interface AffiliateSummary {
  /** คอมมิชชันรวมทุกสถานะ (รวม Ineligible) */
  totalCommission: number;
  /** ยอดรายได้ที่นำมาคิด = ผลรวม Est. standard commission + Est. Shop Ads commission ทั้งหมด (ทุกแถว) */
  totalEligibleCommission: number;
  avgCommissionRate: number;
  byStatus: AffiliateStatusSummary[];
  byShop: AffiliateShopSummary[];
  products: AffiliateProductSummary[];
  potentialGainIfIneligibleSettled: number;
}

export type AffiliateImportItem = {
  affiliate_shop: string;
  order_id: string;
  settlement_status: string;
  sku_id: string;
  product_name: string;
  items_sold: number;
  gmv: number;
  commission_amount: number;
  standard_commission: number;
  shop_ads_commission: number;
  commission_base: number;
  commission_rate: number;
  ineligible_amount: number;
  content_type: string;
  order_date: string | null;
  settlement_date: string | null;
};

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
  /** Normalized sale date (YYYY-MM-DD) for dedupe (shop + date + SKU). */
  date: string | null;
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

  // Sum subtotal per order to split order-level fees proportionally
  const orderSubtotals = new Map<string, number>();
  normalized.forEach((row) => {
    const oid = String(row.order_id ?? "").trim() || "_unknown";
    const current = orderSubtotals.get(oid) ?? 0;
    orderSubtotals.set(oid, current + (Number(row.sku_subtotal_after_discount) || 0));
  });

  const dailyMap = new Map<string, { revenue: number; refund: number; deductions: number }>();
  const itemMap = new Map<string, SkuRow>();

  let totalRevenue = 0;
  let totalRefund = 0;
  let totalDeductions = 0;
  let dateFrom: string | null = null;
  let dateTo: string | null = null;

  normalized.forEach((row) => {
    const rev = Number(row.sku_subtotal_after_discount) || 0;
    const refund = Number(row.order_refund_amount) || 0;
    const platformDiscount = Number(row.sku_platform_discount) || 0;
    const sellerDiscount = Number(row.sku_seller_discount) || 0;
    const shipping = Number(row.shipping_fee_after_discount) || 0;
    const tax = Number(row.taxes) || 0;
    const payDisc = Number(row.payment_platform_discount) || 0;
    const smallFee = Number(row.small_order_fee) || 0;

    const oid = String(row.order_id ?? "").trim() || "_unknown";
    const orderTotal = orderSubtotals.get(oid) ?? rev;
    const orderLevelTotal = shipping + tax + payDisc + smallFee;
    const orderShare = orderTotal > 0 && rev > 0 ? (orderLevelTotal * rev) / orderTotal : 0;

    const createdRaw = String(row.created_time ?? "").trim();
    const normalizedDate = normalizeDateString(createdRaw);
    if (normalizedDate) {
      if (!dailyMap.has(normalizedDate)) dailyMap.set(normalizedDate, { revenue: 0, refund: 0, deductions: 0 });
      const day = dailyMap.get(normalizedDate)!;
      day.revenue += rev;
      day.refund += refund;
      day.deductions += platformDiscount + sellerDiscount + orderShare;
      if (!dateFrom || normalizedDate < dateFrom) dateFrom = normalizedDate;
      if (!dateTo || normalizedDate > dateTo) dateTo = normalizedDate;
    }

    totalRevenue += rev;
    totalRefund += refund;
    totalDeductions += platformDiscount + sellerDiscount + orderShare;

    const sku = String(row.sku_id ?? "").trim();
    if (sku) {
      const key = `${normalizedDate ?? "__no_date"}::${sku}`;
      const existing = itemMap.get(key) ?? {
        date: normalizedDate,
        sku_id: sku,
        seller_sku: String(row.seller_sku ?? "").trim() || undefined,
        product_name: String(row.product_name ?? "").trim() || undefined,
        variation: String(row.variation ?? "").trim() || undefined,
        quantity: 0,
        revenue: 0,
        deductions: 0,
        refund: 0,
        net: 0,
      };
      existing.quantity += Number(row.quantity) || 0;
      existing.revenue += rev;
      existing.deductions += platformDiscount + sellerDiscount + orderShare;
      existing.refund += refund;
      existing.net = existing.revenue - existing.deductions - existing.refund;
      itemMap.set(key, existing);
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

  const items: SkuRow[] = Array.from(itemMap.values());

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

/** Aggregate affiliate orders: summary + per-status + per-shop + per-product (client-side only; no persistence). */
export function aggregateAffiliateOrders(
  rows: string[][],
  mappings: Map<number, string>
): AffiliateSummary {
  const get = (row: string[], field: string) => {
    const col = getCol(mappings, field);
    if (col === undefined) return "";
    return String(row[col] ?? "").trim();
  };

  let totalCommission = 0;
  let totalEligibleCommission = 0;
  let totalBase = 0;
  const byStatus = new Map<string, number>();
  const byShop = new Map<
    string,
    { amount: number; gmv: number; orderCount: number; orderIds: Set<string>; ineligibleAmount: number }
  >();
  const products = new Map<
    string,
    { shopName: string; productName: string; skuId: string; itemsSold: number; gmv: number; commission: number; ineligibleAmount: number; rateSum: number; rateCount: number }
  >();

  /** Order settlement status = Ineligible → นำยอด (Total final earned amount) มาคำนวณเป็น "ยอดที่ไม่ได้รับ" */
  const isIneligible = (s: string) => String(s).toLowerCase().includes("ineligible");

  /** ยอดรายได้ที่นำมาคิด = Est. standard commission + Est. Shop Ads commission (ทุกแถว) */
  const rowEligibleAmount = (std: number, shopAds: number) => std + shopAds;

  rows.forEach((row) => {
    const shopName = get(row, "shop_name") || "Unknown";
    const productName = get(row, "product_name") || "Unknown";
    const skuId = get(row, "sku_id") || "";
    const status = get(row, "commission_status") || "Unknown";

    /** ยอดจากคอลัมน์ Total final earned amount (เมื่อ Settled มีค่า, เมื่อ Ineligible มักไม่มีค่า) */
    const commissionAmount = parseNumAffiliate(get(row, "commission_amount"));
    const standardCommission = parseNumAffiliate(get(row, "standard_commission"));
    const shopAdsCommission = parseNumAffiliate(get(row, "shop_ads_commission"));
    const commissionBase = parseNumAffiliate(get(row, "commission_base"));
    const itemsSold = parseNumAffiliate(get(row, "items_sold"));
    const price = parseNumAffiliate(get(row, "price"));
    /** GMV: ใช้คอลัมน์ GMV หรือ Price × Items sold */
    const gmv = parseNumAffiliate(get(row, "gmv")) || (price * (itemsSold || 1)) || commissionBase;
    const orderId = get(row, "order_id") || "";

    const isIneligibleRow = isIneligible(status);
    const amountForRow = isIneligibleRow
      ? (standardCommission || shopAdsCommission || commissionAmount)
      : commissionAmount;
    /** ยอดรายได้ที่นำมาคิดต่อแถว = Est. standard + Est. Shop Ads (ตาม spec) */
    const eligibleForRow = rowEligibleAmount(standardCommission, shopAdsCommission);

    // Standard field may be a percentage string like "15%"
    const rawRate = get(row, "commission_rate");
    let rate = 0;
    if (rawRate) {
      const cleaned = rawRate.replace("%", "").trim();
      const n = Number(cleaned);
      if (Number.isFinite(n)) rate = n / 100;
    }

    totalCommission += amountForRow;
    totalEligibleCommission += eligibleForRow;
    totalBase += commissionBase;

    byStatus.set(status, (byStatus.get(status) ?? 0) + amountForRow);

    const shopAgg = byShop.get(shopName) ?? {
      amount: 0,
      gmv: 0,
      orderCount: 0,
      orderIds: new Set<string>(),
      ineligibleAmount: 0,
    };
    if (orderId) shopAgg.orderIds.add(orderId);
    shopAgg.orderCount = shopAgg.orderIds.size;
    /** ยอดรายได้ที่นำมาคิดต่อร้าน = ผลรวม Est. standard + Est. Shop Ads ของแถวในร้าน */
    shopAgg.amount += eligibleForRow;
    if (isIneligibleRow) {
      shopAgg.ineligibleAmount += amountForRow;
    }
    shopAgg.gmv += gmv;
    byShop.set(shopName, shopAgg);

    const productKey = `${shopName}::${productName}::${skuId}`;
    const prodAgg =
      products.get(productKey) ?? {
        shopName,
        productName,
        skuId,
        itemsSold: 0,
        gmv: 0,
        commission: 0,
        ineligibleAmount: 0,
        rateSum: 0,
        rateCount: 0,
      };
    prodAgg.itemsSold += itemsSold;
    prodAgg.gmv += gmv;
    /** ค่าคอมที่นำมาคิดต่อสินค้า = Est. standard + Est. Shop Ads */
    prodAgg.commission += eligibleForRow;
    if (isIneligibleRow) {
      prodAgg.ineligibleAmount += amountForRow;
    }
    if (rate > 0) {
      prodAgg.rateSum += rate;
      prodAgg.rateCount += 1;
    }
    products.set(productKey, prodAgg);
  });

  const byStatusArr: AffiliateStatusSummary[] = [];
  byStatus.forEach((amount, status) => {
    byStatusArr.push({
      status,
      amount,
      ratio: totalCommission > 0 ? amount / totalCommission : 0,
    });
  });

  const byShopArr: AffiliateShopSummary[] = [];
  byShop.forEach((agg, shopName) => {
    byShopArr.push({
      shopName,
      amount: agg.amount,
      gmv: agg.gmv,
      orderCount: agg.orderCount,
      ineligibleAmount: agg.ineligibleAmount,
      ratio: totalEligibleCommission > 0 ? agg.amount / totalEligibleCommission : 0,
    });
  });

  const productsArr: AffiliateProductSummary[] = [];
  products.forEach((p) => {
    const avgRate = p.rateCount > 0 ? p.rateSum / p.rateCount : 0;
    productsArr.push({
      shopName: p.shopName,
      productName: p.productName,
      skuId: p.skuId,
      itemsSold: p.itemsSold,
      gmv: p.gmv,
      commission: p.commission,
      ineligibleAmount: p.ineligibleAmount,
      rate: avgRate,
    });
  });

  const ineligible = byStatusArr
    .filter((s) => s.status.toLowerCase().includes("ineligible"))
    .reduce((sum, s) => sum + s.amount, 0);

  const avgCommissionRate =
    totalBase > 0 ? totalCommission / totalBase : 0;

  return {
    totalCommission,
    totalEligibleCommission,
    avgCommissionRate,
    byStatus: byStatusArr,
    byShop: byShopArr,
    products: productsArr,
    potentialGainIfIneligibleSettled: ineligible,
  };
}

/** สร้าง payload สำหรับส่งไปบันทึก affiliate_sku_row */
export function buildAffiliateImportItems(
  rows: string[][],
  mappings: Map<number, string>
): AffiliateImportItem[] {
  const get = (row: string[], field: string) => {
    const col = getCol(mappings, field);
    if (col === undefined) return "";
    return String(row[col] ?? "").trim();
  };
  const isIneligible = (s: string) => String(s).toLowerCase().includes("ineligible");

  const items: AffiliateImportItem[] = [];
  for (const row of rows) {
    const affiliateShop = get(row, "shop_name") || "Unknown";
    const orderId = get(row, "order_id");
    if (!orderId) continue; // ต้องมี order_id

    const skuId = get(row, "sku_id");
    const productName = get(row, "product_name") || "Unknown";
    const status = get(row, "commission_status") || "Unknown";
    const contentType = get(row, "content_type");

    const commissionAmount = parseNumAffiliate(get(row, "commission_amount"));
    const standardCommission = parseNumAffiliate(get(row, "standard_commission"));
    const shopAdsCommission = parseNumAffiliate(get(row, "shop_ads_commission"));
    const commissionBase = parseNumAffiliate(get(row, "commission_base"));
    const itemsSold = parseNumAffiliate(get(row, "items_sold"));
    const price = parseNumAffiliate(get(row, "price"));
    const gmv = parseNumAffiliate(get(row, "gmv")) || (price * (itemsSold || 1)) || commissionBase;

    let commissionRate = 0;
    const rawRate = get(row, "commission_rate");
    if (rawRate) {
      const cleaned = rawRate.replace("%", "").trim();
      const n = Number(cleaned);
      if (Number.isFinite(n)) commissionRate = n > 1 ? n / 100 : n; // รองรับ "15%" หรือ "0.15"
    }

    const eligible = standardCommission || shopAdsCommission || commissionAmount;
    const ineligibleAmount = isIneligible(status) ? Math.max(eligible - commissionAmount, 0) : 0;

    // ถ้าไม่มี/parse ไม่ได้ ให้ fallback เป็นวันที่วันนี้ (UTC) เพื่อไม่ให้ BE ได้ null
    const orderDate =
      normalizeDateString(get(row, "order_date")) ||
      new Date().toISOString().slice(0, 10);
    const settlementDate = normalizeDateString(get(row, "settlement_date"));

    items.push({
      affiliate_shop: affiliateShop,
      order_id: orderId,
      settlement_status: status,
      sku_id: skuId,
      product_name: productName,
      items_sold: itemsSold,
      gmv,
      commission_amount: commissionAmount,
      standard_commission: standardCommission,
      shop_ads_commission: shopAdsCommission,
      commission_base: commissionBase,
      commission_rate: commissionRate,
      ineligible_amount: ineligibleAmount,
      content_type: contentType,
      order_date: orderDate,
      settlement_date: settlementDate,
    });
  }
  return items;
}
