/**
 * Micro-narratives for charts: Setup -> Insight -> Action pattern.
 *
 * Each narrative generator receives chart-specific data and returns
 * Thai-language text with conditional insights and actionable advice.
 *
 * Structure:
 *   setup   - What the chart shows (context)
 *   insight - What the data tells us (conditional on data)
 *   action  - What to do next (actionable advice)
 *   severity - Visual tone: success | warning | danger | info
 */

export interface ChartNarrative {
  setup: string;
  insight: string;
  action: string;
  severity: 'success' | 'warning' | 'danger' | 'info';
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function fmtBaht(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`;
  return `฿${n.toLocaleString('th-TH')}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function calcChangePercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : current < 0 ? -100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// ----------------------------------------------------------------
// Simple change narrators
// ----------------------------------------------------------------

/**
 * Narrates revenue change between two periods.
 * @example "Revenue increased 15% compared to last period"
 */
export function narrateRevenueChange(current: number, previous: number): string {
  const change = calcChangePercent(current, previous);
  const absChange = Math.abs(change);
  const direction = change > 0 ? 'เพิ่มขึ้น' : change < 0 ? 'ลดลง' : 'ทรงตัว';
  const period = 'จากช่วงก่อนหน้า';

  if (change === 0) {
    return `รายได้ทรงตัวที่ ${fmtBaht(current)} ${period}`;
  }
  return `รายได้${direction} ${fmtPct(absChange)} ${period} (${fmtBaht(current)})`;
}

/**
 * Narrates profit change between two periods.
 * @example "Profit increased 8% compared to last period"
 */
export function narrateProfitChange(current: number, previous: number): string {
  const change = calcChangePercent(current, previous);
  const absChange = Math.abs(change);
  const direction = change > 0 ? 'เพิ่มขึ้น' : change < 0 ? 'ลดลง' : 'ทรงตัว';
  const period = 'จากช่วงก่อนหน้า';

  if (current < 0 && previous < 0) {
    return `ขาดทุน${direction} ${fmtPct(absChange)} ${period} (${fmtBaht(Math.abs(current))})`;
  }
  if (current < 0) {
    return `ขาดทุน ${fmtBaht(Math.abs(current))} ${period}`;
  }
  if (change === 0) {
    return `กำไรทรงตัวที่ ${fmtBaht(current)} ${period}`;
  }
  return `กำไร${direction} ${fmtPct(absChange)} ${period} (${fmtBaht(current)})`;
}

/**
 * Narrates a trend from a time series array.
 * @param data - Array of {date, value} objects, already sorted chronologically
 * @example "Overall trend is upward over 30 days"
 */
export function narrateTrend(data: { date: string; value: number }[]): string {
  if (!data || data.length < 2) {
    return 'ไม่มีข้อมูลเพียงพอสำหรับวิเคราะห์แนวโน้ม';
  }

  const values = data.map((d) => d.value);
  const first = values[0];
  const last = values[values.length - 1];
  const change = calcChangePercent(last, first);
  const absChange = Math.abs(change);

  // Simple linear regression for slope
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) ** 2;
  }
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const avgValue = yMean;

  if (Math.abs(slope) < avgValue * 0.01) {
    return `แนวโน้มทรงตัวตลอด ${n} วัน (${fmtBaht(last)})`;
  }

  const trendWord = slope > 0 ? 'ขาขึ้น' : 'ขาลง';
  const peakIdx = slope > 0
    ? values.indexOf(Math.max(...values))
    : values.indexOf(Math.min(...values));
  const peakDate = data[peakIdx]?.date ?? '';
  const peakValue = values[peakIdx];

  let result = `แนวโน้ม${trendWord} ${fmtPct(absChange)} ตลอด ${n} วัน`;
  if (peakDate) {
    result += ` จุดสูงสุด${slope > 0 ? '' : 'ต่ำสุด'}: ${peakDate} (${fmtBaht(peakValue)})`;
  }
  return result;
}

// ----------------------------------------------------------------
// 1. TimeSeriesChart
// ----------------------------------------------------------------

export function timeSeriesNarrative(data: {
  totalDays: number;
  peakDay: string;
  peakRevenue: number;
  avgDailyRevenue: number;
  trendDirection: 'up' | 'down' | 'flat';
  trendPercent: number;
}): ChartNarrative {
  const { totalDays, peakDay, peakRevenue, avgDailyRevenue, trendDirection, trendPercent } = data;

  const setup = `กราฟแสดงยอดขายรายวัน ${totalDays} วัน เฉลี่ยวันละ ${fmtBaht(avgDailyRevenue)}`;

  let insight: string;
  let severity: ChartNarrative['severity'];

  if (trendDirection === 'up' && trendPercent > 10) {
    insight = `ยอดขายมีแนวโน้มเพิ่มขึ้น ${fmtPct(trendPercent)} วันที่ขายดีสุดคือ ${peakDay} (${fmtBaht(peakRevenue)})`;
    severity = 'success';
  } else if (trendDirection === 'down' && trendPercent > 10) {
    insight = `ยอดขายลดลง ${fmtPct(trendPercent)} จากช่วงก่อนหน้า ต้องเฝ้าระวัง`;
    severity = 'warning';
  } else {
    insight = `ยอดขายค่อนข้างทรงตัว วันที่ขายดีสุดคือ ${peakDay} (${fmtBaht(peakRevenue)})`;
    severity = 'info';
  }

  let action: string;
  if (trendDirection === 'down') {
    action = 'ลองวิเคราะห์ว่าช่วงไหนยอดตก แล้วจัดโปรโมชั่นในช่วงนั้น';
  } else if (trendDirection === 'up') {
    action = 'ช่วงนี้ยอดขึ้น ลองเพิ่มสต็อกและขยาย ads ในวันที่ขายดี';
  } else {
    action = 'ลองจัดโปรโมชั่นหรือ LIVE สด เพื่อสร้างจุดพีคใหม่';
  }

  return { setup, insight, action, severity };
}

// ----------------------------------------------------------------
// 2. ProfitMarginChart
// ----------------------------------------------------------------

/**
 * Full profit margin narrative with complete data.
 */
export function profitMarginNarrativeFull(data: {
  netMargin: number;
  grossMargin: number;
  netProfit: number;
  hasCostData: boolean;
}): ChartNarrative {
  const { netMargin, grossMargin, netProfit, hasCostData } = data;

  const setup = hasCostData
    ? `Gross Margin ${fmtPct(grossMargin)} | Net Margin ${fmtPct(netMargin)}`
    : `กำไรก่อนหักต้นทุนสินค้า ${fmtBaht(netProfit)} (ยังไม่มีข้อมูลต้นทุน)`;

  let insight: string;
  let severity: ChartNarrative['severity'];

  if (!hasCostData) {
    insight = 'ยังไม่มีข้อมูลต้นทุนสินค้า ตัวเลขกำไรยังไม่แม่นยำ';
    severity = 'warning';
  } else if (netMargin >= 20) {
    insight = `กำไรสุทธิ ${fmtPct(netMargin)} ถือว่าดีมากสำหรับ e-commerce`;
    severity = 'success';
  } else if (netMargin >= 10) {
    insight = `กำไรสุทธิ ${fmtPct(netMargin)} อยู่ในเกณฑ์ปานกลาง ยังมีช่องว่างให้ปรับปรุง`;
    severity = 'info';
  } else if (netMargin >= 0) {
    insight = `กำไรบาง (${fmtPct(netMargin)}) ต้องระวังค่าใช้จ่ายที่อาจทำให้ขาดทุน`;
    severity = 'warning';
  } else {
    insight = `ขาดทุน ${fmtPct(Math.abs(netMargin))} ต้องแก้ไขโดยเร็ว`;
    severity = 'danger';
  }

  let action: string;
  if (!hasCostData) {
    action = 'ตั้งค่าราคาต้นทุนสินค้าในหน้า "สินค้า" เพื่อดู margin ที่แม่นยำ';
  } else if (netMargin < 10) {
    action = 'ลดต้นทุน: หาซัพพลายเออร์ใหม่, เจรจาค่าธรรมเนียม, หรือขึ้นราคาสินค้า';
  } else {
    action = 'รักษามาร์จิ้นนี้ไว้ และลองเพิ่มยอดขายเพื่อเพิ่มกำไรรวม';
  }

  return { setup, insight, action, severity };
}

/**
 * @deprecated Use profitMarginNarrativeFull(data) with full data instead.
 * profitMarginNarrative with backwards-compatible number signature.
 */
export function profitMarginNarrative(avgMargin: number | null): string | null;
export function profitMarginNarrative(data: {
  netMargin: number;
  grossMargin: number;
  netProfit: number;
  hasCostData: boolean;
}): ChartNarrative;
export function profitMarginNarrative(
  data: number | null | { netMargin: number; grossMargin: number; netProfit: number; hasCostData: boolean }
): ChartNarrative | string | null {
  if (data === null || data === undefined) return null;
  if (typeof data === 'number') {
    return profitMarginNarrativeSimple(data);
  }
  return profitMarginNarrativeFull(data);
}

// ----------------------------------------------------------------
// 3. SimplifiedStackedBar
// ----------------------------------------------------------------

export function simplifiedStackedBarNarrative(data: {
  revenue: number;
  cogs: number;
  fees: number;
  profit: number;
  cogsPercent: number;
  feesPercent: number;
  profitPercent: number;
}): ChartNarrative {
  const { revenue, cogs, fees, profit, cogsPercent, feesPercent, profitPercent } = data;
  const isLoss = profit < 0;

  const setup = `จากรายได้ ${fmtBaht(revenue)} → ต้นทุน ${fmtPct(cogsPercent)} + ค่าธรรมเนียม ${fmtPct(feesPercent)} = ${isLoss ? 'ขาดทุน' : 'กำไร'} ${fmtPct(Math.abs(profitPercent))}`;

  let insight: string;
  let severity: ChartNarrative['severity'];

  if (isLoss) {
    insight = `ขาดทุน ${fmtBaht(Math.abs(profit))} ต้นทุน+ค่าธรรมเนียมรวมกันเกินรายได้`;
    severity = 'danger';
  } else if (profitPercent < 10) {
    insight = `กำไรบางมาก (${fmtPct(profitPercent)}) ต้นทุนและค่าธรรมเนียมกินรายได้เกือบหมด`;
    severity = 'warning';
  } else if (feesPercent > cogsPercent) {
    insight = `ค่าธรรมเนียม (${fmtPct(feesPercent)}) สูงกว่าต้นทุนสินค้า (${fmtPct(cogsPercent)}) — แพลตฟอร์มกินเงินเยอะ`;
    severity = 'warning';
  } else {
    insight = `สัดส่วนสมดุลดี กำไร ${fmtPct(profitPercent)} ของรายได้`;
    severity = 'success';
  }

  let action: string;
  if (isLoss) {
    action = 'ต้องขึ้นราคาหรือลดต้นทุนอย่างเร่งด่วน ทุกออเดอร์กำลังขาดทุน';
  } else if (feesPercent > 30) {
    action = 'ค่าธรรมเนียมสูง ลองเจรจากับแพลตฟอร์มหรือลด affiliate commission';
  } else {
    action = 'เน้นเพิ่มปริมาณขาย กำไรต่อชิ้นอยู่ในเกณฑ์ดี';
  }

  return { setup, insight, action, severity };
}

// ----------------------------------------------------------------
// 4. ReconciliationKpiCards
// ----------------------------------------------------------------

export function reconciliationKpiNarrative(data: {
  gmv: number;
  settlement: number;
  netProfit: number;
  settlementRate: number;
  profitMargin: number;
  gmvChange: number | null;
  profitChange: number | null;
}): ChartNarrative {
  const { gmv, settlement, netProfit, settlementRate, profitMargin, gmvChange, profitChange } = data;

  const setup = `ยอดขาย ${fmtBaht(gmv)} → เงินเข้าจริง ${fmtBaht(settlement)} (${fmtPct(settlementRate)}) → กำไร ${fmtBaht(netProfit)}`;

  let insight: string;
  let severity: ChartNarrative['severity'];

  if (netProfit < 0) {
    insight = `ขาดทุน ${fmtBaht(Math.abs(netProfit))} แม้ยอดขายจะอยู่ที่ ${fmtBaht(gmv)}`;
    severity = 'danger';
  } else if (settlementRate < 60) {
    insight = `เงินเข้าจริงแค่ ${fmtPct(settlementRate)} ของยอดขาย — เสียค่าธรรมเนียม+ส่วนลดเยอะมาก`;
    severity = 'warning';
  } else if (profitChange !== null && profitChange < -10) {
    insight = `กำไรลดลง ${fmtPct(Math.abs(profitChange))} จากเดือนที่แล้ว ต้องเฝ้าระวัง`;
    severity = 'warning';
  } else if (profitMargin >= 15) {
    insight = `กำไร margin ${fmtPct(profitMargin)} ดี${gmvChange !== null && gmvChange > 0 ? ` ยอดขายยังโตอีก ${fmtPct(gmvChange)}` : ''}`;
    severity = 'success';
  } else {
    insight = `กำไร margin ${fmtPct(profitMargin)} พอใช้ ยังมีที่ปรับปรุงได้`;
    severity = 'info';
  }

  let action: string;
  if (netProfit < 0) {
    action = 'ต้องลดค่าใช้จ่ายและเพิ่มราคาสินค้าอย่างเร่งด่วน';
  } else if (settlementRate < 65) {
    action = 'ตรวจสอบค่าธรรมเนียมและส่วนลด — เงินหายไปกับอะไรบ้าง';
  } else {
    action = 'เพิ่มยอดขายให้กำไรรวมเพิ่มขึ้น margin อยู่ในเกณฑ์ที่ดี';
  }

  return { setup, insight, action, severity };
}

// ----------------------------------------------------------------
// Legacy simple helpers (backwards-compatible)
// ----------------------------------------------------------------

/**
 * @deprecated Use profitMarginNarrative(data) with full data instead.
 * Simple profit margin narrative from avgMargin only.
 */
export function profitMarginNarrativeSimple(avgMargin: number | null): string | null {
  if (avgMargin === null || avgMargin === undefined) return null;
  if (avgMargin < 0) return "อัตรากำไรเฉลี่ยติดลบ — ควรตรวจสอบต้นทุนและราคาขาย";
  if (avgMargin < 10) return "อัตรากำไรเฉลี่ยต่ำ — พิจารณาปรับราคาหรือลดต้นทุน";
  if (avgMargin < 20) return "อัตรากำไรเฉลี่ยอยู่ในเกณฑ์ปานกลาง — พยายามเพิ่มให้ได้ 20% ขึ้นไป";
  return "อัตรากำไรเฉลี่ยอยู่ในเกณฑ์ดี";
}

/**
 * @deprecated Use narrateTrend(data) instead.
 */
export function marginTrendNarrative(trend: "up" | "down" | "stable"): string | null {
  switch (trend) {
    case "up":
      return "แนวโน้ม margin ดีขึ้น";
    case "down":
      return "แนวโน้ม margin ลดลง — ควรติดตาม";
    case "stable":
      return "แนวโน้ม margin คงที่";
    default:
      return null;
  }
}
