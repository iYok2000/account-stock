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
} from "@/types/api/inventory";
import type {
  OrderListResponseApi,
  OrderApi,
  OrderCreateBodyApi,
  OrderStatusBodyApi,
} from "@/types/api/orders";
import type {
  SupplierListResponseApi,
  SupplierApi,
  SupplierCreateBodyApi,
  SupplierUpdateBodyApi,
} from "@/types/api/suppliers";
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
      apiRequest<OrderListResponseApi>(
        `/api/orders${qs ? `?${qs}` : ""}`
      ),
    retry: false,
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => apiRequest<OrderApi>(`/api/orders/${id}`),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OrderCreateBodyApi) =>
      apiRequest<OrderApi>(`/api/orders`, {
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
    mutationFn: ({ id, status }: { id: string; status: OrderStatusBodyApi["status"] }) =>
      apiRequest<OrderApi>(`/api/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status } satisfies OrderStatusBodyApi),
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
      apiRequest<SupplierListResponseApi>(
        `/api/suppliers${qs ? `?${qs}` : ""}`
      ),
    retry: false,
  });
}

export function useSupplier(id: string | null) {
  return useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => apiRequest<SupplierApi>(`/api/suppliers/${id}`),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplierCreateBodyApi) =>
      apiRequest<SupplierApi>(`/api/suppliers`, {
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
    mutationFn: ({ id, data }: { id: string; data: SupplierUpdateBodyApi }) =>
      apiRequest<SupplierApi>(`/api/suppliers/${id}`, {
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
      apiRequest(`/api/suppliers/${id}`, { method: "DELETE" }),
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
      apiRequest<ReportSummaryApi>(
        `/api/reports/summary?period=${encodeURIComponent(period)}`
      ),
    retry: false,
  });
}
