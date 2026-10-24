import { prisma } from "@/lib/prisma";
import { updateOrderSchema } from "@/lib/schemas";
import { toCents } from "@/lib/currency";
import { badRequest, json, notFound, readJson, requireSession } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/orders/:id — edits customer and amounts of an order (authenticated). */
export async function PATCH(req: Request, { params }: Params) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const parsed = updateOrderSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error, "Datos del pedido inválidos");

  const { customer, total, cost } = parsed.data;
  const { count } = await prisma.order.updateMany({
    where: { id },
    data: { customer, totalCents: toCents(total), costCents: toCents(cost) },
  });
  if (count === 0) return notFound("Pedido no encontrado");

  const order = await prisma.order.findUnique({ where: { id } });
  return json(order);
}

/** DELETE /api/orders/:id — removes an order (authenticated). */
export async function DELETE(_req: Request, { params }: Params) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const { count } = await prisma.order.deleteMany({ where: { id } });
  if (count === 0) return notFound("Pedido no encontrado");

  return json({ ok: true, id });
}
