import { describe, expect, it } from "vitest";
import { averageTicket, grossMarginCents, marginPercent } from "@/lib/finance";

describe("averageTicket", () => {
  it("divides revenue by the number of orders", () => {
    expect(averageTicket(300000, 3)).toBe(100000);
  });

  it("returns 0 when there are no orders", () => {
    expect(averageTicket(0, 0)).toBe(0);
  });
});

describe("grossMarginCents", () => {
  it("subtracts cost from revenue", () => {
    expect(grossMarginCents(10000, 6500)).toBe(3500);
  });
});

describe("marginPercent", () => {
  it("returns the margin rounded to 2 decimals", () => {
    expect(marginPercent(30000, 20000)).toBe(33.33);
  });

  it("returns 0 when revenue is 0", () => {
    expect(marginPercent(0, 100)).toBe(0);
  });
});
