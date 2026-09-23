import React from 'react';
import { useVendorStore } from '../../../stores/vendorStore';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  Calendar,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

export function VendorPerformancePage() {
  const getCurrentVendor = useVendorStore((s) => s.getCurrentVendor);
  const orders = useVendorStore((s) => s.orders);

  const currentVendor = getCurrentVendor();
  const vendorOrders = orders.filter((o) => o.vendorId === currentVendor?.id && o.isShared !== false);

  const totalOrders = vendorOrders.length;
  const completedOrders = vendorOrders.filter((o) => o.status === 'Completed').length;
  const delayedOrders = vendorOrders.filter((o) => o.riskStatus === 'Delayed' || o.status === 'Delayed').length;
  const activeOrders = vendorOrders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled').length;
  const onTimeOrders = Math.max(0, totalOrders - delayedOrders);
  const onTimePercentage = totalOrders > 0 ? Math.round((onTimeOrders / totalOrders) * 100) : 100;

  const avgProgress =
    totalOrders > 0
      ? Math.round(vendorOrders.reduce((acc, o) => acc + (o.overallProgress || 0), 0) / totalOrders)
      : 0;

  // Compute stage averages
  const stageStats = {};
  vendorOrders.forEach((o) => {
    (o.stages || []).forEach((stg) => {
      if (!stageStats[stg.name]) {
        stageStats[stg.name] = { name: stg.name, count: 0, weightSum: 0, daysSum: 0 };
      }
      stageStats[stg.name].count += 1;
      stageStats[stg.name].weightSum += stg.weight || 0;
      stageStats[stg.name].daysSum += stg.expectedDays || 3;
    });
  });

  const stageList = Object.values(stageStats);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Vendor Performance Scorecard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational turnaround velocity, on-time completion record, and stage benchmark metrics for {currentVendor?.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <Award size={14} />
            <span>Supplier Grade: Tier 1 Premium</span>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Allocated Orders
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalOrders}</p>
          <p className="text-[11px] text-slate-500">{activeOrders} currently active</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            On-Time Delivery Rate
          </span>
          <p className="text-2xl font-black text-emerald-600">{onTimePercentage}%</p>
          <p className="text-[11px] text-emerald-600 font-medium">{onTimeOrders} on-time dispatches</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Delayed Orders
          </span>
          <p className="text-2xl font-black text-rose-600">{delayedOrders}</p>
          <p className="text-[11px] text-slate-400">Past SLA deadline</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Average Progress Velocity
          </span>
          <p className="text-2xl font-black text-primary">{avgProgress}%</p>
          <p className="text-[11px] text-slate-400">Across open pipelines</p>
        </div>
      </div>

      {/* Stage-Wise Average Duration & Benchmarks */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers size={16} className="text-primary" />
              <span>Stage Duration & Efficiency Benchmarks</span>
            </h3>
            <p className="text-xs text-slate-500">
              Average timeline and planned days per manufacturing stage across historical jobs.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {stageList.length} Stages Configured
          </span>
        </div>

        <div className="space-y-4">
          {stageList.map((stg, idx) => {
            const avgDays = Math.round((stg.daysSum / stg.count) * 10) / 10;
            const avgWeight = Math.round(stg.weightSum / stg.count);

            return (
              <div key={idx} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-slate-800 dark:text-slate-200">{stg.name}</span>
                    <span className="text-[10px] text-slate-400">({stg.count} orders processed)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">Weight: <strong>{avgWeight}%</strong></span>
                    <span className="font-mono text-primary font-bold">~{avgDays} days avg</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, avgDays * 15)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Turnaround History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          <span>Outsourced Orders Execution Record</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Order Number</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3 text-center">Quantity</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Risk Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {vendorOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-primary">{o.orderNumber}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{o.product}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{o.quantity} {o.uom || 'Units'}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{o.dueDate}</td>
                  <td className="py-2.5 px-3 font-mono font-bold">{o.overallProgress}%</td>
                  <td className="py-2.5 px-3 text-center"><StatusBadge status={o.status} /></td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      o.riskStatus === 'Delayed'
                        ? 'bg-rose-100 text-rose-700'
                        : o.riskStatus === 'At Risk'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {o.riskStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default VendorPerformancePage;
