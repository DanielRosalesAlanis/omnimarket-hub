import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATUSES, type Status } from "@/lib/schemas";
import { json, notFound, serverTiming } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/test/kanban-status?code=ORD-0001   (or ?id=<cuid>)
 *   → current status/position of one order, e.g. after a drag & drop.
 * GET /api/test/kanban-status
 *   → number of orders per Kanban column.
 */
export async function GET(req: NextRequest) {
  const startedAt = performance.now();
  const headers = () => ({ "Server-Timing": serverTiming(startedAt) });

  const code = req.nextUrl.searchParams.get("code");
  const id = req.nextUrl.searchParams.get("id");

  if (code || id) {
    const order = await prisma.order.findUnique({
      where: code ? { code } : { id: id! },
      select: { id: true, code: true, status: true, position: true, updatedAt: true },
    });
    if (!order) return notFound("Pedido no encontrado");
    return json(order, { headers: headers() });
  }

  const groups = await prisma.order.groupBy({ by: ["status"], _count: { _all: true } });
  const columns = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const group of groups) columns[group.status] = group._count._all;

  return json({ columns }, { headers: headers() });
}
