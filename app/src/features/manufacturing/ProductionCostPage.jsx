import React, { useState, useMemo } from 'react';
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
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { useManufacturingStore } from '../../stores/manufacturingStore';
import { formatCurrency } from '../../utils/currencyUtils';
import { computeProductionCost } from '../../utils/manufacturingUtils';

export default function ProductionCostPage() {
  const batches = useManufacturingStore((s) => s.batches);
  const labourEntries = useManufacturingStore((s) => s.labourEntries);

  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');

  const batch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  const projectLabour = useMemo(() => {
    if (!batch) return [];
    return labourEntries.filter(
      (l) => l.projectId === batch.projectId || l.projectNumber === batch.projectNumber
    );
  }, [batch, labourEntries]);

  const calculatedLabourCost = useMemo(() => {
    return projectLabour.reduce((sum, l) => sum + (Number(l.totalCost) || 0), 0);
  }, [projectLabour]);

  const costBreakdown = useMemo(() => {
    if (!batch) {
      return {
        materialCost: 0,
        labourCost: 0,
        machineCost: 0,
        overheadCost: 0,
        reworkCost: 0,
        scrapCost: 0,
        otherCost: 0,
        totalPlannedCost: 0,
        totalActualCost: 0,
        costVariance: 0,
        costVariancePct: 0,
        unitActualCost: 0,
      };
    }
    const cs = batch.costSummary || {};
    const effectiveLabour = calculatedLabourCost > 0 ? calculatedLabourCost : (cs.labourCost || 120000);
    return computeProductionCost({
      materialCost: cs.materialCost || 850000,
      labourCost: effectiveLabour,
      machineCost: cs.machineCost || 180000,
      overheadCost: cs.overheadCost || 95000,
      reworkCost: cs.reworkCost || 15000,
      scrapCost: cs.scrapCost || 12000,
      otherCost: cs.otherCost || 0,
      plannedCost: cs.totalPlannedCost || 1250000,
      quantity: batch.plannedQty || 1,
    });
  }, [batch, calculatedLabourCost]);

  if (!batch) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Production Cost Absorption"
          subtitle="Full absorption costing of direct materials, shopfloor labour, machine hours, and factory overheads."
        />
        <div className="bg-white border border-[#dce5f4] rounded-xl p-8 text-center text-xs text-[#64748b]">
          No production batches found.
        </div>
      </div>
    );
  }

  const isOverBudget = costBreakdown.costVariance > 0;

  // Percentage distribution for stacked bar
  const total = costBreakdown.totalActualCost || 1;
  const matPct = Math.round((costBreakdown.materialCost / total) * 100);
  const labPct = Math.round((costBreakdown.labourCost / total) * 100);
  const machPct = Math.round((costBreakdown.machineCost / total) * 100);
  const ovhPct = Math.round((costBreakdown.overheadCost / total) * 100);
  const rwkPct = Math.round((costBreakdown.reworkCost / total) * 100);
  const scpPct = Math.round((costBreakdown.scrapCost / total) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Cost Absorption & Variances"
        subtitle="Full absorption costing of direct materials, shopfloor labour, machine hours, and factory overheads."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748b] font-medium">Batch:</span>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="text-xs border border-[#cbd5e1] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1f6bff] text-[#0f172a] bg-white font-medium shadow-2xs"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} - {b.productName} ({b.projectNumber})
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Top Cost KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Total Planned Budget</span>
          <p className="text-xl font-bold text-[#0f172a] mt-1">
            {formatCurrency(costBreakdown.totalPlannedCost)}
          </p>
          <span className="text-[11px] text-[#64748b]">BOM & standard estimate</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Actual Absorbed Cost</span>
          <p className="text-xl font-bold text-[#1f6bff] mt-1">
            {formatCurrency(costBreakdown.totalActualCost)}
          </p>
          <span className="text-[11px] text-[#64748b]">Incurred to date</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Budget Variance</span>
          <p className={`text-xl font-bold mt-1 ${isOverBudget ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
            {isOverBudget ? '+' : ''}{formatCurrency(costBreakdown.costVariance)}
          </p>
          <span className={`text-[11px] font-semibold ${isOverBudget ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
            {costBreakdown.costVariancePct}% {isOverBudget ? 'overrun' : 'savings'}
          </span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Actual Unit Cost</span>
          <p className="text-xl font-bold text-[#0f172a] mt-1">
            {formatCurrency(costBreakdown.unitActualCost)}
          </p>
          <span className="text-[11px] text-[#64748b]">Per unit ({batch.plannedQty} units planned)</span>
        </div>
      </div>

      {/* Proportional Cost Absorption Visual Bar */}
      <div className="bg-white border border-[#dce5f4] rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
            Cost Absorption Stack Distribution
          </h4>
          <span className="text-xs text-[#64748b] font-mono">
            Total: {formatCurrency(costBreakdown.totalActualCost)}
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-4 w-full rounded-full bg-[#f1f5f9] overflow-hidden flex">
          <div style={{ width: `${matPct}%` }} className="bg-[#1f6bff] h-full" title={`Material: ${matPct}%`} />
          <div style={{ width: `${labPct}%` }} className="bg-[#10b981] h-full" title={`Labour: ${labPct}%`} />
          <div style={{ width: `${machPct}%` }} className="bg-[#f59e0b] h-full" title={`Machine: ${machPct}%`} />
          <div style={{ width: `${ovhPct}%` }} className="bg-[#8b5cf6] h-full" title={`Overhead: ${ovhPct}%`} />
          <div style={{ width: `${rwkPct}%` }} className="bg-[#ef4444] h-full" title={`Rework: ${rwkPct}%`} />
          <div style={{ width: `${scpPct}%` }} className="bg-[#ea580c] h-full" title={`Scrap: ${scpPct}%`} />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#1f6bff]" />
            <span className="text-[#64748b]">Materials ({matPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#10b981]" />
            <span className="text-[#64748b]">Direct Labour ({labPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#f59e0b]" />
            <span className="text-[#64748b]">Machine & Tooling ({machPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#8b5cf6]" />
            <span className="text-[#64748b]">Factory Overheads ({ovhPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#ef4444]" />
            <span className="text-[#64748b]">Rework Cost ({rwkPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#ea580c]" />
            <span className="text-[#64748b]">Scrap Loss ({scpPct}%)</span>
          </div>
        </div>
      </div>

      {/* Itemized Cost Component Breakdown Table */}
      <div className="bg-white border border-[#dce5f4] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#dce5f4]">
          <h4 className="text-sm font-semibold text-[#0f172a]">Itemized Cost Absorption Table</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#dce5f4] font-semibold">
              <tr>
                <th className="py-3 px-4">Cost Center Component</th>
                <th className="py-3 px-4">Absorption Method</th>
                <th className="py-3 px-4 text-right">Incurred Amount</th>
                <th className="py-3 px-4 text-right">Share of Total</th>
                <th className="py-3 px-4 text-right">Unit Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              <tr>
                <td className="py-3.5 px-4 font-semibold text-[#0f172a] flex items-center gap-2">
                  <Boxes size={15} className="text-[#1f6bff]" /> Direct Raw Materials
                </td>
                <td className="py-3.5 px-4 text-[#64748b]">Warehouse Issue Slips & Consumption Logs</td>
                <td className="py-3.5 px-4 text-right font-bold text-[#0f172a]">{formatCurrency(costBreakdown.materialCost)}</td>
                <td className="py-3.5 px-4 text-right text-[#64748b]">{matPct}%</td>
                <td className="py-3.5 px-4 text-right font-medium text-[#0f172a]">{formatCurrency(costBreakdown.materialCost / (batch.plannedQty || 1))}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-[#0f172a] flex items-center gap-2">
                  <Wrench size={15} className="text-[#10b981]" /> Direct Shopfloor Labour
                </td>
                <td className="py-3.5 px-4 text-[#64748b]">Shift Work Logs & Overtime Capture</td>
                <td className="py-3.5 px-4 text-right font-bold text-[#0f172a]">{formatCurrency(costBreakdown.labourCost)}</td>
                <td className="py-3.5 px-4 text-right text-[#64748b]">{labPct}%</td>
                <td className="py-3.5 px-4 text-right font-medium text-[#0f172a]">{formatCurrency(costBreakdown.labourCost / (batch.plannedQty || 1))}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-[#0f172a] flex items-center gap-2">
                  <Cpu size={15} className="text-[#f59e0b]" /> Machine & Tooling Hours
                </td>
                <td className="py-3.5 px-4 text-[#64748b]">CNC & Laser Machine Hourly Runtime Rates</td>
                <td className="py-3.5 px-4 text-right font-bold text-[#0f172a]">{formatCurrency(costBreakdown.machineCost)}</td>
                <td className="py-3.5 px-4 text-right text-[#64748b]">{machPct}%</td>
                <td className="py-3.5 px-4 text-right font-medium text-[#0f172a]">{formatCurrency(costBreakdown.machineCost / (batch.plannedQty || 1))}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-[#0f172a] flex items-center gap-2">
                  <PieChart size={15} className="text-[#8b5cf6]" /> Factory & Plant Overheads
                </td>
                <td className="py-3.5 px-4 text-[#64748b]">15% Absorption on Direct Conversion Cost</td>
                <td className="py-3.5 px-4 text-right font-bold text-[#0f172a]">{formatCurrency(costBreakdown.overheadCost)}</td>
                <td className="py-3.5 px-4 text-right text-[#64748b]">{ovhPct}%</td>
                <td className="py-3.5 px-4 text-right font-medium text-[#0f172a]">{formatCurrency(costBreakdown.overheadCost / (batch.plannedQty || 1))}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-[#ef4444] flex items-center gap-2">
                  <RotateCcw size={15} className="text-[#ef4444]" /> Quality Non-Conformance / Rework
                </td>
                <td className="py-3.5 px-4 text-[#64748b]">Corrective Action Labor & Re-machining</td>
                <td className="py-3.5 px-4 text-right font-bold text-[#ef4444]">{formatCurrency(costBreakdown.reworkCost)}</td>
                <td className="py-3.5 px-4 text-right text-[#64748b]">{rwkPct}%</td>
                <td className="py-3.5 px-4 text-right font-medium text-[#ef4444]">{formatCurrency(costBreakdown.reworkCost / (batch.plannedQty || 1))}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-[#ea580c] flex items-center gap-2">
                  <AlertTriangle size={15} className="text-[#ea580c]" /> Scrap & Offcut Wastage
                </td>
                <td className="py-3.5 px-4 text-[#64748b]">Unrecoverable Cutting Loss & Offcuts</td>
                <td className="py-3.5 px-4 text-right font-bold text-[#ea580c]">{formatCurrency(costBreakdown.scrapCost)}</td>
                <td className="py-3.5 px-4 text-right text-[#64748b]">{scpPct}%</td>
                <td className="py-3.5 px-4 text-right font-medium text-[#ea580c]">{formatCurrency(costBreakdown.scrapCost / (batch.plannedQty || 1))}</td>
              </tr>
            </tbody>
            <tfoot className="bg-[#f8fafc] border-t-2 border-[#dce5f4] font-bold text-xs">
              <tr>
                <td colSpan={2} className="py-3 px-4 text-[#0f172a]">TOTAL PRODUCTION ABSORPTION</td>
                <td className="py-3 px-4 text-right text-[#1f6bff] text-sm">{formatCurrency(costBreakdown.totalActualCost)}</td>
                <td className="py-3 px-4 text-right text-[#0f172a]">100%</td>
                <td className="py-3 px-4 text-right text-[#0f172a]">{formatCurrency(costBreakdown.unitActualCost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
