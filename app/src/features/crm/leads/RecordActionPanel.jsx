import { Trash2, UserCheck, X } from "lucide-react";

// Shown above the leads table while any lead is selected. Delete only asks for
// confirmation (the parent opens the dialog); nothing is removed from here.
export default function RecordActionPanel({ lead, leads = [], onClose, onDelete, onBulkAssign }) {
  const selectedLeads = leads.length > 0 ? leads : lead ? [lead] : [];
  if (selectedLeads.length === 0) return null;
  const count = selectedLeads.length;

  function handleDelete() {
    if (count > 1) {
      onDelete(selectedLeads);
      return;
    }
    onDelete(selectedLeads[0].id);
  }

  return (
    <div className="record-action-panel" role="toolbar" aria-label="Selected lead actions">
      <div className="record-action-buttons">
        <span className="record-action-count" aria-live="polite">
          {count} {count === 1 ? "lead" : "leads"} selected
        </span>
        <button
          type="button"
          className="record-action-button"
          onClick={() => onBulkAssign?.(selectedLeads)}
          aria-label="Assign owner to selected leads"
        >
          <UserCheck size={15} />
          <span>Assign Owner</span>
        </button>
        <button
          type="button"
          className="record-action-button delete"
          onClick={handleDelete}
          aria-label={`Delete ${count} selected ${count === 1 ? "lead" : "leads"}`}
        >
          <Trash2 size={15} />
          <span>Delete{count > 1 ? ` (${count})` : ""}</span>
        </button>
        <button type="button" className="record-action-close" onClick={onClose} aria-label="Clear selection" title="Clear selection">
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
