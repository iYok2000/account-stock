/**
 * Placeholder types — รอต่อ API.
 * แทนที่ด้วย response shape จริงเมื่อ backend พร้อม
 */

export type ReportSummaryApi = {
  periodStart: string;
  periodEnd: string;
  totalRevenue?: number;
  totalOrders?: number;
  topProducts?: Array<{ name: string; quantity: number; revenue: number }>;
};

export type ReportExportResponseApi = {
  url?: string;
  blob?: Blob;
  filename?: string;
};
