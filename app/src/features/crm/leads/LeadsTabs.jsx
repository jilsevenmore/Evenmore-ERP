import {
  ChevronDown,
  ChevronsUpDown,
  Filter,
  Printer,
  LayoutGrid,
  SquareChartGantt,
  MapPin,
  MoreHorizontal,
} from "lucide-react";
import { tabs } from '../../../data/crm/mockLeads';
import SortPopover from "./SortPopover";
import RecordActionPanel from "./RecordActionPanel";

function ViewButton({ label, active, onClick, children }) {
  return (
    <button
      type="button"
      className={`toolbar-icon tooltip-anchor${active ? " active" : ""}`}
      aria-label={label}
      onClick={onClick}
    >
      {children}
      <span className="toolbar-tooltip">{label}</span>
    </button>
  );
}

export default function LeadsTabs({
  activeTab,
  onChange,
  isFilterOpen,
  onToggleFilter,
  isSortOpen,
  sortDraft,
  sortApplied,
  sortOptions,
  onToggleSort,
  onSortDraftChange,
  onApplySort,
  onCancelSort,
  onClearSort,
  leadView,
  onLeadViewChange,
  onCreateLead,
  recordActionLead,
  recordActionLeads = [],
  onCloseRecordAction,
  onDeleteRecord,
  onPrint,
}) {
  const hasRecordAction = Boolean(recordActionLead) || recordActionLeads.length > 0;
  return (
    <div className="leads-toolbar-wrap">
      <div className="tabs-bar">
        <div className="tabs-list" role="tablist">
          {tabs.slice(0, 1).map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={activeTab === t.key}
              type="button"
              onClick={() => onChange(t.key)}
              className={`tab-dropdown${activeTab === t.key ? " active" : ""}`}
            >
              {t.label}
              <ChevronDown size={16} />
            </button>
          ))}
          <button type="button" className="toolbar-ghost" aria-label="More lead views">
            <MoreHorizontal size={20} />
          </button>
          <div className="group relative inline-block">
            <div className="invisible absolute bottom-[calc(100%+2px)] left-0 z-20 flex translate-y-1 flex-col items-start opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <button
                type="button"
                onClick={onCreateLead}
                className="inline-flex w-max max-w-[260px] items-start gap-2.5 rounded-[16px] bg-[#1d6bff] px-4 py-3 text-left text-[14px] font-medium leading-snug text-white shadow-[0_4px_14px_rgba(29,107,255,0.35)]"
                aria-label="Click here to learn how to create a lead"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-bold text-[#1d6bff]">1</span>
                <span>Click here to learn<br />how to create a lead</span>
              </button>
              <svg width="72" height="42" viewBox="0 0 72 42" fill="none" className="ml-[52px] mt-[-6px]" aria-hidden="true">
                <path d="M6 2 C 6 26, 22 37, 50 34" stroke="#1d6bff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M41 26 L52 34 L41 40" stroke="#1d6bff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <button
              type="button"
              onClick={onCreateLead}
              className="inline-flex items-center gap-2 rounded-[12px] border-2 border-[#1d6bff] bg-[#f2f7ff] px-3 py-2.5 text-[13px] font-semibold text-[#1d6bff]"
              aria-label="How to create a lead"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#1d6bff] text-[12px] font-bold text-white">?</span>
              <span>How to create a lead?</span>
            </button>
          </div>
        </div>
        <div className="tabs-actions">
          <button type="button" className="toolbar-more" aria-label="More options">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
      <div className={`list-toolbar${hasRecordAction ? " list-toolbar-actions" : ""}`}>
        <div className="list-toolbar-left">
          <button
            type="button"
            className={`toolbar-pill${isFilterOpen ? " active" : ""}`}
            onClick={onToggleFilter}
          >
            <Filter size={18} />
            Filter
          </button>
          <SortPopover
            isOpen={isSortOpen}
            sortDraft={sortDraft}
            sortApplied={sortApplied}
            options={sortOptions}
            onToggle={onToggleSort}
            onDraftChange={onSortDraftChange}
            onApply={onApplySort}
            onCancel={onCancelSort}
            onClear={onClearSort}
          />
          <button type="button" className="toolbar-icon" aria-label="Sort settings">
            <ChevronsUpDown size={16} />
          </button>
          <ViewButton label="Print Leads" onClick={onPrint}>
            <Printer size={18} />
          </ViewButton>
          <ViewButton label="Grid View" active={leadView === "grid"} onClick={() => onLeadViewChange("grid")}>
            <LayoutGrid size={18} />
          </ViewButton>
          <ViewButton label="Tile View" active={leadView === "tile"} onClick={() => onLeadViewChange("tile")}>
            <SquareChartGantt size={18} />
          </ViewButton>
          <ViewButton label="Map View" active={leadView === "map"} onClick={() => onLeadViewChange("map")}>
            <MapPin size={18} />
          </ViewButton>
          {hasRecordAction && (
            <RecordActionPanel
              lead={recordActionLead}
              leads={recordActionLeads}
              onClose={onCloseRecordAction}
              onDelete={onDeleteRecord}
            />
          )}
          <button type="button" className="toolbar-icon" aria-label="More toolbar options">
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
