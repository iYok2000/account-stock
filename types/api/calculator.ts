/**
 * Placeholder types — รอต่อ API (calc engine / backend).
 * แทนที่ด้วย response shape จริงเมื่อ backend พร้อม
 */

export type ProfitCalcInputApi = {
  revenue: number;
  cogs: number;
  commissionRate?: number;
  commerceGrowthRate?: number;      // Commerce Growth Fee (CGF): 2–6.5%
  infrastructureRate?: number;      // Infrastructure Fee: 0.44%
  paymentFeeRate?: number;          // Transaction Fee: ~2.84%
  adSpend?: number;
  shippingCost?: number;
  platformShippingDiscount?: number; // ค่าส่งที่ TikTok ออกให้
  otherCosts?: number;
  voucherSellerCost?: number;       // ส่วนผู้ขายออกเองต่อออเดอร์ (฿)
  returnRate?: number;
  affiliateRate?: number;
  orderCount?: number;              // จำนวนออเดอร์ (ใช้คำนวณ ROAS, CAC)
  category?: string;                // หมวดสินค้า (beauty, fashion, food, ...)
};

export type ProfitCalcResultApi = {
  revenue_gross: number;
  revenue_net: number;
  total_product_cost: number;
  total_cost: number;
  net_revenue: number;
  // Margins
  gross_profit: number;
  gross_margin_pct: number;         // (revenue - COGS) / revenue
  net_profit_before_tax?: number;
  net_margin_pct?: number;
  // Fee breakdown
  commission_fee?: number;
  commerce_growth_fee?: number;     // NEW
  infrastructure_fee?: number;      // NEW
  payment_fee?: number;
  affiliate_fee?: number;
  voucher_cost?: number;            // NEW
  // Analytics metrics
  settlement_gap_pct?: number;      // NEW (fees+shipping) / revenue
  roas?: number;                    // NEW revenue / adSpend
  cac?: number;                     // NEW adSpend / order count
  [key: string]: number | undefined;
};
