import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  ArrowLeftRight,
  Copy,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Edit2,
  Eye,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { useManufacturingStore } from '../../stores/manufacturingStore';
import { formatCurrency } from '../../utils/currencyUtils';
import { computeBomCost, getManufacturingStatusStyle } from '../../utils/manufacturingUtils';
import { BomCompareModal } from './components/BomCompareModal';

export default function BomVersionsPage() {
  const bomVersions = useManufacturingStore((s) => s.bomVersions);
  const activateBomVersion = useManufacturingStore((s) => s.activateBomVersion);
  const duplicateBomVersion = useManufacturingStore((s) => s.duplicateBomVersion);
  const createBomVersion = useManufacturingStore((s) => s.createBomVersion);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedBom, setSelectedBom] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New BOM modal form state
  const [newBomData, setNewBomData] = useState({
    productId: 'PRJ-2026-001',
    productCode: 'PRD-CNC-2026',
    productName: 'Custom 5-Axis CNC Milling Center',
    versionNumber: 'v1.0',
    revisionReason: 'Initial engineering release',
    components: [
      {
        id: 'c-new-1',
        componentCode: 'MTR-SS-001',
        materialName: 'Structural Steel Box Section 100x100x6mm',
        quantity: 12,
        uom: 'MTR',
        scrapPct: 5,
        estimatedRate: 1450,
      },
    ],
  });

  const filteredBoms = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    const sf = (statusFilter || '').toLowerCase().trim();
    return bomVersions.filter((b) => {
      const matchSearch =
        !q ||
        (b.bomNumber || '').toLowerCase().includes(q) ||
        (b.productName || '').toLowerCase().includes(q) ||
        (b.versionNumber || b.version || '').toLowerCase().includes(q);
      const matchStatus = sf === 'all' || (b.status || '').toLowerCase() === sf;
      return matchSearch && matchStatus;
    });
  }, [bomVersions, searchTerm, statusFilter]);

  function handleCreateBom(e) {
    e.preventDefault();
    createBomVersion({
      productId: newBomData.productId,
      productCode: newBomData.productCode,
      productName: newBomData.productName,
      versionNumber: newBomData.versionNumber,
      revisionReason: newBomData.revisionReason,
      components: newBomData.components,
    });
    setCreateModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bill of Materials (BOM) Version Control"
        subtitle="Manage product engineering structures, revision histories, multi-level BOMs and cost delta comparisons."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={ArrowLeftRight}
              onClick={() => setCompareOpen(true)}
            >
              Compare Versions
            </Button>
            <Button
              icon={Plus}
              onClick={() => setCreateModalOpen(true)}
            >
              New BOM Version
            </Button>
          </div>
        }
      />

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-[#dce5f4] p-4 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search BOM #, product, or version..."
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
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Superseded">Superseded</option>
          </select>
        </div>
      </div>

      {/* BOM Table */}
      <div className="bg-white border border-[#dce5f4] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#dce5f4] font-semibold">
              <tr>
                <th className="py-3 px-4">BOM Number</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Effective Date</th>
                <th className="py-3 px-4 text-center">Components</th>
                <th className="py-3 px-4 text-right">Estimated BOM Cost</th>
                <th className="py-3 px-4">Revision Reason</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredBoms.map((bom) => {
                const statusStyle = getManufacturingStatusStyle(bom.status);
                const totalCost = computeBomCost(bom.components || []);
                return (
                  <tr key={bom.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0f172a]">
                      {bom.bomNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#0f172a]">{bom.productName}</div>
                      <div className="text-[11px] text-[#64748b] font-mono">{bom.productCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-[#eff6ff] text-[#1d4ed8]">
                        {bom.versionNumber || bom.version || 'v1.0'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                        style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.color ? `${statusStyle.color}40` : '#e2e8f0' }}
                      >
                        {statusStyle.label || bom.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#64748b]">{bom.effectiveDate}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#0f172a]">
                      {bom.components?.length || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#0f172a]">
                      {formatCurrency(totalCost)}
                    </td>
                    <td className="py-3.5 px-4 text-[#64748b] max-w-xs truncate" title={bom.revisionReason}>
                      {bom.revisionReason || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="xs"
                          variant="ghost"
                          title="View Details"
                          icon={Eye}
                          onClick={() => setSelectedBom(bom)}
                        />
                        {bom.status !== 'Active' && (
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-[#10b981]"
                            title="Activate this version"
                            icon={CheckCircle2}
                            onClick={() => activateBomVersion(bom.id)}
                          />
                        )}
                        <Button
                          size="xs"
                          variant="ghost"
                          title="Clone / Create New Version"
                          icon={Copy}
                          onClick={() => duplicateBomVersion(bom.id, `Revision of ${bom.versionNumber}`)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected BOM Quick View Modal */}
      {selectedBom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#dce5f4] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#dce5f4] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0f172a]">
                  BOM {selectedBom.bomNumber} - {selectedBom.versionNumber}
                </h3>
                <p className="text-xs text-[#64748b]">
                  {selectedBom.productName} ({selectedBom.productCode})
                </p>
              </div>
              <Button size="xs" variant="ghost" onClick={() => setSelectedBom(null)}>
                Close
              </Button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-3 bg-[#f8fafc] p-3 rounded-lg text-xs">
                <div>
                  <span className="text-[#64748b]">Status:</span>{' '}
                  <span className="font-semibold text-[#0f172a]">{selectedBom.status}</span>
                </div>
                <div>
                  <span className="text-[#64748b]">Total Items:</span>{' '}
                  <span className="font-semibold text-[#0f172a]">{selectedBom.components?.length || 0}</span>
                </div>
                <div>
                  <span className="text-[#64748b]">Estimated Cost:</span>{' '}
                  <span className="font-bold text-[#1f6bff]">
                    {formatCurrency(computeBomCost(selectedBom.components || []))}
                  </span>
                </div>
              </div>

              <div className="border border-[#dce5f4] rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#dce5f4] font-semibold">
                    <tr>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Material Name</th>
                      <th className="p-2.5 text-center">Qty / Unit</th>
                      <th className="p-2.5 text-center">Scrap %</th>
                      <th className="p-2.5 text-right">Est. Rate</th>
                      <th className="p-2.5 text-right">Total Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {(selectedBom.components || []).map((comp) => {
                      const totalCompCost = (comp.quantity || 1) * (comp.estimatedRate || 0);
                      return (
                        <tr key={comp.id}>
                          <td className="p-2.5 font-mono font-medium text-[#0f172a]">{comp.componentCode}</td>
                          <td className="p-2.5 font-medium text-[#334155]">{comp.materialName}</td>
                          <td className="p-2.5 text-center font-bold">{comp.quantity} {comp.uom}</td>
                          <td className="p-2.5 text-center text-[#eab308] font-medium">{comp.scrapPct || 0}%</td>
                          <td className="p-2.5 text-right text-[#64748b]">{formatCurrency(comp.estimatedRate || 0)}</td>
                          <td className="p-2.5 text-right font-bold text-[#0f172a]">{formatCurrency(totalCompCost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 border-t border-[#dce5f4] bg-[#f8fafc] flex justify-end">
              <Button size="sm" onClick={() => setSelectedBom(null)}>Done</Button>
            </div>
          </div>
        </div>
      )}

      {/* New BOM Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#dce5f4] w-full max-w-lg p-5">
            <h3 className="text-base font-bold text-[#0f172a] mb-4">Create New BOM Version</h3>
            <form onSubmit={handleCreateBom} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#64748b] font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newBomData.productName}
                  onChange={(e) => setNewBomData({ ...newBomData, productName: e.target.value })}
                  className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Product Code</label>
                  <input
                    type="text"
                    required
                    value={newBomData.productCode}
                    onChange={(e) => setNewBomData({ ...newBomData, productCode: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Version Number</label>
                  <input
                    type="text"
                    required
                    value={newBomData.versionNumber}
                    onChange={(e) => setNewBomData({ ...newBomData, versionNumber: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                    placeholder="e.g. v1.0, v2.1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748b] font-medium mb-1">Revision Reason / Scope</label>
                <textarea
                  rows={2}
                  value={newBomData.revisionReason}
                  onChange={(e) => setNewBomData({ ...newBomData, revisionReason: e.target.value })}
                  className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f1f5f9]">
                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Version</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Side-by-side BOM Compare Modal */}
      <BomCompareModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        availableVersions={bomVersions}
      />
    </div>
  );
}
