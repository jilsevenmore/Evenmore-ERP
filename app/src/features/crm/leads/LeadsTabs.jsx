import {
  ChevronDown,
  ChevronsUpDown,
  Filter,
  Printer,
  LayoutGrid,
  SquareChartGantt,
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
  onOpenGuide,
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
          <button
            type="button"
            onClick={onOpenGuide}
            className="inline-flex items-center gap-2 rounded-[12px] border-2 border-[#1d6bff] bg-[#f2f7ff] px-3 py-2.5 text-[13px] font-semibold text-[#1d6bff]"
            aria-label="How to create a lead"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#1d6bff] text-[12px] font-bold text-white">?</span>
            <span>How to create a lead?</span>
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
          {hasRecordAction && (
            <RecordActionPanel
              lead={recordActionLead}
              leads={recordActionLeads}
              onClose={onCloseRecordAction}
              onDelete={onDeleteRecord}
            />
          )}
        </div>
      </div>
    </div>
  );
}
