/**
 * Client portal reorder — the only place the app talks to `/portal/client/*`.
 *
 * A customer reorders items they have bought before. The server decides which
 * items those are, at what rate and tax, and computes the order's totals; the
 * screen only estimates. Customers cannot read `/sales/orders/`, so this goes
 * through `api` directly rather than the backendSync registry.
 */
import { api } from './api';

const BASE = '/portal/client';

/** Items this customer may reorder, each with its last rate and tax. */
export async function fetchOrderableItems({ signal } = {}) {
  const body = await api.get(`${BASE}/orderable-items/`, { signal });
  if (Array.isArray(body)) return body;
  return Array.isArray(body?.results) ? body.results : [];
}

/**
 * Place the order. `payload` carries only what the customer chooses:
 * `{ deliveryDate?, notes?, lines: [{ itemId, quantity, notes? }] }`.
 *
 * `idempotencyKey` must stay the same across retries of the same submission,
 * so a retry after a timeout returns the original order instead of a second
 * one. No automatic retry here: the caller owns that decision.
 */
export function placePortalOrder(payload, { idempotencyKey, signal } = {}) {
  return api.post(`${BASE}/place-order/`, payload, {
    idempotencyKey,
    signal,
    // Number allocation and the recompute run in one transaction; give it
    // longer than a read.
    timeoutMs: 30000,
  });
}

/** One key per submission attempt; `randomUUID` needs a secure context. */
export function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `portal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
