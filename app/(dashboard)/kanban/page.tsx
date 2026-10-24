import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { STATUSES, type Status } from "@/lib/schemas";
import { KanbanBoard } from "@/components/KanbanBoard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kanban" };

const CARDS_PER_COLUMN = 15;

export default async function KanbanPage() {
  const [lists, groups] = await Promise.all([
    Promise.all(
      STATUSES.map((status) =>
        prisma.order.findMany({
          where: { status },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          take: CARDS_PER_COLUMN,
          select: { id: true, code: true, customer: true, totalCents: true, status: true, position: true },
        }),
      ),
    ),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const totals = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const group of groups) totals[group.status] = group._count._all;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tablero de pedidos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Arrastra una tarjeta a otra columna para cambiar su estado. Se muestran los primeros {CARDS_PER_COLUMN}{" "}
          pedidos de cada columna.
        </p>
      </div>
      <KanbanBoard initial={lists.flat()} totals={totals} />
    </div>
  );
}
