import { z } from "zod";
import { sanitizeString } from "./sanitize";

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(300).transform(sanitizeString),
  contact: z.string().max(500).transform(sanitizeString).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1).max(300).transform(sanitizeString).optional(),
  contact: z.string().max(500).transform(sanitizeString).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export const supplierQuerySchema = z.object({
  search: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type SupplierQueryInput = z.infer<typeof supplierQuerySchema>;
