import React from 'react';
import { EmptyStatePms } from '../../components/EmptyStatePms';

/**
 * ProjectPipelineChart — where in-flight work currently sits.
 *
 * Horizontal bars, one per department holding at least one active project.
 * Bars are scaled against the busiest department so the shape stays readable
 * whether the company is running 4 projects or 400.
 */

// A department wears one colour everywhere, so this reads the same catalogue
// the Gantt does rather than keeping a second opinion about what Design looks
// like. Work with no department keeps the neutral grey.
const UNASSIGNED = '#94a3b8';

export function ProjectPipelineChart({ rows = [], departments = [] }) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const colors = {};
  for (const dept of departments) colors[dept.name] = dept.color;

  return (
    <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs h-full">
      <header className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">Project Pipeline by Stage</h3>
        <span className="text-[11px] font-medium text-slate-400">
          {total} active {total === 1 ? 'project' : 'projects'}
        </span>
      </header>

      {rows.length === 0 ? (
        <EmptyStatePms
          variant="projects"
          title="Nothing in the pipeline"
          description="Active projects appear here grouped by the department currently holding the work."
        />
      ) : (
        <ul className="space-y-3.5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((row) => {
            const color = colors[row.department] ?? UNASSIGNED;
            return (
              <li key={row.department}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700">{row.department}</span>
                  <span className="text-xs font-bold text-slate-800">
                    {row.count}
                    <span className="font-medium text-slate-400 ml-1">
                      {row.count === 1 ? 'project' : 'projects'}
                    </span>
                  </span>
                </div>
                <div
                  className="w-full overflow-hidden"
                  style={{ height: 8, borderRadius: 4, background: '#eef2f8' }}
                >
                  <div
                    style={{
                      width: `${row.sharePct}%`,
                      height: '100%',
                      borderRadius: 4,
                      background: color,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default ProjectPipelineChart;
