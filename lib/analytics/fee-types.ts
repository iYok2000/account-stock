/**
 * Fee breakdown type constants for analytics revenue page.
 * Keys must match what the backend returns in feeBreakdown[].label
 *
 * Owner/Shop flow (import_sku_row):
 *   tiktokCommission = GMV - settlement - deductions - refund  (implied platform cut)
 *   deductions       = other deductions captured in import row
 *   refund           = refund amounts
 *
 * Affiliate flow (affiliate_sku_row):
 *   ineligible       = commission clawed back for cancelled/ineligible orders
 *   affiliateCommission, shipping, transactionFee, otherFees → future granular import
 */

export const FEE_KEYS = {
  /** ค่าคอมมิชชั่น TikTok — platform cut (GMV - net - deductions - refund) */
  TIKTOK_COMMISSION: "tiktokCommission",
  /** ค่าจัดส่ง — shipping subsidy / shipping fee */
  SHIPPING: "shipping",
  /** ค่าคอม Affiliate — affiliate commission passed through */
  AFFILIATE_COMMISSION: "affiliateCommission",
  /** ค่าธรรมเนียมธุรกรรม — payment processing fee */
  TRANSACTION_FEE: "transactionFee",
  /** ค่าบริการอื่นๆ — misc platform services */
  OTHER_FEES: "otherFees",
  /** หักอื่นๆ — catch-all deductions from import row */
  DEDUCTIONS: "deductions",
  /** คืนเงิน — refunds */
  REFUND: "refund",
  /** ยอดไม่ได้รับ — Affiliate ineligible commission (clawback) */
  INELIGIBLE: "ineligible",
} as const;

export type FeeKey = (typeof FEE_KEYS)[keyof typeof FEE_KEYS];

/** Thai display labels for each fee key */
export const FEE_LABELS: Record<string, string> = {
  [FEE_KEYS.TIKTOK_COMMISSION]: "ค่าคอมมิชชั่น TikTok",
  [FEE_KEYS.SHIPPING]: "ค่าจัดส่ง",
  [FEE_KEYS.AFFILIATE_COMMISSION]: "ค่าคอม Affiliate",
  [FEE_KEYS.TRANSACTION_FEE]: "ค่าธรรมเนียมธุรกรรม",
  [FEE_KEYS.OTHER_FEES]: "ค่าบริการอื่นๆ",
  [FEE_KEYS.DEDUCTIONS]: "หักอื่นๆ",
  [FEE_KEYS.REFUND]: "คืนเงิน",
  [FEE_KEYS.INELIGIBLE]: "ยอดไม่ได้รับ (Ineligible)",
};

/** Returns Thai label; falls back to the raw key if unmapped */
export function getFeeLabel(key: string): string {
  return FEE_LABELS[key] ?? key;
}

/**
 * Chart colors matched to fee keys for consistent color assignment.
 * Import and spread into your Cell/Bar fill props.
 */
export const FEE_COLORS: Record<string, string> = {
  [FEE_KEYS.TIKTOK_COMMISSION]: "#6366f1",   // indigo
  [FEE_KEYS.SHIPPING]: "#f59e0b",            // amber
  [FEE_KEYS.AFFILIATE_COMMISSION]: "#10b981", // emerald
  [FEE_KEYS.TRANSACTION_FEE]: "#3b82f6",     // blue
  [FEE_KEYS.OTHER_FEES]: "#8b5cf6",          // violet
  [FEE_KEYS.DEDUCTIONS]: "#f97316",          // orange
  [FEE_KEYS.REFUND]: "#ef4444",             // red
  [FEE_KEYS.INELIGIBLE]: "#e11d48",         // rose
};

/** Ordered list of fee keys for chart legend/table consistency */
export const FEE_KEY_ORDER: string[] = [
  FEE_KEYS.TIKTOK_COMMISSION,
  FEE_KEYS.AFFILIATE_COMMISSION,
  FEE_KEYS.SHIPPING,
  FEE_KEYS.TRANSACTION_FEE,
  FEE_KEYS.OTHER_FEES,
  FEE_KEYS.DEDUCTIONS,
  FEE_KEYS.REFUND,
  FEE_KEYS.INELIGIBLE,
];

/** Sort a fee breakdown array in display order */
export function sortFeeBreakdown<T extends { label: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ai = FEE_KEY_ORDER.indexOf(a.label);
    const bi = FEE_KEY_ORDER.indexOf(b.label);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}
