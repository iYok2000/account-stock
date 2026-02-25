/**
 * POST /api/import/order-transaction — request payload and response.
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

export type ImportOrderTransactionPayloadApi =
  | { tier: "free"; summary: OrderTransactionSummaryApi; daily: DailyRowApi[] }
  | { tier: "paid"; summary: OrderTransactionSummaryApi; items: SkuRowApi[] };

/** Response from backend (may be empty or { ok: true } until backend implements). */
export interface ImportOrderTransactionResponseApi {
  ok?: boolean;
  imported?: number;
  errors?: string[];
}
