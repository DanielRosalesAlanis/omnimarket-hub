"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createOrderSchema } from "@/lib/schemas";
import { sanitizeCustomerInput, sanitizeMoneyInput } from "@/lib/input";

type Field = "customer" | "total" | "cost";
type FieldErrors = Partial<Record<Field, string>>;
export type OrderFormValues = Record<Field, string>;

type Props =
  | { mode: "create" }
  | { mode: "edit"; orderId: string; code: string; initial: OrderFormValues };

const EMPTY: OrderFormValues = { customer: "", total: "", cost: "" };

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 aria-invalid:border-red-400 disabled:bg-slate-100";

function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0] as Field;
    errors[field] ??= issue.message;
  }
  return errors;
}

export function OrderForm(props: Props) {
  const router = useRouter();
  const [values, setValues] = useState<OrderFormValues>(props.mode === "edit" ? props.initial : EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function update(field: Field, raw: string) {
    const sanitize = field === "customer" ? sanitizeCustomerInput : sanitizeMoneyInput;
    setValues((prev) => ({ ...prev, [field]: sanitize(raw) }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = createOrderSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch(props.mode === "edit" ? `/api/orders/${props.orderId}` : "/api/orders", {
        method: props.mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { issues?: { path: PropertyKey[]; message: string }[] };
        if (body.issues) setErrors(toFieldErrors(body.issues));
        throw new Error(`HTTP ${res.status}`);
      }
      toast.success(props.mode === "edit" ? `${props.code} actualizado` : "Pedido creado");
      router.push("/orders");
      router.refresh();
    } catch {
      toast.error(props.mode === "edit" ? `No se pudo actualizar ${props.code}.` : "No se pudo crear el pedido. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-busy={submitting}>
      {/* While saving, the fields turn into a pulsing skeleton (no spinners). */}
      <fieldset disabled={submitting} className={`space-y-5 ${submitting ? "animate-pulse" : ""}`}>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Cliente
            <input
              name="customer"
              type="text"
              autoComplete="off"
              required
              maxLength={80}
              value={values.customer}
              onChange={(e) => update("customer", e.target.value)}
              aria-invalid={!!errors.customer}
              aria-describedby="customer-hint"
              className={inputClass}
            />
          </label>
          <p id="customer-hint" className={`mt-1 text-xs ${errors.customer ? "text-red-600" : "text-slate-400"}`}>
            {errors.customer ?? "Letras, números, espacios y . , ' & - (2 a 80 caracteres)"}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Total (MXN)
              <input
                name="total"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                required
                value={values.total}
                onChange={(e) => update("total", e.target.value)}
                aria-invalid={!!errors.total}
                aria-describedby="total-hint"
                className={inputClass}
              />
            </label>
            <p id="total-hint" className={`mt-1 text-xs ${errors.total ? "text-red-600" : "text-slate-400"}`}>
              {errors.total ?? "Mayor a 0, hasta $1,000,000"}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Costo (MXN)
              <input
                name="cost"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                required
                value={values.cost}
                onChange={(e) => update("cost", e.target.value)}
                aria-invalid={!!errors.cost}
                aria-describedby="cost-hint"
                className={inputClass}
              />
            </label>
            <p id="cost-hint" className={`mt-1 text-xs ${errors.cost ? "text-red-600" : "text-slate-400"}`}>
              {errors.cost ?? "No negativo y no mayor al total"}
            </p>
          </div>
        </div>
      </fieldset>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/orders" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {submitting ? "Guardando…" : props.mode === "edit" ? "Guardar cambios" : "Guardar pedido"}
        </button>
      </div>
    </form>
  );
}
