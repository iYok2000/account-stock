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
