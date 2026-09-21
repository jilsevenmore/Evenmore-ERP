import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { ProofUploadWidget } from './ProofUploadWidget';
import { useVendorStore } from '../../../../stores/vendorStore';
import { getCurrentISODate } from '../../../../utils/dateUtils';
import { CheckCircle2, Clock, AlertTriangle, Layers, ShieldCheck } from 'lucide-react';

export function VendorStageUpdateModal({
  isOpen,
  onClose,
  order,
  stage,
  onSuccess,
}) {
  const submitStageUpdate = useVendorStore((s) => s.submitStageUpdate);
  const [selectedStageId, setSelectedStageId] = useState(stage?.id || order?.stages?.[0]?.id || '');
  const [status, setStatus] = useState('In Progress');
  const [quantityCompleted, setQuantityCompleted] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updateDate, setUpdateDate] = useState(() => getCurrentISODate());
  const [proofFiles, setProofFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const activeStage = order?.stages?.find((s) => s.id === selectedStageId) || stage || order?.stages?.[0];

  useEffect(() => {
    if (stage) {
      setSelectedStageId(stage.id);
      setStatus(stage.status === 'Completed' || stage.status === 'Submitted' ? 'Completed' : stage.status === 'Not Started' ? 'Started' : 'In Progress');
      setQuantityCompleted(stage.quantityCompleted || order?.quantity || '');
      setRemarks(stage.remarks || '');
      setProofFiles(stage.proofFiles || []);
      setErrors({});
    }
  }, [stage, order]);

  if (!isOpen || !order || !activeStage) return null;

  const isCompletedSelected = status === 'Completed';
  const isProofMandatory = Boolean(activeStage.proofRequired && isCompletedSelected);

  const validate = () => {
    const errs = {};
    const qtyNum = Number(quantityCompleted);

    if (isCompletedSelected) {
      if (quantityCompleted === '' || isNaN(qtyNum)) {
        errs.quantityCompleted = 'Quantity completed is required when marking stage completed.';
      } else if (qtyNum < 0) {
        errs.quantityCompleted = 'Quantity cannot be negative.';
      } else if (qtyNum > order.quantity) {
        errs.quantityCompleted = `Quantity cannot exceed total order quantity (${order.quantity} ${order.uom || 'units'}).`;
      }

      if (!remarks.trim()) {
        errs.remarks = 'Completion remarks and manufacturing notes are required.';
      } else if (remarks.trim().length < 5) {
        errs.remarks = 'Remarks must be at least 5 characters.';
      }

      if (isProofMandatory && proofFiles.length === 0) {
        errs.proof = 'Verification proof (photo/inspection report) is mandatory for this stage completion.';
      }
    } else {
      if (quantityCompleted !== '' && (isNaN(qtyNum) || qtyNum < 0)) {
        errs.quantityCompleted = 'Quantity must be a valid positive number.';
      } else if (qtyNum > order.quantity) {
        errs.quantityCompleted = `Quantity cannot exceed total order quantity (${order.quantity}).`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      submitStageUpdate(order.id, activeStage.id, {
        status,
        quantityCompleted: Number(quantityCompleted) || 0,
        remarks: remarks.trim(),
        updateDate,
        proofFiles,
      });

      onSuccess?.(`Stage "${activeStage.name}" update submitted successfully!`);
      onClose();
    } catch (err) {
      console.error(err);
      setErrors({ form: 'An error occurred while saving the update.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Stage: ${activeStage.name}`}
      subtitle={`Order #${order.orderNumber} • ${order.product} • Total: ${order.quantity} ${order.uom || 'Units'}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Stage Selection & Stage Metadata */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              {activeStage.sequence}
            </div>
            <div>
              <p className="font-bold text-text text-sm">{activeStage.name}</p>
              <p className="text-[11px] text-muted">
                Weight: <span className="font-semibold text-text">{activeStage.weight}%</span> • Expected:{' '}
                <span className="font-semibold text-text">{activeStage.expectedDays} days</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeStage.proofRequired && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <ShieldCheck size={11} /> Proof Mandatory
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
              Current: {activeStage.status}
            </span>
          </div>
        </div>

        {activeStage.instructions && (
          <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-blue-800 text-[11px] leading-relaxed">
            <span className="font-bold">Stage Instructions: </span>
            {activeStage.instructions}
          </div>
        )}

        {/* Status Selection */}
        <div>
          <label className="block font-semibold text-text mb-1.5">
            Stage Update Status <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'Started', label: 'Started', desc: 'Work has begun', icon: Clock },
              { id: 'In Progress', label: 'In Progress', desc: 'Fabrication underway', icon: Layers },
              { id: 'Completed', label: 'Completed', desc: 'Ready for approval', icon: CheckCircle2 },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = status === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setStatus(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-text-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={isSelected ? 'text-primary' : 'text-muted'} />
                    <span className="font-bold text-xs">{opt.label}</span>
                  </div>
                  <p className="text-[10px] text-muted mt-1">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantities & Update Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-text mb-1">
              Quantity Processed / Completed {isCompletedSelected && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max={order.quantity}
                value={quantityCompleted}
                onChange={(e) => setQuantityCompleted(e.target.value)}
                placeholder={`e.g. ${order.quantity}`}
                className={`w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 text-text font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.quantityCompleted ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted font-medium">
                / {order.quantity} {order.uom || 'Units'}
              </span>
            </div>
            {errors.quantityCompleted && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.quantityCompleted}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-text mb-1">
              Update Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={updateDate}
              onChange={(e) => setUpdateDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Remarks & Technical Notes */}
        <div>
          <label className="block font-semibold text-text mb-1">
            Manufacturing Remarks & Notes {isCompletedSelected && <span className="text-rose-500">*</span>}
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Describe completed work, machine setup, dimensions verified, or any observations..."
            className={`w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed ${
              errors.remarks ? 'border-rose-400' : 'border-slate-200'
            }`}
          />
          {errors.remarks && (
            <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.remarks}</p>
          )}
        </div>

        {/* Proof Upload Component */}
        <div className="pt-1">
          <ProofUploadWidget
            files={proofFiles}
            onChange={setProofFiles}
            isRequired={isProofMandatory}
            label={activeStage.proofRequired ? 'Stage Verification Proof (Mandatory)' : 'Verification Proof (Optional)'}
            helpText={
              activeStage.proofRequired
                ? 'Mandatory: Upload test certificates, dimension inspection photos, or QC approval slips.'
                : 'Optional: Upload supporting photographs or process sheets.'
            }
          />
          {errors.proof && (
            <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.proof}</p>
          )}
        </div>

        {isCompletedSelected && (
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-2.5">
            <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Approval Notice</p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Marking this stage as "Completed" will submit it for in-house engineering team approval. The next stage will unlock automatically once this submission is approved.
              </p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isCompletedSelected ? 'Submit for Approval' : 'Update Stage Progress'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default VendorStageUpdateModal;
