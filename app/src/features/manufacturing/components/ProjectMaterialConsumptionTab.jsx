import React, { useState } from 'react';
import {
  Boxes,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Plus,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Warehouse,
  Flame,
} from 'lucide-react';
import { useManufacturingStore } from '../../../stores/manufacturingStore';
import { formatCurrency } from '../../../utils/currencyUtils';
import { getManufacturingStatusStyle } from '../../../utils/manufacturingUtils';
import { Button } from '../../../components/ui/Button';

export function ProjectMaterialConsumptionTab({ project }) {
  const materialIssues = useManufacturingStore((s) => s.materialIssues);
  const materialConsumptions = useManufacturingStore((s) => s.materialConsumptions);
  const createMaterialIssue = useManufacturingStore((s) => s.createMaterialIssue);
  const returnMaterialIssue = useManufacturingStore((s) => s.returnMaterialIssue);
  const recordMaterialConsumption = useManufacturingStore((s) => s.recordMaterialConsumption);

  const projectIssues = materialIssues.filter((i) => i.projectId === project.id || i.projectNumber === project.id);
  const projectConsumptions = materialConsumptions.filter((c) => c.projectId === project.id || c.projectNumber === project.id);

  const [activeSubView, setActiveSubView] = useState('consumption'); // 'consumption' | 'issue'
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [consModalOpen, setConsModalOpen] = useState(false);

  // Forms
  const [issueForm, setIssueForm] = useState({
    materialCode: 'RAW-CRCA-02',
    materialName: '2mm CRCA Steel Sheet',
    plannedQty: 100,
    availableQty: 450,
    issueQty: 100,
    uom: 'KG',
    productionStage: 'Production & Fabrication',
    batchNumber: 'BATCH-2026-001',
    remarks: '',
  });

  const [consForm, setConsForm] = useState({
    materialCode: 'RAW-CRCA-02',
    materialName: '2mm CRCA Steel Sheet',
    bomQty: 88,
    issuedQty: 100,
    actualConsumedQty: 92,
    scrap: 4,
    uom: 'KG',
    stageName: 'Production & Fabrication',
    operator: 'Ramesh Verma',
    remarks: '',
  });

  const handleIssueSubmit = (e) => {
    e.preventDefault();
    createMaterialIssue({
      projectId: project.id,
      projectNumber: project.id,
      ...issueForm,
    });
    setIssueModalOpen(false);
  };

  const handleConsSubmit = (e) => {
    e.preventDefault();
    if (consForm.actualConsumedQty < 0) return;
    recordMaterialConsumption({
      projectId: project.id,
      projectNumber: project.id,
      ...consForm,
    });
    setConsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Sub-tab Pill Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubView('consumption')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeSubView === 'consumption'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Material Consumption (Actuals & Scrap) ({projectConsumptions.length})
          </button>
          <button
            onClick={() => setActiveSubView('issue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeSubView === 'issue'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Material Issues (Warehouse → Shop Floor) ({projectIssues.length})
          </button>
        </div>

        <div>
          {activeSubView === 'consumption' ? (
            <Button size="sm" icon={Plus} onClick={() => setConsModalOpen(true)}>
              Record Consumption
            </Button>
          ) : (
            <Button size="sm" icon={Plus} onClick={() => setIssueModalOpen(true)}>
              New Material Issue
            </Button>
          )}
        </div>
      </div>

      {/* VIEW 1: MATERIAL CONSUMPTION */}
      {activeSubView === 'consumption' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-4">
          <div className="p-4 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Actual Shop-Floor Material Consumption & Variance Log
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tracks actual consumed units against engineering BOM allocations. Overages indicate cutting scrap, weld losses, or process rework.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Log # / Date</th>
                  <th className="py-2.5 px-3">Material Component</th>
                  <th className="py-2.5 px-3">Stage / Operator</th>
                  <th className="py-2.5 px-3 text-center">BOM Qty</th>
                  <th className="py-2.5 px-3 text-center">Issued Qty</th>
                  <th className="py-2.5 px-3 text-center">Actual Consumed</th>
                  <th className="py-2.5 px-3 text-center">Scrap Recorded</th>
                  <th className="py-2.5 px-3 text-center">Variance (+/-)</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectConsumptions.map((cons) => {
                  const isNegativeVariance = cons.variance > 0;
                  return (
                    <tr key={cons.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 font-mono">
                        <span className="font-bold text-slate-800">{cons.consumptionNumber}</span>
                        <span className="text-[10px] text-slate-400 block">{cons.date}</span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {cons.materialName}
                        <span className="text-[10px] text-slate-400 font-mono block">{cons.materialCode}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        <span>{cons.stageName}</span>
                        <span className="text-[10px] text-slate-400 block">Op: {cons.operator}</span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono">
                        {cons.bomQty} {cons.uom}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-medium text-slate-700">
                        {cons.issuedQty} {cons.uom}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                        {cons.actualConsumedQty} {cons.uom}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-amber-700 font-semibold">
                        {cons.scrap || 0} {cons.uom}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          isNegativeVariance
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {cons.variance > 0 ? `+${cons.variance}` : cons.variance} {cons.uom} ({cons.variancePct > 0 ? `+${cons.variancePct}%` : `${cons.variancePct}%`})
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] max-w-[200px] truncate" title={cons.remarks}>
                        {cons.remarks || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: MATERIAL ISSUES */}
      {activeSubView === 'issue' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-4">
          <div className="p-4 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Warehouse to Shop-Floor Material Issue Vouchers
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Material transfers physically released from central stores to line stages.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Issue # / Date</th>
                  <th className="py-2.5 px-3">Material</th>
                  <th className="py-2.5 px-3">Target Stage</th>
                  <th className="py-2.5 px-3 text-center">Planned Qty</th>
                  <th className="py-2.5 px-3 text-center">Issued Qty</th>
                  <th className="py-2.5 px-3">Warehouse / Issued By</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectIssues.map((issue) => {
                  const statusStyle = getManufacturingStatusStyle(issue.status);
                  return (
                    <tr key={issue.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 font-mono">
                        <span className="font-bold text-slate-800">{issue.issueNumber}</span>
                        <span className="text-[10px] text-slate-400 block">{issue.date}</span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {issue.materialName}
                        <span className="text-[10px] text-slate-400 font-mono block">{issue.materialCode}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-700">
                        {issue.productionStage}
                      </td>
                      <td className="py-2 px-3 text-center font-mono">
                        {issue.plannedQty} {issue.uom}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-indigo-700">
                        {issue.issueQty} {issue.uom}
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">
                        <div>{issue.warehouse}</div>
                        <div className="text-slate-400 font-medium">By: {issue.issuedBy}</div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {issue.status === 'Issued' && (
                          <button
                            onClick={() => returnMaterialIssue(issue.id, 5, 'Unused line remnant')}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] cursor-pointer flex items-center gap-1 mx-auto"
                            title="Return Surplus to Warehouse"
                          >
                            <RotateCcw size={10} /> Return
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Consumption Modal */}
      {consModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Boxes className="text-indigo-600" size={16} />
              Record Material Consumption
            </h3>

            <form onSubmit={handleConsSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Material Name *</label>
                <input
                  required
                  value={consForm.materialName}
                  onChange={(e) => setConsForm({ ...consForm, materialName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">BOM Planned Qty</label>
                  <input
                    type="number"
                    value={consForm.bomQty}
                    onChange={(e) => setConsForm({ ...consForm, bomQty: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Actual Consumed *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={consForm.actualConsumedQty}
                    onChange={(e) => setConsForm({ ...consForm, actualConsumedQty: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Scrap Generated</label>
                  <input
                    type="number"
                    min="0"
                    value={consForm.scrap}
                    onChange={(e) => setConsForm({ ...consForm, scrap: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Operator / Tech</label>
                  <input
                    value={consForm.operator}
                    onChange={(e) => setConsForm({ ...consForm, operator: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Notes / Variance Reason</label>
                <input
                  value={consForm.remarks}
                  onChange={(e) => setConsForm({ ...consForm, remarks: e.target.value })}
                  placeholder="e.g. Extra 2 KG consumed during setup test"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={() => setConsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Log Consumption
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Material Issue Modal */}
      {issueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Warehouse className="text-indigo-600" size={16} />
              Issue Material to Shop Floor
            </h3>

            <form onSubmit={handleIssueSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Material Name *</label>
                <input
                  required
                  value={issueForm.materialName}
                  onChange={(e) => setIssueForm({ ...issueForm, materialName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Stage</label>
                  <input
                    value={issueForm.productionStage}
                    onChange={(e) => setIssueForm({ ...issueForm, productionStage: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Issue Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={issueForm.issueQty}
                    onChange={(e) => setIssueForm({ ...issueForm, issueQty: parseFloat(e.target.value) || 1 })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={() => setIssueModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Generate Issue Voucher
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectMaterialConsumptionTab;
