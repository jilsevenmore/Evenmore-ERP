import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  ArrowLeftRight,
  Copy,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
  Edit2,
  ExternalLink,
} from 'lucide-react';
import { useManufacturingStore } from '../../../stores/manufacturingStore';
import { formatCurrency } from '../../../utils/currencyUtils';
import { computeBomCost, getManufacturingStatusStyle } from '../../../utils/manufacturingUtils';
import { Button } from '../../../components/ui/Button';

export function ProjectBomTab({ project, onOpenCompare, onOpenCreateVersion }) {
  const bomVersions = useManufacturingStore((s) => s.bomVersions);
  const activateBomVersion = useManufacturingStore((s) => s.activateBomVersion);
  const duplicateBomVersion = useManufacturingStore((s) => s.duplicateBomVersion);
  const removeComponentFromBom = useManufacturingStore((s) => s.removeComponentFromBom);
  const addComponentToBom = useManufacturingStore((s) => s.addComponentToBom);

  // Find BOMs for this project's product
  const relevantBoms = useMemo(() => {
    return bomVersions.filter(
      (b) =>
        b.productId === project.id ||
        b.productName === project.productDetails?.productName ||
        b.productId === 'itm-mach-1' // fallback seed
    );
  }, [bomVersions, project]);

  const activeBom = relevantBoms.find((b) => b.status === 'Active') || relevantBoms[0];
  const [selectedBomId, setSelectedBomId] = useState(activeBom?.id || relevantBoms[0]?.id);
  const [newCompModal, setNewCompModal] = useState(false);
  const [compForm, setCompForm] = useState({
    componentCode: '',
    materialName: '',
    description: '',
    quantity: 1,
    uom: 'NOS',
    scrapPct: 0,
    estimatedRate: 100,
    supplier: '',
  });

  const currentBom = relevantBoms.find((b) => b.id === selectedBomId) || activeBom || relevantBoms[0];
  const totalCost = useMemo(() => computeBomCost(currentBom?.components || []), [currentBom]);

  if (!currentBom) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
        <Layers size={36} className="mx-auto text-slate-300" />
        <h4 className="text-base font-bold text-slate-800">No BOM Linked Yet</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          No Bill of Materials version has been created for {project.productDetails?.productName}. Create the initial engineering BOM to begin material planning.
        </p>
        <Button icon={Plus} onClick={() => onOpenCreateVersion && onOpenCreateVersion(project)}>
          Create Initial BOM
        </Button>
      </div>
    );
  }

  const statusStyle = getManufacturingStatusStyle(currentBom.status);

  const handleAddComponentSubmit = (e) => {
    e.preventDefault();
    addComponentToBom(currentBom.id, compForm);
    setNewCompModal(false);
    setCompForm({
      componentCode: '',
      materialName: '',
      description: '',
      quantity: 1,
      uom: 'NOS',
      scrapPct: 0,
      estimatedRate: 100,
      supplier: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* BOM Version Selector & Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-slate-900 font-mono">
                {currentBom.bomNumber}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                {currentBom.version} • {currentBom.status}
              </span>
              <span className="text-xs text-slate-400">Effective: {currentBom.effectiveDate}</span>
            </div>
            <p className="text-xs text-slate-600">
              <strong className="text-slate-800">Revision Reason:</strong> {currentBom.revisionReason || 'Initial baseline specification.'}
            </p>
            <p className="text-[11px] text-slate-400">
              Author: {currentBom.createdBy} • Created: {currentBom.createdDate}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Version Switcher */}
            {relevantBoms.length > 1 && (
              <select
                value={selectedBomId}
                onChange={(e) => setSelectedBomId(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800"
              >
                {relevantBoms.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.version} ({b.status})
                  </option>
                ))}
              </select>
            )}

            {relevantBoms.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                icon={ArrowLeftRight}
                onClick={() => onOpenCompare && onOpenCompare(relevantBoms)}
              >
                Compare Versions
              </Button>
            )}

            {currentBom.status !== 'Active' && (
              <Button
                size="sm"
                icon={CheckCircle}
                onClick={() => activateBomVersion(currentBom.id)}
              >
                Activate Version
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              icon={Copy}
              onClick={() => {
                const dup = duplicateBomVersion(currentBom.id);
                if (dup) setSelectedBomId(dup.id);
              }}
            >
              Duplicate
            </Button>
          </div>
        </div>
      </div>

      {/* Component Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              BOM Component Assembly ({currentBom.components?.length || 0} Materials)
            </h4>
            <span className="text-[11px] text-slate-400">
              Total Estimated Material Cost per Unit: <strong className="text-slate-900 font-mono">{formatCurrency(totalCost)}</strong>
            </span>
          </div>

          <Button size="sm" icon={Plus} onClick={() => setNewCompModal(true)}>
            Add Component
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Code / Material</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-center">Qty / Unit</th>
                <th className="py-2.5 px-3 text-center">Scrap %</th>
                <th className="py-2.5 px-3 text-center">Req. Qty</th>
                <th className="py-2.5 px-3 text-right">Est. Rate</th>
                <th className="py-2.5 px-3 text-right">Est. Value</th>
                <th className="py-2.5 px-3 text-center">Live Stock</th>
                <th className="py-2.5 px-3">Supplier</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(currentBom.components || []).map((comp) => {
                const isShortage = Number(comp.currentStock || 0) < Number(comp.requiredQty || comp.quantity || 1);
                return (
                  <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      <span>{comp.materialName}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">{comp.componentCode}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-500 max-w-[200px] truncate" title={comp.description}>
                      {comp.description || '—'}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">
                      {comp.quantity} {comp.uom}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600">
                      {comp.scrapPct > 0 ? `${comp.scrapPct}%` : '0%'}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-indigo-700">
                      {comp.requiredQty || comp.quantity} {comp.uom}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                      {formatCurrency(comp.estimatedRate)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(comp.estimatedValue || (comp.requiredQty * comp.estimatedRate))}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isShortage ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {comp.currentStock} {comp.uom}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px]">
                      {comp.supplier || '—'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => removeComponentFromBom(currentBom.id, comp.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                        title="Remove Component"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Component Modal */}
      {newCompModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-800">Add Material to {currentBom.bomNumber}</h3>
            <form onSubmit={handleAddComponentSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Material Code *</label>
                  <input
                    required
                    value={compForm.componentCode}
                    onChange={(e) => setCompForm({ ...compForm, componentCode: e.target.value })}
                    placeholder="e.g. RAW-MS-04"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Material Name *</label>
                  <input
                    required
                    value={compForm.materialName}
                    onChange={(e) => setCompForm({ ...compForm, materialName: e.target.value })}
                    placeholder="e.g. Mild Steel Sheet 3mm"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Description / Spec</label>
                <input
                  value={compForm.description}
                  onChange={(e) => setCompForm({ ...compForm, description: e.target.value })}
                  placeholder="Material specifications or grade"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={compForm.quantity}
                    onChange={(e) => setCompForm({ ...compForm, quantity: parseFloat(e.target.value) || 1 })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">UOM</label>
                  <select
                    value={compForm.uom}
                    onChange={(e) => setCompForm({ ...compForm, uom: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    <option value="KG">KG</option>
                    <option value="MTR">MTR</option>
                    <option value="NOS">NOS</option>
                    <option value="LTR">LTR</option>
                    <option value="SQ.MTR">SQ.MTR</option>
                    <option value="SETS">SETS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Scrap %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={compForm.scrapPct}
                    onChange={(e) => setCompForm({ ...compForm, scrapPct: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Est. Rate (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={compForm.estimatedRate}
                    onChange={(e) => setCompForm({ ...compForm, estimatedRate: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Preferred Supplier</label>
                  <input
                    value={compForm.supplier}
                    onChange={(e) => setCompForm({ ...compForm, supplier: e.target.value })}
                    placeholder="e.g. Shakti Steel Traders"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={() => setNewCompModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save to BOM
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectBomTab;
