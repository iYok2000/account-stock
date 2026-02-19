import { z } from "zod";

export const reportQuerySchema = z.object({
  period: z.enum(["7d", "30d", "90d"]).default("30d"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  format: z.enum(["json", "csv"]).optional().default("json"),
});

export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
