import React, { useState, useMemo } from 'react';
import { X, ArrowLeftRight, CheckCircle2, Plus, Minus, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '../../../utils/currencyUtils';
import { computeBomCost } from '../../../utils/manufacturingUtils';

export function BomCompareModal({ isOpen, onClose, availableVersions = [] }) {
  if (!isOpen) return null;

  const [v1Id, setV1Id] = useState(availableVersions[0]?.id || '');
  const [v2Id, setV2Id] = useState(availableVersions[1]?.id || availableVersions[0]?.id || '');

  const v1 = availableVersions.find((v) => v.id === v1Id) || availableVersions[0];
  const v2 = availableVersions.find((v) => v.id === v2Id) || availableVersions[1] || availableVersions[0];

  const cost1 = useMemo(() => computeBomCost(v1?.components || []), [v1]);
  const cost2 = useMemo(() => computeBomCost(v2?.components || []), [v2]);
  const costDiff = cost2 - cost1;

  // Compute component differences
  const comparisonRows = useMemo(() => {
    if (!v1 || !v2) return [];

    const map = new Map();

    (v1.components || []).forEach((c) => {
      map.set(c.componentCode, {
        code: c.componentCode,
        name: c.materialName,
        uom: c.uom,
        inV1: true,
        inV2: false,
        qty1: Number(c.quantity || 0),
        rate1: Number(c.estimatedRate || 0),
        scrap1: Number(c.scrapPct || 0),
        qty2: 0,
        rate2: 0,
        scrap2: 0,
      });
    });

    (v2.components || []).forEach((c) => {
      if (map.has(c.componentCode)) {
        const item = map.get(c.componentCode);
        item.inV2 = true;
        item.qty2 = Number(c.quantity || 0);
        item.rate2 = Number(c.estimatedRate || 0);
        item.scrap2 = Number(c.scrapPct || 0);
      } else {
        map.set(c.componentCode, {
          code: c.componentCode,
          name: c.materialName,
          uom: c.uom,
          inV1: false,
          inV2: true,
          qty1: 0,
          rate1: 0,
          scrap1: 0,
          qty2: Number(c.quantity || 0),
          rate2: Number(c.estimatedRate || 0),
          scrap2: Number(c.scrapPct || 0),
        });
      }
    });

    return Array.from(map.values()).map((row) => {
      let changeType = 'unchanged';
      if (!row.inV1 && row.inV2) changeType = 'added';
      else if (row.inV1 && !row.inV2) changeType = 'removed';
      else if (row.qty1 !== row.qty2 || row.rate1 !== row.rate2 || row.scrap1 !== row.scrap2) {
        changeType = 'modified';
      }
      return {
        ...row,
        changeType,
        qtyDiff: row.qty2 - row.qty1,
        rateDiff: row.rate2 - row.rate1,
        scrapDiff: row.scrap2 - row.scrap1,
      };
    });
  }, [v1, v2]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="text-indigo-600" size={18} />
            <div>
              <h3 className="text-base font-bold text-slate-900">BOM Version Comparison</h3>
              <p className="text-slate-500 text-[11px]">Compare component specifications, scrap rates, and unit cost deltas.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Version Pickers & High-level Metric Differential */}
        <div className="p-4 bg-white border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Baseline Version</span>
            <select
              value={v1Id}
              onChange={(e) => setV1Id(e.target.value)}
              className="w-full font-bold text-slate-800 bg-white border border-slate-300 rounded p-1.5"
            >
              {availableVersions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.version} — {b.bomNumber} ({b.status})
                </option>
              ))}
            </select>
            <div className="text-[11px] text-slate-600 mt-1 font-mono">
              Cost / unit: <strong>{formatCurrency(cost1)}</strong>
            </div>
          </div>

          <div className="text-center p-3 rounded-xl bg-indigo-50 border border-indigo-100 space-y-1">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Total Cost Delta</span>
            <span className={`text-lg font-black font-mono block ${costDiff > 0 ? 'text-amber-700' : costDiff < 0 ? 'text-emerald-700' : 'text-slate-700'}`}>
              {costDiff > 0 ? `+${formatCurrency(costDiff)}` : formatCurrency(costDiff)}
            </span>
            <span className="text-[10px] text-indigo-600 font-medium">
              {costDiff > 0 ? `+${((costDiff / (cost1 || 1)) * 100).toFixed(1)}% cost variance` : 'Cost neutral / saving'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Comparison Version</span>
            <select
              value={v2Id}
              onChange={(e) => setV2Id(e.target.value)}
              className="w-full font-bold text-slate-800 bg-white border border-slate-300 rounded p-1.5"
            >
              {availableVersions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.version} — {b.bomNumber} ({b.status})
                </option>
              ))}
            </select>
            <div className="text-[11px] text-slate-600 mt-1 font-mono">
              Cost / unit: <strong>{formatCurrency(cost2)}</strong>
            </div>
          </div>
        </div>

        {/* Diff Comparison Table */}
        <div className="overflow-y-auto flex-1 p-4">
          <table className="w-full text-left text-xs text-slate-600 border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Material Component</th>
                <th className="py-2.5 px-3 text-center">{v1.version} Qty</th>
                <th className="py-2.5 px-3 text-center">{v2.version} Qty</th>
                <th className="py-2.5 px-3 text-center">Qty Delta</th>
                <th className="py-2.5 px-3 text-right">{v1.version} Rate</th>
                <th className="py-2.5 px-3 text-right">{v2.version} Rate</th>
                <th className="py-2.5 px-3 text-center">Scrap %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonRows.map((row) => (
                <tr
                  key={row.code}
                  className={`transition-colors ${
                    row.changeType === 'added'
                      ? 'bg-emerald-50/60'
                      : row.changeType === 'removed'
                      ? 'bg-rose-50/60'
                      : row.changeType === 'modified'
                      ? 'bg-amber-50/40'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-2 px-3 whitespace-nowrap">
                    {row.changeType === 'added' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <Plus size={10} /> Added
                      </span>
                    )}
                    {row.changeType === 'removed' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        <Minus size={10} /> Removed
                      </span>
                    )}
                    {row.changeType === 'modified' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Modified
                      </span>
                    )}
                    {row.changeType === 'unchanged' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        Identical
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-800">
                    {row.name}
                    <span className="text-[10px] text-slate-400 font-mono block">{row.code}</span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-medium">
                    {row.inV1 ? `${row.qty1} ${row.uom}` : '—'}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                    {row.inV2 ? `${row.qty2} ${row.uom}` : '—'}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold">
                    {row.qtyDiff > 0 ? (
                      <span className="text-emerald-600">+{row.qtyDiff}</span>
                    ) : row.qtyDiff < 0 ? (
                      <span className="text-rose-600">{row.qtyDiff}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-500">
                    {row.inV1 ? formatCurrency(row.rate1) : '—'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {row.inV2 ? formatCurrency(row.rate2) : '—'}
                  </td>
                  <td className="py-2 px-3 text-center font-mono">
                    {row.scrap1}% → {row.scrap2}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close Comparison
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BomCompareModal;
