export type DashboardOverviewApi = {
  totalProducts: number;
  lowStock: number;
  lastImport?: string | null;
};

export type DashboardRevenuePointApi = {
  date: string; // YYYY-MM-DD
  revenue: number;
  units: number;
};

export type DashboardRevenue7dApi = {
  data: DashboardRevenuePointApi[];
  from: string;
  to: string;
};

export type DashboardLowStockItemApi = {
  sku: string;
  name: string;
  qty?: number;
  amount?: number;
  units?: number;
  date?: string;
};

export type DashboardLowStockResponseApi = {
  data: DashboardLowStockItemApi[];
  limit: number;
};
