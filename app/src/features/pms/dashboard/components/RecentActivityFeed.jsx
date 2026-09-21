import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../../../i18n';
import { ActivityTimeline } from '../../components/ActivityTimeline';

/**
 * RecentActivityFeed — merged audit stream across every project.
 *
 * Reuses the Stage 3 ActivityTimeline. The only thing this adds is a project
 * link per row, since entries here span projects where a project-level
 * timeline would not need one.
 */
export function RecentActivityFeed({ entries = [], limit = 8 }) {
  const { t } = useTranslation();
  return (
    <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs h-full">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">{t('dashboard.recentActivity')}</h3>
        <Link
          to="/pms/projects"
          className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          {t('navigation.allProjects')}
        </Link>
      </header>

      <ActivityTimeline
        entries={entries}
        limit={limit}
        renderContext={(entry) =>
          entry.projectId ? (
            <Link
              to={`/pms/projects/${entry.projectId}`}
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              title={entry.projectCustomer}
            >
              {entry.projectId}
            </Link>
          ) : null
        }
      />
    </section>
  );
}

export default RecentActivityFeed;
