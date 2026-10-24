import { describe, expect, it } from "vitest";
import { bulkUpdateSchema, createOrderSchema, paginationSchema } from "@/lib/schemas";

describe("paginationSchema", () => {
  it("applies defaults when no params are given", () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 50 });
  });

  it("coerces query string values to numbers", () => {
    expect(paginationSchema.parse({ page: "2", limit: "10" })).toEqual({ page: 2, limit: 10 });
  });

  it("rejects a limit above 100", () => {
    expect(paginationSchema.safeParse({ limit: "500" }).success).toBe(false);
  });
});

describe("createOrderSchema", () => {
  it("rejects a cost greater than the total", () => {
    const result = createOrderSchema.safeParse({ customer: "Ana López", total: 100, cost: 150 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ["cost"],
      message: "El costo no puede superar el total",
    });
  });
});

describe("createOrderSchema amounts and names", () => {
  const valid = { customer: "Ana López", total: "1500", cost: "900.50" };

  it("accepts plain decimals as strings or numbers", () => {
    expect(createOrderSchema.parse(valid)).toEqual({ customer: "Ana López", total: 1500, cost: 900.5 });
    expect(createOrderSchema.parse({ ...valid, total: 1500, cost: 900 }).total).toBe(1500);
  });

  it.each([
    ["negative cost", { cost: "-5" }],
    ["exponent notation", { total: "1e3" }],
    ["hexadecimal", { total: "0x10" }],
    ["more than 2 decimals", { total: "10.555" }],
    ["zero total", { total: "0" }],
    ["total above the limit", { total: "1000000.01" }],
    ["non numeric text", { cost: "abc" }],
    ["markup in the name", { customer: "<script>alert(1)</script>" }],
    ["name too short", { customer: "A" }],
  ])("rejects %s", (_, override) => {
    expect(createOrderSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});

describe("bulkUpdateSchema", () => {
  it("rejects an empty id list and an unknown status", () => {
    expect(bulkUpdateSchema.safeParse({ ids: [], status: "SHIPPED" }).success).toBe(false);
    expect(bulkUpdateSchema.safeParse({ ids: ["a"], status: "LOST" }).success).toBe(false);
  });
});
