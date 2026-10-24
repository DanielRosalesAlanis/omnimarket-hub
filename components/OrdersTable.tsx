"use client";

import { useState } from "react";
import { toast } from "sonner";
import { STATUSES, type Status } from "@/lib/schemas";
import { STATUS_LABELS } from "@/lib/status";
import { filterOrders } from "@/lib/filters";
import { formatMXN } from "@/lib/currency";
import { marginPercent } from "@/lib/finance";
import { StatusBadge } from "./StatusBadge";

export type OrderRow = {
  id: string;
  code: string;
  customer: string;
  status: Status;
  totalCents: number;
  costCents: number;
  dateLabel: string;
};

const fieldClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

export function OrdersTable({ initial }: { initial: OrderRow[] }) {
  const [rows, setRows] = useState(initial);
  const [source, setSource] = useState(initial);
  // Fresh server data (router.refresh / navigation) replaces the local copy.
  if (initial !== source) {
    setSource(initial);
    setRows(initial);
  }
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [targetStatus, setTargetStatus] = useState<Status>("PROCESSING");
  const [saving, setSaving] = useState<ReadonlySet<string>>(new Set());

  const visible = filterOrders(rows, { query, status: statusFilter });
  const allVisibleSelected = visible.length > 0 && visible.every((row) => selected.has(row.id));
  const isSaving = saving.size > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const row of visible) {
        if (allVisibleSelected) next.delete(row.id);
        else next.add(row.id);
      }
      return next;
    });
  }

  async function applyBulkUpdate() {
    const ids = [...selected];
    if (ids.length === 0) return;

    // Remember each row's previous status so a failure can be rolled back precisely.
    const previous = new Map(rows.filter((r) => selected.has(r.id)).map((r) => [r.id, r.status]));

    // Optimistic update.
    setRows((prev) => prev.map((r) => (previous.has(r.id) ? { ...r, status: targetStatus } : r)));
    setSaving(new Set(ids));

    try {
      const res = await fetch("/api/orders/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status: targetStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { count } = (await res.json()) as { count: number };
      toast.success(`${count} pedidos actualizados`);
      setSelected(new Set());
    } catch {
      setRows((prev) => prev.map((r) => (previous.has(r.id) ? { ...r, status: previous.get(r.id)! } : r)));
      toast.error("Falló la edición en lote. Cambios revertidos.");
    } finally {
      setSaving(new Set());
    }
  }

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por código o cliente"
          aria-label="Buscar pedidos"
          className={`${fieldClass} w-full sm:w-64`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | "ALL")}
          aria-label="Filtrar por estado"
          className={fieldClass}
        >
          <option value="ALL">Todos los estados</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
          <label className="text-sm text-slate-600" htmlFor="bulk-status">
            Mover a
          </label>
          <select
            id="bulk-status"
            value={targetStatus}
            onChange={(e) => setTargetStatus(e.target.value as Status)}
            className={fieldClass}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyBulkUpdate}
            disabled={selected.size === 0 || isSaving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Actualizar seleccionados ({selected.size})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
            <tr>
              <th scope="col" className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  aria-label="Seleccionar todos los visibles"
                  className="size-4 accent-indigo-600"
                />
              </th>
              <th scope="col" className="px-4 py-3">Código</th>
              <th scope="col" className="px-4 py-3">Cliente</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3 text-right">Total</th>
              <th scope="col" className="px-4 py-3 text-right">Margen</th>
              <th scope="col" className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row) => {
              const isSelected = selected.has(row.id);
              return (
                <tr
                  key={row.id}
                  aria-busy={saving.has(row.id)}
                  className={`${isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50"} ${saving.has(row.id) ? "animate-pulse" : ""}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(row.id)}
                      aria-label={`Seleccionar ${row.code}`}
                      className="size-4 accent-indigo-600"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-600">{row.code}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{row.customer}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{formatMXN(row.totalCents)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap text-slate-600 tabular-nums">
                    {marginPercent(row.totalCents, row.costCents).toFixed(2)} %
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">{row.dateLabel}</td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No hay pedidos que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
        Mostrando {visible.length} de {rows.length} pedidos
      </p>
    </div>
  );
}
