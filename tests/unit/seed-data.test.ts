import { describe, expect, it } from "vitest";
import { buildSeedOrders } from "@/lib/seed-data";

describe("buildSeedOrders", () => {
  it("is deterministic across calls", () => {
    expect(buildSeedOrders(20)).toEqual(buildSeedOrders(20));
  });

  it("always starts with ORD-0001 pending at position 0", () => {
    expect(buildSeedOrders(20)[0]).toMatchObject({ code: "ORD-0001", status: "PENDING", position: 0 });
  });
});
