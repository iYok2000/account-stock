/**
 * Placeholder types — รอต่อ API.
 * แทนที่ด้วย response shape จริงเมื่อ backend พร้อม
 */

export type SupplierApi = {
  id: string;
  name: string;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SupplierListResponseApi = {
  data: SupplierApi[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  nextCursor?: string;
};

/** POST /api/suppliers — create body */
export type SupplierCreateBodyApi = Partial<Omit<SupplierApi, "id">> & Pick<SupplierApi, "name">;
/** PUT /api/suppliers/:id — update body */
export type SupplierUpdateBodyApi = Partial<Omit<SupplierApi, "id">>;
