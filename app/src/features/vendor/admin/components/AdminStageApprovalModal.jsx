import React, { useState } from 'react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { useVendorStore } from '../../../../stores/vendorStore';
import {
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  User,
  Clock,
  Layers,
  Building2,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';

export function AdminStageApprovalModal({
  isOpen,
  onClose,
  order,
  stage,
  onSuccess,
}) {
  const approveStageUpdate = useVendorStore((s) => s.approveStageUpdate);
  const rejectStageUpdate = useVendorStore((s) => s.rejectStageUpdate);

  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !order || !stage) return null;

  const handleApprove = () => {
    setIsProcessing(true);
    try {
      approveStageUpdate(order.id, stage.id, adminNotes);
      onSuccess?.(`Stage "${stage.name}" for order ${order.orderNumber} successfully approved!`);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to approve stage.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    setErrorMsg('');
    if (!rejectionReason.trim()) {
      setErrorMsg('Rejection reason is mandatory. Please state the deficiency or test failure.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = rejectStageUpdate(order.id, stage.id, rejectionReason.trim());
      if (res.success) {
        onSuccess?.(`Stage "${stage.name}" update rejected. Vendor notified for correction.`);
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to reject stage update.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const proofFiles = stage.proofFiles || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Review Stage Submission: ${stage.name}`}
      subtitle={`Order #${order.orderNumber} • ${order.vendorName} • Product: ${order.product}`}
      size="lg"
    >
      <div className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Overview Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">{stage.name}</span>
              <StatusBadge status={stage.status || 'Submitted'} />
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                Weight: {stage.weight}%
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Submitted: <strong>{stage.submittedDate || order.lastUpdate}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Vendor Supplier</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{order.vendorName}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Submitted By User</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{stage.submittedBy || 'Vendor Representative'}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Quantity Processed</span>
              <p className="font-bold font-mono text-slate-800 dark:text-slate-200">
                {stage.quantityCompleted || order.quantity} / {order.quantity} {order.uom || 'Units'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Current Progress</span>
              <p className="font-bold font-mono text-primary">{stage.progress || 100}%</p>
            </div>
          </div>
        </div>

        {/* Vendor Remarks */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Vendor Submission Remarks:
          </label>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs italic leading-relaxed">
            "{stage.remarks || 'No remarks provided.'}"
          </div>
        </div>

        {/* Verification Proofs Inspection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Attached Verification Proof ({proofFiles.length}):
            </label>
            {stage.proofRequired && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Proof Mandatory for this Stage
              </span>
            )}
          </div>

          {proofFiles.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-400 text-xs">
              No proof files attached to this stage update.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {proofFiles.map((file, idx) => {
                const isPdf = file.name?.endsWith('.pdf') || file.type === 'application/pdf';
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {file.url && !isPdf ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                          {isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-400">{file.size || '1.8 MB'}</p>
                      </div>
                    </div>

                    <a
                      href={file.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-primary font-semibold text-xs hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                    >
                      Inspect
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* In-House Engineering Notes (Optional for Approve) */}
        {!isRejecting && (
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Approval Notes / Technical Comments (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Dimensions verified against drawing rev 4. Approved for next stage."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
            />
          </div>
        )}

        {/* Rejection Section (Mandatory Reason) */}
        {isRejecting && (
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-rose-800 font-bold">
              <XCircle size={16} className="text-rose-600" />
              <span>Reject Stage Update</span>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-rose-900 mb-1">
                Reason for Rejection * (Mandatory)
              </label>
              <textarea
                rows={3}
                required
                placeholder="State technical discrepancy, dimension failure, or missing documentation so the vendor can correct and resubmit..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-rose-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {!isRejecting ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs cursor-pointer transition-colors"
                >
                  Reject Update...
                </button>
                <Button
                  variant="primary"
                  type="button"
                  icon={CheckCircle2}
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Approving...' : 'Approve & Unlock Next Stage'}
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsRejecting(false);
                    setRejectionReason('');
                    setErrorMsg('');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Back to Approve
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                >
                  {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default AdminStageApprovalModal;
