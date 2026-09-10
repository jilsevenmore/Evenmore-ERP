import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Mail,
  MapPin,
  Phone,
  Search,
  Settings2,
  X,
} from "lucide-react";
import LeadAvatar from "./LeadAvatar";

import { formatCurrency } from "../../../utils/currencyUtils";

function formatAmount(value) {
  const activeCurrency = localStorage.getItem('evenmore_currency') || 'USD ($)';
  return formatCurrency(value || 0, activeCurrency, { noDecimals: true });
}

function getStatusTone(status) {
  const normalized = status.toLowerCase();
  if (normalized.includes("qualified")) return "green";
  if (normalized.includes("contact")) return "blue";
  if (normalized.includes("lost") || normalized.includes("junk")) return "red";
  return "pink";
}

export default function LeadMapView({
  rows = [],
  selected = [],
  onToggleOne,
  onAddNote,
  onOpenListView,
  onOpenLead,
}) {
  const [activeLeadId, setActiveLeadId] = useState(rows[0]?.id ?? null);

  useEffect(() => {
    if (!rows.some((row) => row.id === activeLeadId)) {
      setActiveLeadId(rows[0]?.id ?? null);
    }
  }, [rows, activeLeadId]);

  const activeLead = useMemo(
    () => rows.find((row) => row.id === activeLeadId) ?? rows[0] ?? null,
    [rows, activeLeadId],
  );

  return (
    <section className="leads-map-page">
      <div className="leads-map-top">
        <div>
          <h2>Leads Map</h2>
          <p>Visualize your leads on a map and explore location-wise opportunities.</p>
        </div>
        <div className="leads-map-view-switch">
          <button type="button" className="btn-outline" onClick={onOpenListView}>
            List View
          </button>
          <button type="button" className="btn-primary">Map View</button>
        </div>
      </div>

      <div className="leads-map-filter-card">
        <label className="leads-map-filter-field">
          <span>Pipeline</span>
          <select defaultValue="Sales">
            <option>Sales</option>
            <option>Support</option>
          </select>
        </label>
        <label className="leads-map-filter-field">
          <span>Status</span>
          <select defaultValue="All Statuses">
            <option>All Statuses</option>
            <option>Qualified</option>
            <option>Contacted</option>
          </select>
        </label>
        <label className="leads-map-filter-field">
          <span>Source</span>
          <select defaultValue="All Sources">
            <option>All Sources</option>
            <option>Cold Call</option>
            <option>Advertisement</option>
          </select>
        </label>
        <label className="leads-map-filter-field">
          <span>Product</span>
          <select defaultValue="All Products">
            <option>All Products</option>
            <option>Endoscopy System</option>
            <option>OT Light</option>
          </select>
        </label>
        <label className="leads-map-filter-field">
          <span>Assigned User</span>
          <select defaultValue="All Users">
            <option>All Users</option>
            <option>Drashti Evenmore</option>
            <option>Priya Mehta</option>
          </select>
        </label>
        <label className="leads-map-filter-field">
          <span>From Date</span>
          <div className="input-icon-wrap">
            <input type="text" placeholder="dd-mm-yyyy" />
            <CalendarDays size={16} />
          </div>
        </label>
        <label className="leads-map-filter-field">
          <span>To Date</span>
          <div className="input-icon-wrap">
            <input type="text" placeholder="dd-mm-yyyy" />
            <CalendarDays size={16} />
          </div>
        </label>
        <label className="leads-map-filter-field">
          <span>Search</span>
          <div className="input-icon-wrap">
            <input type="text" placeholder="Search by name, subject, email, phone, lead number" />
            <Search size={16} />
          </div>
        </label>
      </div>

      <div className="leads-map-layout">
        <aside className="leads-map-list-pane">
          <div className="leads-map-pane-head">
            <h3>Leads ({rows.length})</h3>
            <button type="button" className="leads-map-pane-action">
              Sort
              <ChevronsUpDown size={14} />
            </button>
          </div>

          <div className="leads-map-listing">
            {rows.map((row) => (
              <div
                key={row.id}
                className={`leads-map-list-item${row.id === activeLead?.id ? " active" : ""}`}
              >
                <input
                  type="checkbox"
                  className="row-check"
                  checked={selected.includes(row.id)}
                  onChange={() => onToggleOne(row.id)}
                  aria-label={`Select ${row.name}`}
                />
                <button
                  type="button"
                  className="leads-map-list-main"
                  onClick={() => setActiveLeadId(row.id)}
                >
                  <LeadAvatar lead={row} className="leads-map-list-avatar" />
                  <div className="leads-map-list-copy">
                    <strong>{row.name.replace(" (Sample)", "")}</strong>
                    <span>{row.company}</span>
                    <small>{row.city}, {row.state}</small>
                  </div>
                  <b className={`leads-map-list-amount ${getStatusTone(row.status)}`}>
                    {formatAmount(row.amount)}
                  </b>
                </button>
              </div>
            ))}
          </div>

          <div className="leads-map-pagination">
            <button type="button" className="page-nav"><ChevronLeft size={15} /></button>
            <button type="button" className="page-num active">1</button>
            <button type="button" className="page-num">2</button>
            <button type="button" className="page-num">3</button>
            <span>...</span>
            <button type="button" className="page-nav"><ChevronRight size={15} /></button>
          </div>
        </aside>

        <div className="leads-map-stage">
          <div className="leads-map-stage-top">
            <div className="leads-map-tabs">
              <button type="button" className="active">Map</button>
              <button type="button">Satellite</button>
            </div>
            <button type="button" className="leads-map-focus-btn">
              <Settings2 size={18} />
            </button>
          </div>

          <div className="leads-map-canvas-pro">
            <div className="map-water-edge" />
            <div className="map-region-label ahmedabad">Ahmedabad</div>
            <div className="map-region-label gujarat">GUJARAT</div>
            <div className="map-region-label surat">Surat</div>
            <div className="map-region-label mumbai">Mumbai</div>
            <div className="map-region-label nashik">Nashik</div>
            <div className="map-region-label maharashtra">MAHARASHTRA</div>
            <div className="map-route map-route-one" />
            <div className="map-route map-route-two" />
            <div className="map-route map-route-three" />
            <div className="map-route map-route-four" />

            {rows.map((row, index) => (
              <button
                key={row.id}
                type="button"
                className={`leads-map-marker-pro ${getStatusTone(row.status)}`}
                style={{ left: `${row.mapX}%`, top: `${row.mapY}%` }}
                onClick={() => setActiveLeadId(row.id)}
              >
                <span className="leads-map-marker-photo">
                  <LeadAvatar lead={row} className="leads-map-marker-avatar" />
                </span>
                <span className="leads-map-marker-pill">{formatAmount(row.amount)}</span>
                {index === 1 && <span className="leads-map-cluster-bubble">3</span>}
              </button>
            ))}

            {activeLead && (
              <div
                className="leads-map-info-card"
                style={{ left: `min(calc(${activeLead.mapX}% + 4%), calc(100% - 260px))`, top: `calc(${activeLead.mapY}% + 2%)` }}
              >
                <div className="leads-map-info-head">
                  <LeadAvatar lead={activeLead} className="leads-map-info-avatar" />
                  <div>
                    <strong>{activeLead.name.replace(" (Sample)", "")}</strong>
                    <span>{activeLead.company}</span>
                  </div>
                </div>
                <ul className="leads-map-info-list">
                  <li><MapPin size={14} /> 123, {activeLead.city} Industrial Estate, {activeLead.state}, {activeLead.country}</li>
                  <li><Phone size={14} /> +91 {activeLead.phone}</li>
                  <li><Mail size={14} /> {activeLead.email}</li>
                </ul>
                <button type="button" className="leads-map-link-btn" onClick={() => onOpenLead(activeLead)}>
                  View Details
                </button>
              </div>
            )}

            <div className="leads-map-zoom">
              <button type="button">+</button>
              <button type="button">-</button>
            </div>
          </div>
        </div>

        <aside className="leads-map-detail-pane">
          {activeLead && (
            <>
              <div className="leads-map-detail-head">
                <h3>Lead Details</h3>
                <button type="button" className="modal-close" aria-label="Close lead details">
                  <X size={18} />
                </button>
              </div>

              <div className="leads-map-detail-profile">
                <LeadAvatar lead={activeLead} className="leads-map-detail-avatar" />
                <div>
                  <strong>{activeLead.name.replace(" (Sample)", "")}</strong>
                  <span>{activeLead.company}</span>
                </div>
              </div>

              <div className="leads-map-detail-tags">
                <span className={`lead-status-chip ${getStatusTone(activeLead.status)}`}>{activeLead.status}</span>
                <b>{formatAmount(activeLead.amount)}</b>
              </div>

              <ul className="leads-map-detail-contact">
                <li><Phone size={15} /> +91 {activeLead.phone}</li>
                <li><Mail size={15} /> {activeLead.email}</li>
                <li><MapPin size={15} /> 123, {activeLead.city}, {activeLead.state}, {activeLead.country}</li>
              </ul>

              <div className="leads-map-detail-grid">
                <div><span>Lead Source</span><strong>{activeLead.source}</strong></div>
                <div><span>Assigned User</span><strong>{activeLead.owner}</strong></div>
                <div><span>Created On</span><strong>{activeLead.createdOn}</strong></div>
                <div><span>Pipeline</span><strong>Sales</strong></div>
              </div>

              <button type="button" className="btn-primary leads-map-detail-primary" onClick={() => onOpenLead(activeLead)}>
                View Full Details
              </button>

              <div className="leads-map-detail-actions">
                <button type="button" className="btn-outline">Edit</button>
                <button type="button" className="btn-outline">Create Deal</button>
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
