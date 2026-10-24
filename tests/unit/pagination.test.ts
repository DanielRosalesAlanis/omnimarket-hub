import { describe, expect, it } from "vitest";
import { clampPage, pageCount } from "@/lib/pagination";
import { bulkDeleteSchema, ordersQuerySchema } from "@/lib/schemas";

describe("pageCount", () => {
  it("rounds up partial pages", () => {
    expect(pageCount(500, 25)).toBe(20);
    expect(pageCount(501, 25)).toBe(21);
  });

  it("returns one page for an empty result", () => {
    expect(pageCount(0, 25)).toBe(1);
  });
});

describe("clampPage", () => {
  it("keeps the page inside the valid range", () => {
    expect(clampPage(0, 20)).toBe(1);
    expect(clampPage(99, 20)).toBe(20);
    expect(clampPage(7, 20)).toBe(7);
  });
});

describe("ordersQuerySchema", () => {
  it("reads page, search and status from the URL", () => {
    expect(ordersQuerySchema.parse({ page: "3", q: " ana ", status: "SHIPPED" })).toEqual({
      page: 3,
      q: "ana",
      status: "SHIPPED",
    });
  });

  it("falls back to defaults on missing or tampered values instead of failing", () => {
    expect(ordersQuerySchema.parse({})).toEqual({ page: 1, q: "", status: "ALL" });
    expect(ordersQuerySchema.parse({ page: "-4", status: "HACKED", q: ["a", "b"] })).toEqual({
      page: 1,
      q: "",
      status: "ALL",
    });
  });
});

describe("bulkDeleteSchema", () => {
  it("requires between 1 and 200 ids", () => {
    expect(bulkDeleteSchema.safeParse({ ids: ["a", "b"] }).success).toBe(true);
    expect(bulkDeleteSchema.safeParse({ ids: [] }).success).toBe(false);
    expect(bulkDeleteSchema.safeParse({ ids: Array.from({ length: 201 }, (_, i) => `id${i}`) }).success).toBe(false);
  });
});
