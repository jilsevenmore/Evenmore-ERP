import React from "react";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Pin,
  UserRound,
  XCircle,
  ExternalLink,
  Tag,
  DollarSign,
} from "lucide-react";
import LeadAvatar from "./LeadAvatar";
import { formatCurrency } from "../../../utils/currencyUtils";
import { useCrmStore } from "../../../stores/crmStore";

export default function LeadCardGridView({
  rows = [],
  selected = [],
  pinnedLeadIds = [],
  onTogglePin,
  onToggleOne,
  onRequestDelete,
  onAddNote,
  onOpenLead,
}) {
  const stages = useCrmStore((s) => s.stages || []);
  const activeCurrency =
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("evenmore_currency")) ||
    "USD ($)";

  const getStageStyle = (row) => {
    const stage = stages.find(
      (s) =>
        s.id === row.stageId ||
        s.name?.toLowerCase() === row.status?.toLowerCase()
    );
    if (stage?.bg && stage?.fg) {
      return { backgroundColor: stage.bg, color: stage.fg, borderColor: stage.color || stage.fg };
    }
    // Defaults for standard statuses
    const statusLower = (row.status || "").toLowerCase();
    if (statusLower.includes("won")) {
      return { backgroundColor: "#f0fdf4", color: "#166534", borderColor: "#86efac" };
    }
    if (statusLower.includes("lost")) {
      return { backgroundColor: "#fef2f2", color: "#991b1b", borderColor: "#fca5a5" };
    }
    if (statusLower.includes("new")) {
      return { backgroundColor: "#eff6ff", color: "#1d4ed8", borderColor: "#93c5fd" };
    }
    if (statusLower.includes("negotiation") || statusLower.includes("demo")) {
      return { backgroundColor: "#fefce8", color: "#854d0e", borderColor: "#fde047" };
    }
    return { backgroundColor: "#f8fafc", color: "#334155", borderColor: "#cbd5e1" };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-2">
      {rows.map((row) => {
        const isSelected = selected.includes(row.id);
        const isPinned = pinnedLeadIds.includes(row.id);
        const stageStyle = getStageStyle(row);

        return (
          <article
            key={row.id}
            className={`group rounded-2xl border transition-all duration-200 flex flex-col justify-between p-4 bg-white relative ${
              isSelected
                ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10 shadow-md"
                : "border-slate-200/90 hover:border-blue-300 hover:shadow-lg shadow-xs"
            }`}
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-colors"
                    checked={isSelected}
                    onChange={() => onToggleOne?.(row.id)}
                    aria-label={`Select ${row.name}`}
                  />
                  <div className="relative shrink-0">
                    <LeadAvatar lead={row} className="h-9 w-9 text-xs rounded-xl shadow-xs" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="text-left font-bold text-slate-900 hover:text-blue-600 transition-colors block truncate text-sm leading-snug w-full"
                      onClick={() => onOpenLead?.(row)}
                      title={`Open details for ${row.name}`}
                    >
                      {row.name || "Untitled Lead"}
                    </button>
                    {row.leadNumber && (
                      <span className="text-[10px] font-semibold text-slate-400 block tracking-wider">
                        {row.leadNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Header Action Icons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      isPinned
                        ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    }`}
                    aria-label={`${isPinned ? "Unpin" : "Pin"} ${row.name}`}
                    title={isPinned ? "Unpin record" : "Pin record"}
                    onClick={() => onTogglePin?.(row)}
                  >
                    <Pin size={13} fill={isPinned ? "currentColor" : "none"} />
                  </button>

                  <button
                    type="button"
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    onClick={() => onRequestDelete?.(row)}
                    aria-label={`Mark ${row.name} as lost`}
                    title="Mark as Lost"
                  >
                    <XCircle size={14} />
                  </button>

                  <button
                    type="button"
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => onOpenLead?.(row)}
                    aria-label={`Open ${row.name}`}
                    title="View details"
                  >
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>

              {/* Status & Company Badges */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs"
                  style={stageStyle}
                >
                  <span className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: stageStyle.color }} />
                  {row.status || "Unknown Stage"}
                </span>

                {row.company && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 truncate max-w-[170px]" title={row.company}>
                    <Building2 size={11} className="shrink-0 text-slate-500" />
                    <span className="truncate">{row.company}</span>
                  </span>
                )}
              </div>

              {/* Lead Details Body */}
              <div className="mt-3.5 space-y-2 text-xs text-slate-600">
                {row.email ? (
                  <a
                    href={`mailto:${row.email}`}
                    className="flex items-center gap-2 hover:text-blue-600 transition-colors truncate text-slate-600"
                    title={row.email}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{row.email}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 italic">
                    <Mail size={13} className="shrink-0" />
                    <span>No email provided</span>
                  </div>
                )}

                {row.phone ? (
                  <a
                    href={`tel:${row.phone}`}
                    className="flex items-center gap-2 hover:text-blue-600 transition-colors truncate text-slate-600"
                    title={row.phone}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{row.phone}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 italic">
                    <Phone size={13} className="shrink-0" />
                    <span>No phone number</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-slate-600 truncate" title={`Owner: ${row.owner || "Unassigned"}`}>
                  <UserRound size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">
                    <span className="text-slate-400 mr-1">Owner:</span>
                    <strong className="font-medium text-slate-700">{row.owner || "Unassigned"}</strong>
                  </span>
                </div>

                {(row.city || row.state) && (
                  <div className="flex items-center gap-2 text-slate-500 truncate" title={`${row.city || ""}${row.city && row.state ? ", " : ""}${row.state || ""}`}>
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{[row.city, row.state].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                <Tag size={11} className="text-slate-400 shrink-0" />
                <span className="truncate max-w-[100px]">{row.source || "Direct"}</span>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  {formatCurrency(row.amount || 0, activeCurrency, { noDecimals: true })}
                </span>
              </div>
            </div>
          </article>
        );
      })}

      {rows.length === 0 && (
        <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Building2 size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No leads found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No leads match the current filters or tab selection. Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
