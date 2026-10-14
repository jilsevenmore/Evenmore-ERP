/**
 * Estimated order totals for the portal's Place Order form.
 *
 * The same per-line steps the server runs (Backend/apps/core/money.py,
 * `compute_line`): line = rate × qty, discount is a percentage of it, tax is
 * charged on what remains, each step rounded half-up to 2 decimals. It is an
 * estimate only — the server recomputes and its figures are the order's.
 */

/** Half-up to 2 decimals, as `round2` does on the server. */
export function round2(value) {
  const n = Number(value) || 0;
  const sign = n < 0 ? -1 : 1;
  return (sign * Math.round((Math.abs(n) + Number.EPSILON) * 100)) / 100;
}

/** A quantity the server will accept: positive, at most 4 decimals. */
export function parseQuantity(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return { ok: false, empty: true, error: 'Enter a quantity.' };
  if (/^-\s*\d/.test(text)) return { ok: false, error: 'Quantity must be more than 0.' };
  if (!/^\d+(\.\d+)?$/.test(text) && !/^\.\d+$/.test(text)) {
    return { ok: false, error: 'Enter a number, like 5 or 2.5.' };
  }
  const value = Number(text);
  if (!(value > 0)) return { ok: false, error: 'Quantity must be more than 0.' };
  const decimals = (text.split('.')[1] || '').length;
  if (decimals > 4) return { ok: false, error: 'Use at most 4 decimal places.' };
  if (value >= 1e14) return { ok: false, error: 'That quantity is too large.' };
  return { ok: true, value, text };
}

export function estimateLine(item, quantity) {
  const qty = Number(quantity) || 0;
  const rate = Number(item?.lastOrderedRate) || 0;
  const discountPct = Number(item?.lastDiscountPct) || 0;
  const taxPct = Number(item?.taxRate) || 0;
  const amount = round2(rate * qty);
  const discount = round2(amount * (discountPct / 100));
  const taxable = Math.max(0, round2(amount - discount));
  const tax = round2(taxable * (taxPct / 100));
  return { amount, discount, taxable, tax, total: round2(taxable + tax) };
}

export function estimateOrder(lines) {
  return lines.reduce(
    (sum, line) => ({
      amount: round2(sum.amount + line.amount),
      discount: round2(sum.discount + line.discount),
      tax: round2(sum.tax + line.tax),
      total: round2(sum.total + line.total),
    }),
    { amount: 0, discount: 0, tax: 0, total: 0 },
  );
}
