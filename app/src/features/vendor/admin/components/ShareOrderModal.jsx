import React, { useState, useMemo } from 'react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { useVendorStore } from '../../../../stores/vendorStore';
import { getCurrentISODate, addDaysISO } from '../../../../utils/dateUtils';
import {
  Share2,
  Building2,
  Calendar,
  Layers,
  User,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  History,
  Trash2,
  Ban,
} from 'lucide-react';

export function ShareOrderModal({
  isOpen,
  onClose,
  initialSalesOrder = null,
  onSuccess,
}) {
  const vendors = useVendorStore((s) => s.vendors);
  const vendorUsers = useVendorStore((s) => s.vendorUsers);
  const templates = useVendorStore((s) => s.templates);
  const orders = useVendorStore((s) => s.orders);
  const shareOrderWithVendor = useVendorStore((s) => s.shareOrderWithVendor);
  const unshareOrder = useVendorStore((s) => s.unshareOrder);
  const sharingHistory = useVendorStore((s) => s.sharingHistory);

  // Eligible vendors with portal enabled
  const enabledVendors = useMemo(() => {
    return vendors.filter((v) => v.portalAccess !== 'Disabled');
  }, [vendors]);

  // Check if this sales order is already shared
  const existingSharedOrder = useMemo(() => {
    if (!initialSalesOrder) return null;
    return orders.find(
      (o) =>
        o.isShared !== false &&
        (o.orderNumber === initialSalesOrder.orderNumber ||
          o.salesOrderId === initialSalesOrder.id ||
          o.orderNumber === initialSalesOrder.id)
    );
  }, [orders, initialSalesOrder]);

  const [activeTab, setActiveTab] = useState('share'); // 'share' | 'history'
  const [selectedVendorId, setSelectedVendorId] = useState(enabledVendors[0]?.id || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '');
  const [startDate, setStartDate] = useState(() => getCurrentISODate());
  const [endDate, setEndDate] = useState(() => addDaysISO(getCurrentISODate(), 14));
  const [assignedOwner, setAssignedOwner] = useState('Adarsh Gupta');
  const [notes, setNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [unshareConfirmOpen, setUnshareConfirmOpen] = useState(false);
  const [unshareReason, setUnshareReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const targetOrderNumber = initialSalesOrder?.orderNumber || `SO-${Date.now().toString().slice(-4)}`;
  const targetCustomer = initialSalesOrder?.customer || 'Patel Agro Industries';
  const targetProduct =
    initialSalesOrder?.items?.[0]?.description ||
    initialSalesOrder?.items?.[0]?.name ||
    'Fabricated Component Assembly';
  const targetQty = initialSalesOrder?.items?.reduce((s, it) => s + (it.qty || 1), 0) || 50;

  const handleShareSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedVendorId) {
      setErrorMsg('Please select an active vendor.');
      return;
    }
    if (!selectedTemplateId) {
      setErrorMsg('Please select a process template.');
      return;
    }

    setShowConfirm(true);
  };

  const confirmShare = () => {
    try {
      shareOrderWithVendor({
        orderNumber: targetOrderNumber,
        salesOrderId: initialSalesOrder?.id || null,
        vendorId: selectedVendorId,
        customer: targetCustomer,
        product: targetProduct,
        quantity: targetQty,
        templateId: selectedTemplateId,
        expectedStartDate: startDate,
        expectedEndDate: endDate,
        assignedOwner,
        notes,
      });

      onSuccess?.(`Order ${targetOrderNumber} shared with vendor successfully!`);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to share order.');
    }
  };

  const handleUnshare = () => {
    if (!existingSharedOrder) return;
    try {
      unshareOrder(existingSharedOrder.id, unshareReason || 'Unshared by administrator');
      onSuccess?.(`Order ${targetOrderNumber} has been unshared.`);
      setUnshareConfirmOpen(false);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const orderRelatedHistory = sharingHistory.filter(
    (sh) => sh.orderNumber === targetOrderNumber
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share Order with Vendor: ${targetOrderNumber}`}
      subtitle={`${targetProduct} • Customer: ${targetCustomer} • Quantity: ${targetQty} Units`}
      size="lg"
    >
      <div className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              activeTab === 'share'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            Sharing Configuration
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <History size={13} />
            <span>Sharing Audit History ({orderRelatedHistory.length})</span>
          </button>
        </div>

        {activeTab === 'share' && (
          <>
            {/* Existing Shared Status Banner */}
            {existingSharedOrder ? (
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 size={16} className="text-blue-600" />
                    <span>Currently Shared with {existingSharedOrder.vendorName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUnshareConfirmOpen(true)}
                    className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <Ban size={12} />
                    <span>Unshare Order</span>
                  </button>
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  This order is active in the vendor portal. The vendor has completed {existingSharedOrder.overallProgress}% progress. Unsharing will remove it from the vendor's view while preserving all historical stages and audit logs.
                </p>
              </div>
            ) : null}

            {/* Form */}
            {!existingSharedOrder && (
              <form onSubmit={handleShareSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Select Vendor */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Vendor Supplier *
                    </label>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 text-xs font-semibold"
                    >
                      {enabledVendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.supplyType})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Process Template */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Stage Process Template *
                    </label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 text-xs font-semibold"
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.stages?.length} stages, 100%)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dates */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Expected Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Expected Completion Due Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  {/* In-House Owner */}
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      In-House Engineering POC / Owner
                    </label>
                    <input
                      type="text"
                      value={assignedOwner}
                      onChange={(e) => setAssignedOwner(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Technical Dispatch Instructions & Vendor Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Special packaging guidelines, tolerance specifications, or raw material delivery notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button variant="outline" type="button" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" icon={Share2}>
                    Share with Vendor
                  </Button>
                </div>
              </form>
            )}
          </>
        )}

        {/* ── Tab: Sharing History ──────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {orderRelatedHistory.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                No sharing audit entries recorded for this order yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {orderRelatedHistory.map((h) => (
                  <div key={h.id} className="p-3 bg-white dark:bg-slate-900 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {h.vendorName}
                      </span>
                      <span
                        className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          h.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {h.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Shared by <strong>{h.sharedBy}</strong> on {h.sharedDate}
                      {h.unsharedBy && (
                        <span> • Unshared by <strong>{h.unsharedBy}</strong> on {h.unsharedDate}</span>
                      )}
                    </p>
                    {h.reason && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                        "{h.reason}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal before sharing */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Share2 size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Confirm Order Outsourcing</h4>
                  <p className="text-[11px] text-slate-500">Assign to external vendor portal</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                You are about to share Order <strong>{targetOrderNumber}</strong> with{' '}
                <strong>
                  {enabledVendors.find((v) => v.id === selectedVendorId)?.name}
                </strong>
                . The vendor will receive an alert and will be able to start stage tracking.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmShare}
                  className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-xs"
                >
                  Yes, Share Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal before unsharing */}
        {unshareConfirmOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Ban size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-rose-700">Confirm Order Unsharing</h4>
                  <p className="text-[11px] text-slate-500">Revoke vendor portal visibility</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to unshare <strong>{targetOrderNumber}</strong>? This will remove the order from the vendor's active list while preserving all historical audit logs.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Unsharing
                </label>
                <input
                  type="text"
                  placeholder="e.g. Outsourcing cancelled; work brought in-house"
                  value={unshareReason}
                  onChange={(e) => setUnshareReason(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUnshareConfirmOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUnshare}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
                >
                  Confirm Unshare
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ShareOrderModal;
