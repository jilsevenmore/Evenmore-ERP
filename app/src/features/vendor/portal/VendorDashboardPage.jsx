import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useVendorStore } from '../../../stores/vendorStore';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Layers,
  Calendar,
  Bell,
  Eye,
  FileCheck,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export function VendorDashboardPage() {
  const navigate = useNavigate();
  const getCurrentVendor = useVendorStore((s) => s.getCurrentVendor);
  const getCurrentUser = useVendorStore((s) => s.getCurrentUser);
  const orders = useVendorStore((s) => s.orders);
  const notifications = useVendorStore((s) => s.notifications);

  const currentVendor = getCurrentVendor();
  const currentUser = getCurrentUser();

  // Scoped orders for current vendor only
  const vendorOrders = orders.filter((o) => o.vendorId === currentVendor.id && o.isShared !== false);

  // Compute metrics
  const totalShared = vendorOrders.length;
  const newOrders = vendorOrders.filter((o) => o.status === 'New');
  const inProgressOrders = vendorOrders.filter((o) => o.status === 'In Progress' || o.status === 'Accepted');
  const completedOrders = vendorOrders.filter((o) => o.status === 'Completed');
  const delayedOrders = vendorOrders.filter((o) => o.riskStatus === 'Delayed' || o.status === 'Delayed');
  const atRiskOrders = vendorOrders.filter((o) => o.riskStatus === 'At Risk' || o.status === 'At Risk');
  const pendingApprovals = vendorOrders.filter((o) => o.status === 'Awaiting Approval');

  // Orders requiring update (active orders with in-progress or started stage)
  const ordersRequiringUpdate = vendorOrders.filter(
    (o) => o.status === 'In Progress' || o.status === 'Awaiting Approval' || o.status === 'New'
  );

  // Recently completed stages across orders
  const recentlyCompletedStages = [];
  vendorOrders.forEach((o) => {
    (o.stages || []).forEach((stg) => {
      if (stg.status === 'Approved' || stg.status === 'Submitted') {
        recentlyCompletedStages.push({
          orderId: o.id,
          orderNumber: o.orderNumber,
          product: o.product,
          stageName: stg.name,
          status: stg.status,
          date: stg.actualCompletionDate || stg.submittedDate || o.lastUpdate,
          quantity: stg.quantityCompleted || o.quantity,
          weight: stg.weight,
        });
      }
    });
  });

  // Recent scoped notifications
  const recentNotifications = notifications
    .filter((n) => n.vendorId === currentVendor.id || n.vendorId === null)
    .slice(0, 4);

  // Overall Average Progress
  const avgProgress =
    totalShared > 0
      ? Math.round(vendorOrders.reduce((sum, o) => sum + (o.overallProgress || 0), 0) / totalShared)
      : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs text-blue-200 text-xs font-semibold">
              <ShieldCheck size={12} />
              <span>Verified Supplier Portal • {currentVendor.code}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.name || currentVendor.name}
            </h1>
            <p className="text-xs text-blue-200/80 max-w-2xl leading-relaxed">
              Real-time production visibility for {currentVendor.name}. You have{' '}
              <span className="font-bold text-white underline decoration-blue-400">
                {pendingApprovals.length} stage update(s)
              </span>{' '}
              awaiting in-house engineering verification and{' '}
              <span className="font-bold text-white underline decoration-blue-400">
                {inProgressOrders.length} active production orders
              </span>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/vendor/orders"
              className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 shadow-sm cursor-pointer transition-colors inline-flex items-center gap-1.5"
            >
              <span>View My Orders</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Summary KPI Cards (Clickable) ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Total Shared Orders',
            value: totalShared,
            filter: 'All',
            color: 'text-slate-900 dark:text-white',
            bg: 'bg-white dark:bg-slate-900',
            border: 'border-slate-200 dark:border-slate-800',
            icon: Package,
            iconColor: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50',
          },
          {
            label: 'New Orders',
            value: newOrders.length,
            filter: 'New',
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-white dark:bg-slate-900',
            border: 'border-slate-200 dark:border-slate-800',
            icon: AlertCircle,
            iconColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50',
          },
          {
            label: 'In Progress',
            value: inProgressOrders.length,
            filter: 'In Progress',
            color: 'text-sky-600 dark:text-sky-400',
            bg: 'bg-white dark:bg-slate-900',
            border: 'border-slate-200 dark:border-slate-800',
            icon: Clock,
            iconColor: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50',
          },
          {
            label: 'Completed',
            value: completedOrders.length,
            filter: 'Completed',
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-white dark:bg-slate-900',
            border: 'border-slate-200 dark:border-slate-800',
            icon: CheckCircle2,
            iconColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
          },
          {
            label: 'Delayed Orders',
            value: delayedOrders.length,
            filter: 'Delayed',
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-white dark:bg-slate-900',
            border: 'border-slate-200 dark:border-slate-800',
            icon: AlertTriangle,
            iconColor: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50',
          },
          {
            label: 'At Risk',
            value: atRiskOrders.length,
            filter: 'At Risk',
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-white dark:bg-slate-900',
            border: 'border-slate-200 dark:border-slate-800',
            icon: AlertTriangle,
            iconColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <button
              key={idx}
              onClick={() => navigate(`/vendor/orders?status=${encodeURIComponent(kpi.filter)}`)}
              className={`${kpi.bg} p-4 rounded-2xl border ${kpi.border} text-left transition-all hover:shadow-md hover:border-primary/40 cursor-pointer group`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl ${kpi.iconColor} flex items-center justify-center`}>
                  <Icon size={16} />
                </div>
                <ChevronRight size={13} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 truncate">{kpi.label}</p>
              <p className={`text-xl font-extrabold ${kpi.color} mt-0.5`}>{kpi.value}</p>
            </button>
          );
        })}
      </div>

      {/* ── Overall Progress Summary Card ─────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Overall Production Progress</h3>
            <p className="text-xs text-slate-500">
              Weighted milestone completion across all active and completed shared orders.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black font-mono text-primary">{avgProgress}%</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              {currentVendor.onTimeRate || 94}% On-Time Delivery
            </span>
          </div>
        </div>

        <div className="mt-3">
          <ProgressBar value={avgProgress} max={100} color="blue" height={10} />
        </div>
      </div>

      {/* ── Grid: Orders Requiring Update & Pending Approvals ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Requiring Action / Update */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Clock size={14} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Orders Requiring Update</h3>
                <p className="text-[11px] text-slate-500">Production stages currently awaiting execution</p>
              </div>
            </div>
            <Link to="/vendor/orders" className="text-xs text-primary font-semibold hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {ordersRequiringUpdate.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No pending orders require updates right now.</p>
            ) : (
              ordersRequiringUpdate.slice(0, 4).map((order) => {
                const currentStage =
                  order.stages?.find((s) => s.status === 'In Progress' || s.status === 'Submitted' || s.status === 'Started') ||
                  order.stages?.[0];

                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/vendor/orders/${order.id}`)}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-primary/40 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-primary group-hover:underline">
                          {order.orderNumber}
                        </span>
                        <StatusBadge status={order.status} />
                        {order.priority === 'Urgent' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {order.product}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Current Stage: <span className="font-medium text-slate-700 dark:text-slate-300">{currentStage?.name || 'Initiation'}</span> • Due: {order.dueDate}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                        {order.overallProgress}%
                      </span>
                      <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform mt-1 ml-auto" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pending In-House Approvals */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <FileCheck size={14} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pending In-House Approvals</h3>
                <p className="text-[11px] text-slate-500">Submitted stages waiting for ERP engineering sign-off</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-600 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
              {pendingApprovals.length} Pending
            </span>
          </div>

          <div className="space-y-2.5">
            {pendingApprovals.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No stage updates are waiting for approval.</p>
            ) : (
              pendingApprovals.map((order) => {
                const submittedStage = order.stages?.find((s) => s.status === 'Submitted');
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/vendor/orders/${order.id}`)}
                    className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50/60 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {order.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {submittedStage?.name || 'Stage'} • Submitted
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 truncate">
                        {order.product} (Qty: {submittedStage?.quantityCompleted || order.quantity})
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Remarks: "{submittedStage?.remarks || 'Submitted with test reports.'}"
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[11px] font-semibold text-primary group-hover:underline inline-flex items-center gap-0.5">
                        Inspect <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Grid: Recently Completed Stages & Recent Notifications ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Completed Stages */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Recently Completed Stages</span>
            </h3>
            <span className="text-[11px] text-slate-400">Latest milestones</span>
          </div>

          <div className="space-y-2">
            {recentlyCompletedStages.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No completed stages yet.</p>
            ) : (
              recentlyCompletedStages.slice(0, 4).map((stg, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/vendor/orders/${stg.orderId}`)}
                  className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {stg.stageName} • <span className="font-mono text-primary">{stg.orderNumber}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {stg.product} • Weight: {stg.weight}%
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={stg.status} />
                    <p className="text-[10px] text-slate-400 mt-1">{stg.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Bell size={16} className="text-primary" />
              <span>Recent Activity & Notifications</span>
            </h3>
            <Link to="/vendor/notifications" className="text-xs text-primary font-semibold hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {recentNotifications.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">You're all caught up! No notifications.</p>
            ) : (
              recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.orderId) navigate(`/vendor/orders/${notif.orderId}`);
                  }}
                  className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                    !notif.read
                      ? 'bg-blue-50/50 border-blue-200/80 dark:bg-blue-950/20 dark:border-blue-900/50'
                      : 'bg-slate-50/70 border-slate-200/80 dark:bg-slate-800/40 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{notif.title}</p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboardPage;
