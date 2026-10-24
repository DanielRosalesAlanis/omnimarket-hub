import { describe, expect, it } from "vitest";
import { sanitizeCustomerInput, sanitizeMoneyInput } from "@/lib/input";

describe("sanitizeMoneyInput", () => {
  it("strips signs, letters and exponent notation", () => {
    expect(sanitizeMoneyInput("-1e5")).toBe("15");
    expect(sanitizeMoneyInput("+$1,500.75abc")).toBe("1500.75");
  });

  it("keeps a single decimal point and at most 2 decimals", () => {
    expect(sanitizeMoneyInput("12.3.4")).toBe("12.34");
    expect(sanitizeMoneyInput("9.999")).toBe("9.99");
    expect(sanitizeMoneyInput(".5")).toBe("0.5");
  });

  it("limits the integer part to 7 digits", () => {
    expect(sanitizeMoneyInput("123456789")).toBe("1234567");
  });
});

describe("sanitizeCustomerInput", () => {
  it("removes markup and symbols but keeps accents", () => {
    expect(sanitizeCustomerInput("<script>María</script>")).toBe("scriptMaríascript");
    expect(sanitizeCustomerInput("José 🚀 O'Neil & Hijos")).toBe("José O'Neil & Hijos");
  });

  it("collapses repeated spaces and caps the length at 80", () => {
    expect(sanitizeCustomerInput("  Ana   López")).toBe("Ana López");
    expect(sanitizeCustomerInput("a".repeat(100))).toHaveLength(80);
  });
});
