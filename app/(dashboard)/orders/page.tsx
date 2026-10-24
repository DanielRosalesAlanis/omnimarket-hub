import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/orders";
import { ORDERS_PAGE_SIZE, ordersQuerySchema } from "@/lib/schemas";
import { clampPage, pageCount } from "@/lib/pagination";
import { OrdersTable } from "@/components/OrdersTable";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pedidos" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = ordersQuerySchema.parse(await searchParams);

  const where: Prisma.OrderWhereInput = {
    ...(query.status !== "ALL" && { status: query.status }),
    ...(query.q && {
      OR: [
        { code: { contains: query.q, mode: "insensitive" } },
        { customer: { contains: query.q, mode: "insensitive" } },
      ],
    }),
  };

  const total = await prisma.order.count({ where });
  const totalPages = pageCount(total, ORDERS_PAGE_SIZE);
  const page = clampPage(query.page, totalPages);

  const orders = await prisma.order.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { code: "desc" }],
    skip: (page - 1) * ORDERS_PAGE_SIZE,
    take: ORDERS_PAGE_SIZE,
    select: { id: true, code: true, customer: true, status: true, totalCents: true, costCents: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Busca, filtra y pagina todos los pedidos. Selecciona varios para editarlos o eliminarlos en lote.
          </p>
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
        query={{ ...query, page }}
        total={total}
        totalPages={totalPages}
        pageSize={ORDERS_PAGE_SIZE}
      />
    </div>
  );
}
