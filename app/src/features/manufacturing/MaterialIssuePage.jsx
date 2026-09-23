import React, { useState } from 'react';
import {
  Boxes,
  ArrowRight,
  Plus,
  RotateCcw,
  CheckCircle2,
  Warehouse,
  Search,
  Calendar,
  Building2,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { useManufacturingStore } from '../../stores/manufacturingStore';
import { getManufacturingStatusStyle } from '../../utils/manufacturingUtils';

export default function MaterialIssuePage() {
  const materialIssues = useManufacturingStore((s) => s.materialIssues);
  const createMaterialIssue = useManufacturingStore((s) => s.createMaterialIssue);
  const returnMaterialIssue = useManufacturingStore((s) => s.returnMaterialIssue);

  const [searchTerm, setSearchTerm] = useState('');
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [returnModalItem, setReturnModalItem] = useState(null);
  const [returnQty, setReturnQty] = useState('');

  // Form for new issue
  const [newIssue, setNewIssue] = useState({
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    batchNumber: 'BAT-2026-001',
    materialCode: 'MTR-SS-001',
    materialName: 'Structural Steel Box Section 100x100x6mm',
    quantityIssued: 10,
    uom: 'MTR',
    fromLocation: 'Main Warehouse Rack A-12',
    toLocation: 'Shopfloor Fabrication Bay 2',
    issuedBy: 'Warehouse Executive',
  });

  const filteredIssues = materialIssues.filter((i) => {
    const q = (searchTerm || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (i.issueNumber || '').toLowerCase().includes(q) ||
      (i.materialName || '').toLowerCase().includes(q) ||
      (i.projectNumber || '').toLowerCase().includes(q) ||
      (i.batchNumber || '').toLowerCase().includes(q)
    );
  });

  function handleCreateIssue(e) {
    e.preventDefault();
    createMaterialIssue(newIssue);
    setIssueModalOpen(false);
  }

  function handleReturn(e) {
    e.preventDefault();
    if (!returnModalItem) return;
    const q = parseFloat(returnQty);
    if (!isNaN(q) && q > 0) {
      returnMaterialIssue(returnModalItem.id, q);
    }
    setReturnModalItem(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Material Issue & Floor Requisitions"
        subtitle="Manage warehouse-to-shopfloor inventory transfer notes, line-side stock allocation, and unused returns."
        actions={
          <Button
            icon={Plus}
            onClick={() => setIssueModalOpen(true)}
          >
            Create Issue Slip
          </Button>
        }
      />

      {/* Search & Filter */}
      <div className="bg-white border border-[#dce5f4] p-4 rounded-xl shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search issue slip #, batch, or material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#1f6bff] text-[#0f172a]"
          />
        </div>
        <div className="text-xs text-[#64748b]">
          Total Slips: <span className="font-bold text-[#0f172a]">{materialIssues.length}</span>
        </div>
      </div>

      {/* Issue Table */}
      <div className="bg-white border border-[#dce5f4] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#dce5f4] font-semibold">
              <tr>
                <th className="py-3 px-4">Issue Slip #</th>
                <th className="py-3 px-4">Project & Batch</th>
                <th className="py-3 px-4">Material Description</th>
                <th className="py-3 px-4 text-center">Issued Qty</th>
                <th className="py-3 px-4 text-center">Returned Qty</th>
                <th className="py-3 px-4 text-center font-bold text-[#0f172a]">Net Consumed</th>
                <th className="py-3 px-4">Route (From &rarr; To)</th>
                <th className="py-3 px-4">Issued By & Date</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredIssues.map((issue) => {
                const issuedQty = issue.quantityIssued ?? issue.issueQty ?? 0;
                const net = issuedQty - (issue.quantityReturned || 0);
                return (
                  <tr key={issue.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0f172a]">
                      {issue.issueNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#0f172a]">{issue.projectNumber}</div>
                      <div className="text-[11px] text-[#64748b] font-mono">{issue.batchNumber}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#0f172a]">{issue.materialName}</div>
                      <div className="text-[11px] text-[#64748b] font-mono">{issue.materialCode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#0f172a]">
                      {issuedQty} {issue.uom}
                    </td>
                    <td className="py-3.5 px-4 text-center text-[#eab308] font-medium">
                      {issue.quantityReturned || 0} {issue.uom}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#10b981] bg-[#f0fdf4]/50">
                      {net} {issue.uom}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-[#64748b]">
                      <div>From: {issue.fromLocation || issue.warehouse || 'Central Stores'}</div>
                      <div className="text-[#1f6bff] font-medium">To: {issue.toLocation || issue.productionStage || 'Shopfloor'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-[#64748b]">
                      <div className="font-medium text-[#0f172a]">{issue.issuedBy}</div>
                      <div>{issue.issueDate || issue.date || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        size="xs"
                        variant="outline"
                        icon={RotateCcw}
                        onClick={() => {
                          setReturnModalItem(issue);
                          setReturnQty('1');
                        }}
                      >
                        Return Unused
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Issue Slip Modal */}
      {issueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#dce5f4] w-full max-w-lg p-5">
            <h3 className="text-base font-bold text-[#0f172a] mb-4">Create Material Issue Slip</h3>
            <form onSubmit={handleCreateIssue} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Project Number</label>
                  <input
                    type="text"
                    required
                    value={newIssue.projectNumber}
                    onChange={(e) => setNewIssue({ ...newIssue, projectNumber: e.target.value, projectId: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={newIssue.batchNumber}
                    onChange={(e) => setNewIssue({ ...newIssue, batchNumber: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748b] font-medium mb-1">Material Name</label>
                <input
                  type="text"
                  required
                  value={newIssue.materialName}
                  onChange={(e) => setNewIssue({ ...newIssue, materialName: e.target.value })}
                  className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Item Code</label>
                  <input
                    type="text"
                    required
                    value={newIssue.materialCode}
                    onChange={(e) => setNewIssue({ ...newIssue, materialCode: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={newIssue.quantityIssued}
                    onChange={(e) => setNewIssue({ ...newIssue, quantityIssued: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">UOM</label>
                  <input
                    type="text"
                    required
                    value={newIssue.uom}
                    onChange={(e) => setNewIssue({ ...newIssue, uom: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">From Location</label>
                  <input
                    type="text"
                    required
                    value={newIssue.fromLocation}
                    onChange={(e) => setNewIssue({ ...newIssue, fromLocation: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">To Location / Bay</label>
                  <input
                    type="text"
                    required
                    value={newIssue.toLocation}
                    onChange={(e) => setNewIssue({ ...newIssue, toLocation: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f1f5f9]">
                <Button type="button" variant="outline" onClick={() => setIssueModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" icon={Boxes}>
                  Issue Material
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Unused Modal */}
      {returnModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#dce5f4] w-full max-w-sm p-5">
            <h3 className="text-base font-bold text-[#0f172a] mb-2">Return Material to Warehouse</h3>
            <p className="text-xs text-[#64748b] mb-4">
              Return surplus unconsumed items from shopfloor back into warehouse inventory.
            </p>

            <form onSubmit={handleReturn} className="space-y-3 text-xs">
              <div className="bg-[#f8fafc] p-3 rounded-lg text-xs space-y-1">
                <div>Item: <strong>{returnModalItem.materialName}</strong></div>
                <div>Issued: <strong>{returnModalItem.quantityIssued} {returnModalItem.uom}</strong></div>
              </div>

              <div>
                <label className="block text-[#64748b] font-medium mb-1">Quantity to Return ({returnModalItem.uom})</label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  max={returnModalItem.quantityIssued - (returnModalItem.quantityReturned || 0)}
                  value={returnQty}
                  onChange={(e) => setReturnQty(e.target.value)}
                  className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f1f5f9]">
                <Button type="button" variant="outline" onClick={() => setReturnModalItem(null)}>
                  Cancel
                </Button>
                <Button type="submit" icon={RotateCcw}>
                  Process Return
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
