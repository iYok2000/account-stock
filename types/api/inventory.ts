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
