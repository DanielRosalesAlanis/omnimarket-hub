import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/schemas";
import { toCents } from "@/lib/currency";
import { topPositionFor } from "@/lib/orders";
import { badRequest, json, readJson, requireSession } from "@/lib/http";

/** POST /api/orders — creates an order (authenticated). Amounts arrive in pesos and are stored in cents. */
export async function POST(req: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const parsed = createOrderSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error, "Datos del pedido inválidos");

  const { customer, total, cost } = parsed.data;
  const order = await prisma.order.create({
    data: {
      code: `ORD-${Date.now().toString(36).toUpperCase()}`,
      customer,
      totalCents: toCents(total),
      costCents: toCents(cost),
      status: "PENDING",
      position: await topPositionFor("PENDING"),
    },
  });

  return json(order, { status: 201 });
}
