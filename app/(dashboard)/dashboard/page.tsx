import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STATUSES } from "@/lib/schemas";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/status";
import { averageTicket, grossMarginCents, marginPercent } from "@/lib/finance";
import { formatMXN } from "@/lib/currency";
import { formatDate } from "@/lib/orders";
import { StatusBadge } from "@/components/StatusBadge";
import { LiveRefresh } from "@/components/LiveRefresh";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resumen" };

const numberFormat = new Intl.NumberFormat("es-MX");
const timeFormat = new Intl.DateTimeFormat("es-MX", { timeStyle: "medium", timeZone: "America/Mexico_City" });

export default async function DashboardPage() {
  const [aggregate, byStatus, recent] = await Promise.all([
    prisma.order.aggregate({ _count: { _all: true }, _sum: { totalCents: true, costCents: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true }, _sum: { totalCents: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, code: true, customer: true, status: true, totalCents: true, createdAt: true },
    }),
  ]);

  const count = aggregate._count._all;
  const revenue = aggregate._sum.totalCents ?? 0;
  const cost = aggregate._sum.costCents ?? 0;

  const statusRows = STATUSES.map((status) => {
    const group = byStatus.find((g) => g.status === status);
    return { status, count: group?._count._all ?? 0, revenue: group?._sum.totalCents ?? 0 };
  });
  const maxRevenue = Math.max(1, ...statusRows.map((row) => row.revenue));

  const kpis = [
    { label: "Ventas totales", value: formatMXN(revenue), hint: "Ingresos acumulados" },
    { label: "Ticket promedio", value: formatMXN(averageTicket(revenue, count)), hint: "Ingreso medio por pedido" },
    {
      label: "Margen bruto %",
      value: `${marginPercent(revenue, cost).toFixed(2)} %`,
      hint: `Utilidad bruta ${formatMXN(grossMarginCents(revenue, cost))}`,
    },
    { label: "Pedidos", value: numberFormat.format(count), hint: "Total registrados" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resumen</h1>
          <p className="mt-1 text-sm text-slate-500">Indicadores clave de ventas y operación</p>
        </div>
        <LiveRefresh updatedAt={timeFormat.format(new Date())} />
      </div>

      <section aria-label="Indicadores clave" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{kpi.value}</p>
            <p className="mt-1 text-xs text-slate-400">{kpi.hint}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-3">
          <h2 className="text-base font-semibold">Ventas por estado</h2>
          <ul className="mt-5 space-y-4">
            {statusRows.map((row) => (
              <li key={row.status}>
                <div className="mb-1.5 flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-medium">{STATUS_LABELS[row.status]}</span>
                  <span className="text-slate-500 tabular-nums">
                    {formatMXN(row.revenue)} · {numberFormat.format(row.count)} pedidos
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${STATUS_STYLES[row.status].accent}`}
                    style={{ width: `${(row.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Pedidos recientes</h2>
            <Link href="/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Ver todos
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {recent.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{order.customer}</p>
                  <p className="text-xs text-slate-500">
                    <span className="font-mono">{order.code}</span> · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-medium tabular-nums">{formatMXN(order.totalCents)}</span>
                  <StatusBadge status={order.status} />
                </div>
              </li>
            ))}
            {recent.length === 0 && <li className="py-6 text-center text-sm text-slate-500">Sin pedidos todavía</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
