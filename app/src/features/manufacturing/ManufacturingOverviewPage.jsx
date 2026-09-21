import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Factory,
  Layers,
  Sliders,
  Boxes,
  Wrench,
  RotateCcw,
  Package,
  Truck,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { useTranslation } from '../../i18n';
import { usePmsStore } from '../../stores/pmsStore';
import { useManufacturingStore } from '../../stores/manufacturingStore';
import { formatCurrency } from '../../utils/currencyUtils';
import { getManufacturingStatusStyle } from '../../utils/manufacturingUtils';

export default function ManufacturingOverviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const projects = usePmsStore((s) => s.projects);
  const batches = useManufacturingStore((s) => s.batches);
  const bomVersions = useManufacturingStore((s) => s.bomVersions);
  const materialPlans = useManufacturingStore((s) => s.materialPlans);
  const reworkRecords = useManufacturingStore((s) => s.reworkRecords);
  const packagingRecords = useManufacturingStore((s) => s.packagingRecords);
  const dispatchRecords = useManufacturingStore((s) => s.dispatchRecords);
  const getProjectWeightedProgress = useManufacturingStore((s) => s.getProjectWeightedProgress);

  // Filter projects with manufacturing data or active status
  const mfgProjects = useMemo(() => {
    return projects.map((p) => {
      const pBatches = batches.filter((b) => b.projectId === p.id);
      const activeBatch = pBatches[0];
      const prog = getProjectWeightedProgress(p.id);
      const prodCost = activeBatch?.costSummary?.totalActualCost || 0;
      const rev = p.contractValue || p.budget || 2500000;
      const profit = rev - prodCost;
      const margin = rev > 0 ? (profit / rev) * 100 : 0;

      return {
        ...p,
        activeBatch,
        weightedProgress: prog,
        productionCost: prodCost,
        revenue: rev,
        grossProfit: profit,
        marginPct: margin,
        stageName: p.stages?.find((s) => s.status === 'In Progress')?.name || 'Production & Assembly',
      };
    });
  }, [projects, batches, getProjectWeightedProgress]);

  // Aggregate Metrics
  const activeProjectsCount = mfgProjects.filter((p) => p.status === 'In Progress').length;
  const inProductionBatches = batches.filter((b) => b.status === 'In Production').length;
  const totalProductionCost = batches.reduce((acc, b) => acc + (b.costSummary?.totalActualCost || 0), 0);
  const totalContractValue = mfgProjects.reduce((acc, p) => acc + (p.revenue || 0), 0);
  const openReworks = reworkRecords.filter((r) => r.status === 'Open' || r.status === 'In Progress').length;
  const readyDispatchCount = packagingRecords.filter((p) => p.status === 'Packed' || p.status === 'Inspection Passed').length;

  const avgProgress = useMemo(() => {
    if (mfgProjects.length === 0) return 0;
    const total = mfgProjects.reduce((acc, p) => acc + (p.weightedProgress || 0), 0);
    return Math.round(total / mfgProjects.length);
  }, [mfgProjects]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('navigation.manufacturingDashboard')}
        subtitle="End-to-end shopfloor execution: BOM versions, material planning, production tracking, costing, and dispatch."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={Sliders}
              onClick={() => navigate('/manufacturing/material-planning')}
            >
              {t('manufacturing.materialPlanning')}
            </Button>
            <Button
              icon={Plus}
              onClick={() => navigate('/manufacturing/batches')}
            >
              New Production Batch
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748b] mb-1.5">
            <span className="text-xs font-medium">{t('dashboard.activeProjects')}</span>
            <Factory size={16} className="text-[#1f6bff]" />
          </div>
          <p className="text-2xl font-bold text-[#0f172a]">{activeProjectsCount}</p>
          <span className="text-[11px] text-[#64748b]">On shopfloor</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748b] mb-1.5">
            <span className="text-xs font-medium">In Production</span>
            <Wrench size={16} className="text-[#eab308]" />
          </div>
          <p className="text-2xl font-bold text-[#0f172a]">{inProductionBatches}</p>
          <span className="text-[11px] text-[#64748b]">Active batches</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748b] mb-1.5">
            <span className="text-xs font-medium">Avg Progress</span>
            <TrendingUp size={16} className="text-[#10b981]" />
          </div>
          <p className="text-2xl font-bold text-[#0f172a]">{avgProgress}%</p>
          <span className="text-[11px] text-[#64748b]">Stage-weighted</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748b] mb-1.5">
            <span className="text-xs font-medium">Total Cost Absorbed</span>
            <DollarSign size={16} className="text-[#6366f1]" />
          </div>
          <p className="text-xl font-bold text-[#0f172a]">{formatCurrency(totalProductionCost)}</p>
          <span className="text-[11px] text-[#64748b]">Mat + Lab + Overhead</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748b] mb-1.5">
            <span className="text-xs font-medium">Open Rework</span>
            <RotateCcw size={16} className="text-[#ef4444]" />
          </div>
          <p className="text-2xl font-bold text-[#ef4444]">{openReworks}</p>
          <span className="text-[11px] text-[#64748b]">Tickets pending</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748b] mb-1.5">
            <span className="text-xs font-medium">Ready for Dispatch</span>
            <Package size={16} className="text-[#10b981]" />
          </div>
          <p className="text-2xl font-bold text-[#0f172a]">{readyDispatchCount}</p>
          <span className="text-[11px] text-[#64748b]">Packaging certified</span>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          to="/manufacturing/bom"
          className="bg-white border border-[#dce5f4] hover:border-[#1f6bff] p-4 rounded-xl shadow-2xs transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#eff6ff] flex items-center justify-center text-[#1f6bff] group-hover:scale-105 transition-transform">
              <Layers size={18} />
            </div>
            <ArrowRight size={14} className="text-[#94a3b8] group-hover:text-[#1f6bff] transition-colors" />
          </div>
          <div className="mt-3">
            <h4 className="text-sm font-semibold text-[#0f172a] group-hover:text-[#1f6bff]">{t('navigation.bomVersionControl')}</h4>
            <p className="text-xs text-[#64748b] mt-0.5">{bomVersions.length} Active & Draft Versions</p>
          </div>
        </Link>

        <Link
          to="/manufacturing/material-planning"
          className="bg-white border border-[#dce5f4] hover:border-[#1f6bff] p-4 rounded-xl shadow-2xs transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#f0fdf4] flex items-center justify-center text-[#16a34a] group-hover:scale-105 transition-transform">
              <Sliders size={18} />
            </div>
            <ArrowRight size={14} className="text-[#94a3b8] group-hover:text-[#1f6bff] transition-colors" />
          </div>
          <div className="mt-3">
            <h4 className="text-sm font-semibold text-[#0f172a] group-hover:text-[#1f6bff]">{t('navigation.materialPlanning')}</h4>
            <p className="text-xs text-[#64748b] mt-0.5">{materialPlans.length} Exploded Plans</p>
          </div>
        </Link>

        <Link
          to="/manufacturing/costing"
          className="bg-white border border-[#dce5f4] hover:border-[#1f6bff] p-4 rounded-xl shadow-2xs transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#fdf4ff] flex items-center justify-center text-[#c026d3] group-hover:scale-105 transition-transform">
              <DollarSign size={18} />
            </div>
            <ArrowRight size={14} className="text-[#94a3b8] group-hover:text-[#1f6bff] transition-colors" />
          </div>
          <div className="mt-3">
            <h4 className="text-sm font-semibold text-[#0f172a] group-hover:text-[#1f6bff]">{t('navigation.productionCosting')}</h4>
            <p className="text-xs text-[#64748b] mt-0.5">Absorption & Variances</p>
          </div>
        </Link>

        <Link
          to="/manufacturing/profitability"
          className="bg-white border border-[#dce5f4] hover:border-[#1f6bff] p-4 rounded-xl shadow-2xs transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#ecfdf5] flex items-center justify-center text-[#059669] group-hover:scale-105 transition-transform">
              <TrendingUp size={18} />
            </div>
            <ArrowRight size={14} className="text-[#94a3b8] group-hover:text-[#1f6bff] transition-colors" />
          </div>
          <div className="mt-3">
            <h4 className="text-sm font-semibold text-[#0f172a] group-hover:text-[#1f6bff]">{t('navigation.projectProfitability')}</h4>
            <p className="text-xs text-[#64748b] mt-0.5">Contract vs Actual Margins</p>
          </div>
        </Link>
      </div>

      {/* Live Manufacturing Projects Table */}
      <div className="bg-white border border-[#dce5f4] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#dce5f4] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#0f172a]">Live Manufacturing Execution Projects</h3>
            <p className="text-xs text-[#64748b] mt-0.5">Continuous tracking across design, fabrication, QC, packaging, and dispatch.</p>
          </div>
          <Link
            to="/manufacturing/projects"
            className="text-xs font-semibold text-[#1f6bff] hover:underline flex items-center gap-1"
          >
            View all manufacturing projects <ArrowRight size={12} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#dce5f4] font-semibold">
              <tr>
                <th className="py-3 px-4">Project & Product</th>
                <th className="py-3 px-4">{t('common.customer')}</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Weighted Progress</th>
                <th className="py-3 px-4">{t('manufacturing.productionStatus')}</th>
                <th className="py-3 px-4 text-right">{t('manufacturing.productionCost')}</th>
                <th className="py-3 px-4 text-right">Est. Margin</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {mfgProjects.map((p) => {
                const statusStyle = getManufacturingStatusStyle(p.activeBatch?.status || p.status);
                return (
                  <tr key={p.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#0f172a] hover:text-[#1f6bff] cursor-pointer" onClick={() => navigate(`/pms/projects/${p.id}`)}>
                        {p.name || p.id}
                      </div>
                      <div className="text-[11px] text-[#64748b]">
                        {p.productDetails?.productName || 'Custom Machine Assembly'} • Qty: {p.productDetails?.quantity || 1}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#334155]">
                      {p.customerName || 'Standard Client'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f1f5f9] text-[#475569]">
                        {p.stageName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#e2e8f0] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#1f6bff] h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, p.weightedProgress))}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-[#0f172a] w-8 text-right">
                          {p.weightedProgress}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                        style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.color ? `${statusStyle.color}40` : '#e2e8f0' }}
                      >
                        {statusStyle.label || p.activeBatch?.status || p.status || 'Planned'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-[#0f172a]">
                      {formatCurrency(p.productionCost)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`font-bold ${p.marginPct >= 20 ? 'text-[#16a34a]' : p.marginPct > 0 ? 'text-[#eab308]' : 'text-[#ef4444]'}`}>
                        {p.marginPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => navigate(`/pms/projects/${p.id}`)}
                      >
                        Open Project
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
