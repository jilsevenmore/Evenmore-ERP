import React, { useState, useMemo } from 'react';
import { useVendorStore } from '../../../stores/vendorStore';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Button } from '../../../components/ui/Button';
import { PageHeader } from '../../../components/common/PageHeader';
import { AdminStageApprovalModal } from './components/AdminStageApprovalModal';
import { ShareOrderModal } from './components/ShareOrderModal';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  Filter,
  RotateCcw,
  Building2,
  Layers,
  ArrowRight,
  Eye,
  Share2,
  TrendingUp,
} from 'lucide-react';

const progressGuide = {
  title: 'Vendor Outsourcing & Progress Tracking',
  subtitle: 'Supplier milestone execution, real-time stage progress, and in-house engineering approvals.',
  purpose: 'Centralized oversight for all outsourced production jobs across suppliers. Review photo/certificate verification proofs, enforce weighted stage milestones, and approve or reject stage completions.',
  workflow: ['Order Shared', 'Vendor Accepts', 'Stages Executed', 'Proof Submitted', 'In-House Sign-Off', 'Dispatch Clearance'],
  keyTerms: [
    { term: 'Weighted Milestones', definition: 'Each stage contributes a defined weight % (e.g. Fabrication 30%, Welding 25%) rather than arbitrary stage counts.' },
    { term: 'In-House Verification', definition: 'Vendor completion submissions enter Pending Approval until an in-house engineer verifies proofs and clears the stage.' },
    { term: 'Dynamic Risk Engine', definition: 'Orders falling behind delivery timelines are automatically flagged Delayed or At Risk.' },
  ],
  tips: [
    'Click "Review Update" on any stage awaiting approval to inspect uploaded test certificates or photos.',
    'Click "Share Order" to assign an existing sales order to an authorized supplier portal.',
  ],
};

export function AdminVendorProgressDashboard() {
  const vendors = useVendorStore((s) => s.vendors);
  const orders = useVendorStore((s) => s.orders);

  const sharedOrders = useMemo(() => {
    return orders.filter((o) => o.isShared !== false);
  }, [orders]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState('All');

  // Modals state
  const [approvalTarget, setApprovalTarget] = useState(null); // { order, stage }
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Collect unique stages for filter
  const uniqueStages = useMemo(() => {
    const s = new Set();
    sharedOrders.forEach((o) => (o.stages || []).forEach((stg) => s.add(stg.name)));
    return Array.from(s);
  }, [sharedOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return sharedOrders.filter((order) => {
      const q = searchTerm.toLowerCase().trim();
      if (q) {
        const matches =
          order.orderNumber.toLowerCase().includes(q) ||
          order.vendorName.toLowerCase().includes(q) ||
          order.customer.toLowerCase().includes(q) ||
          order.product.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedVendor !== 'All' && order.vendorId !== selectedVendor) return false;

      if (selectedStatus !== 'All') {
        if (selectedStatus === 'Delayed' && order.riskStatus !== 'Delayed' && order.status !== 'Delayed') return false;
        if (selectedStatus === 'At Risk' && order.riskStatus !== 'At Risk' && order.status !== 'At Risk') return false;
        if (selectedStatus === 'Awaiting Approval' && order.status !== 'Awaiting Approval') return false;
        if (selectedStatus !== 'Delayed' && selectedStatus !== 'At Risk' && selectedStatus !== 'Awaiting Approval') {
          if (order.status !== selectedStatus) return false;
        }
      }

      if (selectedRisk !== 'All' && order.riskStatus !== selectedRisk) return false;

      if (selectedStage !== 'All') {
        const hasStage = order.stages?.some((s) => s.name === selectedStage);
        if (!hasStage) return false;
      }

      return true;
    });
  }, [sharedOrders, searchTerm, selectedVendor, selectedStatus, selectedStage, selectedRisk]);

  // Metrics Summary
  const totalOutsourced = sharedOrders.length;
  const inProgress = sharedOrders.filter((o) => o.status === 'In Progress' || o.status === 'Accepted').length;
  const completed = sharedOrders.filter((o) => o.status === 'Completed').length;
  const delayed = sharedOrders.filter((o) => o.riskStatus === 'Delayed' || o.status === 'Delayed').length;
  const atRisk = sharedOrders.filter((o) => o.riskStatus === 'At Risk' || o.status === 'At Risk').length;
  const awaitingApproval = sharedOrders.filter((o) => o.status === 'Awaiting Approval').length;

  // Vendor Performance Table Data
  const vendorPerformanceList = useMemo(() => {
    return vendors.map((v) => {
      const vOrders = sharedOrders.filter((o) => o.vendorId === v.id);
      const vTotal = vOrders.length;
      const vCompleted = vOrders.filter((o) => o.status === 'Completed').length;
      const vDelayed = vOrders.filter((o) => o.riskStatus === 'Delayed' || o.status === 'Delayed').length;
      const vActive = vOrders.filter((o) => o.status !== 'Completed').length;
      const vAvgProgress =
        vTotal > 0
          ? Math.round(vOrders.reduce((sum, o) => sum + (o.overallProgress || 0), 0) / vTotal)
          : 0;
      const onTimePct = vTotal > 0 ? Math.round(((vTotal - vDelayed) / vTotal) * 100) : (v.onTimeRate || 92);

      return {
        ...v,
        totalOrders: vTotal,
        activeOrders: vActive,
        completedOrders: vCompleted,
        delayedOrders: vDelayed,
        avgProgress: vAvgProgress,
        onTimePct,
        avgDuration: '3.4 days',
      };
    });
  }, [vendors, sharedOrders]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedVendor('All');
    setSelectedStatus('All');
    setSelectedStage('All');
    setSelectedRisk('All');
  };

  const handleReviewStage = (order, stage) => {
    setApprovalTarget({ order, stage });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Vendor Progress & Outsourcing Dashboard"
        subtitle="Manage outsourced production orders, track weighted milestone delivery, and review verification proofs."
        guide={progressGuide}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              icon={Share2}
              onClick={() => setIsShareModalOpen(true)}
            >
              Share Order with Vendor
            </Button>
          </div>
        }
      />

      {successToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast('')}>✕</button>
        </div>
      )}

      {/* ── Summary KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Total Outsourced',
            value: totalOutsourced,
            filter: 'All',
            icon: Package,
            color: 'text-slate-900 dark:text-white',
            badgeBg: 'bg-blue-50 text-blue-600',
          },
          {
            label: 'In Progress',
            value: inProgress,
            filter: 'In Progress',
            icon: Clock,
            color: 'text-sky-600',
            badgeBg: 'bg-sky-50 text-sky-600',
          },
          {
            label: 'Completed',
            value: completed,
            filter: 'Completed',
            icon: CheckCircle2,
            color: 'text-emerald-600',
            badgeBg: 'bg-emerald-50 text-emerald-600',
          },
          {
            label: 'Delayed Orders',
            value: delayed,
            filter: 'Delayed',
            icon: AlertTriangle,
            color: 'text-rose-600',
            badgeBg: 'bg-rose-50 text-rose-600',
          },
          {
            label: 'At Risk',
            value: atRisk,
            filter: 'At Risk',
            icon: AlertTriangle,
            color: 'text-amber-600',
            badgeBg: 'bg-amber-50 text-amber-600',
          },
          {
            label: 'Awaiting Approval',
            value: awaitingApproval,
            filter: 'Awaiting Approval',
            icon: FileCheck,
            color: 'text-purple-600',
            badgeBg: 'bg-purple-50 text-purple-600',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          const isSelected = selectedStatus === kpi.filter;
          return (
            <button
              key={idx}
              onClick={() => setSelectedStatus(kpi.filter)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer group bg-white dark:bg-slate-900 ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl ${kpi.badgeBg} flex items-center justify-center`}>
                  <Icon size={16} />
                </div>
                {kpi.value > 0 && kpi.filter === 'Awaiting Approval' && (
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                )}
              </div>
              <p className="text-[11px] font-semibold text-slate-500 truncate">{kpi.label}</p>
              <p className={`text-xl font-extrabold ${kpi.color} mt-0.5`}>{kpi.value}</p>
            </button>
          );
        })}
      </div>

      {/* ── Vendor Performance Summary Table ──────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-primary" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Supplier Performance & Turnaround
            </h3>
          </div>
          <span className="text-xs text-slate-400">Registered Portal Vendors</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Vendor Supplier</th>
                <th className="py-2.5 px-3 text-center">Active Orders</th>
                <th className="py-2.5 px-3 text-center">Completed</th>
                <th className="py-2.5 px-3 text-center">Delayed</th>
                <th className="py-2.5 px-3">Average Progress</th>
                <th className="py-2.5 px-3 text-center">On-Time %</th>
                <th className="py-2.5 px-3 text-center">Avg Stage Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {vendorPerformanceList.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => setSelectedVendor(v.id === selectedVendor ? 'All' : v.id)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                    selectedVendor === v.id ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">{v.code}</span>
                      <span>{v.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                    {v.activeOrders}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-emerald-600 font-bold">
                    {v.completedOrders}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-rose-600 font-bold">
                    {v.delayedOrders}
                  </td>
                  <td className="py-2.5 px-3 min-w-[120px]">
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span>Velocity</span>
                      <span>{v.avgProgress}%</span>
                    </div>
                    <ProgressBar value={v.avgProgress} max={100} height={5} color="blue" />
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-600">
                    {v.onTimePct}%
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                    {v.avgDuration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Main Orders Progress Table & Filters ──────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 p-4">
        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <input
              type="text"
              placeholder="Search by Order #, Vendor, Customer, or Product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          </div>

          {/* Vendor Filter */}
          <div>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
            >
              <option value="All">All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
            >
              <option value="All">All Stages</option>
              {uniqueStages.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
          </div>

          {/* Clear */}
          <div>
            <button
              onClick={clearFilters}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">Order Number</th>
                <th className="py-3 px-3">Assigned Vendor</th>
                <th className="py-3 px-3">Customer & Product</th>
                <th className="py-3 px-3">Progress</th>
                <th className="py-3 px-3">Current Stage</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Risk</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No outsourced orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const pendingStage = order.stages?.find((s) => s.status === 'Submitted');
                  const currentStage =
                    pendingStage ||
                    order.stages?.find((s) => s.status === 'In Progress' || s.status === 'Started') ||
                    order.stages?.find((s) => s.status === 'Not Started') ||
                    order.stages?.[order.stages.length - 1];

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Order Number */}
                      <td className="py-3 px-3 font-mono font-bold text-primary whitespace-nowrap">
                        {order.orderNumber}
                      </td>

                      {/* Vendor */}
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {order.vendorName}
                      </td>

                      {/* Customer & Product */}
                      <td className="py-3 px-3 max-w-xs">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{order.product}</p>
                        <p className="text-[11px] text-slate-500 truncate">{order.customer}</p>
                      </td>

                      {/* Weighted Progress */}
                      <td className="py-3 px-3 min-w-[110px]">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span>{order.overallProgress}%</span>
                        </div>
                        <ProgressBar
                          value={order.overallProgress}
                          max={100}
                          height={5}
                          color={
                            order.overallProgress === 100
                              ? 'green'
                              : order.riskStatus === 'Delayed'
                              ? 'red'
                              : order.riskStatus === 'At Risk'
                              ? 'yellow'
                              : 'blue'
                          }
                        />
                      </td>

                      {/* Current Stage */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            {currentStage?.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">({currentStage?.weight}%)</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">{currentStage?.status}</span>
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {order.dueDate}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Risk */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.riskStatus === 'Delayed'
                              ? 'bg-rose-100 text-rose-700'
                              : order.riskStatus === 'At Risk'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {order.riskStatus}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {pendingStage ? (
                          <button
                            onClick={() => handleReviewStage(order, pendingStage)}
                            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5 animate-pulse"
                          >
                            <FileCheck size={13} />
                            <span>Review Update</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReviewStage(order, currentStage)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-primary hover:bg-slate-50 cursor-pointer text-xs font-semibold"
                          >
                            Stage Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Approval / Rejection Modal */}
      {approvalTarget && (
        <AdminStageApprovalModal
          isOpen={Boolean(approvalTarget)}
          onClose={() => setApprovalTarget(null)}
          order={approvalTarget.order}
          stage={approvalTarget.stage}
          onSuccess={(msg) => {
            setSuccessToast(msg);
            setTimeout(() => setSuccessToast(''), 4000);
          }}
        />
      )}

      {/* Share Order Modal */}
      {isShareModalOpen && (
        <ShareOrderModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onSuccess={(msg) => {
            setSuccessToast(msg);
            setTimeout(() => setSuccessToast(''), 4000);
          }}
        />
      )}
    </div>
  );
}

export default AdminVendorProgressDashboard;
