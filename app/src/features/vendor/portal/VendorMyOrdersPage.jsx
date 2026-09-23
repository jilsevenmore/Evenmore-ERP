import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVendorStore } from '../../../stores/vendorStore';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Button } from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import {
  Search,
  Filter,
  CheckCircle,
  Eye,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Package,
  Layers,
  Check,
} from 'lucide-react';

export function VendorMyOrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status') || 'All';

  const getCurrentVendor = useVendorStore((s) => s.getCurrentVendor);
  const orders = useVendorStore((s) => s.orders);
  const acceptOrder = useVendorStore((s) => s.acceptOrder);

  const currentVendor = getCurrentVendor();

  // Strictly filter orders to current logged in vendor
  const vendorOrders = useMemo(() => {
    return orders.filter((o) => o.vendorId === currentVendor?.id && o.isShared !== false);
  }, [orders, currentVendor]);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(statusParam);
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Collect unique stages for filter dropdown
  const uniqueStages = useMemo(() => {
    const set = new Set();
    vendorOrders.forEach((o) => {
      (o.stages || []).forEach((s) => set.add(s.name));
    });
    return Array.from(set);
  }, [vendorOrders]);

  // Filter & Search
  const filteredOrders = useMemo(() => {
    return vendorOrders.filter((order) => {
      // Search
      const term = searchTerm.toLowerCase().trim();
      if (term) {
        const matchesSearch =
          order.orderNumber.toLowerCase().includes(term) ||
          order.customer.toLowerCase().includes(term) ||
          order.product.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      // Status
      if (selectedStatus !== 'All') {
        if (selectedStatus === 'Delayed') {
          if (order.riskStatus !== 'Delayed' && order.status !== 'Delayed') return false;
        } else if (selectedStatus === 'At Risk') {
          if (order.riskStatus !== 'At Risk' && order.status !== 'At Risk') return false;
        } else if (selectedStatus === 'In Progress') {
          if (order.status !== 'In Progress' && order.status !== 'Accepted') return false;
        } else if (selectedStatus === 'Completed') {
          if (order.status !== 'Completed') return false;
        } else if (selectedStatus === 'New') {
          if (order.status !== 'New') return false;
        } else if (order.status !== selectedStatus) {
          return false;
        }
      }

      // Risk
      if (selectedRisk !== 'All' && order.riskStatus !== selectedRisk) {
        return false;
      }

      // Stage
      if (selectedStage !== 'All') {
        const hasStage = order.stages?.some((s) => s.name === selectedStage);
        if (!hasStage) return false;
      }

      return true;
    });
  }, [vendorOrders, searchTerm, selectedStatus, selectedStage, selectedRisk]);

  // Sorting
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';

      if (sortBy === 'overallProgress') {
        valA = a.overallProgress || 0;
        valB = b.overallProgress || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / pageSize) || 1;
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('All');
    setSelectedStage('All');
    setSelectedRisk('All');
    setSearchParams({});
    setCurrentPage(1);
  };

  const handleAccept = (e, orderId) => {
    e.stopPropagation();
    acceptOrder(orderId);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            My Assigned Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Outsourced manufacturing orders allocated to <span className="font-bold text-slate-700 dark:text-slate-300">{currentVendor.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="px-2.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
            {filteredOrders.length} of {vendorOrders.length} Orders
          </span>
        </div>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <input
              type="text"
              placeholder="Search by Order #, Customer, or Product..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Accepted">Accepted</option>
              <option value="In Progress">In Progress</option>
              <option value="Awaiting Approval">Awaiting Approval</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
              <option value="At Risk">At Risk</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Stages</option>
              {uniqueStages.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick:</span>
          {['All', 'New', 'In Progress', 'Awaiting Approval', 'Delayed', 'At Risk', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setSelectedStatus(tab);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedStatus === tab
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Orders Table ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Order Number</th>
                <th className="py-3 px-4">Customer & Product</th>
                <th className="py-3 px-3 text-center">Quantity</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Priority</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Package size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      No orders have been shared with you yet.
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Check back once ERP administrators allocate outsourced manufacturing work.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const currentStage =
                    order.stages?.find((s) => s.status === 'In Progress' || s.status === 'Submitted' || s.status === 'Started') ||
                    order.stages?.find((s) => s.status === 'Not Started') ||
                    order.stages?.[order.stages.length - 1];

                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/vendor/orders/${order.id}`)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Order Number */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-primary group-hover:underline flex items-center gap-1.5">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Assigned: {order.assignedDate}
                        </span>
                      </td>

                      {/* Customer & Product */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{order.product}</p>
                        <p className="text-[11px] text-slate-500 truncate">{order.customer}</p>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {order.quantity}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400">{order.uom || 'Units'}</span>
                      </td>

                      {/* Current Stage */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                            {currentStage?.sequence || 1}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                              {currentStage?.name || 'Fabrication'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Weight: {currentStage?.weight || 20}% • {currentStage?.status || 'Pending'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-mono font-semibold text-slate-700 dark:text-slate-300">
                          <span>Progress</span>
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

                      {/* Due Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`font-mono text-xs ${order.riskStatus === 'Delayed' ? 'font-bold text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          {order.dueDate}
                        </span>
                        {order.riskStatus === 'Delayed' && (
                          <span className="block text-[10px] text-rose-500 font-bold">Overdue</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            order.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-700'
                              : order.priority === 'High'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {order.priority}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === 'New' && (
                            <button
                              onClick={(e) => handleAccept(e, order.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer shadow-2xs inline-flex items-center gap-1"
                              title="Accept this outsourced assignment"
                            >
                              <Check size={12} />
                              <span>Accept</span>
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/vendor/orders/${order.id}`)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Inspect Order Details & Stage Workflow"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorMyOrdersPage;
