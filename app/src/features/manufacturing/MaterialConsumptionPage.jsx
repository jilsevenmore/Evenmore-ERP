import React, { useState } from 'react';
import {
  Flame,
  Search,
  Plus,
  AlertTriangle,
  TrendingUp,
  Boxes,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { useManufacturingStore } from '../../stores/manufacturingStore';
import { formatCurrency } from '../../utils/currencyUtils';

export default function MaterialConsumptionPage() {
  const materialConsumptions = useManufacturingStore((s) => s.materialConsumptions);
  const recordMaterialConsumption = useManufacturingStore((s) => s.recordMaterialConsumption);

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    batchNumber: 'BAT-2026-001',
    materialCode: 'MTR-SS-001',
    materialName: 'Structural Steel Box Section 100x100x6mm',
    bomPlannedQty: 24,
    actualConsumedQty: 25,
    scrapQty: 1.5,
    uom: 'MTR',
    unitCost: 1450,
    varianceReason: 'Corner miter cuts and offcut scrap',
    recordedBy: 'Shift Supervisor',
  });

  const filteredConsumptions = materialConsumptions.filter((c) => {
    const q = (searchTerm || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (c.materialName || '').toLowerCase().includes(q) ||
      (c.materialCode || '').toLowerCase().includes(q) ||
      (c.projectNumber || '').toLowerCase().includes(q) ||
      (c.batchNumber || '').toLowerCase().includes(q)
    );
  });

  function handleSubmit(e) {
    e.preventDefault();
    recordMaterialConsumption(form);
    setModalOpen(false);
  }

  // Aggregate metrics
  const totalScrapCost = materialConsumptions.reduce((sum, c) => sum + ((c.scrapQty || 0) * (c.unitCost || 0)), 0);
  const totalVarianceCost = materialConsumptions.reduce((sum, c) => sum + (c.varianceCost || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Material Consumption & Scrap Variance"
        subtitle="Track actual vs planned material usage, scrap rates, offcuts, and cost variance across shopfloor work orders."
        actions={
          <Button
            icon={Plus}
            onClick={() => setModalOpen(true)}
          >
            Log Consumption / Scrap
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Total Consumption Logs</span>
          <p className="text-2xl font-bold text-[#0f172a] mt-1">{materialConsumptions.length}</p>
          <span className="text-[11px] text-[#64748b]">Line-side entries</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Total Scrap Incurred</span>
          <p className="text-2xl font-bold text-[#ea580c] mt-1">{formatCurrency(totalScrapCost)}</p>
          <span className="text-[11px] text-[#64748b]">Material offcuts & machining loss</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Net Usage Variance Cost</span>
          <p className={`text-2xl font-bold mt-1 ${totalVarianceCost > 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
            {totalVarianceCost > 0 ? '+' : ''}{formatCurrency(totalVarianceCost)}
          </p>
          <span className="text-[11px] text-[#64748b]">Compared to baseline BOM</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white border border-[#dce5f4] p-4 rounded-xl shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search material, batch, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#1f6bff] text-[#0f172a]"
          />
        </div>
      </div>

      {/* Consumption Table */}
      <div className="bg-white border border-[#dce5f4] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#dce5f4] font-semibold">
              <tr>
                <th className="py-3 px-4">Item & Batch</th>
                <th className="py-3 px-4 text-center">BOM Planned</th>
                <th className="py-3 px-4 text-center">Actual Used</th>
                <th className="py-3 px-4 text-center">Scrap / Wastage</th>
                <th className="py-3 px-4 text-center font-bold text-[#0f172a]">Total Consumed</th>
                <th className="py-3 px-4 text-center">Scrap %</th>
                <th className="py-3 px-4 text-center">Variance %</th>
                <th className="py-3 px-4 text-right">Variance Cost</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredConsumptions.map((item) => {
                const isOver = item.variancePct > 0;
                return (
                  <tr key={item.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#0f172a]">{item.materialName}</div>
                      <div className="text-[11px] text-[#64748b] font-mono">
                        {item.materialCode} • {item.batchNumber} ({item.projectNumber})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center text-[#64748b]">
                      {item.bomPlannedQty ?? item.bomQty ?? 0} {item.uom}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-[#0f172a]">
                      {item.actualConsumedQty ?? 0} {item.uom}
                    </td>
                    <td className="py-3.5 px-4 text-center text-[#ea580c] font-medium">
                      {item.scrapQty ?? item.scrap ?? 0} {item.uom}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#0f172a] bg-[#eff6ff]/30">
                      {item.totalConsumed ?? ((item.actualConsumedQty || 0) + (item.scrapQty ?? item.scrap ?? 0))} {item.uom}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-[#ea580c]">
                      {item.scrapPct ?? 0}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                        isOver ? 'bg-[#fef2f2] text-[#ef4444]' : 'bg-[#f0fdf4] text-[#16a34a]'
                      }`}>
                        {isOver ? `+${item.variancePct}%` : `${item.variancePct}%`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      <span className={isOver ? 'text-[#ef4444]' : 'text-[#16a34a]'}>
                        {isOver ? '+' : ''}{formatCurrency(item.varianceCost || 0)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#64748b] max-w-xs truncate" title={item.varianceReason || item.remarks}>
                      {item.varianceReason || item.remarks || 'Normal production'}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-[#64748b]">
                      <div className="font-medium text-[#0f172a]">{item.recordedBy || item.operator || 'Supervisor'}</div>
                      <div>{item.recordedDate || item.date || '—'}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Consumption Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#dce5f4] w-full max-w-lg p-5">
            <h3 className="text-base font-bold text-[#0f172a] mb-4">Record Material Consumption & Scrap</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Project Number</label>
                  <input
                    type="text"
                    required
                    value={form.projectNumber}
                    onChange={(e) => setForm({ ...form, projectNumber: e.target.value, projectId: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={form.batchNumber}
                    onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748b] font-medium mb-1">Material Name</label>
                <input
                  type="text"
                  required
                  value={form.materialName}
                  onChange={(e) => setForm({ ...form, materialName: e.target.value })}
                  className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Item Code</label>
                  <input
                    type="text"
                    required
                    value={form.materialCode}
                    onChange={(e) => setForm({ ...form, materialCode: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">UOM</label>
                  <input
                    type="text"
                    required
                    value={form.uom}
                    onChange={(e) => setForm({ ...form, uom: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.unitCost}
                    onChange={(e) => setForm({ ...form, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">BOM Planned Qty</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={form.bomPlannedQty}
                    onChange={(e) => setForm({ ...form, bomPlannedQty: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Actual Consumed Qty</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={form.actualConsumedQty}
                    onChange={(e) => setForm({ ...form, actualConsumedQty: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Scrap / Wastage Qty</label>
                  <input
                    type="number"
                    step="any"
                    value={form.scrapQty}
                    onChange={(e) => setForm({ ...form, scrapQty: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748b] font-medium mb-1">Variance / Scrap Reason</label>
                <textarea
                  rows={2}
                  value={form.varianceReason}
                  onChange={(e) => setForm({ ...form, varianceReason: e.target.value })}
                  className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f1f5f9]">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" icon={Flame}>
                  Record Entry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
