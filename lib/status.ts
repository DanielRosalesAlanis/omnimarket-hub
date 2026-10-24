import type { Status } from "./schemas";

export const STATUS_LABELS: Record<Status, string> = {
  PENDING: "Pendiente",
  PROCESSING: "En proceso",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
};

/** Tailwind classes per status: a solid accent (bars, dots) and a soft badge. */
export const STATUS_STYLES: Record<Status, { accent: string; badge: string }> = {
  PENDING: { accent: "bg-amber-500", badge: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  PROCESSING: { accent: "bg-sky-500", badge: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  SHIPPED: { accent: "bg-indigo-500", badge: "bg-indigo-50 text-indigo-700 ring-indigo-600/20" },
  DELIVERED: { accent: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
};
