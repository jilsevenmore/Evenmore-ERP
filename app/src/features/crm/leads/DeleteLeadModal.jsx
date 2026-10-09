import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const NAMES_SHOWN = 5;

// Confirmation for deleting one lead or a selection. Opened only from an
// explicit Delete action; nothing is deleted until the user confirms here.
export default function DeleteLeadModal({ lead, leads = [], onClose, onConfirm, onConfirmAll }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isBulk = leads.length > 0;
  if (!lead && !isBulk) return null;

  const targets = isBulk ? leads : [lead];
  const count = targets.length;
  const noun = count === 1 ? "lead" : "leads";
  const hidden = count - NAMES_SHOWN;

  async function handleConfirm() {
    setIsDeleting(true);
    try {
      await (isBulk ? onConfirmAll(leads) : onConfirm(lead.id));
    } finally {
      setIsDeleting(false);
    }
  }

  const close = isDeleting ? undefined : onClose;

  return (
    <div className="modal-overlay" role="presentation" onClick={close}>
      <section
        className="delete-lead-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-lead-title"
        aria-describedby="delete-lead-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="delete-lead-head">
          <div className="delete-lead-icon">
            <AlertTriangle size={20} />
          </div>
          <button type="button" className="modal-close" onClick={close} disabled={isDeleting} aria-label="Close delete dialog">
            <X size={18} />
          </button>
        </div>
        <h2 id="delete-lead-title">Delete {count === 1 ? "lead" : `${count} leads`}?</h2>
        <p id="delete-lead-desc">
          {count === 1
            ? <>Are you sure you want to delete <strong>{targets[0].name}</strong>?</>
            : <>Are you sure you want to delete these {count} leads?</>}
          {" "}This cannot be undone.
        </p>
        {count > 1 && (
          <ul className="delete-lead-list">
            {targets.slice(0, NAMES_SHOWN).map((item) => (
              <li key={item.id}>{item.name || "Untitled lead"}{item.company ? <span> · {item.company}</span> : null}</li>
            ))}
            {hidden > 0 && <li className="delete-lead-more">and {hidden} more</li>}
          </ul>
        )}
        <div className="delete-lead-actions">
          <button type="button" className="btn-outline" onClick={close} disabled={isDeleting} autoFocus>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting…" : `Delete ${count === 1 ? "Lead" : `${count} Leads`}`}
          </button>
        </div>
      </section>
    </div>
  );
}
