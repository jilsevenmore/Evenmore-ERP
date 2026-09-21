import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  ExternalLink,
  MapPin,
  Clock,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { useManufacturingStore } from '../../stores/manufacturingStore';
import { getManufacturingStatusStyle } from '../../utils/manufacturingUtils';

export default function DispatchPage() {
  const dispatchRecords = useManufacturingStore((s) => s.dispatchRecords);
  const createDispatchRecord = useManufacturingStore((s) => s.createDispatchRecord);
  const updateDispatchStatus = useManufacturingStore((s) => s.updateDispatchStatus);

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    carrierName: 'V-Trans Logistics India Ltd',
    vehicleNumber: 'MH-12-RN-9482',
    lrNumber: 'LR-2026-VTR-88492',
    driverName: 'Suresh Patil',
    driverPhone: '+91 98234 55120',
    deliveryChallanNumber: 'DC-2026-0089',
    destinationAddress: 'Precision Auto Components Ltd, Plot 42, Hinjewadi Phase 2, Pune, Maharashtra 411057',
    dispatchDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
  });

  const filteredDispatches = dispatchRecords.filter((d) => {
    const q = (searchTerm || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (d.dispatchNumber || '').toLowerCase().includes(q) ||
      (d.projectNumber || '').toLowerCase().includes(q) ||
      (d.carrierName || d.transporter || '').toLowerCase().includes(q) ||
      (d.lrNumber || d.lrTrackingNumber || '').toLowerCase().includes(q)
    );
  });

  function handleSubmit(e) {
    e.preventDefault();
    createDispatchRecord(formData);
    setModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finished Goods Dispatch & Freight Delivery"
        subtitle="Manage factory dock release, carrier logistics, lorry receipts (LR), and customer delivery tracking."
        actions={
          <Button
            icon={Plus}
            onClick={() => setModalOpen(true)}
          >
            Create Dispatch Manifest
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Total Shipments</span>
          <p className="text-2xl font-bold text-[#0f172a] mt-1">{dispatchRecords.length}</p>
          <span className="text-[11px] text-[#64748b]">Outbound shipments</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">In Transit to Customer</span>
          <p className="text-2xl font-bold text-[#1f6bff] mt-1">
            {dispatchRecords.filter((d) => d.status === 'In Transit').length}
          </p>
          <span className="text-[11px] text-[#64748b]">Freight on the road</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Successfully Delivered</span>
          <p className="text-2xl font-bold text-[#10b981] mt-1">
            {dispatchRecords.filter((d) => d.status === 'Delivered').length}
          </p>
          <span className="text-[11px] text-[#64748b]">Proof of delivery signed</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white border border-[#dce5f4] p-4 rounded-xl shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search dispatch #, carrier, LR, vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#1f6bff] text-[#0f172a]"
          />
        </div>
      </div>

      {/* Dispatch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDispatches.map((disp) => {
          const statusStyle = getManufacturingStatusStyle(disp.status);
          return (
            <div
              key={disp.id}
              className="bg-white border border-[#dce5f4] rounded-xl p-5 shadow-2xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#0f172a]">{disp.dispatchNumber}</span>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                      style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.color ? `${statusStyle.color}40` : '#e2e8f0' }}
                    >
                      {statusStyle.label || disp.status || 'Dispatched'}
                    </span>
                  </div>
                  <div className="text-xs text-[#64748b] mt-0.5">
                    Project: <span className="font-semibold text-[#0f172a]">{disp.projectNumber}</span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-[#64748b] block text-[11px]">Dispatched On</span>
                  <span className="font-semibold text-[#0f172a]">{disp.dispatchDate}</span>
                </div>
              </div>

              {/* Carrier Details */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-lg">
                <div>
                  <span className="text-[#64748b] block text-[11px]">Freight Carrier</span>
                  <span className="font-bold text-[#0f172a]">{disp.carrierName || disp.transporter || 'Self Logistics'}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[11px]">Vehicle Number</span>
                  <span className="font-mono font-semibold text-[#0f172a]">{disp.vehicleNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[11px]">LR / Tracking Number</span>
                  <span className="font-mono font-bold text-[#1f6bff]">{disp.lrNumber || disp.lrTrackingNumber || 'Pending'}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[11px]">Driver Contact</span>
                  <span className="font-medium text-[#0f172a]">{disp.driverName} ({disp.driverPhone})</span>
                </div>
              </div>

              {/* Destination */}
              <div className="text-xs bg-[#fff] border border-[#e2e8f0] p-3 rounded-lg flex items-start gap-2">
                <MapPin size={16} className="text-[#ef4444] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#64748b] block text-[11px]">Delivery Destination</span>
                  <p className="font-medium text-[#334155] leading-relaxed">{disp.destinationAddress}</p>
                </div>
              </div>

              {/* Delivery Challan link and Action */}
              <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <FileText size={13} className="text-[#64748b]" />
                  <span className="text-[#64748b]">Challan:</span>
                  <span className="font-mono font-semibold text-[#0f172a]">{disp.deliveryChallanNumber}</span>
                </div>

                <div className="flex gap-2">
                  {disp.status === 'Ready for Dispatch' && (
                    <Button
                      size="xs"
                      variant="outline"
                      icon={Truck}
                      onClick={() => updateDispatchStatus(disp.id, 'In Transit')}
                    >
                      Ship Cargo
                    </Button>
                  )}
                  {disp.status === 'In Transit' && (
                    <Button
                      size="xs"
                      variant="outline"
                      className="text-[#10b981] border-[#10b981]/30 hover:bg-[#f0fdf4]"
                      icon={CheckCircle2}
                      onClick={() => updateDispatchStatus(disp.id, 'Delivered')}
                    >
                      Confirm Delivery
                    </Button>
                  )}
                  {disp.status === 'Delivered' && (
                    <span className="text-[11px] text-[#10b981] font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Successfully Delivered
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Dispatch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#dce5f4] w-full max-w-lg p-5">
            <h3 className="text-base font-bold text-[#0f172a] mb-4">Create Outbound Dispatch Manifest</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Project Number</label>
                  <input
                    type="text"
                    required
                    value={formData.projectNumber}
                    onChange={(e) => setFormData({ ...formData, projectNumber: e.target.value, projectId: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Delivery Challan #</label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryChallanNumber}
                    onChange={(e) => setFormData({ ...formData, deliveryChallanNumber: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Carrier Name</label>
                  <input
                    type="text"
                    required
                    value={formData.carrierName}
                    onChange={(e) => setFormData({ ...formData, carrierName: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">LR / Consignment #</label>
                  <input
                    type="text"
                    required
                    value={formData.lrNumber}
                    onChange={(e) => setFormData({ ...formData, lrNumber: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Driver Name & Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748b] font-medium mb-1">Destination Address</label>
                <textarea
                  rows={2}
                  required
                  value={formData.destinationAddress}
                  onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                  className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f1f5f9]">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" icon={Truck}>
                  Save Manifest
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
