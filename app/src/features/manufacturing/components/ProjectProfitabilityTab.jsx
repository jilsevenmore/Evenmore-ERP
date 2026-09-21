import React, { useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle2,
  Boxes,
} from 'lucide-react';
import { useManufacturingStore } from '../../../stores/manufacturingStore';
import { formatCurrency } from '../../../utils/currencyUtils';
import { computeProjectProfitability, computeProductionCost } from '../../../utils/manufacturingUtils';

export function ProjectProfitabilityTab({ project }) {
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

  const revenue = Number(project.productDetails?.orderValue || 142500);
  const profitability = useMemo(
    () => computeProjectProfitability(revenue, costs.totalCost),
    [revenue, costs.totalCost]
  );

  const costBreakdown = [
    { label: 'Material Cost', value: costs.materialCost, color: '#3b82f6' },
    { label: 'Labour Cost', value: costs.labourCost, color: '#6366f1' },
    { label: 'Machine / Tooling', value: costs.machineCost, color: '#0ea5e9' },
    { label: 'Overhead Cost', value: costs.overheadCost, color: '#8b5cf6' },
    { label: 'Rework & Corrections', value: costs.reworkCost, color: '#f43f5e' },
    { label: 'Scrap & Wastage', value: costs.scrapCost, color: '#f59e0b' },
    { label: 'Other Direct Costs', value: costs.otherCost, color: '#64748b' },
  ];

  return (
    <div className="space-y-4">
      {/* Top 4 Profitability KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contract Revenue</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">{formatCurrency(profitability.revenue)}</span>
          <span className="text-[11px] text-emerald-600 font-medium">Billed to {project.customerName}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Project Cost</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">{formatCurrency(profitability.totalCost)}</span>
          <span className="text-[11px] text-slate-500">Material + Labour + Overhead</span>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs ${
          profitability.grossProfit > 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500">Net Gross Profit</span>
          <span className={`text-xl font-black font-mono mt-0.5 block ${
            profitability.grossProfit > 0 ? 'text-emerald-900' : 'text-rose-900'
          }`}>
            {formatCurrency(profitability.grossProfit)}
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <ArrowUpRight size={13} /> Target: {formatCurrency(profitability.plannedProfit)}
          </span>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs ${
          profitability.isHealthy ? 'bg-indigo-50/70 border-indigo-200' : 'bg-amber-50/70 border-amber-200'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500">Gross Margin %</span>
          <span className={`text-2xl font-black font-mono mt-0.5 block ${
            profitability.isHealthy ? 'text-indigo-900' : 'text-amber-900'
          }`}>
            {profitability.profitMargin}%
          </span>
          <span className="text-[11px] font-medium text-indigo-600">
            {profitability.isHealthy ? 'Exceeds 25% hurdle' : 'Below 25% margin target'}
          </span>
        </div>
      </div>

      {/* Revenue vs Cost Comparison Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-indigo-600" />
            Revenue vs Production Cost Absorption
          </h4>
          <span className="text-xs font-mono font-bold text-slate-800">
            Margin: <span className="text-indigo-600">{profitability.profitMargin}%</span>
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-semibold text-slate-600">Revenue (100%)</span>
              <span className="font-mono font-bold text-slate-800">{formatCurrency(profitability.revenue)}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-semibold text-slate-600">Production Cost Absorption</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(profitability.totalCost)} ({Math.round((profitability.totalCost / (profitability.revenue || 1)) * 100)}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((profitability.totalCost / (profitability.revenue || 1)) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown & Batch Level Profitability */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cost Element Breakdown Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Cost Allocation Stack
          </h4>
          <div className="divide-y divide-slate-100 text-xs">
            {costBreakdown.map((c) => {
              const pct = costs.totalCost > 0 ? ((c.value / costs.totalCost) * 100).toFixed(1) : '0';
              return (
                <div key={c.label} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-slate-700 font-medium">{c.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono text-[11px]">{pct}%</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(c.value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Batch-Level Profitability Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Batch Economics & Unit Contribution
          </h4>

          {batch ? (
            <div className="space-y-2.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Batch:</span>
                  <strong className="text-slate-800 font-mono">{batch.batchNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Batch Quantity:</span>
                  <strong className="text-slate-800 font-mono">{batch.quantity} Units</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unit Selling Price:</span>
                  <strong className="text-emerald-700 font-mono">
                    {formatCurrency(Math.round(profitability.revenue / (batch.quantity || 1)))}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unit Production Cost:</span>
                  <strong className="text-indigo-700 font-mono">
                    {formatCurrency(batch.costPerUnit || Math.round(profitability.totalCost / (batch.quantity || 1)))}
                  </strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-700">Unit Gross Margin:</span>
                  <strong className="text-emerald-800 font-mono font-bold">
                    {formatCurrency(Math.round(profitability.grossProfit / (batch.quantity || 1)))} / unit
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 space-y-1">
                <span className="font-bold block flex items-center gap-1">
                  <CheckCircle2 size={13} /> Project Profitability Assessment: Healthy
                </span>
                <p className="text-slate-600">
                  Total revenue covers direct manufacturing and absorbed overhead with a healthy net contribution.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No active batch allocated.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectProfitabilityTab;
