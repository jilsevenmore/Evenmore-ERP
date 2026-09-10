import { Building2, Mail, MapPin, Phone, UserRound } from "lucide-react";
import LeadAvatar from "./LeadAvatar";
import { formatCurrency } from "../../../utils/currencyUtils";

export default function LeadCardGridView({ rows = [], onAddNote, onOpenLead }) {
  const activeCurrency = localStorage.getItem('evenmore_currency') || 'USD ($)';
  return (
    <div className="lead-grid">
      {rows.map((row) => (
        <article key={row.id} className="lead-grid-card">
          <div className="lead-grid-top">
            <div className="lead-grid-person">
              <LeadAvatar lead={row} />
              <div>
                <button type="button" className="lead-name-button" onClick={() => onOpenLead(row)}>
                  <strong>{row.name}</strong>
                </button>
                <span>{row.status}</span>
              </div>
            </div>
            <button type="button" className="lead-grid-open" onClick={() => onAddNote(row)}>
              Open
            </button>
          </div>

          <div className="lead-grid-company">
            <Building2 size={16} />
            <span>{row.company}</span>
          </div>

          <div className="lead-grid-meta">
            <span><Mail size={15} /> {row.email}</span>
            <span><Phone size={15} /> {row.phone}</span>
            <span><UserRound size={15} /> {row.owner}</span>
            <span><MapPin size={15} /> {row.city}, {row.state}</span>
          </div>

          <div className="lead-grid-footer">
            <small>{row.source}</small>
            <b>{formatCurrency(row.amount || 0, activeCurrency, { noDecimals: true })}</b>
          </div>
        </article>
      ))}

      {rows.length === 0 && (
        <div className="table-card lead-grid-empty">
          No leads match the current filters.
        </div>
      )}
    </div>
  );
}
