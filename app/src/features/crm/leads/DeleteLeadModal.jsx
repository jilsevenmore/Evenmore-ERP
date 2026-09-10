import { AlertTriangle, X } from "lucide-react";

export default function DeleteLeadModal({ lead, leads = [], onClose, onConfirm, onConfirmAll }) {
  const isBulk = leads.length > 0;
  if (!lead && !isBulk) return null;
  const recordLabel = isBulk ? `${leads.length} records` : "this record";

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="delete-lead-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-lead-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="delete-lead-head">
          <div className="delete-lead-icon">
            <AlertTriangle size={20} />
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close delete dialog">
            <X size={18} />
          </button>
        </div>
        <h2 id="delete-lead-title">Delete Record</h2>
        <p>
          Are you sure you want to delete <strong>{isBulk ? recordLabel : lead.name}</strong>? This action cannot be undone.
        </p>
        <div className="delete-lead-actions">
          <button
            type="button"
            className="delete-confirm-btn"
            onClick={() => (isBulk ? onConfirmAll(leads) : onConfirm(lead.id))}
          >
            Delete {isBulk ? "All Records" : "Record"}
          </button>
        </div>
      </section>
    </div>
  );
}
