import { ArrowUpDown, MoreVertical, Phone } from "lucide-react";
import LeadAvatar from "./LeadAvatar";

export default function LeadsTable({ rows = [], selected = [], onToggleOne, onToggleAll, onAddNote, onOpenLead }) {
  const allChecked = rows.length > 0 && rows.every((row) => selected.includes(row.id));

  return (
    <div className="table-card screenshot-table-card">
      <div className="table-scroll">
        <table className="leads-table screenshot-table">
          <thead>
            <tr>
              <th className="col-check">
                <input
                  type="checkbox"
                  className="row-check"
                  checked={allChecked}
                  onChange={onToggleAll}
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
                  <td>
                    <input
                      type="checkbox"
                      className="row-check"
                      checked={selected.includes(row.id)}
                      onChange={() => onToggleOne(row.id)}
                      aria-label={`Select ${row.name}`}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="lead-link-btn"
                      onClick={() => onOpenLead(row)}
                      aria-label={`Open details for ${row.name}`}
                    >
                      <LeadAvatar lead={row} className="screenshot-avatar" />
                      <strong>{row.name}</strong>
                    </button>
                  </td>
                  <td className="muted">{row.company}</td>
                  <td><span className="mail-link">{row.email}</span></td>
                  <td>
                    <span className="phone-cell">
                      <span>{row.phone}</span>
                      <Phone size={15} strokeWidth={1.8} />
                    </span>
                  </td>
                  <td className="muted">{row.source}</td>
                  <td className="muted">{row.owner}</td>
                  <td className="muted nowrap">{row.createdOn}</td>
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
                <td colSpan={9} className="empty-row">No leads match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
