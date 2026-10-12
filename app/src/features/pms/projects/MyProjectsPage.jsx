import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import {
  usePmsStore,
  filterProjects,
  getProjectFilterOptions,
  emptyProjectFilters,
  hasActiveFilters,
  worksOnProject,
} from '../../../stores/pmsStore';
import { pullMyProjects } from '../../../services/pmsSync';
import { ProjectFilterBar } from './components/ProjectFilterBar';
import { ProjectsTable } from './components/ProjectsTable';

/**
 * MyProjectsPage (/pms/my-projects) — the projects the signed-in user works on.
 *
 * Same table and filter bar as the master directory, pre-scoped to projects
 * where the user is the PM, a stage or task assignee, or on the team list,
 * before the filter bar so the counts and dropdowns reflect their own work.
 */
export default function MyProjectsPage() {
  const navigate = useNavigate();
  const projects = usePmsStore((s) => s.projects);
  const currentUserId = usePmsStore((s) => s.currentUserId);
  const employees = usePmsStore((s) => s.employees);

  const currentUser = useMemo(
    () => employees.find((e) => e.id === currentUserId) ?? null,
    [employees, currentUserId]
  );

  // Team-list members are not in the project payload, so the server's own
  // answer (`/pms/my-projects/`) completes what the payload shows.
  const [serverIds, setServerIds] = useState(() => new Set());
  useEffect(() => {
    let cancelled = false;
    pullMyProjects().then((body) => {
      const rows = body?.results || body?.data || (Array.isArray(body) ? body : []);
      if (!cancelled) setServerIds(new Set(rows.map((r) => r.id)));
    });
    return () => { cancelled = true; };
  }, [currentUserId]);

  const mine = useMemo(
    () => projects.filter((p) => serverIds.has(p.id) || worksOnProject(p, currentUserId)),
    [projects, currentUserId, serverIds]
  );

  const [filters, setFilters] = useState(emptyProjectFilters);

  const options = useMemo(() => getProjectFilterOptions(mine), [mine]);
  const visible = useMemo(() => filterProjects(mine, filters), [mine, filters]);
  const isFiltered = hasActiveFilters(filters);

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Projects"
        subtitle={
          currentUser
            ? `Projects ${currentUser?.name} is assigned to — as project manager, stage owner, task assignee or team member.`
            : 'Projects you are assigned to — as project manager, stage owner, task assignee or team member.'
        }
      />

      <ProjectFilterBar
        filters={filters}
        options={options}
        onChange={setFilters}
        onReset={() => setFilters(emptyProjectFilters())}
        isFiltered={isFiltered}
        resultCount={visible.length}
        totalCount={mine.length}
      />

      <ProjectsTable
        projects={visible}
        emptyTitle={isFiltered ? 'No projects match these filters' : 'Nothing assigned to you'}
        emptyDesc={
          isFiltered
            ? 'Try widening the search or clearing a filter.'
            : 'Projects where you own a stage, have a task, are on the team or manage the project will appear here.'
        }
        onQuickAssign={(row) => navigate(`/pms/projects/${row.id}`)}
        onLogDelay={(row) => navigate(`/pms/delays?project=${row.id}`)}
      />
    </div>
  );
}
