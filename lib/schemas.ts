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

/** Letters (any language, with accents), digits, spaces and . , ' & - */
export const CUSTOMER_PATTERN = /^[\p{L}\p{N} .,'&-]+$/u;

/** Plain non-negative decimal with up to 2 decimals: rejects "-5", "1e3", "0x10", "1.234". */
export const MONEY_PATTERN = /^\d{1,7}(\.\d{1,2})?$/;

export const MAX_ORDER_TOTAL = 1_000_000;

/** Accepts a JSON number or a numeric string, but only in plain decimal notation. */
function moneySchema(label: string) {
  return z
    .union([z.number(), z.string()], { error: `${label}: ingresa un monto válido` })
    .transform((value) => (typeof value === "number" ? String(value) : value.trim()))
    .pipe(z.string().regex(MONEY_PATTERN, `${label}: solo números positivos con máximo 2 decimales`))
    .transform(Number);
}

export const createOrderSchema = z
  .object({
    customer: z
      .string({ error: "El cliente es obligatorio" })
      .trim()
      .min(2, "El cliente debe tener al menos 2 caracteres")
      .max(80, "El cliente no puede superar 80 caracteres")
      .regex(CUSTOMER_PATTERN, "El cliente solo puede tener letras, números, espacios y . , ' & -"),
    total: moneySchema("Total")
      .refine((v) => v > 0, "El total debe ser mayor a 0")
      .refine((v) => v <= MAX_ORDER_TOTAL, "El total no puede superar $1,000,000"),
    cost: moneySchema("Costo"),
  })
  .refine((order) => order.cost <= order.total, {
    message: "El costo no puede superar el total",
    path: ["cost"],
  });
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Editing an order validates the same fields and rules as creating one. */
export const updateOrderSchema = createOrderSchema;

export const moveSchema = z.object({ status: statusSchema });

const idsSchema = z.array(z.string().min(1).max(40)).min(1).max(200);

export const bulkUpdateSchema = z.object({ ids: idsSchema, status: statusSchema });

export const bulkDeleteSchema = z.object({ ids: idsSchema });

export const ORDERS_PAGE_SIZE = 25;

/** URL query of the orders table. Invalid values fall back to defaults instead of failing. */
export const ordersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  q: z.string().trim().max(80).catch(""),
  status: z.enum([...STATUSES, "ALL"]).catch("ALL"),
});
export type OrdersQuery = z.infer<typeof ordersQuerySchema>;
