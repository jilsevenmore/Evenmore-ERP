import { Pin, Trash2, X } from "lucide-react";

export default function RecordActionPanel({ lead, leads = [], onClose, onDelete, onPin }) {
  const isBulk = leads.length > 0;
  if (!lead && !isBulk) return null;

  function handleDelete() {
    if (isBulk) {
      onDelete(leads);
      return;
    }
    onDelete(lead.id);
  }

  function handlePin() {
    if (isBulk) {
      leads.forEach((item) => onPin(item));
      onClose();
      return;
    }
    onPin(lead);
  }

  return (
    <div className="record-action-panel" role="toolbar" aria-label="Record actions">
      <div className="record-action-copy">
        <strong>{isBulk ? `${leads.length} records selected` : lead.name}</strong>
        <span>{isBulk ? "Choose an action" : "Choose an action for this record"}</span>
      </div>
      <div className="record-action-buttons">
        <button type="button" className="record-action-button delete" onClick={handleDelete} aria-label="Delete record">
          <Trash2 size={17} />
          <span>Delete</span>
        </button>
        <button type="button" className="record-action-button pin" onClick={handlePin} aria-label="Pin record">
          <Pin size={17} />
          <span>Pin</span>
        </button>
        <button type="button" className="record-action-close" onClick={onClose} aria-label="Close record actions">
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
