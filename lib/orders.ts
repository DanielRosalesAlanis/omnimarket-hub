import { prisma } from "./prisma";
import type { Status } from "./schemas";

/**
 * Position that places a card at the top of a Kanban column. Columns are sorted
 * by `position asc`, so going below the current minimum keeps moved or newly
 * created orders visible even when the board only renders the first N cards.
 */
export async function topPositionFor(status: Status): Promise<number> {
  const { _min } = await prisma.order.aggregate({ where: { status }, _min: { position: true } });
  return (_min.position ?? 1) - 1;
}

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeZone: "America/Mexico_City",
});

/** Server-side date label; computed once on the server so SSR and hydration always match. */
export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}
