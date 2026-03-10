/**
 * Data fetching hooks — รอต่อ API.
 * ใช้ types จาก types/api; เมื่อ backend พร้อมให้เปลี่ยน base URL / endpoint และ response shape.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  InventoryListResponseApi,
  InventoryItemApi,
  InventoryCreateBodyApi,
  InventoryUpdateBodyApi,
  InventoryImportPayloadApi,
  InventoryImportResponseApi,
  InventorySummaryApi,
} from "@/types/api/inventory";
import type { ReportSummaryApi } from "@/types/api/reports";
import type { UsersListResponseApi } from "@/types/api/users";
import type {
  DashboardOverviewApi,
  DashboardRevenue7dApi,
  DashboardLowStockResponseApi,
} from "@/types/api/dashboard";
import type { DashboardKpisApi } from "@/types/api/dashboard-kpis";
import type {
  AnalyticsReconciliationApi,
  AnalyticsDailyMetricsApi,
  AnalyticsProductMetricsApi,
} from "@/types/api/analytics";
import { apiRequest } from "@/lib/api-client";

// ============== USERS (GET /api/users — SuperAdmin, พร้อมใช้ที่ backend) ==============

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => apiRequest<UsersListResponseApi>("/api/users"),
    retry: false,
  });
}

// ============== INVENTORY (รอต่อ API) ==============

export function useInventory(params?: {
  search?: string;
  cursor?: string;
  limit?: number;
  status?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.status) searchParams.set("status", params.status);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["inventory", params],
    queryFn: () =>
      apiRequest<InventoryListResponseApi>(
        `/api/inventory${qs ? `?${qs}` : ""}`
      ),
    retry: false,
  });
}

export function useInventoryItem(id: string | null) {
  return useQuery({
    queryKey: ["inventory", id],
    queryFn: () => apiRequest<InventoryItemApi>(`/api/inventory/${id}`),
    enabled: !!id,
    retry: false,
  });
}

export function useInventorySummary(period: string = "current_month") {
  return useQuery({
    queryKey: ["inventory", "summary", period],
    queryFn: () =>
      apiRequest<InventorySummaryApi>(
        `/api/inventory/summary?period=${encodeURIComponent(period)}`
      ),
    retry: false,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InventoryCreateBodyApi) =>
      apiRequest<InventoryItemApi>(`/api/inventory`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InventoryUpdateBodyApi }) =>
      apiRequest<InventoryItemApi>(`/api/inventory/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/inventory/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useImportInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InventoryImportPayloadApi) =>
      apiRequest<InventoryImportResponseApi>(`/api/inventory/import`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "summary"] });
    },
  });
}

// ============== REPORTS (รอต่อ API) ==============

export function useReportSummary(period: string = "30d") {
  return useQuery({
    queryKey: ["reports", "summary", period],
    queryFn: () =>
      apiRequest<ReportSummaryApi>(
        `/api/reports/summary?period=${encodeURIComponent(period)}`
      ),
    retry: false,
  });
}

// ============== DASHBOARD ==============

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => apiRequest<DashboardOverviewApi>("/api/dashboard/overview"),
    retry: false,
  });
}

export function useDashboardRevenue7d() {
  return useQuery({
    queryKey: ["dashboard", "revenue-7d"],
    queryFn: () => apiRequest<DashboardRevenue7dApi>("/api/dashboard/revenue-7d"),
    retry: false,
  });
}

export function useDashboardLowStock(limit: number = 5) {
  return useQuery({
    queryKey: ["dashboard", "low-stock", limit],
    queryFn: () =>
      apiRequest<DashboardLowStockResponseApi>(
        `/api/dashboard/low-stock?limit=${limit}`
      ),
    retry: false,
  });
}

export function useDashboardKpis() {
  return useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: () => apiRequest<DashboardKpisApi>("/api/dashboard/kpis"),
    retry: false,
  });
}

// ============== ANALYTICS ==============

export function useAnalyticsReconciliation(params?: { from?: string; to?: string }) {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const qs = search.toString();
  return useQuery({
    queryKey: ["analytics", "reconciliation", params],
    queryFn: () => apiRequest<AnalyticsReconciliationApi>(`/api/analytics/reconciliation${qs ? `?${qs}` : ""}`),
    retry: false,
  });
}

export function useAnalyticsDailyMetrics(params?: { from?: string; to?: string }) {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const qs = search.toString();
  return useQuery({
    queryKey: ["analytics", "daily-metrics", params],
    queryFn: () => apiRequest<AnalyticsDailyMetricsApi>(`/api/analytics/daily-metrics${qs ? `?${qs}` : ""}`),
    retry: false,
  });
}

export function useAnalyticsProductMetrics(params?: { from?: string; to?: string }) {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const qs = search.toString();
  return useQuery({
    queryKey: ["analytics", "product-metrics", params],
    queryFn: () => apiRequest<AnalyticsProductMetricsApi>(`/api/analytics/product-metrics${qs ? `?${qs}` : ""}`),
    retry: false,
  });
}
