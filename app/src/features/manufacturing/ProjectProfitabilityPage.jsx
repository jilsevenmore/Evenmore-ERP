import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { usePmsStore } from '../../stores/pmsStore';
import { useManufacturingStore } from '../../stores/manufacturingStore';
import { formatCurrency } from '../../utils/currencyUtils';
import { computeProjectProfitability, computeProductionCost } from '../../utils/manufacturingUtils';

export default function ProjectProfitabilityPage() {
  const navigate = useNavigate();
  const projects = usePmsStore((s) => s.projects);
  const batches = useManufacturingStore((s) => s.batches);

  const [selectedProjId, setSelectedProjId] = useState(projects[0]?.id || '');

  const enrichedProjects = useMemo(() => {
    return projects.map((proj) => {
      const projBatches = batches.filter((b) => b.projectId === proj.id || b.projectNumber === proj.id);
      const activeBatch = projBatches[0] || batches[0];
      const cs = activeBatch?.costSummary || {};
      const totalCost = cs.totalActualCost || 1350000;
      const contractRevenue = proj.contractValue || proj.budget || 2400000;

      const prof = computeProjectProfitability({
        contractRevenue,
        productionCost: totalCost,
        targetMarginPct: 35,
        deliveredQuantity: activeBatch?.completedQty || 1,
      });

      return {
        ...proj,
        activeBatch,
        contractRevenue,
        productionCost: totalCost,
        profitability: prof,
      };
    });
  }, [projects, batches]);

  const selectedProj = enrichedProjects.find((p) => p.id === selectedProjId) || enrichedProjects[0];

  const overall = useMemo(() => {
    const totalRev = enrichedProjects.reduce((s, p) => s + p.contractRevenue, 0);
    const totalCost = enrichedProjects.reduce((s, p) => s + p.productionCost, 0);
    const gross = totalRev - totalCost;
    const margin = totalRev > 0 ? (gross / totalRev) * 100 : 0;
    return { totalRev, totalCost, gross, margin };
  }, [enrichedProjects]);

  if (!selectedProj) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Project & Batch Profitability"
          subtitle="Contract commercial realization, margin performance, and batch unit economics."
        />
        <div className="bg-white border border-[#dce5f4] rounded-xl p-8 text-center text-xs text-[#64748b]">
          No project profitability records available.
        </div>
      </div>
    );
  }

  const prof = selectedProj.profitability;
  const isHealthyMargin = prof.actualMarginPct >= 25;
  const costPct = Math.min(100, Math.round((selectedProj.productionCost / selectedProj.contractRevenue) * 100));
  const profitPct = Math.max(0, 100 - costPct);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manufacturing Profitability & Unit Economics"
        subtitle="Track contract revenue absorption, gross margins, contribution profit, and unit cost realization."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748b] font-medium">Project:</span>
            <select
              value={selectedProjId}
              onChange={(e) => setSelectedProjId(e.target.value)}
              className="text-xs border border-[#cbd5e1] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1f6bff] text-[#0f172a] bg-white font-medium shadow-2xs"
            >
              {enrichedProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.id} ({p.customerName})
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* High-Level Overview Metrics across all projects */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Contract Sales Revenue</span>
          <p className="text-xl font-bold text-[#0f172a] mt-1">
            {formatCurrency(selectedProj.contractRevenue)}
          </p>
          <span className="text-[11px] text-[#64748b]">Agreed sales order value</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Actual Production Cost</span>
          <p className="text-xl font-bold text-[#ef4444] mt-1">
            {formatCurrency(selectedProj.productionCost)}
          </p>
          <span className="text-[11px] text-[#64748b]">Full absorption cost</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Realized Gross Profit</span>
          <p className="text-xl font-bold text-[#10b981] mt-1">
            {formatCurrency(prof.grossProfit)}
          </p>
          <span className="text-[11px] text-[#64748b]">Revenue minus production cost</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Gross Profit Margin</span>
          <p className={`text-xl font-bold mt-1 ${isHealthyMargin ? 'text-[#16a34a]' : 'text-[#ea580c]'}`}>
            {prof.actualMarginPct}%
          </p>
          <span className="text-[11px] text-[#64748b]">Target: {prof.targetMarginPct}%</span>
        </div>
      </div>

      {/* Revenue vs Cost Absorption Bar */}
      <div className="bg-white border border-[#dce5f4] rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
            Revenue Absorption vs Realized Profit
          </h4>
          <span className="text-xs font-semibold text-[#0f172a]">
            {selectedProj.name} ({selectedProj.customerName})
          </span>
        </div>

        <div className="h-5 w-full rounded-full bg-[#f1f5f9] overflow-hidden flex">
          <div
            style={{ width: `${costPct}%` }}
            className="bg-[#ef4444] h-full flex items-center justify-center text-[10px] text-white font-bold"
            title={`Production Cost: ${costPct}%`}
          >
            Cost ({costPct}%)
          </div>
          <div
            style={{ width: `${profitPct}%` }}
            className="bg-[#10b981] h-full flex items-center justify-center text-[10px] text-white font-bold"
            title={`Gross Profit: ${profitPct}%`}
          >
            Gross Profit ({profitPct}%)
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#64748b] pt-1">
          <div>
            Total Contract: <strong className="text-[#0f172a]">{formatCurrency(selectedProj.contractRevenue)}</strong>
          </div>
          <div>
            Net Realized Margin: <strong className="text-[#10b981]">{prof.actualMarginPct}%</strong>
          </div>
        </div>
      </div>

      {/* Unit Economics Breakdown Card */}
      <div className="bg-white border border-[#dce5f4] rounded-xl p-5 shadow-2xs">
        <h4 className="text-sm font-semibold text-[#0f172a] mb-3">Unit Commercial Economics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-lg">
            <span className="text-xs text-[#64748b] block">Unit Selling Price</span>
            <span className="text-lg font-bold text-[#0f172a]">{formatCurrency(prof.unitSellingPrice)}</span>
            <span className="text-[10px] text-[#64748b] block mt-0.5">Realized from contract</span>
          </div>

          <div className="bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-lg">
            <span className="text-xs text-[#64748b] block">Unit Production Cost</span>
            <span className="text-lg font-bold text-[#ef4444]">{formatCurrency(prof.unitCost)}</span>
            <span className="text-[10px] text-[#64748b] block mt-0.5">Fully absorbed floor cost</span>
          </div>

          <div className="bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-lg">
            <span className="text-xs text-[#64748b] block">Unit Contribution Margin</span>
            <span className="text-lg font-bold text-[#10b981]">{formatCurrency(prof.unitContribution)}</span>
            <span className="text-[10px] text-[#64748b] block mt-0.5">Per delivered machine unit</span>
          </div>
        </div>
      </div>

      {/* Project Profitability Comparison Table */}
      <div className="bg-white border border-[#dce5f4] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#dce5f4] flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[#0f172a]">All Active Projects Profitability Comparison</h4>
          <span className="text-xs text-[#64748b]">Total Portfolio Margin: <strong className="text-[#10b981]">{overall.margin.toFixed(1)}%</strong></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#dce5f4] font-semibold">
              <tr>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Contract Revenue</th>
                <th className="py-3 px-4 text-right">Actual Cost</th>
                <th className="py-3 px-4 text-right font-bold text-[#0f172a]">Gross Profit</th>
                <th className="py-3 px-4 text-center">Gross Margin</th>
                <th className="py-3 px-4 text-center">Target Margin</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {enrichedProjects.map((p) => {
                const isHealthy = p.profitability.actualMarginPct >= 25;
                return (
                  <tr key={p.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#0f172a]">
                      {p.name || p.id}
                    </td>
                    <td className="py-3.5 px-4 text-[#334155] font-medium">
                      {p.customerName || 'Standard Client'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-[#0f172a]">
                      {formatCurrency(p.contractRevenue)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#64748b]">
                      {formatCurrency(p.productionCost)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#10b981]">
                      {formatCurrency(p.profitability.grossProfit)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                        isHealthy ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#fff7ed] text-[#ea580c]'
                      }`}>
                        {p.profitability.actualMarginPct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-[#64748b]">
                      {p.profitability.targetMarginPct}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#10b981]">
                        <CheckCircle2 size={13} /> {p.profitability.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => navigate(`/pms/projects/${p.id}`)}
                      >
                        Project Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
