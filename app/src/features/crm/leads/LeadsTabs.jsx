import {
  ChevronDown,
  Filter,
  ChevronsUpDown,
  List,
  LayoutGrid,
  SquareChartGantt,
  MapPin,
  MoreHorizontal,
  Plus,
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
  recordActionLeads,
  onCloseRecordAction,
  onDeleteRecord,
  onPinRecord,
}) {
  const hasRecordAction = Boolean(recordActionLead) || (recordActionLeads && recordActionLeads.length > 0);
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
        </div>
        <div className="tabs-actions">
          <button type="button" className="create-lead-btn" onClick={onCreateLead}>
            <Plus size={16} strokeWidth={2.5} />
            Create Lead
          </button>
          <button type="button" className="create-lead-split" aria-label="More create options">
            <ChevronDown size={16} />
          </button>
          <button type="button" className="toolbar-more" aria-label="More options">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
      <div className={`list-toolbar${hasRecordAction ? " list-toolbar-actions" : ""}`}>
        {hasRecordAction ? (
          <RecordActionPanel
            lead={recordActionLead}
            leads={recordActionLeads || []}
            onClose={onCloseRecordAction}
            onDelete={onDeleteRecord}
            onPin={onPinRecord}
          />
        ) : (
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
          <ViewButton label="List View" active={leadView === "list"} onClick={() => onLeadViewChange("list")}>
            <List size={18} />
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
          <button type="button" className="toolbar-icon" aria-label="More toolbar options">
            <ChevronDown size={16} />
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
