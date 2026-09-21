import React from 'react';
import { Drawer } from '../../../../components/ui/Drawer';
import { Button } from '../../../../components/ui/Button';
import { ProgressBar } from '../../../../components/ui/ProgressBar';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { useVendorStore } from '../../../../stores/vendorStore';
import {
  Award,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Package,
  Calendar,
} from 'lucide-react';

export function VendorPerformanceDrawer({ isOpen, onClose, vendor }) {
  const orders = useVendorStore((s) => s.orders);

  if (!isOpen || !vendor) return null;

  const vendorOrders = orders.filter((o) => o.vendorId === vendor.id && o.isShared !== false);
  const total = vendorOrders.length;
  const completed = vendorOrders.filter((o) => o.status === 'Completed').length;
  const delayed = vendorOrders.filter((o) => o.riskStatus === 'Delayed' || o.status === 'Delayed').length;
  const active = vendorOrders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled').length;
  const onTimePercentage = total > 0 ? Math.round(((total - delayed) / total) * 100) : (vendor.onTimeRate || 92);

  const avgProgress =
    total > 0
      ? Math.round(vendorOrders.reduce((acc, o) => acc + (o.overallProgress || 0), 0) / total)
      : 0;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Supplier Performance: ${vendor.name}`}
      subtitle={`${vendor.code} • ${vendor.supplyType}`}
      size="md"
    >
      <div className="space-y-5 text-xs">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Shared Orders
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{total}</p>
            <p className="text-[11px] text-slate-500">{active} active in-progress</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              On-Time SLA Rate
            </span>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{onTimePercentage}%</p>
            <p className="text-[11px] text-emerald-600 font-semibold">{total - delayed} on schedule</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Delayed Deliveries
            </span>
            <p className="text-xl font-black text-rose-600 mt-0.5">{delayed}</p>
            <p className="text-[11px] text-slate-400">Exceeded deadline</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Average Progress
            </span>
            <p className="text-xl font-black text-primary mt-0.5">{avgProgress}%</p>
            <p className="text-[11px] text-slate-400">Across pipeline</p>
          </div>
        </div>

        {/* Vendor Contact & Terms */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <h4 className="font-bold text-slate-800 dark:text-slate-200">Procurement Profile</h4>
          <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
            <p>Plant Address: <strong className="text-slate-800 dark:text-slate-200">{vendor.address}, {vendor.city}</strong></p>
            <p>Contact Person: <strong className="text-slate-800 dark:text-slate-200">{vendor.contactPerson} ({vendor.email})</strong></p>
            <p>Payment Terms: <strong className="text-slate-800 dark:text-slate-200">{vendor.paymentTerms}</strong></p>
            <p>Portal Status: <strong className="text-emerald-600">{vendor.portalAccess}</strong></p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span>Allocated Outsourcing Orders ({vendorOrders.length})</span>
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {vendorOrders.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No orders shared with this vendor yet.</p>
            ) : (
              vendorOrders.map((o) => (
                <div key={o.id} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-mono font-bold text-primary">{o.orderNumber}</p>
                    <p className="text-slate-800 dark:text-slate-200 font-semibold">{o.product}</p>
                    <p className="text-[10px] text-slate-400">Due: {o.dueDate} • Qty: {o.quantity}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="font-mono font-bold text-xs">{o.overallProgress}%</span>
                    <div>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close Scorecard
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

export default VendorPerformanceDrawer;
