import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  Weight,
  Maximize2,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { useManufacturingStore } from '../../stores/manufacturingStore';
import { getManufacturingStatusStyle } from '../../utils/manufacturingUtils';

export default function PackagingPage() {
  const packagingRecords = useManufacturingStore((s) => s.packagingRecords);
  const createPackagingRecord = useManufacturingStore((s) => s.createPackagingRecord);
  const updatePackagingStatus = useManufacturingStore((s) => s.updatePackagingStatus);

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    batchNumber: 'BAT-2026-001',
    packageType: 'Heavy Wooden Crate (ISPM-15 Heat Treated)',
    dimensions: '3200 x 2400 x 2200 mm',
    grossWeightKg: 4850,
    tareWeightKg: 350,
    supervisor: 'Packaging Engineer',
    checklistItems: [
      { item: 'VCI Anti-Corrosion Wrap & Desiccant Bags', verified: true },
      { item: 'Internal Polyethylene Shock Absorbers', verified: true },
      { item: 'Center of Gravity & Forklift Lift Points Marked', verified: true },
      { item: 'Tilt & Shock Impact Indicators Affixed', verified: true },
    ],
  });

  const filteredPackages = packagingRecords.filter((p) => {
    const q = (searchTerm || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (p.packageNumber || '').toLowerCase().includes(q) ||
      (p.projectNumber || '').toLowerCase().includes(q) ||
      (p.packageType || '').toLowerCase().includes(q)
    );
  });

  function handleSubmit(e) {
    e.preventDefault();
    createPackagingRecord(formData);
    setModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Protective Packaging & Crating Manifests"
        subtitle="Manage export-grade wooden crating, anti-corrosion VCI packing, weight certificates, and dispatch readiness."
        actions={
          <Button
            icon={Plus}
            onClick={() => setModalOpen(true)}
          >
            New Package Record
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Total Packages / Crates</span>
          <p className="text-2xl font-bold text-[#0f172a] mt-1">{packagingRecords.length}</p>
          <span className="text-[11px] text-[#64748b]">Registered crates</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Inspection Passed</span>
          <p className="text-2xl font-bold text-[#10b981] mt-1">
            {packagingRecords.filter((p) => p.status === 'Inspection Passed').length}
          </p>
          <span className="text-[11px] text-[#64748b]">Ready for shipping</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">In Crating / Packing</span>
          <p className="text-2xl font-bold text-[#eab308] mt-1">
            {packagingRecords.filter((p) => p.status !== 'Inspection Passed').length}
          </p>
          <span className="text-[11px] text-[#64748b]">Floor packaging active</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white border border-[#dce5f4] p-4 rounded-xl shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search package #, project, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#1f6bff] text-[#0f172a]"
          />
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPackages.map((pkg) => {
          const statusStyle = getManufacturingStatusStyle(pkg.status);
          const netWeight = (pkg.grossWeightKg || 0) - (pkg.tareWeightKg || 0);
          return (
            <div
              key={pkg.id}
              className="bg-white border border-[#dce5f4] rounded-xl p-5 shadow-2xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#0f172a]">{pkg.packageNumber}</span>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                      style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.color ? `${statusStyle.color}40` : '#e2e8f0' }}
                    >
                      {statusStyle.label || pkg.status || 'Packed'}
                    </span>
                  </div>
                  <div className="text-xs text-[#64748b] mt-0.5">
                    Project: <span className="font-semibold text-[#0f172a]">{pkg.projectNumber}</span> • Batch: {pkg.batchNumber}
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-[#64748b] block text-[11px]">Packed On</span>
                  <span className="font-semibold text-[#0f172a]">{pkg.packedDate || pkg.packingDate || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-lg">
                <div>
                  <span className="text-[#64748b] block text-[11px]">Package Container</span>
                  <span className="font-medium text-[#0f172a]">{pkg.packageType}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[11px]">Dimensions (LxWxH)</span>
                  <span className="font-medium text-[#0f172a]">{pkg.dimensions}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[11px]">Gross / Tare Weight</span>
                  <span className="font-bold text-[#0f172a]">{pkg.grossWeightKg} kg / {pkg.tareWeightKg} kg</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[11px]">Net Payload</span>
                  <span className="font-bold text-[#10b981]">{netWeight} kg</span>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <span className="text-xs font-semibold text-[#0f172a] block mb-1.5">Verification Checklist</span>
                <div className="space-y-1">
                  {(pkg.checklistItems || []).map((chk, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#475569]">
                      <CheckCircle2 size={13} className={chk.verified ? 'text-[#10b981]' : 'text-[#cbd5e1]'} />
                      <span className={chk.verified ? 'text-[#0f172a]' : 'text-[#94a3b8]'}>{chk.item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-[#64748b]">
                  <User size={12} />
                  <span>Supervisor: <strong>{pkg.supervisor}</strong></span>
                </div>

                <div className="flex gap-2">
                  {pkg.status === 'Packed' && (
                    <Button
                      size="xs"
                      variant="outline"
                      className="text-[#10b981] border-[#10b981]/30 hover:bg-[#f0fdf4]"
                      icon={ShieldCheck}
                      onClick={() => updatePackagingStatus(pkg.id, 'Inspection Passed')}
                    >
                      Pass QC Inspection
                    </Button>
                  )}
                  {pkg.status === 'Inspection Passed' && (
                    <span className="text-[11px] text-[#10b981] font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Ready for Dock Dispatch
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Package Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#dce5f4] w-full max-w-lg p-5">
            <h3 className="text-base font-bold text-[#0f172a] mb-4">Create Packaging Record</h3>
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
                  <label className="block text-[#64748b] font-medium mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748b] font-medium mb-1">Packaging Container Type</label>
                <input
                  type="text"
                  required
                  value={formData.packageType}
                  onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                  className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                />
              </div>

              <div>
                <label className="block text-[#64748b] font-medium mb-1">External Dimensions (LxWxH mm)</label>
                <input
                  type="text"
                  required
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Gross Weight (kg)</label>
                  <input
                    type="number"
                    required
                    value={formData.grossWeightKg}
                    onChange={(e) => setFormData({ ...formData, grossWeightKg: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Tare Weight (kg)</label>
                  <input
                    type="number"
                    required
                    value={formData.tareWeightKg}
                    onChange={(e) => setFormData({ ...formData, tareWeightKg: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748b] font-medium mb-1">Packing Supervisor</label>
                <input
                  type="text"
                  required
                  value={formData.supervisor}
                  onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                  className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f1f5f9]">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" icon={Package}>
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
