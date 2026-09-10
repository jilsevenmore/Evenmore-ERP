import { useState } from "react";
import { Activity, ArrowUpDown, ClipboardCheck, MoreVertical, NotebookPen, Phone, Pin } from "lucide-react";
import LeadAvatar from "./LeadAvatar";

function EditableCell({ row, field, className = "", onUpdate, renderValue }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(row[field] ?? "");

  function startEditing() {
    setValue(row[field] ?? "");
    setEditing(true);
  }

  function save() {
    const nextValue = value.trim();
    if (nextValue !== String(row[field] ?? "")) {
      onUpdate?.(row.id, { [field]: nextValue });
    }
    setEditing(false);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") save();
    if (event.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <td className={className}>
        <input
          className="table-inline-input"
          value={value}
          autoFocus
          onChange={(event) => setValue(event.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          aria-label={`Edit ${field}`}
        />
      </td>
    );
  }

  return (
    <td className={className} onDoubleClick={startEditing} title="Double-click to edit">
      {renderValue ? renderValue(row) : row[field]}
    </td>
  );
}

function RowActions({ row, selected, isPinned, onToggleOne, onTogglePin, onRequestDelete, onAddNote, onCreateTask }) {
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  function createTask() {
    setIsActivityOpen(false);
    onCreateTask?.(row);
  }

  return (
    <td className="lead-row-actions">
      <button
        type="button"
        className="row-action-icon"
        onClick={() => onAddNote?.(row)}
        aria-label={`Add note for ${row.name}`}
      >
        <NotebookPen size={15} />
        <span className="toolbar-tooltip">Add Note</span>
      </button>
      <input
        type="checkbox"
        className="row-check"
        checked={selected.includes(row.id)}
        onChange={() => {
          onToggleOne?.(row.id);
          onRequestDelete?.(row);
        }}
        aria-label={`Select ${row.name}`}
      />
      <div className="activity-action-wrap">
        <button
          type="button"
          className="row-action-icon"
          onClick={() => setIsActivityOpen((current) => !current)}
          aria-label={`Add activity for ${row.name}`}
        >
          <Activity size={15} />
          <span className="toolbar-tooltip">Add Activity</span>
        </button>
        {isActivityOpen && (
          <div className="activity-menu">
            <button type="button" onClick={createTask}>
              <ClipboardCheck size={16} />
              Create Task
            </button>
          </div>
        )}
      </div>
      {isPinned && (
        <button
          type="button"
          className="pinned-indicator"
          title="Unpin record"
          aria-label={`Unpin ${row.name}`}
          onClick={() => onTogglePin?.(row.id)}
        >
          <Pin size={14} />
        </button>
      )}
    </td>
  );
}

export default function LeadsTable({ rows = [], selected = [], pinnedLeadIds = [], onToggleOne, onToggleAll, onTogglePin, onRequestDelete, onRequestDeleteAll, onAddNote, onCreateTask, onOpenLead, onUpdateLead, variant = "list" }) {
  const allChecked = rows.length > 0 && rows.every((row) => selected.includes(row.id));

  return (
    <div className={`table-card screenshot-table-card${variant === "grid" ? " grid-table-card" : ""}`}>
      <div className="table-scroll">
        <table className="leads-table screenshot-table">
          <thead>
            <tr>
              <th className="col-check">
                <input
                  type="checkbox"
                  className="row-check"
                  checked={allChecked}
                  onChange={() => {
                    onToggleAll?.();
                    onRequestDeleteAll?.(rows);
                  }}
                  aria-label="Select all"
                />
              </th>
              <th>
                <span className="th-inner">Lead Name <ArrowUpDown size={13} className="sort-ico" /></span>
              </th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Lead Source</th>
              <th>Title</th>
              <th>Industry</th>
              <th>Lead Owner</th>
              <th>
                <span className="th-inner">Created On <ArrowUpDown size={13} className="sort-ico" /></span>
              </th>
              <th className="col-more"><MoreVertical size={15} /></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              return (
                <tr key={row.id}>
                  <RowActions
                    row={row}
                    selected={selected}
                    isPinned={pinnedLeadIds.includes(row.id)}
                    onToggleOne={onToggleOne}
                    onTogglePin={onTogglePin}
                    onRequestDelete={onRequestDelete}
                    onAddNote={onAddNote}
                    onCreateTask={onCreateTask}
                  />
                  <EditableCell
                    row={row}
                    field="name"
                    onUpdate={onUpdateLead}
                    renderValue={(lead) => (
                      <button
                        type="button"
                        className="lead-link-btn"
                        onClick={() => onOpenLead?.(lead)}
                        aria-label={`Open details for ${lead.name}`}
                      >
                        <LeadAvatar
                          lead={lead}
                          className={variant === "grid" ? "grid-lead-avatar" : "screenshot-avatar"}
                        />
                        <strong>{lead.name}</strong>
                      </button>
                    )}
                  />
                  <EditableCell row={row} field="company" className="muted" onUpdate={onUpdateLead} />
                  <EditableCell row={row} field="email" className="mail-link" onUpdate={onUpdateLead} />
                  <EditableCell
                    row={row}
                    field="phone"
                    onUpdate={onUpdateLead}
                    renderValue={(lead) => (
                      <span className="phone-cell">
                        <span>{lead.phone}</span>
                        <Phone size={15} strokeWidth={1.8} />
                      </span>
                    )}
                  />
                  <EditableCell row={row} field="source" className="muted" onUpdate={onUpdateLead} />
                  <EditableCell row={row} field="jobTitle" className="muted" onUpdate={onUpdateLead} />
                  <EditableCell row={row} field="industry" className="muted" onUpdate={onUpdateLead} />
                  <EditableCell row={row} field="owner" className="muted" onUpdate={onUpdateLead} />
                  <EditableCell row={row} field="createdOn" className="muted nowrap" onUpdate={onUpdateLead} />
                  <td>
                    <button type="button" className="row-more" aria-label={`More actions for ${row.name}`}>
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="empty-row">No leads match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
