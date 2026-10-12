import { useState } from "react";
import { X, XCircle } from "lucide-react";
import { useCrmStore } from "../../../stores/crmStore";

const NAMES_SHOWN = 5;

// Confirmation for marking one lead or a selection as Lost -- what the Leads
// list offers instead of Delete. Nothing is deleted: each lead moves to the Lost
// stage and its deal to the Deals pipeline's Lost column, where an admin can
// reopen it.
export default function MarkLostLeadModal({ lead, leads = [], onClose, onConfirm }) {
  const [isSaving, setIsSaving] = useState(false);
  const [reasonId, setReasonId] = useState("");
  const lostReasons = useCrmStore((s) => s.lostReasons);
  const isBulk = leads.length > 0;
  if (!lead && !isBulk) return null;

  const targets = isBulk ? leads : [lead];
  const count = targets.length;
  const hidden = count - NAMES_SHOWN;

  async function handleConfirm() {
    setIsSaving(true);
    try {
      await onConfirm(targets, reasonId || null);
    } finally {
      setIsSaving(false);
    }
  }

  const close = isSaving ? undefined : onClose;

  return (
    <div className="modal-overlay" role="presentation" onClick={close}>
      <section
        className="delete-lead-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="lost-lead-title"
        aria-describedby="lost-lead-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="delete-lead-head">
          <div className="delete-lead-icon">
            <XCircle size={20} />
          </div>
          <button type="button" className="modal-close" onClick={close} disabled={isSaving} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <h2 id="lost-lead-title">Mark {count === 1 ? "lead" : `${count} leads`} as lost?</h2>
        <p id="lost-lead-desc">
          {count === 1
            ? <><strong>{targets[0].name}</strong> moves to the Lost stage</>
            : <>These {count} leads move to the Lost stage</>}
          {" "}and {count === 1 ? "its deal shows" : "their deals show"} in the Deals pipeline&apos;s Lost
          column. Nothing is deleted; an admin can reopen {count === 1 ? "it" : "them"} from there.
        </p>
        {count > 1 && (
          <ul className="delete-lead-list">
            {targets.slice(0, NAMES_SHOWN).map((item) => (
              <li key={item.id}>{item.name || "Untitled lead"}{item.company ? <span> · {item.company}</span> : null}</li>
            ))}
            {hidden > 0 && <li className="delete-lead-more">and {hidden} more</li>}
          </ul>
        )}
        {lostReasons.length > 0 && (
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 mt-3">
            Lost reason (optional)
            <select
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 bg-white outline-none focus:border-blue-400"
              value={reasonId}
              onChange={(event) => setReasonId(event.target.value)}
              disabled={isSaving}
            >
              <option value="">No reason</option>
              {lostReasons.map((reason) => (
                <option key={reason.id} value={reason.id}>{reason.name || reason.label}</option>
              ))}
            </select>
          </label>
        )}
        <div className="delete-lead-actions">
          <button type="button" className="btn-outline" onClick={close} disabled={isSaving} autoFocus>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={handleConfirm} disabled={isSaving}>
            {isSaving ? "Saving…" : `Mark ${count === 1 ? "Lead" : `${count} Leads`} as Lost`}
          </button>
        </div>
      </section>
    </div>
  );
}
