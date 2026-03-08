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
