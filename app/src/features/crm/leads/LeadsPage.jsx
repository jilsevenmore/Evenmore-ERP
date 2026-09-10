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

const leadsGuide = {
  title: 'CRM Leads',
  subtitle: 'Capture, qualify, and convert prospective customer opportunities.',
  purpose: 'A lead is a prospective customer or business opportunity that can be qualified, assigned, followed up, and converted into a customer or sales opportunity.',
  workflow: ['Lead Captured', 'Assigned to Owner', 'Qualification', 'Follow-up', 'Converted'],
  keyTerms: [
    { term: 'Lead', definition: 'A person or company that may become a customer.' },
    { term: 'Lead Source', definition: 'The channel that generated the lead, such as a referral, campaign, or website.' },
    { term: 'Lead Owner', definition: 'The team member responsible for follow-up and progress.' },
    { term: 'Qualification', definition: 'The process of confirming need, fit, timing, and purchase intent.' },
    { term: 'Follow-up', definition: 'A planned call, email, note, or task used to move the lead forward.' },
    { term: 'Conversion', definition: 'Turning a qualified lead into a customer or active sales opportunity.' },
  ],
};

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
  const selectedLeads = useMemo(
    () => leadRows.filter((lead) => selected.includes(lead.id)),
    [leadRows, selected],
  );
  const selectedLead = selectedLeads[0] ?? null;

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

  function clearSelected() {
    setSelected([]);
  }

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
    setPinnedLeadIds((current) => current.filter((pinnedId) => pinnedId !== id));
    closeDeleteLead();
  }

  function deleteAllLeads(leadsToDelete) {
    const ids = new Set(leadsToDelete.map((lead) => lead.id));
    setLeadRows((current) => current.filter((lead) => !ids.has(lead.id)));
    setSelected((current) => current.filter((id) => !ids.has(id)));
    setPinnedLeadIds((current) => current.filter((id) => !ids.has(id)));
    closeDeleteLead();
  }

  function pinLead(lead) {
    if (!lead) return;
    setPinnedLeadIds((current) => (current.includes(lead.id) ? current : [...current, lead.id]));
    setSelected((current) => current.filter((id) => id !== lead.id));
    closeDeleteLead();
  }

  function togglePinLead(lead) {
    if (!lead) return;
    setPinnedLeadIds((current) => (
      current.includes(lead.id)
        ? current.filter((pinnedId) => pinnedId !== lead.id)
        : [...current, lead.id]
    ));
  }

  const recordActionLead = selectedLeads.length === 1 ? selectedLeads[0] : null;

  function requestDeleteSelection(target) {
    if (Array.isArray(target)) {
      requestDeleteAll(target);
      return;
    }

    const targetLead = leadRows.find((lead) => lead.id === target) ?? recordActionLead;
    if (targetLead) {
      requestDeleteLead(targetLead);
    }
  }

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle="Manage and track all your CRM leads."
        guide={leadsGuide}
        actions={
          <>
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
        recordActionLead={recordActionLead}
        recordActionLeads={selectedLeads}
        onCloseRecordAction={clearSelected}
        onDeleteRecord={requestDeleteSelection}
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
                onRequestDelete={requestDeleteLead}
                onRequestDeleteAll={requestDeleteAll}
                onToggleAll={toggleAll}
                onAddNote={openNotes}
                onCreateTask={openTaskForm}
                onOpenLead={openLeadDetails}
                onUpdateLead={updateLead}
                onDelete={deleteLead}
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
                onRequestDelete={requestDeleteLead}
                onRequestDeleteAll={requestDeleteAll}
                onToggleAll={toggleAll}
                onAddNote={openNotes}
                onCreateTask={openTaskForm}
                onOpenLead={openLeadDetails}
                onUpdateLead={updateLead}
                variant="grid"
                onDelete={deleteLead}
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
            <LeadCardGridView
              rows={pagedRows}
              selected={selected}
              pinnedLeadIds={pinnedLeadIds}
              onTogglePin={togglePinLead}
              onToggleOne={toggleOne}
              onRequestDelete={requestDeleteLead}
              onAddNote={openNotes}
              onOpenLead={openLeadDetails}
              onDelete={deleteLead}
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
