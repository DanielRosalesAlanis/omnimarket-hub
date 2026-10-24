export type SeedStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED";

const STATUSES: SeedStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
const CUSTOMERS = [
  "Ana López", "Carlos Ruiz", "María Fernández", "Jorge Díaz", "Lucía Torres",
  "Pedro Sánchez", "Sofía Ramírez", "Diego Morales", "Valeria Cruz", "Andrés Gómez",
];

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSeedOrders(count = 500) {
  const rand = mulberry32(42);
  const positions: Record<SeedStatus, number> = { PENDING: 0, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0 };
  const base = new Date("2026-01-01T00:00:00Z").getTime();

  return Array.from({ length: count }, (_, i) => {
    const status = STATUSES[i % STATUSES.length];
    const totalCents = Math.round((200 + rand() * 4800) * 100);
    const costCents = Math.round(totalCents * (0.45 + rand() * 0.3));
    return {
      code: `ORD-${String(i + 1).padStart(4, "0")}`,
      customer: CUSTOMERS[Math.floor(rand() * CUSTOMERS.length)],
      totalCents,
      costCents,
      status,
      position: positions[status]++,
      createdAt: new Date(base + i * 7 * 3_600_000),
    };
  });
}
