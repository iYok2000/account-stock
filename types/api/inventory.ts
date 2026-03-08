/**
 * Placeholder types — รอต่อ API.
 * แทนที่ด้วย response shape จริงเมื่อ backend พร้อม
 */

export type InventoryItemApi = {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  /** Optional: extended metrics from import */
  date?: string | null;
  revenue?: number;
  deductions?: number;
  refund?: number;
  net?: number;
  seller_sku?: string | null;
  product_name?: string | null;
  variation?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type InventoryListResponseApi = {
  data: InventoryItemApi[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  nextCursor?: string;
};

/** POST /api/inventory — create body */
export type InventoryCreateBodyApi = Partial<Omit<InventoryItemApi, "id">> & Pick<InventoryItemApi, "name" | "sku" | "quantity" | "status">;
/** PUT /api/inventory/:id — update body */
export type InventoryUpdateBodyApi = Partial<Omit<InventoryItemApi, "id">>;

/** POST /api/inventory/import — bulk upsert from import (shop scoped by auth) */
export type InventoryImportItemApi = {
  date: string | null;
  sku_id: string;
  name: string;
  seller_sku?: string;
  product_name?: string;
  variation?: string;
  quantity: number;
  revenue?: number;
  deductions?: number;
  refund?: number;
  net?: number;
};

export type InventoryImportPayloadApi = { items: InventoryImportItemApi[] };
export type InventoryImportResponseApi = { ok?: boolean; imported?: number; updated?: number; errors?: string[] };

export type InventorySummaryApi = {
  uniqueSkus: number;
  unitsThisMonth: number;
  revenueThisMonth: number;
  netThisMonth: number;
  lastImport?: string | null;
  topSkus?: {
    sku: string;
    name?: string;
    quantity?: number;
    revenue?: number;
    net?: number;
    date?: string | null;
  }[];
};
