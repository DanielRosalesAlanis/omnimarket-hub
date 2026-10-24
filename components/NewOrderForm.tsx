"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createOrderSchema } from "@/lib/schemas";

type FieldErrors = Partial<Record<"customer" | "total" | "cost", string>>;

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 aria-invalid:border-red-400";

function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0] as keyof FieldErrors;
    errors[field] ??= issue.message;
  }
  return errors;
}

export function NewOrderForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { customer: form.get("customer"), total: form.get("total"), cost: form.get("cost") };

    const parsed = createOrderSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { issues?: { path: PropertyKey[]; message: string }[] };
        if (body.issues) setErrors(toFieldErrors(body.issues));
        throw new Error(`HTTP ${res.status}`);
      }
      toast.success("Pedido creado");
      router.push("/orders");
      router.refresh();
    } catch {
      toast.error("No se pudo crear el pedido. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Cliente
          <input
            name="customer"
            type="text"
            autoComplete="off"
            required
            maxLength={80}
            aria-invalid={!!errors.customer}
            className={inputClass}
          />
        </label>
        {errors.customer && <p className="mt-1 text-xs text-red-600">{errors.customer}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Total (MXN)
            <input
              name="total"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              aria-invalid={!!errors.total}
              className={inputClass}
            />
          </label>
          {errors.total && <p className="mt-1 text-xs text-red-600">{errors.total}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Costo (MXN)
            <input
              name="cost"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              required
              aria-invalid={!!errors.cost}
              className={inputClass}
            />
          </label>
          {errors.cost && <p className="mt-1 text-xs text-red-600">{errors.cost}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/orders" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {submitting ? "Guardando…" : "Guardar pedido"}
        </button>
      </div>
    </form>
  );
}
