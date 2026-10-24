import { z } from "zod";

export const STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export const statusSchema = z.enum(STATUSES);
export type Status = z.infer<typeof statusSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const resetSchema = z.object({
  count: z.number().int().min(100).max(1000).default(500),
});

export const createOrderSchema = z
  .object({
    customer: z
      .string()
      .trim()
      .min(2, "El cliente debe tener al menos 2 caracteres")
      .max(80, "El cliente no puede superar 80 caracteres"),
    total: z.coerce
      .number()
      .positive("El total debe ser mayor a 0")
      .max(1_000_000, "El total no puede superar 1,000,000"),
    cost: z.coerce.number().min(0, "El costo no puede ser negativo"),
  })
  .refine((order) => order.cost <= order.total, {
    message: "El costo no puede superar el total",
    path: ["cost"],
  });
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const moveSchema = z.object({ status: statusSchema });

export const bulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  status: statusSchema,
});
