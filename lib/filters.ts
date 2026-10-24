import type { Status } from "./schemas";

export type FilterableOrder = {
  code: string;
  customer: string;
  status: Status;
  totalCents: number;
};

export type OrderFilters = {
  query?: string;
  status?: Status | "ALL";
  minTotalCents?: number;
};

/** Lowercases and strips diacritics so "maria" matches "María". */
function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function filterOrders<T extends FilterableOrder>(orders: T[], filters: OrderFilters = {}): T[] {
  const query = normalize(filters.query?.trim() ?? "");
  const status = filters.status ?? "ALL";
  const minTotal = filters.minTotalCents ?? 0;

  return orders.filter((order) => {
    if (status !== "ALL" && order.status !== status) return false;
    if (order.totalCents < minTotal) return false;
    if (!query) return true;
    return normalize(order.code).includes(query) || normalize(order.customer).includes(query);
  });
}
