import { ArrowLeft, CalendarClock, ClipboardList, FileText, NotebookPen, UserRound } from "lucide-react";
import LeadAvatar from "../leads/LeadAvatar";

export default function TaskForm({ lead, onAddNote, onBack }) {
  return (
    <section className="task-form-shell">
      <div className="task-form-top">
        <button type="button" className="back-link" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to Leads
        </button>
        <button type="button" className="btn-outline" onClick={() => onAddNote(lead)}>
          <NotebookPen size={16} />
          Add Note
        </button>
      </div>

      <div className="task-form-card">
        <div className="task-form-head">
          <div className="task-lead-head">
            {lead && <LeadAvatar lead={lead} className="task-lead-avatar" />}
            <div>
              <div className="task-form-kicker">Lead Task Form</div>
              <h2>Create task for {lead?.name ?? "selected lead"}</h2>
              <p>
                Task will stay linked with {lead?.company ?? "this lead"} so your note and follow-up flow stay together.
              </p>
            </div>
          </div>
          <div className="task-lead-badge">
            <UserRound size={18} />
            <span>{lead?.owner ?? "Owner not assigned"}</span>
          </div>
        </div>

        <div className="task-grid">
          <label className="task-field">
            <span>Task Title</span>
            <input type="text" defaultValue={lead ? `Follow up with ${lead.name}` : ""} placeholder="Enter task title" />
          </label>

          <label className="task-field">
            <span>Status</span>
            <select defaultValue="Open">
              <option>Open</option>
              <option>In Progress</option>
              <option>Waiting</option>
              <option>Completed</option>
            </select>
          </label>

          <label className="task-field">
            <span>Due Date</span>
            <input type="date" />
          </label>

          <label className="task-field">
            <span>Priority</span>
            <select defaultValue="Medium">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </label>

          <label className="task-field task-field-wide">
            <span>Description</span>
            <textarea rows={6} placeholder="Add task instructions, owner notes, and expected next step..." />
          </label>
        </div>

        <div className="task-summary">
          <div className="summary-card">
            <ClipboardList size={18} />
            <div>
              <strong>Lead Source</strong>
              <span>{lead?.source ?? "Not available"}</span>
            </div>
          </div>
          <div className="summary-card">
            <CalendarClock size={18} />
            <div>
              <strong>Created On</strong>
              <span>{lead?.createdOn ?? "Not available"}</span>
            </div>
          </div>
          <div className="summary-card">
            <FileText size={18} />
            <div>
              <strong>Lead Email</strong>
              <span>{lead?.email ?? "Not available"}</span>
            </div>
          </div>
        </div>

        <div className="task-form-actions">
          <button type="button" className="btn-outline" onClick={() => onAddNote(lead)}>Open Notes</button>
          <button type="button" className="btn-primary">Save Task</button>
        </div>
      </div>
    </section>
  );
}
