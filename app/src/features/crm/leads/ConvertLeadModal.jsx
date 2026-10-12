import { useState } from "react";
import { UserCheck, X } from "lucide-react";

// Confirmation for turning a lead into a customer. The server creates the
// customer party and the deal (`POST /crm/leads/{id}/convert/`) only once the
// user confirms here.
export default function ConvertLeadModal({ lead, onClose, onConfirm }) {
  const [isConverting, setIsConverting] = useState(false);
  if (!lead) return null;

  async function handleConfirm() {
    setIsConverting(true);
    try {
      await onConfirm(lead);
    } finally {
      setIsConverting(false);
    }
  }

  const close = isConverting ? undefined : onClose;
  const customerName = lead.company || lead.name;

  return (
    <div className="modal-overlay" role="presentation" onClick={close}>
      <section
        className="delete-lead-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="convert-lead-title"
        aria-describedby="convert-lead-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="delete-lead-head">
          <div className="delete-lead-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
            <UserCheck size={20} />
          </div>
          <button type="button" className="modal-close" onClick={close} disabled={isConverting} aria-label="Close convert dialog">
            <X size={18} />
          </button>
        </div>
        <h2 id="convert-lead-title">Convert to customer?</h2>
        <p id="convert-lead-desc">
          <strong>{lead.name}</strong> becomes the customer <strong>{customerName}</strong>, and a deal
          is opened for it. The lead stays in your list, linked to both.
        </p>
        <div className="delete-lead-actions">
          <button type="button" className="btn-outline" onClick={close} disabled={isConverting} autoFocus>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleConfirm} disabled={isConverting}>
            {isConverting ? "Converting…" : "Convert to Customer"}
          </button>
        </div>
      </section>
    </div>
  );
}
