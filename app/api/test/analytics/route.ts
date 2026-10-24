import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema, STATUSES, type Status } from "@/lib/schemas";
import { averageTicket, marginPercent } from "@/lib/finance";
import { badRequest, json, serverTiming } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/test/analytics?page=1&limit=50
 * Public audit endpoint: paginated orders plus aggregated sales metrics.
 */
export async function GET(req: NextRequest) {
  const startedAt = performance.now();

  const parsed = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return badRequest(parsed.error, "Parámetros de paginación inválidos");
  const { page, limit } = parsed.data;

  // Independent queries run in parallel to stay well under the 300 ms SLA.
  const [aggregate, byStatus, rows] = await Promise.all([
    prisma.order.aggregate({ _count: { _all: true }, _sum: { totalCents: true, costCents: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        code: true,
        customer: true,
        status: true,
        totalCents: true,
        costCents: true,
        createdAt: true,
      },
    }),
  ]);

  const total = aggregate._count._all;
  const revenueCents = aggregate._sum.totalCents ?? 0;
  const costCents = aggregate._sum.costCents ?? 0;

  const ordersByStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const group of byStatus) ordersByStatus[group.status] = group._count._all;

  return json(
    {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      summary: {
        revenueCents,
        averageTicketCents: averageTicket(revenueCents, total),
        grossMarginPct: marginPercent(revenueCents, costCents),
        ordersByStatus,
      },
      data: rows.map((row) => ({ ...row, marginPct: marginPercent(row.totalCents, row.costCents) })),
    },
    { headers: { "Server-Timing": serverTiming(startedAt) } },
  );
}
