/**
 * Keystroke-level sanitizers for form fields. They only improve the typing
 * experience; the authoritative validation is the Zod schema on the server.
 */

const MAX_INTEGER_DIGITS = 7;

/** Keeps a plain positive decimal: digits and one ".", max 2 decimals ("," is a thousands separator in es-MX and is dropped). */
export function sanitizeMoneyInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot === -1) return cleaned.slice(0, MAX_INTEGER_DIGITS);

  const integer = cleaned.slice(0, dot).slice(0, MAX_INTEGER_DIGITS);
  const decimals = cleaned.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  return `${integer || "0"}.${decimals}`;
}

/** Removes characters outside letters, digits, spaces and . , ' & - and collapses repeated spaces. */
export function sanitizeCustomerInput(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N} .,'&-]/gu, "")
    .replace(/ {2,}/g, " ")
    .replace(/^ /, "")
    .slice(0, 80);
}
