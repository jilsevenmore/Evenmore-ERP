import { useEffect, useState } from "react";
import { Activity, ArrowUpDown, MoreVertical, NotebookPen, Pencil, Phone, Pin, UserCheck } from "lucide-react";
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

export default function LeadsTable({ rows = [], selected = [], pinnedLeadIds = [], onToggleOne, onToggleAll, onTogglePin, onAddNote, onOpenLead, onEditLead, onConvertLead, onUpdateLead, variant = "list" }) {
  const allChecked = rows.length > 0 && rows.every((row) => selected.includes(row.id));
  const [openMenuId, setOpenMenuId] = useState(null);
  // The menu is fixed to the viewport: inside the table's scroll box an
  // absolutely placed menu was clipped to the row's height and never showed.
  const [menuPos, setMenuPos] = useState(null);

  function toggleMenu(rowId, event) {
    if (openMenuId === rowId) {
      setOpenMenuId(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 180;
    const openUp = rect.bottom + menuHeight + 8 > window.innerHeight;
    setMenuPos({
      right: Math.max(8, window.innerWidth - rect.right),
      ...(openUp ? { top: "auto", bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
    });
    setOpenMenuId(rowId);
  }

  // Close on an outside click, a scroll or a resize (the fixed spot goes stale).
  useEffect(() => {
    if (openMenuId === null) return undefined;
    const close = () => setOpenMenuId(null);
    const onPointerDown = (event) => {
      if (!event.target.closest?.(".activity-action-wrap")) close();
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [openMenuId]);

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
                  // Replaced: also called onRequestDeleteAll(rows), which opened the
                  // delete dialog on every tick. Selecting only selects now; Delete
                  // lives in the selection bar above the table.
                  onChange={() => onToggleAll?.()}
                  aria-label="Select all"
                />
              </th>
              <th>Lead ID</th>
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
                      onChange={() => onToggleOne?.(row.id)}
                      aria-label={`Select ${row.name}`}
                    />
                  </td>
                  <td className="muted nowrap">{row.leadNumber || "—"}</td>
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
                        aria-expanded={openMenuId === row.id}
                        onClick={(event) => toggleMenu(row.id, event)}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openMenuId === row.id && (
                        <div className="activity-menu" role="menu" style={{ position: "fixed", left: "auto", zIndex: 60, ...menuPos }}>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onEditLead?.(row);
                            }}
                          >
                            <Pencil size={16} />
                            Edit Lead Information
                          </button>
                          {/* A lead with a customer party is converted already. */}
                          <button
                            type="button"
                            disabled={Boolean(row.party)}
                            title={row.party ? "Already converted to a customer" : undefined}
                            style={row.party ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                            onClick={() => {
                              setOpenMenuId(null);
                              onConvertLead?.(row);
                            }}
                          >
                            <UserCheck size={16} />
                            {row.party ? "Converted to Customer" : "Convert to Customer"}
                          </button>
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
                              onOpenLead?.(row);
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
                <td colSpan={12} className="empty-row">No leads match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
