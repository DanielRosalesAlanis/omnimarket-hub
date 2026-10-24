/** Average order value in cents. Returns 0 when there are no orders. */
export function averageTicket(sumCents: number, count: number): number {
  if (count === 0) return 0;
  return Math.round(sumCents / count);
}

/** Gross margin in cents: revenue minus cost of goods. */
export function grossMarginCents(totalCents: number, costCents: number): number {
  return totalCents - costCents;
}

/** Gross margin as a percentage of revenue, rounded to 2 decimals. */
export function marginPercent(totalCents: number, costCents: number): number {
  if (totalCents <= 0) return 0;
  const pct = (grossMarginCents(totalCents, costCents) / totalCents) * 100;
  return Math.round(pct * 100) / 100;
}
