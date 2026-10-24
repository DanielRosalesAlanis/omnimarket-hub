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

describe("bulkUpdateSchema", () => {
  it("rejects an empty id list and an unknown status", () => {
    expect(bulkUpdateSchema.safeParse({ ids: [], status: "SHIPPED" }).success).toBe(false);
    expect(bulkUpdateSchema.safeParse({ ids: ["a"], status: "LOST" }).success).toBe(false);
  });
});
