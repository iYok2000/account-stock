/**
 * Import APIs — request payloads and responses.
 */

export interface OrderTransactionSummaryApi {
  totalRows: number;
  totalRevenue: number;
  totalRefund: number;
  totalDeductions: number;
  dateFrom: string | null;
  dateTo: string | null;
}

export interface DailyRowApi {
  date: string;
  revenue: number;
  deductions_breakdown: Record<string, number>;
  refund: number;
  net: number;
}

export interface SkuRowApi {
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
 * Import payload — backendควร upsert SKU rows (shop_id + date + sku_id).
 * summary/daily เป็นข้อมูลประกอบ (optional) สำหรับ UI/analytics.
 * สำหรับ free/payed ใช้ items เหมือนกัน เพื่อไม่บวม summary/daily ฝั่ง DB.
 */
export type ImportOrderTransactionPayloadApi = {
  tier: "free" | "paid";
  items: SkuRowApi[];
  summary?: OrderTransactionSummaryApi;
  daily?: DailyRowApi[];
};

export interface AffiliateStatusSummaryApi {
  status: string;
  amount: number;
  ratio: number;
}

export interface AffiliateShopSummaryApi {
  shopName: string;
  amount: number;
  ratio: number;
  gmv: number;
}

export interface AffiliateProductSummaryApi {
  shopName: string;
  productName: string;
  skuId: string;
  itemsSold: number;
  gmv: number;
  commission: number;
  rate: number;
}

export interface AffiliateSummaryApi {
  totalCommission: number;
  avgCommissionRate: number;
  byStatus: AffiliateStatusSummaryApi[];
  byShop: AffiliateShopSummaryApi[];
  products: AffiliateProductSummaryApi[];
  potentialGainIfIneligibleSettled: number;
}

export interface ImportAffiliateOrdersPayloadApi {
  summary: AffiliateSummaryApi;
}

/** Response from backend (may be empty or { ok: true } until backend implements). */
export interface ImportOrderTransactionResponseApi {
  ok?: boolean;
  imported?: number;
  errors?: string[];
}

export interface ImportAffiliateOrdersResponseApi {
  ok?: boolean;
  errors?: string[];
}
