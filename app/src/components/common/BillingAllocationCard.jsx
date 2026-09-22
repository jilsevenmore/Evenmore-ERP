import React, { useMemo, useState } from 'react';
import { formatCurrency } from '../../utils/currencyUtils';
import {
  BILLING_MODES,
  DEFAULT_GST_RATE,
  billingModeLabel,
  normalizeAllocation,
  validateAllocation,
} from '../../utils/billingAllocation';

const inputClass =
  'w-full text-xs rounded-lg border border-[#dce5f4] bg-white px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400';

function parseAmount(raw) {
  if (raw === '' || raw === null || raw === undefined) return 0;
  const n = Number(String(raw).replace(/[,₹\s]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * BillingAllocationCard — reusable White (GST) / Black (Non-GST) split editor.
 * Controlled via value { mode, whiteAmount, blackAmount, gstRate } + onChange.
 * GST applies only to the white leg; black leg is always tax-free and stays
 * visible in every summary/report (never off-book).
 */
export function BillingAllocationCard({
  projectValue = 0,
  value,
  onChange,
  readOnly = false,
  compact = false,
}) {
  const [lastEdited, setLastEdited] = useState('white');
  const state = value || { mode: BILLING_MODES.SPLIT, whiteAmount: 0, blackAmount: 0, gstRate: DEFAULT_GST_RATE };
  const alloc = useMemo(
    () =>
      normalizeAllocation({
        projectValue,
        whiteAmount: state.whiteAmount,
        blackAmount: state.blackAmount,
        gstRate: state.gstRate ?? DEFAULT_GST_RATE,
        mode: state.mode || BILLING_MODES.SPLIT,
      }),
    [projectValue, state.whiteAmount, state.blackAmount, state.gstRate, state.mode]
  );
  const validation = useMemo(() => validateAllocation(alloc), [alloc]);

  function emit(patch) {
    if (readOnly) return;
    const next = { ...state, ...patch };
    // Auto-derive the untouched leg from project value (both directions).
    if (patch.mode === BILLING_MODES.FULL_WHITE) {
      next.whiteAmount = projectValue;
      next.blackAmount = 0;
    } else if (patch.mode === BILLING_MODES.FULL_BLACK) {
      next.whiteAmount = 0;
      next.blackAmount = projectValue;
    } else if (patch.whiteAmount !== undefined && lastEdited === 'white') {
      const w = parseAmount(patch.whiteAmount);
      if (Number.isFinite(w)) next.blackAmount = Math.max(0, Number(projectValue) - w);
    } else if (patch.blackAmount !== undefined && lastEdited === 'black') {
      const b = parseAmount(patch.blackAmount);
      if (Number.isFinite(b)) next.whiteAmount = Math.max(0, Number(projectValue) - b);
    }
    onChange?.(next);
  }

  const modes = [BILLING_MODES.FULL_WHITE, BILLING_MODES.FULL_BLACK, BILLING_MODES.SPLIT];

  return (
    <section className="rounded-xl border border-[#dce5f4] bg-white shadow-2xs overflow-hidden">
      <header className="px-4 py-3 border-b border-slate-100 bg-[#f6f9ff]">
        <h3 className="text-sm font-bold text-slate-800">Billing Allocation</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Split the project value between GST and non-taxable legs. Non-GST allocation must be used
          only where the applicable tax treatment permits it.
        </p>
      </header>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project Value</p>
            <p className="text-lg font-extrabold text-slate-900">{formatCurrency(projectValue || 0)}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap" role="radiogroup" aria-label="Billing Mode">
            {modes.map((m) => (
              <label
                key={m}
                className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-full border cursor-pointer transition-colors ${
                  state.mode === m
                    ? 'bg-[#1F2E4A] text-white border-[#1F2E4A]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                } ${readOnly ? 'pointer-events-none opacity-70' : ''}`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={state.mode === m}
                  disabled={readOnly}
                  onChange={() => emit({ mode: m })}
                />
                {m === BILLING_MODES.FULL_WHITE ? 'Full White (GST)' : m === BILLING_MODES.FULL_BLACK ? 'Full Black (Non-GST)' : 'Split'}
              </label>
            ))}
          </div>
        </div>

        <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {/* White leg — clean tax-invoice style */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <p className="text-[11px] font-bold text-emerald-800">WHITE BILLING (GST)</p>
            <p className="text-[10px] text-emerald-700/70 mb-2">GST / Tax Invoice</p>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Billing Amount</label>
            <input
              type="number"
              min="0"
              step="any"
              className={inputClass}
              value={state.mode === BILLING_MODES.FULL_BLACK ? 0 : (state.whiteAmount ?? '')}
              disabled={readOnly || state.mode === BILLING_MODES.FULL_WHITE || state.mode === BILLING_MODES.FULL_BLACK}
              onFocus={() => setLastEdited('white')}
              onChange={(e) => {
                setLastEdited('white');
                const raw = e.target.value === '' ? '' : Number(e.target.value);
                emit({ whiteAmount: raw, mode: BILLING_MODES.SPLIT });
              }}
            />
            <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">GST %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  className={inputClass}
                  value={state.gstRate ?? DEFAULT_GST_RATE}
                  disabled={readOnly}
                  onChange={(e) => emit({ gstRate: e.target.value === '' ? '' : Number(e.target.value) })}
                />
              </div>
              <div className="bg-white rounded-lg border border-emerald-100 px-2 py-1.5">
                <p className="text-[10px] text-slate-400">GST</p>
                <p className="font-bold text-slate-800">{formatCurrency(alloc.gstAmount)}</p>
              </div>
              <div className="bg-white rounded-lg border border-emerald-100 px-2 py-1.5">
                <p className="text-[10px] text-slate-400">With GST</p>
                <p className="font-bold text-slate-800">{formatCurrency(alloc.whiteTotal)}</p>
              </div>
            </div>
          </div>

          {/* Black leg — dark card is visual only, amount stays reported */}
          <div className="rounded-lg border border-slate-700 bg-[#1F2E4A] p-3 text-white">
            <p className="text-[11px] font-bold">BLACK BILLING (NON-GST)</p>
            <p className="text-[10px] text-slate-300 mb-2">Non-GST / Non-taxable allocation</p>
            <label className="block text-[10px] font-semibold text-slate-300 mb-1">Billing Amount</label>
            <input
              type="number"
              min="0"
              step="any"
              className="w-full text-xs rounded-lg border border-slate-600 bg-white px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-400"
              value={state.mode === BILLING_MODES.FULL_WHITE ? 0 : (state.blackAmount ?? '')}
              disabled={readOnly || state.mode === BILLING_MODES.FULL_WHITE || state.mode === BILLING_MODES.FULL_BLACK}
              onFocus={() => setLastEdited('black')}
              onChange={(e) => {
                setLastEdited('black');
                const raw = e.target.value === '' ? '' : Number(e.target.value);
                emit({ blackAmount: raw, mode: BILLING_MODES.SPLIT });
              }}
            />
            <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
              <div className="bg-white/10 rounded-lg border border-white/15 px-2 py-1.5">
                <p className="text-[10px] text-slate-300">Tax</p>
                <p className="font-bold">{formatCurrency(0)}</p>
              </div>
              <div className="bg-white/10 rounded-lg border border-white/15 px-2 py-1.5">
                <p className="text-[10px] text-slate-300">Total</p>
                <p className="font-bold">{formatCurrency(alloc.blackTotal)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
            {[
              ['White', alloc.whiteAmount],
              ['Black', alloc.blackAmount],
              ['GST', alloc.gstAmount],
              ['Allocated', alloc.allocated],
              ['Remaining', alloc.remaining],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">{k}</p>
                <p className={`font-bold ${k === 'Remaining' ? (alloc.remaining === 0 ? 'text-emerald-700' : alloc.remaining < 0 ? 'text-rose-600' : 'text-amber-600') : 'text-slate-800'}`}>
                  {formatCurrency(v)}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Mode: {billingModeLabel(state.mode)}</p>
          {validation.valid ? (
            <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 mt-2">
              {validation.message}
            </p>
          ) : (
            <p className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 mt-2">
              {validation.message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default BillingAllocationCard;
