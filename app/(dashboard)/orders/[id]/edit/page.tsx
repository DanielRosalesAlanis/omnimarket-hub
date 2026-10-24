import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/orders";
import { OrderForm } from "@/components/OrderForm";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar pedido" };

const toAmount = (cents: number) => (cents / 100).toFixed(2);

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          ← Volver a pedidos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Editar {order.code}</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
          <StatusBadge status={order.status} /> Registrado el {formatDate(order.createdAt)}. El estado se cambia
          desde el Kanban o la edición en lote.
        </p>
      </div>
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <OrderForm
          mode="edit"
          orderId={order.id}
          code={order.code}
          initial={{ customer: order.customer, total: toAmount(order.totalCents), cost: toAmount(order.costCents) }}
        />
      </div>
    </div>
  );
}
