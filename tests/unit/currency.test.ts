import { describe, expect, it } from "vitest";
import { formatMXN, toCents } from "@/lib/currency";

describe("formatMXN", () => {
  it("formats cents as Mexican pesos with thousands separator", () => {
    expect(formatMXN(123450)).toBe("$1,234.50");
  });

  it("formats zero", () => {
    expect(formatMXN(0)).toBe("$0.00");
  });
});

describe("toCents", () => {
  it("avoids floating point drift", () => {
    expect(toCents(19.99)).toBe(1999);
  });
});
