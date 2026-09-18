import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button';
import {
  usePmsStore,
  filterProjects,
  getProjectFilterOptions,
  emptyProjectFilters,
  hasActiveFilters,
} from '../../../stores/pmsStore';
import { ProjectFilterBar } from './components/ProjectFilterBar';
import { ProjectsTable } from './components/ProjectsTable';
import { CreateProjectModal } from './components/CreateProjectModal';

/**
 * ProjectsPage (/pms/projects) — the master project directory.
 *
 * Filtering runs through the store's pure filterProjects() so the matching
 * rules stay testable on their own; this page only owns the filter state and
 * the create-project dialog.
 */
export default function ProjectsPage() {
  const navigate = useNavigate();
  const projects = usePmsStore((s) => s.projects);

  const [filters, setFilters] = useState(emptyProjectFilters);
  const [isCreateOpen, setCreateOpen] = useState(false);

  const options = useMemo(() => getProjectFilterOptions(projects), [projects]);
  const visible = useMemo(() => filterProjects(projects, filters), [projects, filters]);
  const isFiltered = hasActiveFilters(filters);

  return (
    <div className="space-y-5">
      <PageHeader
        title="All Projects"
        subtitle="Every project in the company, filterable by customer, manager, department, stage and schedule."
        actions={
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>
            Create New Project
          </Button>
        }
      />

      <ProjectFilterBar
        filters={filters}
        options={options}
        onChange={setFilters}
        onReset={() => setFilters(emptyProjectFilters())}
        isFiltered={isFiltered}
        resultCount={visible.length}
        totalCount={projects.length}
      />

      <ProjectsTable
        projects={visible}
        emptyTitle={isFiltered ? 'No projects match these filters' : 'No projects yet'}
        emptyDesc={
          isFiltered
            ? 'Try widening the search, clearing a dropdown, or turning off "Delayed only".'
            : 'Create a project from a confirmed CRM sales order to get started.'
        }
        emptyAction={
          !isFiltered ? (
            <Button icon={Plus} onClick={() => setCreateOpen(true)}>
              Create New Project
            </Button>
          ) : null
        }
        onQuickAssign={(row) => navigate(`/pms/projects/${row.id}`)}
        onLogDelay={(row) => navigate(`/pms/delays?project=${row.id}`)}
      />

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          setCreateOpen(false);
          navigate(`/pms/projects/${id}`);
        }}
      />
    </div>
  );
}
