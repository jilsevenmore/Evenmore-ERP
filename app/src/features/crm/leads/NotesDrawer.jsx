import { NotebookPen, Paperclip, Type, X, SquareArrowOutUpRight } from "lucide-react";
import LeadAvatar from "./LeadAvatar";

export default function NotesDrawer({ lead, isOpen, onClose, onCreateTask }) {
  if (!isOpen || !lead) return null;

  return (
    <div className="notes-overlay" role="presentation" onClick={onClose}>
      <aside
        className="notes-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notes-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="notes-head">
          <div className="notes-lead-head">
            <LeadAvatar lead={lead} className="notes-avatar" />
            <div>
              <div className="notes-kicker">Notes</div>
              <h2 id="notes-drawer-title">{lead.name}</h2>
              <p>{lead.company}</p>
            </div>
          </div>
          <div className="notes-head-actions">
            <button type="button" className="btn-outline" onClick={() => onCreateTask(lead)}>
              <SquareArrowOutUpRight size={16} />
              Create Task
            </button>
            <button type="button" className="notes-close" onClick={onClose} aria-label="Close notes">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="note-card">
          <label className="note-field">
            <span>Title</span>
            <input type="text" placeholder="What's this note about?" />
          </label>

          <label className="note-field">
            <span>Note</span>
            <textarea rows={10} placeholder="Write follow-up details, client context, or next action..." />
          </label>

          <div className="note-tools">
            <div className="note-tool-icons">
              <button type="button" className="icon-lite" aria-label="Format note">
                <Type size={16} />
              </button>
              <button type="button" className="icon-lite" aria-label="Attach file">
                <Paperclip size={16} />
              </button>
              <button type="button" className="icon-lite" aria-label="Note template">
                <NotebookPen size={16} />
              </button>
            </div>
            <div className="note-actions">
              <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
              <button type="button" className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
