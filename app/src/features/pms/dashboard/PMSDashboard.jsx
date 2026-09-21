import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button';
import {
  usePmsStore,
  computeDashboardMetrics,
  computePipelineByDepartment,
  computeDepartmentWorkload,
  computeDelayWatchlist,
  computeUpcomingDeadlines,
} from '../../../stores/pmsStore';
import { PMSKpiSection } from './components/PMSKpiSection';
import { ProjectPipelineChart } from './components/ProjectPipelineChart';
import { DepartmentWorkload } from './components/DepartmentWorkload';
import { DelayedProjectsTable } from './components/DelayedProjectsTable';
import { UpcomingDeadlines } from './components/UpcomingDeadlines';
import { RecentActivityFeed } from './components/RecentActivityFeed';

const DEADLINE_WINDOW_DAYS = 7;

/**
 * PMSDashboard (/pms) — executive command view.
 *
 * Every number on this page derives from the PMS store. The page subscribes to
 * the raw `projects` and `settings` slices and derives with the store's pure
 * helpers inside useMemo; selecting a computed object straight out of the store
 * would hand useSyncExternalStore a new reference each render.
 */
export default function PMSDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const projects = usePmsStore((s) => s.projects);
  const settings = usePmsStore((s) => s.settings);

  const metrics = useMemo(() => computeDashboardMetrics(projects), [projects]);
  const pipeline = useMemo(() => computePipelineByDepartment(projects), [projects]);
  const workload = useMemo(
    () =>
      computeDepartmentWorkload(
        projects,
        settings.departmentCapacity ?? {},
        settings.defaultDepartmentCapacity ?? 20
      ),
    [projects, settings]
  );
  const watchlist = useMemo(() => computeDelayWatchlist(projects), [projects]);
  const deadlines = useMemo(
    () => computeUpcomingDeadlines(projects, DEADLINE_WINDOW_DAYS),
    [projects]
  );

  // Merged, newest-first audit stream across all projects.
  const activity = useMemo(
    () =>
      projects
        .flatMap((p) =>
          (p.activityLog ?? []).map((a) => ({
            ...a,
            projectId: p.id,
            projectCustomer: p.customerName,
          }))
        )
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [projects]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('navigation.pmsDashboard')}
        subtitle="Executive overview of project health, department workload and delivery risk."
        actions={
          <Button icon={Plus} onClick={() => navigate('/pms/projects')}>
            Create New Project
          </Button>
        }
      />

      <PMSKpiSection metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectPipelineChart rows={pipeline} />
        <DepartmentWorkload rows={workload} />
      </div>

      <DelayedProjectsTable rows={watchlist} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingDeadlines rows={deadlines} windowDays={DEADLINE_WINDOW_DAYS} />
        <RecentActivityFeed entries={activity} limit={8} />
      </div>
    </div>
  );
}
