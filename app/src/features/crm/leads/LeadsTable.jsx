import { useState } from "react";
import { Activity, ArrowUpDown, MoreVertical, NotebookPen, Phone, Pin } from "lucide-react";
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

export default function LeadsTable({ rows = [], selected = [], pinnedLeadIds = [], onToggleOne, onToggleAll, onTogglePin, onRequestDelete, onRequestDeleteAll, onAddNote, onCreateTask, onOpenLead, onUpdateLead, variant = "list" }) {
  const allChecked = rows.length > 0 && rows.every((row) => selected.includes(row.id));
  const [openMenuId, setOpenMenuId] = useState(null);

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
                  <td className="lead-row-actions">
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
                  </td>
                  <EditableCell
                    row={row}
                    field="name"
                    onUpdate={onUpdateLead}
                    renderValue={(lead) => (
                      <div className="lead-name-cell">
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
                        <button
                          type="button"
                          className={`pinned-indicator${pinnedLeadIds.includes(lead.id) ? " active" : ""}`}
                          title={pinnedLeadIds.includes(lead.id) ? "Unpin record" : "Pin record"}
                          aria-label={`${pinnedLeadIds.includes(lead.id) ? "Unpin" : "Pin"} ${lead.name}`}
                          aria-pressed={pinnedLeadIds.includes(lead.id)}
                          onClick={() => onTogglePin?.(lead)}
                        >
                          <Pin size={14} fill={pinnedLeadIds.includes(lead.id) ? "currentColor" : "none"} />
                        </button>
                      </div>
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
                    <div className="activity-action-wrap">
                      <button
                        type="button"
                        className="row-more"
                        aria-label={`More actions for ${row.name}`}
                        onClick={() => setOpenMenuId((current) => (current === row.id ? null : row.id))}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openMenuId === row.id && (
                        <div className="activity-menu" style={{ left: "auto", right: 0 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onAddNote?.(row);
                            }}
                          >
                            <NotebookPen size={16} />
                            Add Note
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onCreateTask?.(row);
                            }}
                          >
                            <Activity size={16} />
                            Add Activity
                          </button>
                        </div>
                      )}
                    </div>
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
