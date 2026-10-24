"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { STATUSES, type Status } from "@/lib/schemas";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/status";
import { formatMXN } from "@/lib/currency";

export type KanbanOrder = {
  id: string;
  code: string;
  customer: string;
  totalCents: number;
  status: Status;
  position: number;
};

type Props = {
  initial: KanbanOrder[];
  totals: Record<Status, number>;
};

export function KanbanBoard({ initial, totals: initialTotals }: Props) {
  const [orders, setOrders] = useState(initial);
  const [totals, setTotals] = useState(initialTotals);
  const [source, setSource] = useState(initial);
  // Fresh server data (router.refresh / navigation) replaces the local copy.
  if (initial !== source) {
    setSource(initial);
    setOrders(initial);
    setTotals(initialTotals);
  }
  const [saving, setSaving] = useState<ReadonlySet<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const byId = (id: unknown) => orders.find((o) => o.id === id);
  const activeOrder = activeId ? byId(activeId) : undefined;

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Tomaste el pedido ${byId(active.id)?.code ?? ""}.`,
    onDragOver: ({ active, over }) =>
      over ? `${byId(active.id)?.code ?? ""} está sobre la columna ${STATUS_LABELS[over.id as Status]}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `${byId(active.id)?.code ?? ""} se soltó en ${STATUS_LABELS[over.id as Status]}.` : undefined,
    onDragCancel: ({ active }) => `Se canceló el movimiento de ${byId(active.id)?.code ?? ""}.`,
  };

  function moveLocal(id: string, from: Status, to: Status, position: number) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: to, position } : o)));
    setTotals((prev) => ({ ...prev, [from]: prev[from] - 1, [to]: prev[to] + 1 }));
  }

  function setSavingFlag(id: string, on: boolean) {
    setSaving((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const order = byId(active.id);
    const target = over.id as Status;
    if (!order || order.status === target) return;

    const { id, code, status: previousStatus, position: previousPosition } = order;
    const topPosition = Math.min(0, ...orders.filter((o) => o.status === target).map((o) => o.position)) - 1;

    // 1) Optimistic update: the card jumps to the top of the target column immediately.
    moveLocal(id, previousStatus, target, topPosition);
    setSavingFlag(id, true);

    try {
      // 2) Persist.
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`${code} movido a ${STATUS_LABELS[target]}`);
    } catch {
      // 3) Roll back only this card so concurrent moves are not affected.
      moveLocal(id, target, previousStatus, previousPosition);
      toast.error(`No se pudo mover ${code}. Cambio revertido.`);
    } finally {
      setSavingFlag(id, false);
    }
  }

  return (
    <DndContext
      id="kanban-board"
      sensors={sensors}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Para mover un pedido, presiona espacio o enter. Usa las flechas para desplazarlo y presiona espacio o enter de nuevo para soltarlo, o escape para cancelar.",
        },
      }}
      onDragStart={({ active }: DragStartEvent) => setActiveId(String(active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            total={totals[status]}
            orders={orders
              .filter((o) => o.status === status)
              .sort((a, b) => a.position - b.position)}
            saving={saving}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeOrder ? <CardBody order={activeOrder} className="rotate-2 shadow-lg ring-indigo-300" /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  total,
  orders,
  saving,
}: {
  status: Status;
  total: number;
  orders: KanbanOrder[];
  saving: ReadonlySet<string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      data-testid={`column-${status}`}
      aria-label={`Columna ${STATUS_LABELS[status]}`}
      className={`flex flex-col rounded-xl p-3 ring-1 transition-colors ${
        isOver ? "bg-indigo-50 ring-2 ring-indigo-400" : "bg-slate-100 ring-slate-200"
      }`}
    >
      <header className="mb-3 flex items-center justify-between px-1 py-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden className={`size-2.5 rounded-full ${STATUS_STYLES[status].accent}`} />
          {STATUS_LABELS[status]}
        </h2>
        <span
          className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 tabular-nums ring-1 ring-slate-200"
          title={`${total} pedidos en total`}
        >
          {total}
        </span>
      </header>

      <ul className="flex min-h-24 flex-col gap-2 lg:max-h-[calc(100vh-15rem)] lg:overflow-y-auto">
        {orders.map((order) => (
          <KanbanCard key={order.id} order={order} saving={saving.has(order.id)} />
        ))}
        {orders.length === 0 && (
          <li className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
            Suelta un pedido aquí
          </li>
        )}
      </ul>
    </section>
  );
}

function KanbanCard({ order, saving }: { order: KanbanOrder; saving: boolean }) {
  // The card stays in place as a faded placeholder while <DragOverlay> follows the
  // pointer; this avoids clipping by the scrollable columns.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: order.id });

  return (
    <li
      ref={setNodeRef}
      data-testid={`card-${order.code}`}
      className={`touch-none select-none ${isDragging ? "opacity-40" : ""} ${saving ? "animate-pulse" : ""}`}
      aria-busy={saving}
      {...attributes}
      {...listeners}
    >
      <CardBody order={order} className="cursor-grab hover:ring-indigo-300 active:cursor-grabbing" />
    </li>
  );
}

function CardBody({ order, className = "" }: { order: KanbanOrder; className?: string }) {
  return (
    <div className={`rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200 transition ${className}`}>
      <p className="font-mono text-xs text-slate-500">{order.code}</p>
      <p className="mt-1 truncate text-sm font-medium">{order.customer}</p>
      <p className="mt-1 text-sm font-semibold text-indigo-600 tabular-nums">{formatMXN(order.totalCents)}</p>
    </div>
  );
}
