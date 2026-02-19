/**
 * Placeholder types — รอต่อ API.
 * แทนที่ด้วย response shape จริงเมื่อ backend พร้อม
 */

export type OrderStatusApi =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded";

export type OrderItemApi = {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  totalPrice?: number;
};

export type OrderApi = {
  id: string;
  orderDate: string;
  status: OrderStatusApi;
  subtotal?: number;
  shippingCost?: number;
  totalAmount: number;
  netRevenue?: number;
  customerName?: string | null;
  items: OrderItemApi[];
  createdAt?: string;
  updatedAt?: string;
};

export type OrderListResponseApi = {
  data: OrderApi[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  nextCursor?: string;
};
