import React from 'react';
import {
  Factory,
  Layers,
  Sliders,
  Boxes,
  Wrench,
  ShieldCheck,
  RotateCcw,
  Package,
  Truck,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/currencyUtils';
import { getManufacturingStatusStyle } from '../../../utils/manufacturingUtils';

const PIPELINE_STAGES = [
  { id: 'design', label: 'Design', icon: Layers, tabTarget: 'documents' },
  { id: 'planning', label: 'Material Planning', icon: Sliders, tabTarget: 'planning' },
  { id: 'material_ready', label: 'Material Ready', icon: Boxes, tabTarget: 'planning' },
  { id: 'production', label: 'Production', icon: Wrench, tabTarget: 'production' },
  { id: 'quality', label: 'Quality', icon: ShieldCheck, tabTarget: 'quality' },
  { id: 'rework', label: 'Rework', icon: RotateCcw, tabTarget: 'quality' },
  { id: 'packaging', label: 'Packaging', icon: Package, tabTarget: 'packaging' },
  { id: 'ready_dispatch', label: 'Ready for Dispatch', icon: Truck, tabTarget: 'dispatch' },
  { id: 'dispatched', label: 'Dispatched', icon: Truck, tabTarget: 'dispatch' },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle2, tabTarget: 'dispatch' },
];

export function ManufacturingHeroCard({
  project,
  weightedProgress = 0,
  productionCost = 0,
  labourCost = 0,
  materialCost = 0,
  revenue = 0,
  profit = 0,
  profitMargin = 0,
  materialStatus = 'Stock Available',
  productionStatus = 'In Production',
  currentStageName = 'Production & Fabrication',
  onSelectTab,
}) {
  const currentPipelineIdx = (() => {
    switch (productionStatus) {
      case 'Design': return 0;
      case 'Material Planning': return 1;
      case 'Material Ready': return 2;
      case 'In Production':
      case 'Production': return 3;
      case 'Quality':
      case 'QC Ready': return 4;
      case 'Rework': return 5;
      case 'Packaging': return 6;
      case 'Ready for Dispatch': return 7;
      case 'Dispatched':
      case 'In Transit': return 8;
      case 'Delivered':
      case 'Completed': return 9;
      default: return 3;
    }
  })();

  const prodStatusStyle = getManufacturingStatusStyle(productionStatus);
  const matStatusStyle = getManufacturingStatusStyle(materialStatus);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Top Banner with Project Context & Key Financials */}
      <div className="p-5 lg:p-6 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Manufacturing Project
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                {project.id}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${prodStatusStyle.bg} ${prodStatusStyle.text} ${prodStatusStyle.border}`}>
                {productionStatus}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${matStatusStyle.bg} ${matStatusStyle.text} ${matStatusStyle.border}`}>
                Material: {materialStatus}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800">
              {project.productDetails?.productName || 'Industrial Assembly System'}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span>Customer: <strong className="text-slate-800">{project.customerName}</strong></span>
              <span>Sales Order: <strong className="text-blue-600 font-mono">{project.crmOrderId || 'SO-2026-0102'}</strong></span>
              <span>Batch Qty: <strong className="text-slate-800 font-mono">{project.productDetails?.quantity || 4} Units</strong></span>
              <span>Current Stage: <strong className="text-indigo-600">{currentStageName}</strong></span>
            </div>
          </div>

          {/* Weighted Progress Radial / Gauge */}
          <div className="flex items-center gap-4 shrink-0 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Weighted Progress</span>
              <span className="text-2xl font-black text-slate-900 font-mono">{weightedProgress}%</span>
              <span className="text-[10px] text-slate-500 block">6 production stages</span>
            </div>
            <div className="w-12 h-12 relative flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-600 transition-all duration-500 ease-out"
                  strokeDasharray={`${weightedProgress}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <Factory size={16} className="absolute text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Financial & Operational KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Contract Revenue</span>
            <span className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(revenue)}</span>
            <span className="text-[10px] text-emerald-600 block font-medium">Billed to Client</span>
          </div>

          <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Material Cost</span>
            <span className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(materialCost)}</span>
            <span className="text-[10px] text-slate-500 block">BOM Consumption</span>
          </div>

          <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Labour Cost</span>
            <span className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(labourCost)}</span>
            <span className="text-[10px] text-slate-500 block">Shop-Floor Hours</span>
          </div>

          <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Production Cost</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{formatCurrency(productionCost)}</span>
            <span className="text-[10px] text-slate-500 block">Direct + Overhead</span>
          </div>

          <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Gross Profit</span>
            <span className="text-sm font-bold text-emerald-800 font-mono">{formatCurrency(profit)}</span>
            <span className="text-[10px] text-emerald-600 block font-medium">Revenue − Cost</span>
          </div>

          <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
            <span className="text-[10px] uppercase font-bold text-indigo-700 block">Profit Margin</span>
            <span className="text-sm font-bold text-indigo-800 font-mono">{profitMargin}%</span>
            <span className="text-[10px] text-indigo-600 block font-medium">Target: ≥35%</span>
          </div>
        </div>
      </div>

      {/* Horizontal Clickable Manufacturing Production Pipeline */}
      <div className="bg-slate-50 px-5 py-3 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[850px] gap-2">
          {PIPELINE_STAGES.map((step, idx) => {
            const Icon = step.icon;
            const isPassed = idx < currentPipelineIdx;
            const isCurrent = idx === currentPipelineIdx;
            const isUpcoming = idx > currentPipelineIdx;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab(step.tabTarget)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200'
                      : isPassed
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                  }`}
                  title={`Click to view ${step.label} tab`}
                >
                  <Icon size={12} className={isCurrent ? 'text-white' : isPassed ? 'text-emerald-600' : 'text-slate-400'} />
                  <span>{step.label}</span>
                </button>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 min-w-4 transition-colors ${
                      isPassed ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ManufacturingHeroCard;
