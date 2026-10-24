import { describe, expect, it } from "vitest";
import { filterOrders, type FilterableOrder } from "@/lib/filters";

const orders: FilterableOrder[] = [
  { code: "ORD-0001", customer: "Ana López", status: "PENDING", totalCents: 50000 },
  { code: "ORD-0002", customer: "Carlos Ruiz", status: "SHIPPED", totalCents: 150000 },
  { code: "ORD-0003", customer: "Lucía Torres", status: "SHIPPED", totalCents: 80000 },
  { code: "ORD-0004", customer: "Diego Morales", status: "DELIVERED", totalCents: 200000 },
];

describe("filterOrders", () => {
  it("searches customers case-insensitively", () => {
    expect(filterOrders(orders, { query: "ana" }).map((o) => o.code)).toEqual(["ORD-0001"]);
  });

  it("combines status and minimum total filters", () => {
    const result = filterOrders(orders, { status: "SHIPPED", minTotalCents: 100000 });
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("ORD-0002");
  });

  it("matches order codes and ignores accents", () => {
    expect(filterOrders(orders, { query: "ord-0004" }).map((o) => o.code)).toEqual(["ORD-0004"]);
    expect(filterOrders(orders, { query: "lucia" }).map((o) => o.code)).toEqual(["ORD-0003"]);
  });

  it("returns every order with the ALL status and no query", () => {
    expect(filterOrders(orders, { status: "ALL" })).toHaveLength(orders.length);
  });
});
