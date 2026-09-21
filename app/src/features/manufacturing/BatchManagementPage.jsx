import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Wrench,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { useManufacturingStore } from '../../stores/manufacturingStore';
import { formatCurrency } from '../../utils/currencyUtils';
import { getManufacturingStatusStyle } from '../../utils/manufacturingUtils';

export default function BatchManagementPage() {
  const navigate = useNavigate();
  const batches = useManufacturingStore((s) => s.batches);
  const createBatch = useManufacturingStore((s) => s.createBatch);
  const updateBatchStatus = useManufacturingStore((s) => s.updateBatchStatus);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [newBatch, setNewBatch] = useState({
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    productId: 'itm-mach-1',
    productName: 'Custom 5-Axis CNC Milling Center',
    bomVersionId: 'BOM-CNC-001-v2',
    bomVersionNumber: 'v2.0',
    plannedQty: 1,
    startDate: new Date().toISOString().split('T')[0],
    targetCompletionDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  });

  const filteredBatches = batches.filter((b) => {
    const q = (searchTerm || '').toLowerCase().trim();
    const sf = (statusFilter || '').toLowerCase().trim();
    const matchSearch =
      !q ||
      (b.batchNumber || '').toLowerCase().includes(q) ||
      (b.productName || '').toLowerCase().includes(q) ||
      (b.projectNumber || '').toLowerCase().includes(q);
    const matchStatus = sf === 'all' || (b.status || '').toLowerCase() === sf;
    return matchSearch && matchStatus;
  });

  function handleCreateBatch(e) {
    e.preventDefault();
    createBatch({
      ...newBatch,
      plannedQty: parseInt(newBatch.plannedQty, 10) || 1,
    });
    setCreateModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Batch & Work Order Tracking"
        subtitle="Manage shopfloor lot numbers, production batches, progress completions, and batch costing."
        actions={
          <Button
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Production Batch
          </Button>
        }
      />

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-[#dce5f4] p-4 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search batch #, product, or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#1f6bff] text-[#0f172a]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748b] font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-[#cbd5e1] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#1f6bff] text-[#0f172a] bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Production">In Production</option>
            <option value="Quality Inspection">Quality Inspection</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white border border-[#dce5f4] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#dce5f4] font-semibold">
              <tr>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Project & Product</th>
                <th className="py-3 px-4 text-center">BOM Version</th>
                <th className="py-3 px-4 text-center">Planned Qty</th>
                <th className="py-3 px-4 text-center">Completed</th>
                <th className="py-3 px-4 text-center">Scrap</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4 text-right font-bold text-[#0f172a]">Actual Batch Cost</th>
                <th className="py-3 px-4 text-center">Lifecycle Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredBatches.map((b) => {
                const statusStyle = getManufacturingStatusStyle(b.status);
                const actualCost = b.costSummary?.totalActualCost || 0;
                return (
                  <tr key={b.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0f172a]">
                      {b.batchNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#0f172a]">{b.productName}</div>
                      <div className="text-[11px] text-[#64748b]">{b.projectNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#eff6ff] text-[#1d4ed8]">
                        {b.bomVersionNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#0f172a]">
                      {b.plannedQty}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#10b981]">
                      {b.completedQty}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-[#ea580c]">
                      {b.scrapQty || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                        style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.color ? `${statusStyle.color}40` : '#e2e8f0' }}
                      >
                        {statusStyle.label || b.status || 'Planned'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-[#64748b]">
                      <div>Start: {b.startDate}</div>
                      <div>Due: {b.targetCompletionDate}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#0f172a]">
                      {formatCurrency(actualCost)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {b.status === 'Scheduled' && (
                        <Button
                          size="xs"
                          variant="outline"
                          icon={Wrench}
                          onClick={() => updateBatchStatus(b.id, 'In Production')}
                        >
                          Start Floor
                        </Button>
                      )}
                      {b.status === 'In Production' && (
                        <Button
                          size="xs"
                          variant="outline"
                          icon={ShieldCheck}
                          className="text-[#8b5cf6] border-[#8b5cf6]/30 hover:bg-[#fdf4ff]"
                          onClick={() => updateBatchStatus(b.id, 'Quality Inspection')}
                        >
                          Send to QC
                        </Button>
                      )}
                      {b.status === 'Quality Inspection' && (
                        <Button
                          size="xs"
                          variant="outline"
                          icon={CheckCircle2}
                          className="text-[#10b981] border-[#10b981]/30 hover:bg-[#f0fdf4]"
                          onClick={() => updateBatchStatus(b.id, 'Completed')}
                        >
                          Mark Passed
                        </Button>
                      )}
                      {b.status === 'Completed' && (
                        <span className="text-[11px] text-[#10b981] font-semibold">
                          Batch Ready
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Batch Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#dce5f4] w-full max-w-lg p-5">
            <h3 className="text-base font-bold text-[#0f172a] mb-4">Create New Production Batch</h3>
            <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Project Number</label>
                  <input
                    type="text"
                    required
                    value={newBatch.projectNumber}
                    onChange={(e) => setNewBatch({ ...newBatch, projectNumber: e.target.value, projectId: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={newBatch.productName}
                    onChange={(e) => setNewBatch({ ...newBatch, productName: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">BOM Version Reference</label>
                  <input
                    type="text"
                    required
                    value={newBatch.bomVersionNumber}
                    onChange={(e) => setNewBatch({ ...newBatch, bomVersionNumber: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Planned Target Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBatch.plannedQty}
                    onChange={(e) => setNewBatch({ ...newBatch, plannedQty: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Floor Start Date</label>
                  <input
                    type="date"
                    required
                    value={newBatch.startDate}
                    onChange={(e) => setNewBatch({ ...newBatch, startDate: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    required
                    value={newBatch.targetCompletionDate}
                    onChange={(e) => setNewBatch({ ...newBatch, targetCompletionDate: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f1f5f9]">
                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" icon={Boxes}>
                  Create Batch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
