import { z } from "zod";
import { sanitizeString } from "./sanitize";

const inventoryStatusEnum = z.enum(["in_stock", "low_stock", "out_of_stock"]);

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(500).transform(sanitizeString),
  sku: z.string().max(100).transform(sanitizeString).optional(),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
  status: inventoryStatusEnum.optional().default("in_stock"),
});

export const updateInventoryItemSchema = z.object({
  name: z.string().min(1).max(500).transform(sanitizeString).optional(),
  sku: z.string().max(100).transform(sanitizeString).optional(),
  quantity: z.number().int().min(0).optional(),
  status: inventoryStatusEnum.optional(),
});

export const inventoryQuerySchema = z.object({
  search: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: inventoryStatusEnum.optional(),
  category: z.string().optional(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>;
