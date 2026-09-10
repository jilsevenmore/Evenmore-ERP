import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import LeadsTabs from './LeadsTabs';
import FilterPanel from './FilterPanel';
import LeadsTable from './LeadsTable';
import LeadCardGridView from './LeadCardGridView';
import LeadGridView from './LeadGridView';
import LeadMapView from './LeadMapView';
import Pagination from '../../../components/ui/Pagination';
import NotesDrawer from './NotesDrawer';
import CreateLeadModal from './CreateLeadModal';
import DeleteLeadModal from './DeleteLeadModal';
import { useNavigate } from 'react-router-dom';
import { leads as seedLeads } from '../../../data/crm/mockLeads';

const INITIAL_FILTERS = { statuses: [], sources: [], systemDefined: [], search: '' };
const INITIAL_SORT = { field: '', direction: 'ascending' };

const SORT_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'name', label: 'Lead Name' },
  { value: 'company', label: 'Company' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'source', label: 'Lead Source' },
  { value: 'owner', label: 'Lead Owner' },
  { value: 'status', label: 'Lead Status' },
  { value: 'createdOn', label: 'Created On' },
];

function getSortValue(lead, field) {
  if (field === 'createdOn') return new Date(lead.createdOn).getTime();
  return String(lead[field] ?? '').toLowerCase();
}

export default function LeadsPage() {
  const navigate = useNavigate();
  const [leadRows, setLeadRows] = useState(seedLeads);
  const [activeTab, setActiveTab] = useState('All Leads');
  const [selected, setSelected] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [leadView, setLeadView] = useState('list');
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [draftFilters, setDraftFilters] = useState(INITIAL_FILTERS);
  const [appliedSort, setAppliedSort] = useState(INITIAL_SORT);
  const [draftSort, setDraftSort] = useState(INITIAL_SORT);
  const [noteTarget, setNoteTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteTargets, setBulkDeleteTargets] = useState([]);
  const [pinnedLeadIds, setPinnedLeadIds] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const rows = useMemo(() => {
    const filtered = leadRows.filter((l) => {
      if (activeTab !== 'All Leads' && l.status !== activeTab) return false;
      if (appliedFilters.statuses.length > 0 && !appliedFilters.statuses.includes(l.status)) return false;
      if (appliedFilters.sources.length > 0 && !appliedFilters.sources.includes(l.source)) return false;
      if (appliedFilters.search) {
        const h = `${l.name} ${l.company} ${l.email} ${l.phone}`.toLowerCase();
        if (!h.includes(appliedFilters.search.toLowerCase())) return false;
      }
      return true;
    });

    if (!appliedSort.field) return filtered;
    const dir = appliedSort.direction === 'descending' ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const av = getSortValue(a, appliedSort.field);
      const bv = getSortValue(b, appliedSort.field);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return a.id - b.id;
    });
  }, [activeTab, appliedFilters, appliedSort, leadRows]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, appliedFilters, appliedSort, leadRows, pageSize]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  function handlePageSizeChange(nextSize) {
    setPageSize(nextSize);
    setPage(1);
  }

  function updateLead(id, updates) {
    setLeadRows((current) => current.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead)));
  }

  const toggleOne = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleAll = () => {
    const ids = rows.map((r) => r.id);
    const allIn = ids.length > 0 && ids.every((id) => selected.includes(id));
    setSelected(allIn ? selected.filter((id) => !ids.includes(id)) : [...new Set([...selected, ...ids])]);
  };

  function openNotes(lead) {
    setNoteTarget(lead ?? selectedLead);
  }

  function closeNotes() {
    setNoteTarget(null);
  }

  function openLeadDetails(lead) {
    const target = lead ?? selectedLead;
    if (!target) return;
    navigate(`/crm/leads/${target.id}`);
  }

  function goToLeads() {
    navigate('/crm/leads');
  }

  function openTaskForm(lead) {
    const target = lead ?? selectedLead;
    if (target && !selected.includes(target.id)) {
      setSelected([target.id]);
    }
    navigate('/crm/tasks');
  }

  function openFilterPanel() {
    setDraftFilters(appliedFilters);
    setIsFilterOpen(true);
  }

  function closeFilterPanel() {
    setDraftFilters(appliedFilters);
    setIsFilterOpen(false);
  }

  function openSortPanel() {
    setDraftSort(appliedSort);
    setIsSortOpen(true);
  }

  function closeSortPanel() {
    setDraftSort(appliedSort);
    setIsSortOpen(false);
  }

  function updateDraftFilter(key, value) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function updateDraftSort(key, value) {
    setDraftSort((current) => ({ ...current, [key]: value }));
  }

  function clearDraftFilters() {
    setDraftFilters(INITIAL_FILTERS);
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
    setIsFilterOpen(false);
  }

  function applySort() {
    setAppliedSort(draftSort.field ? draftSort : INITIAL_SORT);
    setIsSortOpen(false);
  }

  function clearSort() {
    setAppliedSort(INITIAL_SORT);
    setDraftSort(INITIAL_SORT);
    setIsSortOpen(false);
  }

  function openCreateLeadModal() {
    setIsCreateLeadOpen(true);
  }

  function openLeadFormBuilder() {
    navigate('/crm/leads/form-builder');
  }

  function openLeadCreateForm() {
    navigate('/crm/leads/create-form');
  }

  function requestDeleteLead(lead) {
    setDeleteTarget(lead);
    setBulkDeleteTargets([]);
  }

  function requestDeleteAll(visibleLeads) {
    if (!visibleLeads || visibleLeads.length === 0) return;
    setDeleteTarget(null);
    setBulkDeleteTargets(visibleLeads);
  }

  function closeDeleteLead() {
    setDeleteTarget(null);
    setBulkDeleteTargets([]);
  }

  function deleteLead(id) {
    setLeadRows((current) => current.filter((lead) => lead.id !== id));
    setSelected((current) => current.filter((selectedId) => selectedId !== id));
    closeDeleteLead();
  }

  function deleteAllLeads(leadsToDelete) {
    const ids = new Set(leadsToDelete.map((lead) => lead.id));
    setLeadRows((current) => current.filter((lead) => !ids.has(lead.id)));
    setSelected((current) => current.filter((id) => !ids.has(id)));
    closeDeleteLead();
  }

  function pinLead(lead) {
    setPinnedLeadIds((current) => (current.includes(lead.id) ? current : [...current, lead.id]));
    setSelected((current) => current.filter((id) => id !== lead.id));
    closeDeleteLead();
  }

  function togglePinLead(id) {
    setPinnedLeadIds((current) => current.filter((pinnedId) => pinnedId !== id));
  }

  const selectedLead = leadRows.find((l) => selected.includes(l.id)) ?? rows[0] ?? leadRows[0];

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle="Manage and track all your CRM leads."
        actions={
          <>
            <button type="button" className="btn-outline btn-sm" onClick={() => setIsFilterOpen(!isFilterOpen)}>
              Filter
            </button>
            <button type="button" className="btn-primary btn-sm" onClick={() => setIsCreateLeadOpen(true)}>
              + Create Lead
            </button>
          </>
        }
      />

      <LeadsTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        isFilterOpen={isFilterOpen}
        onToggleFilter={() => (isFilterOpen ? closeFilterPanel() : openFilterPanel())}
        isSortOpen={isSortOpen}
        sortDraft={draftSort}
        sortApplied={appliedSort}
        sortOptions={SORT_OPTIONS}
        onToggleSort={() => (isSortOpen ? closeSortPanel() : openSortPanel())}
        onSortDraftChange={updateDraftSort}
        onApplySort={applySort}
        onCancelSort={closeSortPanel}
        onClearSort={clearSort}
        leadView={leadView}
        onLeadViewChange={setLeadView}
        onCreateLead={openCreateLeadModal}
        recordActionLead={deleteTarget}
        recordActionLeads={bulkDeleteTargets}
        onCloseRecordAction={closeDeleteLead}
        onDeleteRecord={(target) => (Array.isArray(target) ? deleteAllLeads(target) : deleteLead(target))}
        onPinRecord={pinLead}
      />

      <div className={`content-grid${isFilterOpen && leadView !== 'map' ? '' : ' content-grid-wide'}`}>
        {isFilterOpen && leadView !== 'map' && (
          <FilterPanel
            statusFilters={draftFilters.statuses}
            sourceFilters={draftFilters.sources}
            systemDefinedFilters={draftFilters.systemDefined}
            searchFilter={draftFilters.search}
            onStatusChange={(v) => updateDraftFilter('statuses', v)}
            onSourceChange={(v) => updateDraftFilter('sources', v)}
            onSystemDefinedChange={(v) => updateDraftFilter('systemDefined', v)}
            onSearchChange={(v) => updateDraftFilter('search', v)}
            onApply={applyFilters}
            onClear={clearDraftFilters}
            onClose={closeFilterPanel}
          />
        )}
        <div className="table-col">
          {leadView === 'list' ? (
            <>
              <LeadsTable
                rows={pagedRows}
                selected={selected}
                pinnedLeadIds={pinnedLeadIds}
                onTogglePin={togglePinLead}
                onToggleOne={toggleOne}
                onToggleAll={toggleAll}
                onRequestDelete={requestDeleteLead}
                onRequestDeleteAll={requestDeleteAll}
                onAddNote={openNotes}
                onCreateTask={openTaskForm}
                onOpenLead={openLeadDetails}
                onUpdateLead={updateLead}
              />
              <div className="table-card pager-wrap" style={{ marginTop: 10 }}>
                <Pagination
                  total={rows.length}
                  page={page}
                  pageSize={pageSize}
                  onChange={setPage}
                  showTotalRecords
                  pageSizeOptions={[10, 20, 50]}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            </>
          ) : leadView === 'grid' ? (
            <>
              <LeadsTable
                rows={pagedRows}
                selected={selected}
                pinnedLeadIds={pinnedLeadIds}
                onTogglePin={togglePinLead}
                onToggleOne={toggleOne}
                onToggleAll={toggleAll}
                onRequestDelete={requestDeleteLead}
                onRequestDeleteAll={requestDeleteAll}
                onAddNote={openNotes}
                onCreateTask={openTaskForm}
                onOpenLead={openLeadDetails}
                onUpdateLead={updateLead}
                variant="grid"
              />
              <div className="table-card pager-wrap" style={{ marginTop: 10 }}>
                <Pagination
                  total={rows.length}
                  page={page}
                  pageSize={pageSize}
                  onChange={setPage}
                  showTotalRecords
                  pageSizeOptions={[10, 20, 50]}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            </>
          ) : leadView === 'tile' ? (
            <LeadGridView
              rows={pagedRows}
              selected={selected}
              onToggleOne={toggleOne}
              onRequestDelete={requestDeleteLead}
              onAddNote={openNotes}
              onOpenLead={openLeadDetails}
            />
          ) : (
            <LeadMapView
              rows={rows}
              selected={selected}
              onToggleOne={toggleOne}
              onAddNote={openNotes}
              onOpenListView={() => setLeadView('list')}
              onOpenLead={openLeadDetails}
            />
          )}
        </div>
      </div>

      <NotesDrawer lead={noteTarget} isOpen={Boolean(noteTarget)} onClose={closeNotes} onCreateTask={openTaskForm} />
      {(deleteTarget || bulkDeleteTargets.length > 0) && (
        <DeleteLeadModal
          lead={deleteTarget}
          leads={bulkDeleteTargets}
          onClose={closeDeleteLead}
          onConfirm={deleteLead}
          onConfirmAll={deleteAllLeads}
          onPin={pinLead}
        />
      )}
      <CreateLeadModal
        isOpen={isCreateLeadOpen}
        onClose={() => setIsCreateLeadOpen(false)}
        onCreate={() => { setIsCreateLeadOpen(false); navigate('/crm/leads/create-form'); }}
        onEditLayout={() => { setIsCreateLeadOpen(false); navigate('/crm/leads/form-builder'); }}
      />
    </>
  );
}
