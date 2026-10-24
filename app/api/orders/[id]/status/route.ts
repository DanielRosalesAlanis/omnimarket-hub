import { prisma } from "@/lib/prisma";
import { moveSchema } from "@/lib/schemas";
import { topPositionFor } from "@/lib/orders";
import { badRequest, json, notFound, readJson, requireSession } from "@/lib/http";

/** PATCH /api/orders/:id/status — moves a Kanban card to another column (authenticated). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const parsed = moveSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error, "Estado inválido");
  const { status } = parsed.data;

  const current = await prisma.order.findUnique({ where: { id }, select: { status: true } });
  if (!current) return notFound("Pedido no encontrado");

  const order = await prisma.order.update({
    where: { id },
    data: current.status === status ? {} : { status, position: await topPositionFor(status) },
    select: { id: true, code: true, status: true, position: true, updatedAt: true },
  });

  return json(order);
}
