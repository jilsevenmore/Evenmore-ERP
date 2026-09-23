import React, { useState } from 'react';
import {
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  ShoppingCart,
  Plus,
  Layers,
  Calendar,
  Building2,
} from 'lucide-react';
import { useManufacturingStore } from '../../../stores/manufacturingStore';
import { getManufacturingStatusStyle } from '../../../utils/manufacturingUtils';
import { Button } from '../../../components/ui/Button';

export function ProjectMaterialPlanningTab({ project, onGeneratePlan }) {
  const materialPlans = useManufacturingStore((s) => s.materialPlans);
  const reserveMaterial = useManufacturingStore((s) => s.reserveMaterial);
  const releaseReservation = useManufacturingStore((s) => s.releaseReservation);
  const createPurchaseRequest = useManufacturingStore((s) => s.createPurchaseRequest);

  const plan = materialPlans.find((p) => p.projectId === project.id || p.projectNumber === project.id) || materialPlans[0];

  const [prModalOpen, setPrModalOpen] = useState(false);
  const [selectedShortageItem, setSelectedShortageItem] = useState(null);
  const [prNotes, setPrNotes] = useState('');
  const [reserveModalItem, setReserveModalItem] = useState(null);
  const [reserveQtyInput, setReserveQtyInput] = useState('');

  if (!plan) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
        <Sliders size={36} className="mx-auto text-slate-300" />
        <h4 className="text-base font-bold text-slate-800">No Material Plan Generated</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Generate an exploded material requirement plan based on the active BOM and batch quantity to calculate shortages and reserve stock.
        </p>
        <Button icon={Plus} onClick={() => onGeneratePlan && onGeneratePlan(project)}>
          Generate Material Plan
        </Button>
      </div>
    );
  }

  const shortages = (plan.items || []).filter((it) => it.shortage > 0);
  const planStatusStyle = getManufacturingStatusStyle(plan.status);

  const handleOpenPR = (item) => {
    setSelectedShortageItem(item);
    setPrNotes(`Procurement request for ${item.shortage} ${item.uom} of ${item.materialName} needed for project ${project.id}.`);
    setPrModalOpen(true);
  };

  const handleConfirmPR = (e) => {
    e.preventDefault();
    if (!selectedShortageItem) return;
    createPurchaseRequest({
      projectId: project.id,
      projectNumber: project.id,
      materialCode: selectedShortageItem.materialCode,
      materialName: selectedShortageItem.materialName,
      requestedQty: selectedShortageItem.shortage,
      uom: selectedShortageItem.uom,
      requiredByDate: plan.requiredByDate,
      remarks: prNotes,
    });
    setPrModalOpen(false);
    setSelectedShortageItem(null);
  };

  const handleConfirmReserve = (e) => {
    e.preventDefault();
    if (!reserveModalItem) return;
    reserveMaterial(plan.id, reserveModalItem.materialCode, parseFloat(reserveQtyInput) || reserveModalItem.totalRequired);
    setReserveModalItem(null);
  };

  return (
    <div className="space-y-4">
      {/* Plan Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-slate-900 font-mono">{plan.planNumber}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${planStatusStyle.bg} ${planStatusStyle.text} ${planStatusStyle.border}`}>
                {plan.status}
              </span>
              <span className="text-xs text-slate-400">BOM: {plan.bomVersion}</span>
              <span className="text-xs text-slate-400">Production Qty: {plan.productionQty} Units</span>
            </div>
            <p className="text-xs text-slate-500">
              Warehouse: <strong className="text-slate-700">{plan.warehouse}</strong> • Required By: <strong className="text-slate-700">{plan.requiredByDate}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" icon={Sliders} onClick={() => onGeneratePlan && onGeneratePlan(project)}>
              Re-generate Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Critical Shortage Warning Banner */}
      {shortages.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={18} />
            <div>
              <h5 className="text-xs font-bold text-rose-900">
                Material Shortage Detected ({shortages.length} {shortages.length === 1 ? 'Item' : 'Items'})
              </h5>
              <p className="text-[11px] text-rose-700">
                Insufficient warehouse stock for production batch. Create purchase requisitions immediately to prevent assembly delays.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Material Planning Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Material Availability & Reservation Roster ({plan.items?.length || 0} Materials)
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Material / Code</th>
                <th className="py-2.5 px-3 text-center">BOM Qty</th>
                <th className="py-2.5 px-3 text-center">Total Req.</th>
                <th className="py-2.5 px-3 text-center">Avail. Stock</th>
                <th className="py-2.5 px-3 text-center">Reserved</th>
                <th className="py-2.5 px-3 text-center">After Reserve</th>
                <th className="py-2.5 px-3 text-center">Shortage</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(plan.items || []).map((item) => {
                const statusStyle = getManufacturingStatusStyle(item.status);
                const hasShortage = item.shortage > 0;
                const isReserved = item.reservedStock > 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      <span>{item.materialName}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">{item.materialCode}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {item.bomQty} {item.uom}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                      {item.totalRequired} {item.uom}
                      {item.scrapQty > 0 && (
                        <span className="text-[9px] text-slate-400 block font-normal">(+{item.scrapQty} scrap)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-700">
                      {item.availableStock} {item.uom}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">
                      {item.reservedStock || 0} {item.uom}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {item.availableAfterReservation} {item.uom}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {hasShortage ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                          Short: {item.shortage} {item.uom}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700">
                          Surplus: {item.surplus}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {hasShortage && (
                          <button
                            onClick={() => handleOpenPR(item)}
                            className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Generate Purchase Requisition"
                          >
                            <ShoppingCart size={11} /> PR
                          </button>
                        )}
                        {!isReserved && !hasShortage && (
                          <button
                            onClick={() => {
                              setReserveModalItem(item);
                              setReserveQtyInput(String(item.totalRequired));
                            }}
                            className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            title="Reserve Stock in Warehouse"
                          >
                            <Lock size={11} /> Reserve
                          </button>
                        )}
                        {isReserved && (
                          <button
                            onClick={() => releaseReservation(plan.id, item.materialCode)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            title="Release Stock Reservation"
                          >
                            <Unlock size={11} /> Release
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Request Modal */}
      {prModalOpen && selectedShortageItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <ShoppingCart className="text-rose-600" size={18} />
                Create Purchase Request
              </h3>
            </div>

            <form onSubmit={handleConfirmPR} className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Shortage Material</span>
                <p className="text-xs font-bold text-slate-800">{selectedShortageItem.materialName}</p>
                <p className="text-[11px] font-mono text-slate-500">SKU: {selectedShortageItem.materialCode}</p>
                <div className="flex items-center gap-4 text-xs pt-1 font-mono">
                  <span>Deficit Shortage: <strong className="text-rose-600">{selectedShortageItem.shortage} {selectedShortageItem.uom}</strong></span>
                  <span>Required Date: <strong>{plan.requiredByDate}</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Requisition Notes & Urgency</label>
                <textarea
                  rows={3}
                  value={prNotes}
                  onChange={(e) => setPrNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={() => setPrModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Generate Requisition
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reserve Stock Modal */}
      {reserveModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Lock className="text-indigo-600" size={16} />
              Reserve Stock
            </h3>

            <form onSubmit={handleConfirmReserve} className="space-y-3">
              <p className="text-xs text-slate-600">
                Reserve material for project <strong>{project.id}</strong> in warehouse.
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Quantity to Reserve ({reserveModalItem.uom})</label>
                <input
                  type="number"
                  min="1"
                  max={reserveModalItem.availableStock}
                  step="any"
                  required
                  value={reserveQtyInput}
                  onChange={(e) => setReserveQtyInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-sm"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Available in store: {reserveModalItem.availableStock} {reserveModalItem.uom}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={() => setReserveModalItem(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Lock Reservation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectMaterialPlanningTab;
