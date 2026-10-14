/**
 * Client portal "Reorder Items" — the button and the drawer it opens.
 *
 * Items come only from `GET /portal/client/orderable-items/`: the server
 * decides what this customer may reorder, at what rate and tax, and computes
 * the order. What is shown here is labelled an estimate. The form sends only
 * the delivery date, remarks, item ids, quantities and line notes.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Loader2, MessageSquarePlus, PackagePlus,
  Plus, RefreshCw, ShoppingCart, Trash2,
} from 'lucide-react';
import { Drawer } from '../../../components/ui/Drawer';
import { Button } from '../../../components/ui/Button';
import { useAppStore } from '../../../stores/appStore';
import { formatCurrency, getBaseCurrency } from '../../../utils/currencyUtils';
import { getCurrentISODate, toDisplayDate } from '../../../utils/dateUtils';
import { handleNumberInputFocus } from '../../../utils/stringUtils';
import {
  fetchOrderableItems,
  newIdempotencyKey,
  placePortalOrder,
} from '../../../services/portalOrderService';
import { estimateLine, estimateOrder, parseQuantity } from './orderEstimate';

const PERMISSION = 'place_portal_order';
const MAX_LINES = 100; // the server's PORTAL_MAX_LINES
const NOTES_MAX = 2000;
const LINE_NOTES_MAX = 500;

const money = (value) => formatCurrency(value, getBaseCurrency());
const qtyText = (value) =>
  Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 4 });

let lineSeq = 0;
const blankLine = () => ({ key: `line-${(lineSeq += 1)}`, itemId: '', quantity: '', notes: '', noteOpen: false });
const blankForm = () => ({ deliveryDate: '', notes: '', lines: [blankLine()] });
const noErrors = () => ({ form: null, hint: null, deliveryDate: null, notes: null, lines: {}, list: null });

/** A signed-in customer who may reorder — never a staff impersonation session. */
export function canPlacePortalOrder(currentUser, permissions) {
  if (!currentUser) return false;
  const isCustomer = Boolean(
    currentUser.isCustomer ||
    currentUser.roleCode === 'CU' ||
    currentUser.role?.code === 'CU' ||
    String(currentUser.role?.name || currentUser.role || '').toLowerCase() === 'customer'
  );
  if (!isCustomer || !(permissions || []).includes(PERMISSION)) return false;
  let impersonating = Boolean(currentUser.impersonating?.is_impersonating);
  try {
    impersonating = impersonating || Boolean(localStorage.getItem('impersonated_from_user'));
  } catch {
    /* storage blocked: rely on the session flag */
  }
  return !impersonating;
}

/** Turn an ApiError from place-order into messages bound to the form. */
function errorsFromApi(err, submittedKeys) {
  const next = noErrors();
  const status = err?.status ?? 0;
  const payload = err?.payload || {};
  const fieldErrors = payload.field_errors || {};

  Object.entries(fieldErrors).forEach(([path, messages]) => {
    const text = Array.isArray(messages) ? messages.join(' ') : String(messages);
    const match = path.match(/^lines\[(\d+)\]\.(\w+)$/);
    if (match) {
      const key = submittedKeys[Number(match[1])];
      if (!key) return;
      const field = match[2] === 'uom' ? 'quantity' : match[2];
      next.lines[key] = { ...(next.lines[key] || {}), [field]: text };
    } else if (path === 'lines') {
      next.list = text;
    } else if (path === 'deliveryDate' || path === 'delivery_date') {
      next.deliveryDate = text;
    } else if (path === 'notes') {
      next.notes = text;
    }
  });

  if (status === 0) {
    next.form = 'We could not reach the server, so we cannot tell yet whether your order went through.';
    next.hint = 'Check your connection and press Place Order again. Retrying is safe — it will not create a second order.';
  } else if (status === 401) {
    next.form = 'Your session has expired. Please sign in again to place this order.';
  } else if (status === 403) {
    next.form = payload.message || 'Your account cannot place orders right now. Please contact us.';
  } else if (status === 409) {
    next.form = payload.message || 'This order is still being processed. Please wait a moment.';
    next.hint = 'Press Place Order again in a few seconds — it will not create a second order.';
  } else if (status === 429) {
    const minutes = err?.retryAfter ? Math.max(1, Math.ceil(err.retryAfter / 60)) : null;
    next.form = 'You have placed several orders in a short time.';
    next.hint = minutes
      ? `Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}. Your entries are kept.`
      : 'Please try again a little later. Your entries are kept.';
  } else if (status >= 500) {
    next.form = 'Something went wrong on our side and the order was not placed.';
    next.hint = 'Your entries are kept. Please try again in a moment.';
  } else {
    next.form = payload.message || err?.message || 'The order could not be placed.';
    if (payload.code === 'ITEM_NOT_ORDERABLE') {
      next.hint = 'Remove or change the highlighted items, then try again.';
    }
  }
  return next;
}

function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1 text-[11px] font-medium text-rose-600">
      {children}
    </p>
  );
}

function PlaceOrderDrawer({ isOpen, onClose, onPlaced }) {
  const showToast = useAppStore((s) => s.showToast);

  const [items, setItems] = useState([]);
  const [itemsState, setItemsState] = useState('idle'); // idle | loading | ready | error
  const [itemsError, setItemsError] = useState('');
  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState(noErrors);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(null);

  const submittingRef = useRef(false);
  // The idempotency key of the last attempt and the body it was sent with: an
  // unchanged resubmission reuses the key, a changed one gets a new key.
  const attemptRef = useRef(null);
  const errorRef = useRef(null);
  const today = getCurrentISODate();

  const loadItems = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setItemsState('loading');
    setItemsError('');
    try {
      const rows = await fetchOrderableItems();
      setItems(rows);
      setItemsState('ready');
    } catch (err) {
      if (quiet) return;
      setItemsError(
        err?.status === 403
          ? err?.payload?.message || 'Your account cannot place orders from the portal.'
          : err?.status === 0
            ? 'We could not reach the server. Check your connection and try again.'
            : err?.message || 'Your items could not be loaded.',
      );
      setItemsState('error');
    }
  }, []);

  // Fresh list on every open: rates, stock and eligibility can change.
  useEffect(() => {
    if (isOpen) loadItems();
  }, [isOpen, loadItems]);

  const itemsById = useMemo(() => {
    const map = new Map();
    items.forEach((item) => map.set(String(item.id), item));
    return map;
  }, [items]);

  const estimates = useMemo(
    () =>
      form.lines.map((line) => {
        const item = itemsById.get(line.itemId);
        const qty = parseQuantity(line.quantity);
        return item && qty.ok ? estimateLine(item, qty.value) : null;
      }),
    [form.lines, itemsById],
  );
  const totals = useMemo(() => estimateOrder(estimates.filter(Boolean)), [estimates]);

  const isDirty =
    Boolean(form.deliveryDate || form.notes.trim()) ||
    form.lines.some((l) => l.itemId || String(l.quantity).trim() || l.notes.trim());

  const reset = () => {
    setForm(blankForm());
    setErrors(noErrors());
    setPlaced(null);
    attemptRef.current = null;
  };

  const requestClose = () => {
    if (submittingRef.current) return; // never abandon an in-flight order
    if (!placed && isDirty && !window.confirm('Discard this order? The items you added will be cleared.')) {
      return;
    }
    reset();
    onClose();
  };

  const updateLine = (key, patch) => {
    setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));
    setErrors((e) => {
      if (!e.lines[key]) return e;
      const lines = { ...e.lines };
      const cleared = { ...lines[key] };
      Object.keys(patch).forEach((field) => delete cleared[field]);
      if ('itemId' in patch) delete cleared.quantity; // a unit error belonged to the old item
      lines[key] = cleared;
      return { ...e, lines };
    });
  };

  const addLine = () => {
    setForm((f) => (f.lines.length >= MAX_LINES ? f : { ...f, lines: [...f.lines, blankLine()] }));
    setErrors((e) => ({ ...e, list: null }));
  };

  const removeLine = (key) => {
    setForm((f) => {
      const lines = f.lines.filter((l) => l.key !== key);
      return { ...f, lines: lines.length ? lines : [blankLine()] };
    });
    setErrors((e) => {
      const lines = { ...e.lines };
      delete lines[key];
      return { ...e, lines };
    });
  };

  const validate = () => {
    const next = noErrors();
    const chosen = [];
    form.lines.forEach((line) => {
      const hasQty = String(line.quantity).trim() !== '';
      if (!line.itemId && !hasQty && !line.notes.trim()) return; // untouched row
      const lineErrors = {};
      if (!line.itemId) lineErrors.itemId = 'Choose an item.';
      else if (!itemsById.has(line.itemId)) lineErrors.itemId = 'This item is no longer available. Remove it.';
      const qty = parseQuantity(line.quantity);
      if (!qty.ok) lineErrors.quantity = qty.error;
      if (Object.keys(lineErrors).length) next.lines[line.key] = lineErrors;
      else chosen.push({ line, quantity: qty.text });
    });
    if (!chosen.length && !Object.keys(next.lines).length) {
      next.list = 'Add at least one item with a quantity.';
    }
    if (form.deliveryDate && form.deliveryDate < today) {
      next.deliveryDate = 'Pick today or a later date.';
    }
    if (form.notes.length > NOTES_MAX) next.notes = `Keep remarks under ${NOTES_MAX} characters.`;
    const failed = Boolean(next.list || next.deliveryDate || next.notes || Object.keys(next.lines).length);
    if (failed) next.form = 'Please fix the highlighted fields.';
    return { failed, next, chosen };
  };

  const submit = async (event) => {
    event?.preventDefault();
    if (submittingRef.current) return; // a second click before the re-render
    const { failed, next, chosen } = validate();
    setErrors(next);
    if (failed) {
      requestAnimationFrame(() => errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
      return;
    }

    const payload = {
      lines: chosen.map(({ line, quantity }) => ({
        itemId: line.itemId,
        quantity,
        ...(line.notes.trim() ? { notes: line.notes.trim() } : {}),
      })),
    };
    if (form.deliveryDate) payload.deliveryDate = form.deliveryDate;
    if (form.notes.trim()) payload.notes = form.notes.trim();

    const body = JSON.stringify(payload);
    if (!attemptRef.current || attemptRef.current.body !== body) {
      attemptRef.current = { body, key: newIdempotencyKey() };
    }
    const submittedKeys = chosen.map(({ line }) => line.key);

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const order = await placePortalOrder(payload, { idempotencyKey: attemptRef.current.key });
      attemptRef.current = null;
      setPlaced(order);
      setErrors(noErrors());
      showToast(order?.orderNumber ? `Order ${order.orderNumber} placed` : 'Order placed');
      onPlaced?.(order);
    } catch (err) {
      setErrors(errorsFromApi(err, submittedKeys));
      if (err?.payload?.code === 'ITEM_NOT_ORDERABLE') loadItems({ quiet: true });
      requestAnimationFrame(() => errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const chosenIds = new Set(form.lines.map((l) => l.itemId).filter(Boolean));
  const allItemsUsed = items.length > 0 && chosenIds.size >= items.length;
  const hasEstimate = estimates.some(Boolean);

  // ── Footer ──────────────────────────────────────────────────────────────
  let footer = null;
  if (placed) {
    footer = (
      <div className="flex w-full flex-wrap items-center justify-end gap-2 text-xs">
        <Button variant="outline" onClick={reset}>Place another order</Button>
        <Button onClick={() => { reset(); onClose(); }}>Done</Button>
      </div>
    );
  } else if (itemsState === 'ready' && items.length > 0) {
    footer = (
      <div className="flex w-full flex-wrap items-center justify-between gap-3 text-xs">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-500">Estimated total</p>
          <p className="text-base font-extrabold text-slate-900">{hasEstimate ? money(totals.total) : '—'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={requestClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" form="portal-place-order-form" disabled={submitting} aria-busy={submitting}>
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
            {submitting ? 'Placing order…' : 'Place Order'}
          </Button>
        </div>
      </div>
    );
  }

  // ── Body ────────────────────────────────────────────────────────────────
  let content;
  if (placed) {
    content = (
      <div className="space-y-5 text-xs">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
          <h3 className="mt-2 text-base font-bold text-slate-900">Order placed</h3>
          <p className="mt-1 text-xs text-slate-600">Keep this number for your reference.</p>
          <p className="mt-3 font-mono text-xl font-extrabold tracking-wide text-slate-900">{placed.orderNumber}</p>
          <p className="mt-3 text-xs text-slate-700">
            Status: <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 font-semibold">{placed.stage}</span>
          </p>
          {placed.stage === 'Draft' && (
            <p className="mt-2 text-xs text-slate-600">Our sales team will review and confirm your order.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700">Order summary</div>
          <ul className="divide-y divide-slate-100">
            {(placed.lines || []).map((line) => (
              <li key={line.lineNo} className="flex items-start justify-between gap-3 px-4 py-2.5 text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">{line.name}</p>
                  <p className="text-slate-500">{qtyText(line.quantity)} {line.uom} × {money(line.rate)}</p>
                </div>
                <span className="shrink-0 font-semibold text-slate-800">{money(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 border-t border-slate-100 px-4 py-3 text-xs">
            <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{money(placed.totals?.subtotal)}</dd></div>
            {Number(placed.totals?.totalDiscount) > 0 && (
              <div className="flex justify-between"><dt className="text-slate-500">Discount</dt><dd>−{money(placed.totals?.totalDiscount)}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-slate-500">GST</dt><dd>{money(placed.totals?.totalTax)}</dd></div>
            <div className="flex justify-between border-t border-slate-100 pt-1.5 text-sm font-bold text-slate-900">
              <dt>Order total</dt><dd>{money(placed.totals?.total)}</dd>
            </div>
          </dl>
          {placed.deliveryDate && (
            <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-600">
              Requested delivery: <strong>{toDisplayDate(placed.deliveryDate)}</strong>
            </p>
          )}
        </div>
      </div>
    );
  } else if (itemsState === 'loading' || itemsState === 'idle') {
    content = (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <p className="text-xs text-slate-500">Loading items you have ordered before…</p>
        {[0, 1, 2].map((n) => (
          <div key={n} className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  } else if (itemsState === 'error') {
    content = (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-xs" role="alert">
        <AlertTriangle size={28} className="mx-auto text-rose-500" />
        <p className="mt-2 text-sm font-semibold text-slate-800">{itemsError}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => loadItems()}>
          <RefreshCw size={14} /> Try again
        </Button>
      </div>
    );
  } else if (items.length === 0) {
    content = (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <PackagePlus size={24} />
        </div>
        <h3 className="mt-3 text-sm font-bold text-slate-800">Nothing to reorder yet</h3>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
          Items you have bought from us before will appear here so you can order them again.
          For anything new, please contact your account manager.
        </p>
      </div>
    );
  } else {
    content = (
      <form id="portal-place-order-form" onSubmit={submit} noValidate className="space-y-5 text-xs">
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-blue-800">
          Choose from items you have ordered before. Prices are from your last order and every
          amount here is an <strong>estimate</strong> — we calculate the final order total when you place it.
        </p>

        {(errors.form || errors.list) && (
          <div ref={errorRef} role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
            <p className="font-semibold">{errors.form || errors.list}</p>
            {errors.form && errors.list && <p className="mt-1">{errors.list}</p>}
            {errors.hint && <p className="mt-1">{errors.hint}</p>}
          </div>
        )}

        <section aria-labelledby="po-items-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 id="po-items-heading" className="text-xs font-bold uppercase tracking-wide text-slate-500">Items</h3>
            <span className="text-[11px] text-slate-400">{items.length} available to reorder</span>
          </div>

          {form.lines.map((line, index) => {
            const item = itemsById.get(line.itemId);
            const lineErr = errors.lines[line.key] || {};
            const estimate = estimates[index];
            const ids = { item: `po-item-${line.key}`, qty: `po-qty-${line.key}`, note: `po-note-${line.key}` };
            return (
              <div
                key={line.key}
                className={`rounded-xl border bg-white p-3 sm:p-4 ${Object.keys(lineErr).length ? 'border-rose-300' : 'border-slate-200'}`}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                    {index + 1}
                  </span>
                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                    <div className="min-w-0">
                      <label htmlFor={ids.item} className="mb-1 block text-[11px] font-semibold text-slate-600">Item</label>
                      <select
                        id={ids.item}
                        value={line.itemId}
                        onChange={(e) => updateLine(line.key, { itemId: e.target.value })}
                        disabled={submitting}
                        aria-invalid={Boolean(lineErr.itemId)}
                        aria-describedby={lineErr.itemId ? `${ids.item}-err` : undefined}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Select an item…</option>
                        {line.itemId && !item && <option value={line.itemId}>Item no longer available</option>}
                        {items
                          .filter((opt) => String(opt.id) === line.itemId || !chosenIds.has(String(opt.id)))
                          .map((opt) => (
                            <option key={opt.id} value={String(opt.id)}>
                              {opt.name}{opt.itemCode ? ` (${opt.itemCode})` : ''}
                            </option>
                          ))}
                      </select>
                      <FieldError id={`${ids.item}-err`}>{lineErr.itemId}</FieldError>
                    </div>
                    <div>
                      <label htmlFor={ids.qty} className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Quantity{item?.uom ? ` (${item.uom})` : ''}
                      </label>
                      <input
                        id={ids.qty}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={line.quantity}
                        onFocus={handleNumberInputFocus}
                        onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                        disabled={submitting}
                        placeholder="0"
                        aria-invalid={Boolean(lineErr.quantity)}
                        aria-describedby={lineErr.quantity ? `${ids.qty}-err` : undefined}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <FieldError id={`${ids.qty}-err`}>{lineErr.quantity}</FieldError>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    disabled={submitting}
                    className="mt-6 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    aria-label={`Remove item ${index + 1}`}
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {item && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-slate-100 pt-2.5 pl-7 text-[11px] text-slate-500">
                    <span>
                      Last rate <strong className="text-slate-700">{money(item.lastOrderedRate)}</strong>/{item.uom}
                      {Number(item.lastDiscountPct) > 0 && <> · Disc {Number(item.lastDiscountPct)}%</>}
                      {' '}· GST {Number(item.taxRate)}%
                      {item.availableStock != null && <> · In stock {qtyText(Math.max(0, item.availableStock))} {item.uom}</>}
                    </span>
                    <span>
                      Est. line total <strong className="text-slate-800">{estimate ? money(estimate.total) : '—'}</strong>
                    </span>
                  </div>
                )}

                <div className="mt-2 pl-7 text-[11px]">
                  {line.noteOpen || line.notes ? (
                    <div>
                      <label htmlFor={ids.note} className="mb-1 block text-[11px] font-semibold text-slate-600">Note for this item (optional)</label>
                      <input
                        id={ids.note}
                        type="text"
                        value={line.notes}
                        maxLength={LINE_NOTES_MAX}
                        onChange={(e) => updateLine(line.key, { notes: e.target.value })}
                        disabled={submitting}
                        placeholder="e.g. cut to 1 m lengths"
                        aria-invalid={Boolean(lineErr.notes)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <FieldError id={`${ids.note}-err`}>{lineErr.notes}</FieldError>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateLine(line.key, { noteOpen: true })}
                      disabled={submitting}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <MessageSquarePlus size={13} /> Add a note
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLine}
            disabled={submitting || allItemsUsed || form.lines.length >= MAX_LINES}
            title={allItemsUsed ? 'Every available item is already in this order' : undefined}
          >
            <Plus size={14} /> Add another item
          </Button>
        </section>

        <section aria-labelledby="po-delivery-heading" className="space-y-3">
          <h3 id="po-delivery-heading" className="text-xs font-bold uppercase tracking-wide text-slate-500">Delivery &amp; remarks</h3>
          <div>
            <label htmlFor="po-delivery-date" className="mb-1 block text-[11px] font-semibold text-slate-600">Preferred delivery date (optional)</label>
            <input
              id="po-delivery-date"
              type="date"
              min={today}
              value={form.deliveryDate}
              onChange={(e) => {
                setForm((f) => ({ ...f, deliveryDate: e.target.value }));
                setErrors((er) => ({ ...er, deliveryDate: null }));
              }}
              disabled={submitting}
              aria-invalid={Boolean(errors.deliveryDate)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-56"
            />
            <FieldError id="po-delivery-date-err">{errors.deliveryDate}</FieldError>
          </div>
          <div>
            <label htmlFor="po-notes" className="mb-1 block text-[11px] font-semibold text-slate-600">Remarks (optional)</label>
            <textarea
              id="po-notes"
              rows={3}
              value={form.notes}
              maxLength={NOTES_MAX}
              onChange={(e) => {
                setForm((f) => ({ ...f, notes: e.target.value }));
                setErrors((er) => ({ ...er, notes: null }));
              }}
              disabled={submitting}
              placeholder="Packing, delivery or other instructions"
              aria-invalid={Boolean(errors.notes)}
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex justify-between">
              <FieldError id="po-notes-err">{errors.notes}</FieldError>
              <span className="ml-auto text-[10px] text-slate-400">{form.notes.length}/{NOTES_MAX}</span>
            </div>
          </div>
        </section>

        <section aria-label="Estimated totals" className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
          <dl className="space-y-1.5">
            <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{money(totals.amount)}</dd></div>
            {totals.discount > 0 && (
              <div className="flex justify-between"><dt className="text-slate-500">Discount</dt><dd>−{money(totals.discount)}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-slate-500">GST</dt><dd>{money(totals.tax)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-slate-900">
              <dt>Estimated total</dt><dd>{money(totals.total)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
            Estimate only. Taxes and the final amount are calculated by us when the order is placed and confirmed by our team.
          </p>
        </section>
      </form>
    );
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={requestClose}
      title={placed ? 'Order confirmation' : 'Reorder items'}
      subtitle={placed ? `Order ${placed.orderNumber}` : 'Order again from your purchase history'}
      width="lg"
      footer={footer}
    >
      {content}
    </Drawer>
  );
}

/**
 * The portal's entry point. Renders nothing for anyone who may not reorder
 * (staff, impersonation sessions, customers without the permission).
 */
export default function PlaceOrderButton({ onPlaced, className = '', size = 'sm' }) {
  const currentUser = useAppStore((s) => s.currentUser);
  const permissions = useAppStore((s) => s.permissions);
  const [open, setOpen] = useState(false);

  if (!canPlacePortalOrder(currentUser, permissions)) return null;

  return (
    <>
      <Button size={size} className={className} onClick={() => setOpen(true)}>
        <ShoppingCart size={14} />
        <span>Reorder Items</span>
      </Button>
      <PlaceOrderDrawer isOpen={open} onClose={() => setOpen(false)} onPlaced={onPlaced} />
    </>
  );
}

export { PlaceOrderDrawer };
