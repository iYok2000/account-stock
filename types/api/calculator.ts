/**
 * Placeholder types — รอต่อ API (calc engine / backend).
 * แทนที่ด้วย response shape จริงเมื่อ backend พร้อม
 */

export type ProfitCalcInputApi = {
  revenue: number;
  cogs: number;
  commissionRate?: number;
  paymentFeeRate?: number;
  adSpend?: number;
  shippingCost?: number;
  otherCosts?: number;
  voucherSellerCost?: number;
  returnRate?: number;
  affiliateRate?: number;
};

export type ProfitCalcResultApi = {
  revenue_gross: number;
  revenue_net: number;
  total_product_cost: number;
  total_cost: number;
  net_revenue: number;
  gross_profit: number;
  gross_margin_pct: number;
  net_profit_before_tax?: number;
  net_margin_pct?: number;
  [key: string]: number | undefined;
};
