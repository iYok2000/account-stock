/**
 * Data fetching hooks — รอต่อ API.
 * ใช้ types จาก types/api; เมื่อ backend พร้อมให้เปลี่ยน base URL / endpoint และ response shape.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { InventoryListResponseApi, InventoryItemApi } from "@/types/api/inventory";
import type { OrderListResponseApi, OrderApi } from "@/types/api/orders";
import type { SupplierListResponseApi, SupplierApi } from "@/types/api/suppliers";
import type { ReportSummaryApi } from "@/types/api/reports";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
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
      apiFetch<InventoryListResponseApi>(
        `${BASE}/api/inventory${qs ? `?${qs}` : ""}`
      ),
    retry: false,
  });
}

export function useInventoryItem(id: string | null) {
  return useQuery({
    queryKey: ["inventory", id],
    queryFn: () => apiFetch<InventoryItemApi>(`${BASE}/api/inventory/${id}`),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<InventoryItemApi>(`${BASE}/api/inventory`, {
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
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) =>
      apiFetch<InventoryItemApi>(`${BASE}/api/inventory/${id}`, {
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
      apiFetch(`${BASE}/api/inventory/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

// ============== ORDERS (รอต่อ API) ==============

export function useOrders(params?: {
  status?: string;
  cursor?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["orders", params],
    queryFn: () =>
      apiFetch<OrderListResponseApi>(
        `${BASE}/api/orders${qs ? `?${qs}` : ""}`
      ),
    retry: false,
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => apiFetch<OrderApi>(`${BASE}/api/orders/${id}`),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<OrderApi>(`${BASE}/api/orders`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) =>
      apiFetch<OrderApi>(`${BASE}/api/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// ============== SUPPLIERS (รอต่อ API) ==============

export function useSuppliers(params?: {
  search?: string;
  cursor?: string;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["suppliers", params],
    queryFn: () =>
      apiFetch<SupplierListResponseApi>(
        `${BASE}/api/suppliers${qs ? `?${qs}` : ""}`
      ),
    retry: false,
  });
}

export function useSupplier(id: string | null) {
  return useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => apiFetch<SupplierApi>(`${BASE}/api/suppliers/${id}`),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<SupplierApi>(`${BASE}/api/suppliers`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) =>
      apiFetch<SupplierApi>(`${BASE}/api/suppliers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`${BASE}/api/suppliers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

// ============== REPORTS (รอต่อ API) ==============

export function useReportSummary(period: string = "30d") {
  return useQuery({
    queryKey: ["reports", "summary", period],
    queryFn: () =>
      apiFetch<ReportSummaryApi>(
        `${BASE}/api/reports/summary?period=${encodeURIComponent(period)}`
      ),
    retry: false,
  });
}
