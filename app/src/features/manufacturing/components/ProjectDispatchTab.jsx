import React, { useState } from 'react';
import {
  Truck,
  Plus,
  CheckCircle2,
  Calendar,
  Building2,
  ExternalLink,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useManufacturingStore } from '../../../stores/manufacturingStore';
import { getManufacturingStatusStyle } from '../../../utils/manufacturingUtils';
import { Button } from '../../../components/ui/Button';

export function ProjectDispatchTab({ project }) {
  const dispatchRecords = useManufacturingStore((s) => s.dispatchRecords);
  const createDispatchRecord = useManufacturingStore((s) => s.createDispatchRecord);
  const updateDispatchStatus = useManufacturingStore((s) => s.updateDispatchStatus);

  const dispatch = dispatchRecords.find(
    (d) => d.projectId === project.id || d.projectNumber === project.id
  ) || dispatchRecords[0];

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    transporter: 'Patel Roadways Logistics',
    lrTrackingNumber: 'LR-BHW-994102',
    vehicleNumber: 'MH-04-AB-1290',
    packageCount: 2,
    expectedDelivery: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createDispatchRecord({
      projectId: project.id,
      projectNumber: project.id,
      orderNumber: project.crmOrderId || 'SO-2026-0102',
      customerName: project.customerName,
      ...form,
    });
    setModalOpen(false);
  };

  const statusStyle = dispatch ? getManufacturingStatusStyle(dispatch.status) : null;

  return (
    <div className="space-y-4">
      {/* Top Banner with Delivery Challan Cross-Link */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck size={18} className="text-indigo-600" />
              Dispatch Logistics & Dock Handover
            </h4>
            <p className="text-xs text-slate-500">
              Synchronizes factory gate passes, transporter waybills (LR), and shipping Delivery Challans.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/sales/delivery"
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1"
            >
              <span>ERP Delivery Challans</span>
              <ExternalLink size={12} />
            </Link>

            {!dispatch && (
              <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
                Generate Dispatch Manifest
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Active Dispatch Manifest Card */}
      {dispatch ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-slate-900 font-mono">{dispatch.dispatchNumber}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                {dispatch.status}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">Date: {dispatch.dispatchDate}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Freight Carrier</span>
              <strong className="text-slate-800 text-sm block">{dispatch.transporter}</strong>
              <span className="text-slate-500 font-mono">Vehicle: {dispatch.vehicleNumber || 'MH-04-AB-1290'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tracking Waybill (LR)</span>
              <strong className="text-indigo-700 text-sm font-mono block">{dispatch.lrTrackingNumber}</strong>
              <span className="text-slate-500">Packages: {dispatch.packageCount} Crates</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Destination Customer</span>
              <strong className="text-slate-800 text-sm block">{dispatch.customerName}</strong>
              <span className="text-slate-500 font-mono">Order: {dispatch.orderNumber}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Arrival</span>
              <strong className="text-slate-800 text-sm font-mono block">{dispatch.expectedDelivery}</strong>
              <span className="text-slate-500">{dispatch.actualDelivery ? `Delivered: ${dispatch.actualDelivery}` : 'Transit on schedule'}</span>
            </div>
          </div>

          {/* Quick Lifecycle Status Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Gate-Pass & Insurance Verified</span>
            </div>

            <div className="flex items-center gap-2">
              {dispatch.status === 'Ready for Dispatch' && (
                <Button
                  size="sm"
                  onClick={() => updateDispatchStatus(dispatch.id, 'In Transit')}
                >
                  Mark In Transit
                </Button>
              )}
              {dispatch.status === 'In Transit' && (
                <Button
                  size="sm"
                  onClick={() => updateDispatchStatus(dispatch.id, 'Delivered', new Date().toISOString().slice(0, 10))}
                >
                  Confirm Client Delivery
                </Button>
              )}
              {dispatch.status === 'Delivered' && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                  <CheckCircle2 size={13} /> Consignment Closed
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
          <Truck size={36} className="mx-auto text-slate-300" />
          <h5 className="text-sm font-bold text-slate-800">No Dispatch Manifest Created</h5>
          <p className="text-xs text-slate-500">Generate a dispatch tracking entry once finished goods packaging is sealed.</p>
        </div>
      )}

      {/* Create Dispatch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Truck className="text-indigo-600" size={16} />
              Issue Dispatch Manifest
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Transporter / Courier *</label>
                <input
                  required
                  value={form.transporter}
                  onChange={(e) => setForm({ ...form, transporter: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">LR / Tracking # *</label>
                  <input
                    required
                    value={form.lrTrackingNumber}
                    onChange={(e) => setForm({ ...form, lrTrackingNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Vehicle / Truck #</label>
                  <input
                    value={form.vehicleNumber}
                    onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Total Packages</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.packageCount}
                    onChange={(e) => setForm({ ...form, packageCount: parseInt(e.target.value, 10) || 1 })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={form.expectedDelivery}
                    onChange={(e) => setForm({ ...form, expectedDelivery: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Generate Gate Pass & LR
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDispatchTab;
