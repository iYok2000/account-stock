import { z } from "zod";
import { sanitizeString } from "./sanitize";

const orderStatusEnum = z.enum([
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
]);

const orderItemSchema = z.object({
  productId: z.string().uuid().optional(),
  productName: z.string().min(1).transform(sanitizeString),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  costPrice: z.number().min(0).optional(),
});

export const createOrderSchema = z.object({
  orderDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  discount: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  platformFee: z.number().min(0).default(0),
  commissionFee: z.number().min(0).default(0),
  affiliateFee: z.number().min(0).default(0),
  customerName: z.string().transform(sanitizeString).optional(),
  customerPhone: z.string().optional(),
  shippingAddress: z.string().transform(sanitizeString).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusEnum,
});

export const orderQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: orderStatusEnum.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["orderDate", "totalAmount", "createdAt"]).default("orderDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
