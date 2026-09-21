import React, { useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  PieChart,
  Layers,
  Wrench,
  RotateCcw,
  Boxes,
  Cpu,
} from 'lucide-react';
import { useManufacturingStore } from '../../../stores/manufacturingStore';
import { formatCurrency } from '../../../utils/currencyUtils';
import { computeProductionCost } from '../../../utils/manufacturingUtils';

export function ProjectCostingTab({ project }) {
  const batches = useManufacturingStore((s) => s.batches);
  const labourEntries = useManufacturingStore((s) => s.labourEntries);

  const batch = batches.find(
    (b) => b.projectId === project.id || b.projectNumber === project.id
  ) || batches[0];

  const projectLabour = labourEntries.filter(
    (l) => l.projectId === project.id || l.projectNumber === project.id
  );

  const totalLabourCost = useMemo(() => {
    return projectLabour.reduce((sum, l) => sum + Number(l.totalCost || 0), 0);
  }, [projectLabour]);

  const costs = useMemo(() => {
    return computeProductionCost({
      materialCost: batch?.materialCost || 38400,
      labourCost: totalLabourCost || batch?.labourCost || 16800,
      machineCost: batch?.machineCost || 8200,
      overheadCost: batch?.overheadCost || 4500,
      reworkCost: batch?.reworkCost || 1200,
      scrapCost: batch?.scrapCost || 1600,
      otherCost: batch?.otherCost || 2100,
    });
  }, [batch, totalLabourCost]);

  const plannedCost = batch?.plannedCost || 68000;
  const costVariance = costs.totalCost - plannedCost;
  const costVariancePct = plannedCost > 0 ? ((costVariance / plannedCost) * 100).toFixed(1) : 0;
  const batchQty = project.productDetails?.quantity || batch?.quantity || 4;
  const costPerUnit = Math.round(costs.totalCost / batchQty);

  const costItems = [
    { label: 'Material Cost', value: costs.materialCost, color: '#3b82f6', icon: Boxes, planned: 36000 },
    { label: 'Labour Cost', value: costs.labourCost, color: '#6366f1', icon: Wrench, planned: 15500 },
    { label: 'Machine & Tooling', value: costs.machineCost, color: '#0ea5e9', icon: Cpu, planned: 8000 },
    { label: 'Factory Overhead', value: costs.overheadCost, color: '#8b5cf6', icon: Layers, planned: 4500 },
    { label: 'Rework & Corrections', value: costs.reworkCost, color: '#f43f5e', icon: RotateCcw, planned: 0 },
    { label: 'Scrap & Material Loss', value: costs.scrapCost, color: '#f59e0b', icon: AlertTriangle, planned: 1500 },
    { label: 'Other Direct Costs', value: costs.otherCost, color: '#64748b', icon: DollarSign, planned: 2500 },
  ];

  return (
    <div className="space-y-4">
      {/* Top Cost KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Production Cost</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">{formatCurrency(costs.totalCost)}</span>
          <span className="text-[11px] text-slate-500">Planned: {formatCurrency(plannedCost)}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cost Per Unit</span>
          <span className="text-xl font-black text-indigo-700 font-mono mt-0.5 block">{formatCurrency(costPerUnit)}</span>
          <span className="text-[11px] text-slate-500 font-mono">Over {batchQty} batch units</span>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs ${
          costVariance > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-emerald-50/70 border-emerald-200'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500">Budget Variance</span>
          <span className={`text-xl font-black font-mono mt-0.5 block ${costVariance > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
            {costVariance > 0 ? `+${formatCurrency(costVariance)}` : formatCurrency(costVariance)}
          </span>
          <span className="text-[11px] font-semibold text-slate-600 font-mono">
            {costVariance > 0 ? `+${costVariancePct}% over budget` : 'Under budget'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Direct Material Ratio</span>
          <span className="text-xl font-black text-blue-700 font-mono mt-0.5 block">
            {costs.totalCost > 0 ? Math.round((costs.materialCost / costs.totalCost) * 100) : 0}%
          </span>
          <span className="text-[11px] text-slate-500 font-mono">{formatCurrency(costs.materialCost)} material</span>
        </div>
      </div>

      {/* Visual Cost Proportional Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <PieChart size={14} className="text-indigo-600" />
            Cost Distribution Stack
          </h4>
          <span className="text-xs font-mono font-bold text-slate-800">
            Total: {formatCurrency(costs.totalCost)}
          </span>
        </div>

        <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100">
          {costItems.map((item) => {
            const pct = costs.totalCost > 0 ? (item.value / costs.totalCost) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <div
                key={item.label}
                style={{ width: `${pct}%`, backgroundColor: item.color }}
                title={`${item.label}: ${formatCurrency(item.value)} (${pct.toFixed(1)}%)`}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
              />
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {costItems.map((item) => {
            const pct = costs.totalCost > 0 ? (item.value / costs.totalCost) * 100 : 0;
            return (
              <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span>{item.label}:</span>
                <strong className="text-slate-800 font-mono">{pct.toFixed(1)}%</strong>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cost Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Detailed Cost Component Register
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Cost Component</th>
                <th className="py-2.5 px-3 text-right">Planned Cost</th>
                <th className="py-2.5 px-3 text-right">Actual Cost</th>
                <th className="py-2.5 px-3 text-right">Variance (+/-)</th>
                <th className="py-2.5 px-3 text-center">Variance %</th>
                <th className="py-2.5 px-3 text-center">Share of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {costItems.map((item) => {
                const Icon = item.icon;
                const variance = item.value - item.planned;
                const varPct = item.planned > 0 ? ((variance / item.planned) * 100).toFixed(1) : '—';
                const sharePct = costs.totalCost > 0 ? ((item.value / costs.totalCost) * 100).toFixed(1) : '0';

                return (
                  <tr key={item.label} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: item.color }}>
                        <Icon size={12} />
                      </div>
                      <span>{item.label}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {formatCurrency(item.planned)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.value)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={variance > 0 ? 'text-amber-700' : variance < 0 ? 'text-emerald-700' : 'text-slate-500'}>
                        {variance > 0 ? `+${formatCurrency(variance)}` : formatCurrency(variance)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        variance > 0 ? 'bg-amber-50 text-amber-800' : variance < 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {varPct !== '—' ? (variance > 0 ? `+${varPct}%` : `${varPct}%`) : 'N/A'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                      {sharePct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
              <tr>
                <td className="py-2.5 px-3">Total Production Cost</td>
                <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(plannedCost)}</td>
                <td className="py-2.5 px-3 text-right font-mono text-indigo-700">{formatCurrency(costs.totalCost)}</td>
                <td className="py-2.5 px-3 text-right font-mono">{costVariance > 0 ? `+${formatCurrency(costVariance)}` : formatCurrency(costVariance)}</td>
                <td className="py-2.5 px-3 text-center font-mono">{costVariancePct > 0 ? `+${costVariancePct}%` : `${costVariancePct}%`}</td>
                <td className="py-2.5 px-3 text-center font-mono">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProjectCostingTab;
