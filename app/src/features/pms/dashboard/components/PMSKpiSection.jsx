import React from 'react';
import KpiCard from '../../../../components/ui/KpiCard';
import {
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  CalendarDays,
} from 'lucide-react';

/**
 * PMSKpiSection — the seven headline dashboard metrics.
 *
 * Every value comes from computeDashboardMetrics() in the PMS store; nothing
 * here is static. Definitions follow the Stage 4 spec, which is stricter than
 * the store's general getKpis(): "Active" is In Progress / At Risk / Delayed
 * only, "Delayed" also counts projects with an overdue stage, and "At Risk"
 * counts stages past 70% elapsed with under 50% done.
 */

const TILES = [
  { key: 'totalProjects', label: 'Total Projects', icon: Layers, tone: 'blue' },
  { key: 'activeProjects', label: 'Active', icon: Activity, tone: 'sky' },
  { key: 'completedProjects', label: 'Completed', icon: CheckCircle2, tone: 'emerald' },
  { key: 'delayedProjects', label: 'Delayed', icon: AlertCircle, tone: 'rose' },
  { key: 'atRiskStages', label: 'At-Risk Stages', icon: AlertTriangle, tone: 'amber' },
  { key: 'dueTodayCount', label: 'Due Today', icon: CalendarClock, tone: 'orange' },
  { key: 'dueThisWeekCount', label: 'Due This Week', icon: CalendarDays, tone: 'purple' },
];

export function PMSKpiSection({ metrics }) {
  return (
    <section
      className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7"
      aria-label="Project management key metrics"
    >
      {TILES.map((tile) => (
        <KpiCard
          key={tile.key}
          label={tile.label}
          value={metrics?.[tile.key] ?? 0}
          icon={tile.icon}
          tone={tile.tone}
        />
      ))}
    </section>
  );
}

export default PMSKpiSection;
