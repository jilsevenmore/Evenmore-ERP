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
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { useManufacturingStore } from '../../stores/manufacturingStore';
import { getManufacturingStatusStyle } from '../../utils/manufacturingUtils';

export default function MaterialPlanningPage() {
  const materialPlans = useManufacturingStore((s) => s.materialPlans);
  const reserveMaterial = useManufacturingStore((s) => s.reserveMaterial);
  const releaseReservation = useManufacturingStore((s) => s.releaseReservation);
  const createPurchaseRequest = useManufacturingStore((s) => s.createPurchaseRequest);

  const [selectedPlanId, setSelectedPlanId] = useState(materialPlans[0]?.id || '');
  const [prModalOpen, setPrModalOpen] = useState(false);
  const [selectedShortageItem, setSelectedShortageItem] = useState(null);
  const [prNotes, setPrNotes] = useState('');
  const [reserveModalItem, setReserveModalItem] = useState(null);
  const [reserveQtyInput, setReserveQtyInput] = useState('');

  const currentPlan = materialPlans.find((p) => p.id === selectedPlanId) || materialPlans[0];

  function handleOpenPr(item) {
    setSelectedShortageItem(item);
    setPrNotes(`Auto-generated shortage request for ${item.materialName}`);
    setPrModalOpen(true);
  }

  function handleConfirmPr(e) {
    e.preventDefault();
    if (!currentPlan || !selectedShortageItem) return;
    createPurchaseRequest(
      currentPlan.id,
      selectedShortageItem.materialCode,
      selectedShortageItem.shortageQty,
      prNotes
    );
    setPrModalOpen(false);
    setSelectedShortageItem(null);
  }

  function handleOpenReserve(item) {
    setReserveModalItem(item);
    setReserveQtyInput(item.totalRequired);
  }

  function handleConfirmReserve(e) {
    e.preventDefault();
    if (!currentPlan || !reserveModalItem) return;
    const qty = parseFloat(reserveQtyInput);
    if (!isNaN(qty) && qty > 0) {
      reserveMaterial(currentPlan.id, reserveModalItem.materialCode, qty);
    }
    setReserveModalItem(null);
  }

  if (!currentPlan) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Material Requirements Planning (MRP)"
          subtitle="Explode BOMs against production targets, verify warehouse balances, reserve stock, and raise purchase requisitions."
        />
        <div className="bg-white border border-[#dce5f4] rounded-xl p-8 text-center text-xs text-[#64748b]">
          No material plans generated yet. Create a production batch to explode BOM requirements.
        </div>
      </div>
    );
  }

  const items = currentPlan.requiredMaterials || [];
  const totalItems = items.length;
  const shortageItems = items.filter((i) => i.shortageQty > 0);
  const readyItems = items.filter((i) => i.status === 'Available');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Material Requirements Planning (MRP)"
        subtitle="Explode BOMs against production targets, verify warehouse balances, reserve stock, and raise purchase requisitions."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="text-xs border border-[#cbd5e1] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1f6bff] text-[#0f172a] bg-white font-medium shadow-2xs"
            >
              {materialPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectNumber} - {p.productName} ({p.batchNumber})
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Plan Header Card */}
      <div className="bg-white border border-[#dce5f4] rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#f1f5f9]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#0f172a]">{currentPlan.productName}</h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#eff6ff] text-[#1d4ed8]">
                Batch: {currentPlan.batchNumber}
              </span>
            </div>
            <p className="text-xs text-[#64748b] mt-0.5">
              Project: <span className="font-semibold text-[#0f172a]">{currentPlan.projectNumber}</span> • Customer: {currentPlan.customerName}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs">
            <div className="bg-[#f8fafc] border border-[#e2e8f0] px-3 py-2 rounded-lg">
              <span className="text-[#64748b] block text-[10px]">Planned Production Qty</span>
              <span className="font-bold text-[#0f172a] text-sm">{currentPlan.plannedQty} units</span>
            </div>
            <div className="bg-[#f8fafc] border border-[#e2e8f0] px-3 py-2 rounded-lg">
              <span className="text-[#64748b] block text-[10px]">BOM Reference</span>
              <span className="font-bold text-[#0f172a] text-sm">{currentPlan.bomVersion}</span>
            </div>
            <div className="bg-[#f8fafc] border border-[#e2e8f0] px-3 py-2 rounded-lg">
              <span className="text-[#64748b] block text-[10px]">Plan Generated</span>
              <span className="font-medium text-[#0f172a] text-xs">{currentPlan.createdDate}</span>
            </div>
          </div>
        </div>

        {/* Shortage Alert Banner */}
        {shortageItems.length > 0 ? (
          <div className="bg-[#fff7ed] border border-[#ffedd5] p-3 rounded-lg flex items-center justify-between gap-3 text-xs text-[#c2410c]">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="shrink-0 text-[#ea580c]" />
              <span>
                <strong>{shortageItems.length} Material Shortages Detected!</strong> Some components lack available warehouse stock for this batch.
              </span>
            </div>
            <Button
              size="xs"
              variant="outline"
              className="border-[#fdba74] bg-white text-[#c2410c] hover:bg-[#fff7ed]"
              onClick={() => handleOpenPr(shortageItems[0])}
            >
              Raise Purchase Requisitions
            </Button>
          </div>
        ) : (
          <div className="bg-[#f0fdf4] border border-[#dcfce7] p-3 rounded-lg flex items-center gap-2 text-xs text-[#15803d]">
            <CheckCircle2 size={18} className="shrink-0 text-[#16a34a]" />
            <span>
              <strong>All Materials Ready!</strong> Sufficient warehouse inventory is on hand to fulfill this production run.
            </span>
          </div>
        )}
      </div>

      {/* Exploded Material Requirements Table */}
      <div className="bg-white border border-[#dce5f4] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#dce5f4] flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-[#0f172a]">Exploded Material Requirements</h4>
            <p className="text-xs text-[#64748b] mt-0.5">Calculated with BOM scrap allowance, warehouse on-hand stock, and active reservations.</p>
          </div>
          <div className="text-xs font-medium text-[#64748b]">
            Total Line Items: <span className="font-bold text-[#0f172a]">{totalItems}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#dce5f4] font-semibold">
              <tr>
                <th className="py-3 px-4">Item Code</th>
                <th className="py-3 px-4">Material Name</th>
                <th className="py-3 px-4 text-center">BOM Qty</th>
                <th className="py-3 px-4 text-center">Scrap %</th>
                <th className="py-3 px-4 text-center font-bold text-[#0f172a]">Total Required</th>
                <th className="py-3 px-4 text-center">In Warehouse</th>
                <th className="py-3 px-4 text-center">Reserved</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-center">Shortage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {items.map((item) => {
                const statusStyle = getManufacturingStatusStyle(item.status);
                const hasShortage = item.shortageQty > 0;
                return (
                  <tr key={item.materialCode} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0f172a]">
                      {item.materialCode}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#334155]">
                      {item.materialName}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.bomQtyPerUnit} {item.uom}
                    </td>
                    <td className="py-3.5 px-4 text-center text-[#eab308] font-medium">
                      {item.scrapAllowancePct}%
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#0f172a] bg-[#eff6ff]/30">
                      {item.totalRequired} {item.uom}
                    </td>
                    <td className="py-3.5 px-4 text-center text-[#64748b]">
                      {item.warehouseStock} {item.uom}
                    </td>
                    <td className="py-3.5 px-4 text-center text-[#6366f1] font-medium">
                      {item.reservedQty} {item.uom}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#0f172a]">
                      {item.availableStock} {item.uom}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {hasShortage ? (
                        <span className="text-[#ef4444]">
                          {item.shortageQty} {item.uom}
                        </span>
                      ) : (
                        <span className="text-[#10b981]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                        style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.color ? `${statusStyle.color}40` : '#e2e8f0' }}
                      >
                        {statusStyle.label || item.status || 'Stock Available'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {hasShortage ? (
                          <Button
                            size="xs"
                            variant="outline"
                            icon={ShoppingCart}
                            className="text-[#ea580c] border-[#ea580c]/30 hover:bg-[#fff7ed]"
                            onClick={() => handleOpenPr(item)}
                          >
                            Raise PR
                          </Button>
                        ) : item.reservedQty < item.totalRequired ? (
                          <Button
                            size="xs"
                            variant="outline"
                            icon={Lock}
                            className="text-[#1f6bff] border-[#1f6bff]/30 hover:bg-[#eff6ff]"
                            onClick={() => handleOpenReserve(item)}
                          >
                            Reserve
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            variant="ghost"
                            icon={Unlock}
                            className="text-[#64748b]"
                            onClick={() => releaseReservation(currentPlan.id, item.materialCode, item.reservedQty)}
                            title="Release Reserved Stock"
                          >
                            Release
                          </Button>
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

      {/* Reserve Stock Modal */}
      {reserveModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#dce5f4] w-full max-w-md p-5">
            <h3 className="text-base font-bold text-[#0f172a] mb-2">Reserve Material for Production</h3>
            <p className="text-xs text-[#64748b] mb-4">
              Allocate warehouse stock specifically to batch <strong>{currentPlan.batchNumber}</strong> to prevent inventory cannibalization.
            </p>

            <form onSubmit={handleConfirmReserve} className="space-y-3 text-xs">
              <div className="bg-[#f8fafc] p-3 rounded-lg space-y-1">
                <div className="text-[#64748b]">Material: <strong className="text-[#0f172a]">{reserveModalItem.materialName}</strong></div>
                <div className="text-[#64748b]">Available in Warehouse: <strong className="text-[#10b981]">{reserveModalItem.availableStock} {reserveModalItem.uom}</strong></div>
                <div className="text-[#64748b]">Total Required: <strong className="text-[#0f172a]">{reserveModalItem.totalRequired} {reserveModalItem.uom}</strong></div>
              </div>

              <div>
                <label className="block text-[#64748b] font-medium mb-1">Quantity to Reserve ({reserveModalItem.uom})</label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  max={reserveModalItem.availableStock}
                  value={reserveQtyInput}
                  onChange={(e) => setReserveQtyInput(e.target.value)}
                  className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f1f5f9]">
                <Button type="button" variant="outline" onClick={() => setReserveModalItem(null)}>
                  Cancel
                </Button>
                <Button type="submit" icon={Lock}>
                  Confirm Reservation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise Purchase Request Modal */}
      {prModalOpen && selectedShortageItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#dce5f4] w-full max-w-md p-5">
            <h3 className="text-base font-bold text-[#0f172a] mb-2">Create Purchase Requisition</h3>
            <p className="text-xs text-[#64748b] mb-4">
              Send an urgent procurement request to the Purchasing team for batch shortages.
            </p>

            <form onSubmit={handleConfirmPr} className="space-y-3 text-xs">
              <div className="bg-[#fff7ed] p-3 rounded-lg border border-[#ffedd5] space-y-1">
                <div className="text-[#c2410c]">Material: <strong>{selectedShortageItem.materialName}</strong></div>
                <div className="text-[#c2410c]">Shortage Amount: <strong>{selectedShortageItem.shortageQty} {selectedShortageItem.uom}</strong></div>
              </div>

              <div>
                <label className="block text-[#64748b] font-medium mb-1">Procurement Notes / Justification</label>
                <textarea
                  rows={3}
                  value={prNotes}
                  onChange={(e) => setPrNotes(e.target.value)}
                  className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f1f5f9]">
                <Button type="button" variant="outline" onClick={() => setPrModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" icon={ShoppingCart}>
                  Submit PR
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
