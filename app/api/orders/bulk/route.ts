import { prisma } from "@/lib/prisma";
import { bulkDeleteSchema, bulkUpdateSchema } from "@/lib/schemas";
import { badRequest, json, readJson, requireSession } from "@/lib/http";

/** PATCH /api/orders/bulk — sets the same status on many orders at once (authenticated). */
export async function PATCH(req: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const parsed = bulkUpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error, "Edición en lote inválida");

  const { ids, status } = parsed.data;
  const { count } = await prisma.order.updateMany({ where: { id: { in: ids } }, data: { status } });

  return json({ count });
}

/** DELETE /api/orders/bulk — removes many orders at once (authenticated). */
export async function DELETE(req: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const parsed = bulkDeleteSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error, "Eliminación en lote inválida");

  const { count } = await prisma.order.deleteMany({ where: { id: { in: parsed.data.ids } } });

  return json({ count });
}
