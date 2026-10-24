import type { Metadata } from "next";
import Link from "next/link";
import { NewOrderForm } from "@/components/NewOrderForm";

export const metadata: Metadata = { title: "Nuevo pedido" };

export default function NewOrderPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          ← Volver a pedidos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nuevo pedido</h1>
        <p className="mt-1 text-sm text-slate-500">El pedido se registra en estado Pendiente.</p>
      </div>
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <NewOrderForm />
      </div>
    </div>
  );
}
