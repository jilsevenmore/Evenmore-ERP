import React, { useState } from 'react';
import {
  Package,
  Plus,
  CheckCircle2,
  Clock,
  FileText,
  Weight,
  Maximize2,
  Calendar,
  User,
} from 'lucide-react';
import { useManufacturingStore } from '../../../stores/manufacturingStore';
import { getManufacturingStatusStyle } from '../../../utils/manufacturingUtils';
import { Button } from '../../../components/ui/Button';

export function ProjectPackagingTab({ project }) {
  const packagingRecords = useManufacturingStore((s) => s.packagingRecords);
  const createPackagingRecord = useManufacturingStore((s) => s.createPackagingRecord);
  const updatePackagingStatus = useManufacturingStore((s) => s.updatePackagingStatus);

  const projectPackages = packagingRecords.filter(
    (p) => p.projectId === project.id || p.projectNumber === project.id
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    packageType: 'Heavy Wooden Crate',
    quantity: project.productDetails?.quantity || 4,
    packedBy: 'Kishore Mali',
    length: 2200,
    width: 1400,
    height: 1900,
    weight: 380,
    remarks: 'Waterproof tarpaulin liner and desiccant silica gel packets placed inside crate.',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createPackagingRecord({
      projectId: project.id,
      projectNumber: project.id,
      packageType: form.packageType,
      quantity: Number(form.quantity),
      packedBy: form.packedBy,
      dimensions: {
        length: Number(form.length),
        width: Number(form.width),
        height: Number(form.height),
        unit: 'mm',
      },
      weight: { value: Number(form.weight), unit: 'kg' },
      remarks: form.remarks,
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Packaging Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package size={18} className="text-indigo-600" />
              Packaging & Protective Crate Manifest
            </h4>
            <p className="text-xs text-slate-500">
              Prepares final physical packaging, moisture barriers, and tare weights after QA sign-off.
            </p>
          </div>

          <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
            New Package Record
          </Button>
        </div>
      </div>

      {/* Package List Cards / Table */}
      {projectPackages.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
          <Package size={36} className="mx-auto text-slate-300" />
          <h5 className="text-sm font-bold text-slate-800">No Packaging Recorded</h5>
          <p className="text-xs text-slate-500">Record package containers and dimensions once fabrication and QA pass.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projectPackages.map((pkg) => {
            const statusStyle = getManufacturingStatusStyle(pkg.status);
            return (
              <div key={pkg.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{pkg.packageNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                      {pkg.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{pkg.packingDate}</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Container Type:</span>
                    <strong className="text-slate-800">{pkg.packageType}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Unit Quantity:</span>
                    <strong className="text-slate-800 font-mono">{pkg.quantity} Units</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Outer Dimensions:</span>
                    <strong className="text-slate-800 font-mono">
                      {pkg.dimensions?.length} x {pkg.dimensions?.width} x {pkg.dimensions?.height} {pkg.dimensions?.unit || 'mm'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gross Weight:</span>
                    <strong className="text-indigo-700 font-mono">
                      {pkg.weight?.value} {pkg.weight?.unit || 'kg'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Packing Lead:</span>
                    <span className="text-slate-800 font-medium">{pkg.packedBy}</span>
                  </div>
                </div>

                {pkg.remarks && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                    Note: {pkg.remarks}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">
                    Documents: {pkg.documents?.length || 1} attached
                  </span>

                  {pkg.status !== 'Completed' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={CheckCircle2}
                      onClick={() => updatePackagingStatus(pkg.id, 'Completed')}
                    >
                      Mark Packed
                    </Button>
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Packing Certified
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Package Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Package className="text-indigo-600" size={16} />
              Create Packaging Manifest
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Package / Container Type</label>
                <select
                  value={form.packageType}
                  onChange={(e) => setForm({ ...form, packageType: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                >
                  <option value="Heavy Wooden Crate">Heavy Wooden Crate</option>
                  <option value="Steel Skid with Heavy Shrink Wrap">Steel Skid with Heavy Shrink Wrap</option>
                  <option value="Pallet Box / Corrugated Crate">Pallet Box / Corrugated Crate</option>
                  <option value="Reinforced Cardboard Carton">Reinforced Cardboard Carton</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Units Inside</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Gross Weight (kg)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Dimensions (L x W x H mm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="L"
                    value={form.length}
                    onChange={(e) => setForm({ ...form, length: e.target.value })}
                    className="border border-slate-300 rounded-lg p-2 font-mono"
                  />
                  <input
                    type="number"
                    placeholder="W"
                    value={form.width}
                    onChange={(e) => setForm({ ...form, width: e.target.value })}
                    className="border border-slate-300 rounded-lg p-2 font-mono"
                  />
                  <input
                    type="number"
                    placeholder="H"
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                    className="border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Supervisor / Lead</label>
                <input
                  required
                  value={form.packedBy}
                  onChange={(e) => setForm({ ...form, packedBy: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Packaging Notes</label>
                <textarea
                  rows={2}
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Package Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectPackagingTab;
