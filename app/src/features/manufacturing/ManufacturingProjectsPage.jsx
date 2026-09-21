import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Factory,
  Search,
  Filter,
  ArrowRight,
  Plus,
  TrendingUp,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { usePmsStore } from '../../stores/pmsStore';
import { useManufacturingStore } from '../../stores/manufacturingStore';
import { formatCurrency } from '../../utils/currencyUtils';
import { getManufacturingStatusStyle } from '../../utils/manufacturingUtils';

export default function ManufacturingProjectsPage() {
  const navigate = useNavigate();
  const projects = usePmsStore((s) => s.projects);
  const batches = useManufacturingStore((s) => s.batches);
  const getProjectWeightedProgress = useManufacturingStore((s) => s.getProjectWeightedProgress);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const enrichedProjects = useMemo(() => {
    return projects.map((p) => {
      const pBatches = batches.filter((b) => b.projectId === p.id);
      const activeBatch = pBatches[0];
      const prog = getProjectWeightedProgress(p.id);
      const prodCost = activeBatch?.costSummary?.totalActualCost || 0;
      const rev = p.contractValue || p.budget || 2500000;
      const profit = rev - prodCost;
      const margin = rev > 0 ? (profit / rev) * 100 : 0;
      const prodStatus = activeBatch?.status || (p.status === 'In Progress' ? 'In Production' : p.status);

      return {
        ...p,
        activeBatch,
        weightedProgress: prog,
        productionCost: prodCost,
        revenue: rev,
        grossProfit: profit,
        marginPct: margin,
        productionStatus: prodStatus,
        stageName: p.stages?.find((s) => s.status === 'In Progress')?.name || 'Production & Assembly',
      };
    });
  }, [projects, batches, getProjectWeightedProgress]);

  const filteredProjects = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    const sf = (statusFilter || '').toLowerCase().trim();
    return enrichedProjects.filter((p) => {
      const matchSearch =
        !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.id || '').toLowerCase().includes(q) ||
        (p.customerName || '').toLowerCase().includes(q) ||
        (p.productDetails?.productName || '').toLowerCase().includes(q);

      const matchStatus =
        sf === 'all' ||
        (p.productionStatus || '').toLowerCase() === sf;

      return matchSearch && matchStatus;
    });
  }, [enrichedProjects, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manufacturing Projects"
        subtitle="End-to-end tracking of custom machine and cleanroom assembly projects on the factory floor."
        actions={
          <Button
            icon={Plus}
            onClick={() => navigate('/pms/projects')}
          >
            New Project
          </Button>
        }
      />

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-[#dce5f4] p-4 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search project, product, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#1f6bff] text-[#0f172a]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-[#64748b]" />
          <span className="text-xs text-[#64748b] font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-[#cbd5e1] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#1f6bff] text-[#0f172a] bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="In Production">In Production</option>
            <option value="Quality Inspection">Quality Inspection</option>
            <option value="Packaging">Packaging</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Projects Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((p) => {
          const statusStyle = getManufacturingStatusStyle(p.productionStatus);
          return (
            <div
              key={p.id}
              className="bg-white border border-[#dce5f4] hover:border-[#1f6bff] rounded-xl p-5 shadow-2xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                    style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.color ? `${statusStyle.color}40` : '#e2e8f0' }}
                  >
                    {statusStyle.label || p.productionStatus || 'Planned'}
                  </span>
                  <span className="text-xs font-semibold text-[#64748b]">
                    {p.id}
                  </span>
                </div>

                <h3
                  onClick={() => navigate(`/pms/projects/${p.id}`)}
                  className="font-bold text-base text-[#0f172a] hover:text-[#1f6bff] cursor-pointer"
                >
                  {p.name}
                </h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Client: <span className="font-semibold text-[#334155]">{p.customerName || 'Standard Client'}</span>
                </p>
                <div className="mt-2 text-xs bg-[#f8fafc] border border-[#e2e8f0] p-2.5 rounded-lg">
                  <div className="text-[11px] text-[#64748b]">Product & Target Qty:</div>
                  <div className="font-medium text-[#0f172a] truncate">
                    {p.productDetails?.productName || 'Industrial Automation Unit'} ({p.productDetails?.quantity || 1} units)
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#64748b]">Weighted Progress</span>
                    <span className="font-bold text-[#0f172a]">{p.weightedProgress}%</span>
                  </div>
                  <div className="w-full bg-[#e2e8f0] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1f6bff] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, p.weightedProgress))}%` }}
                    />
                  </div>
                </div>

                {/* Financial overview */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#f1f5f9] text-xs">
                  <div>
                    <span className="text-[#64748b] block text-[11px]">Revenue</span>
                    <span className="font-semibold text-[#0f172a]">{formatCurrency(p.revenue)}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[11px]">Prod. Cost</span>
                    <span className="font-semibold text-[#0f172a]">{formatCurrency(p.productionCost)}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[11px]">Est. Profit</span>
                    <span className="font-semibold text-[#10b981]">{formatCurrency(p.grossProfit)}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[11px]">Gross Margin</span>
                    <span className={`font-bold ${p.marginPct >= 20 ? 'text-[#16a34a]' : 'text-[#eab308]'}`}>
                      {p.marginPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#f1f5f9] flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  icon={ArrowRight}
                  onClick={() => navigate(`/pms/projects/${p.id}`)}
                >
                  Manage Lifecycle
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
