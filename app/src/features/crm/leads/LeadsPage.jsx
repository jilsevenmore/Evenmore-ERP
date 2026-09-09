import { useMemo, useState } from 'react';
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
import LeadDetailView from './LeadDetailView';
import { useNavigate } from 'react-router-dom';
import { leads } from '../../../data/crm/mockLeads';
import { createFieldFromType, defaultLeadFormSections } from '../../../data/crm/leadFormSchema';

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

  const rows = useMemo(() => {
    const filtered = leads.filter((l) => {
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
  }, [activeTab, appliedFilters, appliedSort]);

  const toggleOne = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleAll = () => {
    const ids = rows.map((r) => r.id);
    const allIn = ids.length > 0 && ids.every((id) => selected.includes(id));
    setSelected(allIn ? selected.filter((id) => !ids.includes(id)) : [...new Set([...selected, ...ids])]);
  };

  const selectedLead = leads.find((l) => selected.includes(l.id)) ?? rows[0] ?? leads[0];

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
        onToggleFilter={() => isFilterOpen ? (setDraftFilters(appliedFilters), setIsFilterOpen(false)) : (setDraftFilters(appliedFilters), setIsFilterOpen(true))}
        isSortOpen={isSortOpen}
        sortDraft={draftSort}
        sortApplied={appliedSort}
        sortOptions={SORT_OPTIONS}
        onToggleSort={() => isSortOpen ? (setDraftSort(appliedSort), setIsSortOpen(false)) : (setDraftSort(appliedSort), setIsSortOpen(true))}
        onSortDraftChange={(k, v) => setDraftSort((c) => ({ ...c, [k]: v }))}
        onApplySort={() => { setAppliedSort(draftSort.field ? draftSort : INITIAL_SORT); setIsSortOpen(false); }}
        onCancelSort={() => { setDraftSort(appliedSort); setIsSortOpen(false); }}
        onClearSort={() => { setAppliedSort(INITIAL_SORT); setDraftSort(INITIAL_SORT); setIsSortOpen(false); }}
        leadView={leadView}
        onLeadViewChange={setLeadView}
        onCreateLead={() => setIsCreateLeadOpen(true)}
      />

      <div className={`content-grid${isFilterOpen && leadView !== 'map' ? '' : ' content-grid-wide'}`}>
        {isFilterOpen && leadView !== 'map' && (
          <FilterPanel
            statusFilters={draftFilters.statuses}
            sourceFilters={draftFilters.sources}
            systemDefinedFilters={draftFilters.systemDefined}
            searchFilter={draftFilters.search}
            onStatusChange={(v) => setDraftFilters((c) => ({ ...c, statuses: v }))}
            onSourceChange={(v) => setDraftFilters((c) => ({ ...c, sources: v }))}
            onSystemDefinedChange={(v) => setDraftFilters((c) => ({ ...c, systemDefined: v }))}
            onSearchChange={(v) => setDraftFilters((c) => ({ ...c, search: v }))}
            onApply={() => { setAppliedFilters(draftFilters); setIsFilterOpen(false); }}
            onClear={() => setDraftFilters(INITIAL_FILTERS)}
            onClose={() => { setDraftFilters(appliedFilters); setIsFilterOpen(false); }}
          />
        )}
        <div className="table-col">
          {leadView === 'list' ? (
            <>
              <LeadsTable
                rows={rows}
                selected={selected}
                onToggleOne={toggleOne}
                onToggleAll={toggleAll}
                onAddNote={(lead) => setNoteTarget(lead)}
                onOpenLead={(lead) => navigate(`/crm/leads/${lead.id}`)}
              />
              <div className="table-card pager-wrap" style={{ marginTop: 10 }}>
                <Pagination total={rows.length} page={1} pageSize={20} />
              </div>
            </>
          ) : leadView === 'grid' ? (
            <LeadCardGridView rows={rows} onAddNote={setNoteTarget} onOpenLead={(lead) => navigate(`/crm/leads/${lead.id}`)} />
          ) : leadView === 'tile' ? (
            <LeadGridView rows={rows} onAddNote={setNoteTarget} onOpenLead={(lead) => navigate(`/crm/leads/${lead.id}`)} />
          ) : (
            <LeadMapView
              rows={rows}
              selected={selected}
              onToggleOne={toggleOne}
              onAddNote={setNoteTarget}
              onOpenListView={() => setLeadView('list')}
              onOpenLead={(lead) => navigate(`/crm/leads/${lead.id}`)}
            />
          )}
        </div>
      </div>

      <NotesDrawer lead={noteTarget} isOpen={Boolean(noteTarget)} onClose={() => setNoteTarget(null)} onCreateTask={() => navigate('/crm/tasks')} />
      <CreateLeadModal
        isOpen={isCreateLeadOpen}
        onClose={() => setIsCreateLeadOpen(false)}
        onCreate={() => { setIsCreateLeadOpen(false); navigate('/crm/leads/create-form'); }}
        onEditLayout={() => { setIsCreateLeadOpen(false); navigate('/crm/leads/form-builder'); }}
      />
    </>
  );
}
