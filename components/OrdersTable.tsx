"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { STATUSES, type OrdersQuery, type Status } from "@/lib/schemas";
import { STATUS_LABELS } from "@/lib/status";
import { filterOrders } from "@/lib/filters";
import { formatMXN } from "@/lib/currency";
import { marginPercent } from "@/lib/finance";
import { ConfirmDialog } from "./ConfirmDialog";
import { Skeleton } from "./Skeleton";
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

type Props = {
  initial: OrderRow[];
  query: OrdersQuery;
  total: number;
  totalPages: number;
  pageSize: number;
};

type PendingDelete = { ids: string[]; label: string } | null;

const fieldClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

const SEARCH_DEBOUNCE_MS = 350;

function ordersHref({ page, q, status }: OrdersQuery): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status !== "ALL") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/orders?${qs}` : "/orders";
}

export function OrdersTable({ initial, query: current, total, totalPages, pageSize }: Props) {
  const router = useRouter();
  const [isLoading, startTransition] = useTransition();

  const [rows, setRows] = useState(initial);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [source, setSource] = useState(initial);
  // Fresh server data (navigation, filters, router.refresh) replaces the local copy.
  if (initial !== source) {
    setSource(initial);
    setRows(initial);
    setSelected(new Set());
  }

  const [search, setSearch] = useState(current.q);
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">(current.status);
  const [targetStatus, setTargetStatus] = useState<Status>("PROCESSING");
  const [saving, setSaving] = useState<ReadonlySet<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  function navigate(next: Partial<OrdersQuery>) {
    const href = ordersHref({ ...current, page: 1, ...next });
    startTransition(() => router.replace(href, { scroll: false }));
  }

  // Server-side search over every order, debounced while typing.
  useEffect(() => {
    const q = search.trim();
    if (q === current.q) return;
    const timer = setTimeout(() => {
      startTransition(() => router.replace(ordersHref({ ...current, q, page: 1 }), { scroll: false }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, current, router]);

  // Local filtering keeps optimistic changes consistent with the active filters instantly.
  const visible = filterOrders(rows, { query: search, status: statusFilter });
  const allVisibleSelected = visible.length > 0 && visible.every((row) => selected.has(row.id));
  const isSaving = saving.size > 0;
  const firstItem = total === 0 ? 0 : (current.page - 1) * pageSize + 1;
  const lastItem = Math.min(current.page * pageSize, total);

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
      startTransition(() => router.refresh());
    } catch {
      setRows((prev) => prev.map((r) => (previous.has(r.id) ? { ...r, status: previous.get(r.id)! } : r)));
      toast.error("Falló la edición en lote. Cambios revertidos.");
    } finally {
      setSaving(new Set());
    }
  }

  async function deleteOrders(ids: string[], label: string) {
    setPendingDelete(null);
    const single = ids.length === 1;

    // Optimistic removal; keep the original positions to restore them on failure.
    const removed = rows.map((row, index) => ({ row, index })).filter(({ row }) => ids.includes(row.id));
    setRows((prev) => prev.filter((r) => !ids.includes(r.id)));

    try {
      const res = single
        ? await fetch(`/api/orders/${ids[0]}`, { method: "DELETE" })
        : await fetch("/api/orders/bulk", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
          });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(single ? `${label} eliminado` : `${ids.length} pedidos eliminados`);
      setSelected((prev) => new Set([...prev].filter((id) => !ids.includes(id))));
      startTransition(() => router.refresh());
    } catch {
      setRows((prev) => {
        const next = [...prev];
        for (const { row, index } of removed) next.splice(index, 0, row);
        return next;
      });
      toast.error(single ? `No se pudo eliminar ${label}. Cambio revertido.` : "Falló la eliminación en lote. Cambios revertidos.");
    }
  }

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
        <input
          type="search"
          maxLength={80}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código o cliente"
          aria-label="Buscar pedidos"
          className={`${fieldClass} w-full sm:w-64`}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            const status = e.target.value as Status | "ALL";
            setStatusFilter(status);
            navigate({ status, q: search.trim() });
          }}
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
          <button
            type="button"
            onClick={() => setPendingDelete({ ids: [...selected], label: `${selected.size} pedidos` })}
            disabled={selected.size === 0 || isSaving}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            Eliminar seleccionados ({selected.size})
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
              <th scope="col" className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100" aria-busy={isLoading}>
            {isLoading
              ? Array.from({ length: 8 }, (_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              : visible.map((row) => {
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
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          href={`/orders/${row.id}/edit`}
                          aria-label={`Editar ${row.code}`}
                          className="rounded-md px-2 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete({ ids: [row.id], label: row.code })}
                          aria-label={`Eliminar ${row.code}`}
                          className="rounded-md px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
            {!isLoading && visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  No hay pedidos que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <nav
        aria-label="Paginación"
        className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600"
      >
        <p className="text-xs text-slate-500">
          {total === 0 ? "Sin resultados" : `Mostrando ${firstItem}–${lastItem} de ${total} pedidos`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate({ page: current.page - 1, q: search.trim(), status: statusFilter })}
            disabled={current.page <= 1 || isLoading}
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="tabular-nums">
            Página {current.page} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => navigate({ page: current.page + 1, q: search.trim(), status: statusFilter })}
            disabled={current.page >= totalPages || isLoading}
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </nav>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="¿Eliminar pedidos?"
        description={
          pendingDelete
            ? `${pendingDelete.ids.length === 1 ? `Se eliminará el pedido ${pendingDelete.label}` : `Se eliminarán ${pendingDelete.label}`}. Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        onConfirm={() => pendingDelete && deleteOrders(pendingDelete.ids, pendingDelete.label)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
