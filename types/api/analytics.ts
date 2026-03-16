export type AnalyticsReconciliationApi = {
  gmv: number;
  settlement: number;
  totalFees: number;
  netProfit: number;
  settlementRate?: number;
  feeBreakdown?: { label: string; value: number }[];
  from: string;
  to: string;
};

export type AnalyticsDailyPointApi = {
  label: string;
  revenue: number;
  profit: number;
  settlement: number;
};

export type AnalyticsDailyMetricsApi = {
  hasData: boolean;
  totals: { revenue: number; profit: number; settlement: number };
  timeSeries: AnalyticsDailyPointApi[];
  from: string;
  to: string;
};

export type AnalyticsProductMetricApi = {
  skuId: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  profit: number;
  profitMargin: number | null;
  hasCost: boolean;
};

export type AnalyticsProductMetricsApi = {
  products: AnalyticsProductMetricApi[];
  hasData: boolean;
  from: string;
  to: string;
};

// ─── Trends ───────────────────────────────────────────────────
export type TrendBucketApi = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
  profit: number;
  discount: number;
  days: number;
};

export type MomGrowthApi = {
  label: string;
  growth: number;
};

export type YoyItemApi = {
  label: string;
  currentYear: number;
  previousYear: number;
};

export type AnalyticsTrendsApi = {
  buckets: TrendBucketApi[];
  monthlyBuckets: TrendBucketApi[];
  momGrowth: MomGrowthApi[];
  yoy: YoyItemApi[];
  hasData: boolean;
  from: string;
  to: string;
  period?: "weekly" | "monthly";
};

// ─── Profitability ────────────────────────────────────────────
export type AnalyticsProfitabilityApi = {
  avgMargin: number;
  marginBuckets: { range: string; count: number }[];
  byCategory: { category: string; profit: number; margin: number }[];
  marginTrend: { label: string; margin: number }[];
  hasData: boolean;
  from: string;
  to: string;
};
