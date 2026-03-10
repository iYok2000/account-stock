// ─── Default fee constants (TikTok Shop Thailand fallback) ───────────────────
export const FEE = {
  COMMISSION:      0.04,    // ค่าคอมมิชชัน (category-specific, default general)
  COMMERCE_GROWTH: 0.04,    // Commerce Growth Fee (CGF): 2–6.5% ตามหมวด
  INFRASTRUCTURE:  0.0044,  // Infrastructure Fee: 0.44% คงที่
  PAYMENT:         0.0284,  // Transaction Fee: ~2.84% (แก้จาก 2% → ค่าจริง)
  VAT:             0.07,    // VAT 7% คำนวณบน Commission เท่านั้น
} as const;

// ─── Category-based commission + CGF rate presets ─────────────────────────────
export const CATEGORY_RATES = {
  beauty:      { commission: 0.064, commerceGrowth: 0.065 }, // ~12.9% total platform
  fashion:     { commission: 0.050, commerceGrowth: 0.050 },
  electronics: { commission: 0.030, commerceGrowth: 0.030 },
  food:        { commission: 0.020, commerceGrowth: 0.020 },
  general:     { commission: 0.040, commerceGrowth: 0.040 }, // default
} as const;
export type ProductCategory = keyof typeof CATEGORY_RATES;

// ─── Types ────────────────────────────────────────────────────────────────────
export type SliderKey = "productCost" | "shippingCost" | "affiliateRate" | "adSpend" | "packagingCost" | "returnRate";

export interface CalcParams {
  sellingPrice: number;
  productCost: number;
  shippingCost: number;
  affiliateRate: number;
  adSpend: number;
  packagingCost: number;
  quantity: number;
  returnRate: number;              // 0–1
  commissionFeeRate?: number;      // override FEE.COMMISSION
  commerceGrowthRate?: number;     // override FEE.COMMERCE_GROWTH
  infrastructureRate?: number;     // override FEE.INFRASTRUCTURE
  paymentFeeRate?: number;         // override FEE.PAYMENT
  commissionVatRate?: number;      // override FEE.VAT
  voucherSellerCost?: number;      // ส่วนที่ผู้ขายออกเองต่อออเดอร์ (฿)
  platformShippingDiscount?: number; // ค่าส่งที่ TikTok ออกให้ต่อออเดอร์ (฿)
}

export interface CalcResult {
  // ─── Per-unit fees ───────────────────────────────────────────────────────
  commissionPerUnit: number;
  commissionVatPerUnit: number;
  commerceGrowthPerUnit: number;  // NEW
  infrastructurePerUnit: number;  // NEW
  paymentFeePerUnit: number;
  affiliateFeePerUnit: number;
  voucherCostPerUnit: number;     // NEW
  totalCostPerUnit: number;
  profitPerUnit: number;
  // ─── Margins ─────────────────────────────────────────────────────────────
  grossMargin: number;            // NEW (revenueNet - COGS) / revenueNet × 100
  grossProfit: number;            // NEW revenueNet - totalProductCost
  profitMargin: number;           // net margin
  // ─── Totals ──────────────────────────────────────────────────────────────
  revenueGross: number;
  revenueNet: number;
  totalProductCost: number;
  totalShipping: number;
  totalPlatformFees: number;
  totalCost: number;
  netProfit: number;
  // ─── Counts ──────────────────────────────────────────────────────────────
  quantity: number;
  returnedUnits: number;
  effectiveUnits: number;
  // ─── Projections ─────────────────────────────────────────────────────────
  monthlyRevenue: number;
  monthlyProfit: number;
  monthlyCost: number;
  yearlyProfit: number;
  // ─── Ratios ──────────────────────────────────────────────────────────────
  platformFeesPct: number;
  shippingPct: number;
  settlementGapPct: number;       // NEW (fees+shipping) / revenue
  roas: number;                   // NEW revenue / adSpend (0 if no ad)
  cac: number;                    // NEW adSpend per effective unit
}

// ─── Core calculation ─────────────────────────────────────────────────────────
export function calculateLocal(p: CalcParams): CalcResult {
  const {
    sellingPrice, productCost, shippingCost, affiliateRate,
    adSpend, packagingCost, quantity, returnRate,
    commissionFeeRate    = FEE.COMMISSION,
    commerceGrowthRate   = FEE.COMMERCE_GROWTH,
    infrastructureRate   = FEE.INFRASTRUCTURE,
    paymentFeeRate       = FEE.PAYMENT,
    commissionVatRate    = FEE.VAT,
    voucherSellerCost    = 0,
    platformShippingDiscount = 0,
  } = p;

  const returnedUnits  = Math.round(quantity * returnRate);
  const effectiveUnits = quantity - returnedUnits;
  const revenueForFees = sellingPrice * effectiveUnits;

  // Platform fees
  const commission    = revenueForFees * commissionFeeRate;
  const commissionVat = commission * commissionVatRate;
  const commerceGrowth = revenueForFees * commerceGrowthRate;
  const infrastructure = revenueForFees * infrastructureRate;
  const paymentFee    = revenueForFees * paymentFeeRate;
  const affiliateFee  = revenueForFees * (affiliateRate / 100);
  const totalPlatformFees = commission + commissionVat + commerceGrowth + infrastructure + paymentFee + affiliateFee;

  // Shipping — net of platform subsidy
  const netShippingPerUnit = Math.max(0, shippingCost - platformShippingDiscount);
  const totalProductCost = (productCost + packagingCost) * quantity;
  const totalShipping    = netShippingPerUnit * quantity;
  const totalVoucherCost = voucherSellerCost * effectiveUnits;
  const totalAdSpend     = adSpend * quantity;

  const revenueGross = sellingPrice * quantity;
  const revenueNet   = sellingPrice * effectiveUnits;
  const grossProfit  = revenueNet - totalProductCost;
  const grossMargin  = revenueNet > 0 ? (grossProfit / revenueNet) * 100 : 0;

  const totalCost  = totalProductCost + totalShipping + totalPlatformFees + totalVoucherCost + totalAdSpend;
  const netProfit  = revenueNet - totalCost;
  const netMargin  = revenueNet > 0 ? (netProfit / revenueNet) * 100 : 0;

  const pu = (v: number) => (effectiveUnits > 0 ? v / effectiveUnits : 0);

  return {
    commissionPerUnit:    pu(commission),
    commissionVatPerUnit: pu(commissionVat),
    commerceGrowthPerUnit: pu(commerceGrowth),
    infrastructurePerUnit: pu(infrastructure),
    paymentFeePerUnit:    pu(paymentFee),
    affiliateFeePerUnit:  pu(affiliateFee),
    voucherCostPerUnit:   voucherSellerCost,
    totalCostPerUnit:     effectiveUnits > 0 ? totalCost / effectiveUnits : 0,
    profitPerUnit:        sellingPrice - (effectiveUnits > 0 ? totalCost / effectiveUnits : 0),
    grossMargin,
    grossProfit,
    profitMargin:         netMargin,
    revenueGross, revenueNet, totalProductCost, totalShipping,
    totalPlatformFees, totalCost, netProfit,
    quantity, returnedUnits, effectiveUnits,
    monthlyRevenue: revenueNet, monthlyProfit: netProfit,
    monthlyCost: totalCost,     yearlyProfit: netProfit * 12,
    platformFeesPct:    revenueNet > 0 ? (totalPlatformFees / revenueNet) * 100 : 0,
    shippingPct:        revenueNet > 0 ? (totalShipping / revenueNet) * 100 : 0,
    settlementGapPct:   revenueNet > 0 ? ((totalPlatformFees + totalShipping) / revenueNet) * 100 : 0,
    roas:               totalAdSpend > 0 ? revenueNet / totalAdSpend : 0,
    cac:                effectiveUnits > 0 ? totalAdSpend / effectiveUnits : 0,
  };
}

// ─── Happiness scores ─────────────────────────────────────────────────────────
export function getHappiness(profitMargin: number, platformFeesPct: number, shippingPct: number, discountPct: number) {
  return {
    sellerScore:   profitMargin   >= 30 ? 3 : profitMargin   >= 15 ? 2 : profitMargin   >= 5 ? 1 : 0,
    tiktokScore:   platformFeesPct >= 8 ? 3 : platformFeesPct >= 5  ? 2 : 1,
    shippingScore: shippingPct    >= 10 ? 3 : shippingPct    >= 5  ? 2 : 1,
    customerScore: discountPct    >= 20 ? 3 : discountPct    >= 10 ? 2 : discountPct >= 0 ? 1 : 0,
  };
}

// ─── Break-even ───────────────────────────────────────────────────────────────
export function calcBreakEven(p: {
  activePrice: number; productCost: number; packagingCost: number;
  shippingCost: number; adSpend: number; affiliateRate: number; returnRate: number; profitPerUnit: number;
}) {
  const feeRate = FEE.COMMISSION * (1 + FEE.VAT) + FEE.COMMERCE_GROWTH + FEE.INFRASTRUCTURE + FEE.PAYMENT + p.affiliateRate / 100;
  const fixed = p.productCost + p.packagingCost + p.shippingCost + p.adSpend;
  const minPrice = fixed / (1 - feeRate);
  const maxCOGS = Math.max(0, p.activePrice * (1 - feeRate) - p.packagingCost - p.shippingCost - p.adSpend);
  const maxReturn = Math.min(100, Math.max(0, (1 - fixed / (p.activePrice * (1 - feeRate))) * 100));
  return { minPrice, maxCOGS, maxReturn, safe: p.profitPerUnit > 0 };
}

// ─── Sensitivity ──────────────────────────────────────────────────────────────
export function calcSensitivity(base: CalcParams, baseProfitPerUnit: number) {
  const run = (delta: Partial<CalcParams>) => calculateLocal({ ...base, ...delta }).profitPerUnit - baseProfitPerUnit;

  const rows = [
    { labelKey: "priceUp",      hintKey: "hintPrice",    icon: "💰", gain: run({ sellingPrice: base.sellingPrice * 1.05 }) },
    { labelKey: "cogsDown",     hintKey: "hintCogs",     icon: "🏭", gain: run({ productCost: base.productCost * 0.9 }) },
    { labelKey: "affiliateDown",hintKey: "hintAffiliate",icon: "📢", gain: run({ affiliateRate: Math.max(0, base.affiliateRate - 3) }) },
    { labelKey: "shippingDown", hintKey: "hintShipping", icon: "🚚", gain: run({ shippingCost: base.shippingCost * 0.8 }) },
    { labelKey: "returnDown",   hintKey: "hintReturn",   icon: "🔄", gain: run({ returnRate: Math.max(0, base.returnRate - 0.03) }) },
    { labelKey: "adDown",       hintKey: "hintAd",       icon: "📣", gain: run({ adSpend: base.adSpend * 0.5 }) },
  ].sort((a, b) => b.gain - a.gain);

  const maxGain = Math.max(...rows.map((r) => Math.abs(r.gain)), 1);
  return rows.map((r) => ({ ...r, pct: (r.gain / maxGain) * 100 }));
}

// ─── Scenarios ────────────────────────────────────────────────────────────────
export function calcScenarios(base: CalcParams) {
  const run = (priceM: number, cogsM: number, retM: number) =>
    calculateLocal({
      ...base,
      sellingPrice: base.sellingPrice * priceM,
      productCost: base.productCost * cogsM,
      returnRate: Math.min(base.returnRate * retM, 0.6),
    });

  return [
    { color: "red",   noteKey: "worstNote",    r: run(0.9,  1.15, 2.0) },
    { color: "blue",  noteKey: "expectedNote",  r: run(1.0,  1.0,  1.0) },
    { color: "green", noteKey: "bestNote",      r: run(1.1,  0.85, 0.5) },
  ];
}

// ─── Monte Carlo (deterministic LCG) ─────────────────────────────────────────
export function calcMonteCarlo(base: CalcParams) {
  const N = 500;
  const profits: number[] = [];
  let s = (((base.sellingPrice * 31 + base.productCost * 17 + base.returnRate * 7) * 2654435761) | 0) >>> 0;
  const rand = () => { s = (Math.imul(1664525, s) + 1013904223) | 0; return (s >>> 0) / 2 ** 32; };

  for (let i = 0; i < N; i++) {
    profits.push(calculateLocal({
      ...base,
      sellingPrice: base.sellingPrice * (1 + (rand() - 0.5) * 0.10),
      productCost:  base.productCost  * (1 + (rand() - 0.5) * 0.10),
      shippingCost: base.shippingCost * (1 + (rand() - 0.5) * 0.20),
      returnRate:   Math.max(0, base.returnRate + (rand() - 0.5) * 0.06),
    }).profitPerUnit);
  }
  profits.sort((a, b) => a - b);
  const lossPct = (profits.filter((p) => p < 0).length / N) * 100;
  const riskKey = lossPct >= 40 ? "veryHigh" : lossPct >= 20 ? "medium" : lossPct >= 5 ? "low" : "veryLow";
  const riskColor = lossPct >= 40 ? "red" : lossPct >= 20 ? "amber" : lossPct >= 5 ? "yellow" : "green";
  return { p10: profits[Math.floor(N * 0.1)], p50: profits[Math.floor(N * 0.5)], p90: profits[Math.floor(N * 0.9)], lossPct, riskKey, riskColor };
}
