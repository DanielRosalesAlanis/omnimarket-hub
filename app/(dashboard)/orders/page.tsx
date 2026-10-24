import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/orders";
import { OrdersTable } from "@/components/OrdersTable";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pedidos" };

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, code: true, customer: true, status: true, totalCents: true, costCents: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
          <p className="mt-1 text-sm text-slate-500">Los 50 pedidos más recientes. Selecciona varios para editarlos en lote.</p>
        </div>
        <Link
          href="/orders/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Nuevo pedido
        </Link>
      </div>

      <OrdersTable
        initial={orders.map(({ createdAt, ...order }) => ({ ...order, dateLabel: formatDate(createdAt) }))}
      />
    </div>
  );
}
