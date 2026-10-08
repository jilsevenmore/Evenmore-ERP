import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  Package, 
  Clock, 
  Receipt, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';
import { StatCard } from '../../../../components/ui/StatCard';
import { fetchProjectProfitability } from '../../../../services/upgradeService';
import { useERP } from '../../../../context/ERPContext';

export function ProjectProfitabilityTab({ project }) {
  const { formatCurrency } = useERP();
  const [profitability, setProfitability] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadProfitability = async () => {
    if (!project?.id) return;
    setLoading(true);
    try {
      const res = await fetchProjectProfitability(project.id);
      if (res?.data) {
        setProfitability(res.data);
      } else if (res) {
        setProfitability(res);
      }
    } catch (err) {
      console.error('Failed to load project profitability:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfitability();
  }, [project?.id]);

  const revenue = Number(profitability?.contract_value ?? profitability?.revenue ?? project?.budget ?? 0);
  const materialCost = Number(profitability?.material_costs ?? profitability?.bills_total ?? 0);
  const expenseCost = Number(profitability?.direct_expenses ?? profitability?.expenses_total ?? 0);
  const laborCost = Number(profitability?.labor_cost ?? profitability?.timesheet_cost ?? 0);
  const totalCost = materialCost + expenseCost + laborCost;
  const grossProfit = revenue - totalCost;
  const marginPct = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;
  const isProfitable = grossProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <DollarSign className="text-emerald-600" size={18} />
            Direct Costs & Profitability Ledger
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregating raw materials, direct vouchers, and timesheet technician hours for {project.title || project.name}
          </p>
        </div>
        <button
          onClick={loadProfitability}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <RefreshCw size={13} /> Refresh P&L
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Contract / Order Revenue"
          value={formatCurrency(revenue)}
          icon={DollarSign}
          subtext="Projected commercial top line"
        />
        <StatCard
          label="Total Direct Cost Incurred"
          value={formatCurrency(totalCost)}
          icon={TrendingDown}
          subtext={`Materials: ${formatCurrency(materialCost)}`}
        />
        <StatCard
          label="Net Gross Profit"
          value={formatCurrency(grossProfit)}
          icon={TrendingUp}
          highlight={isProfitable}
          trend={{ positive: isProfitable, text: isProfitable ? 'Gross positive' : 'Cost overrun' }}
        />
        <StatCard
          label="Gross Margin %"
          value={`${marginPct}%`}
          icon={PieChart}
          highlight={marginPct > 20}
          trend={{ positive: marginPct > 15, text: 'Realized gross margin' }}
        />
      </div>

      {/* Direct Cost Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Component 1: Material Bills */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Package size={14} className="text-blue-600" /> Direct Materials Consumed
            </h4>
            <span className="font-mono font-bold text-blue-700">{formatCurrency(materialCost)}</span>
          </div>
          <div className="space-y-2">
            {(profitability?.bills || []).length === 0 ? (
              <p className="text-slate-400 py-3 text-center">No purchase bills tagged to this project.</p>
            ) : (
              (profitability.bills || []).map((bill, i) => (
                <div key={i} className="flex justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="font-mono font-medium text-slate-700">{bill.bill_number}</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(bill.total)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Component 2: Direct Expense Vouchers */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Receipt size={14} className="text-amber-600" /> Direct Site & Freight Expenses
            </h4>
            <span className="font-mono font-bold text-amber-700">{formatCurrency(expenseCost)}</span>
          </div>
          <div className="space-y-2">
            {(profitability?.expenses || []).length === 0 ? (
              <p className="text-slate-400 py-3 text-center">No expense vouchers allocated to this project.</p>
            ) : (
              (profitability.expenses || []).map((exp, i) => (
                <div key={i} className="flex justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">{exp.category || exp.description}</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(exp.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Component 3: Timesheet Labor */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Clock size={14} className="text-purple-600" /> Timesheet Labor Allocation
            </h4>
            <span className="font-mono font-bold text-purple-700">{formatCurrency(laborCost)}</span>
          </div>
          <div className="space-y-2">
            <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex justify-between text-purple-900">
                <span>Logged Billable Hours:</span>
                <span className="font-mono font-bold">{profitability?.logged_hours ?? 0} hrs</span>
              </div>
              <div className="flex justify-between text-purple-700 mt-1">
                <span>Effective Labor Rate:</span>
                <span className="font-mono font-bold">Rs {profitability?.hourly_rate ?? 650}/hr</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
