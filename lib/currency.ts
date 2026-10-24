const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

/** Formats an integer amount of cents as Mexican pesos, e.g. 123450 → "$1,234.50". */
export function formatMXN(cents: number): string {
  return mxn.format(cents / 100);
}

/** Converts a decimal peso amount to integer cents, e.g. 19.99 → 1999. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}
