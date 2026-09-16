import { useRecruitmentStore } from "../../stores/recruitmentStore";
import { useAppStore } from "../../stores/appStore";
import { Users, ChevronRight } from "lucide-react";

const STAGE_CONFIG = [
  { key: "Applied", label: "Applied", color: "blue", dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "Screening", label: "Screening", color: "cyan", dot: "bg-cyan-500", badge: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { key: "Interview", label: "Interview", color: "indigo", dot: "bg-indigo-500", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { key: "Shortlisted", label: "Shortlisted", color: "purple", dot: "bg-purple-500", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  { key: "Offer", label: "Offer", color: "amber", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "Hired", label: "Hired", color: "emerald", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { key: "Rejected", label: "Rejected", color: "rose", dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700 border-rose-200" },
];

export function CandidatePipeline() {
  const candidates = useRecruitmentStore((s) => s.candidates);
  const changeStage = useRecruitmentStore((s) => s.changeStage);
  const showToast = useAppStore((s) => s.showToast);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
            <Users size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-text">Candidate Pipeline</h3>
            <p className="text-[11px] text-muted">Visual stage progression and instant candidate movement</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-muted bg-soft px-2.5 py-1 rounded-full border border-border">
          {candidates.length} Active Candidates
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {STAGE_CONFIG.map(({ key, label, dot, badge }) => {
          const colCandidates = candidates.filter((c) => c.stage === key);
          return (
            <div
              key={key}
              className="bg-soft/70 border border-border/80 rounded-xl p-3 flex flex-col min-h-[220px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border/60">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                  <span className="text-[11px] font-bold text-text uppercase tracking-wider truncate">
                    {label}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${badge}`}>
                  {colCandidates.length}
                </span>
              </div>

              {/* Candidates in Stage */}
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-0.5">
                {colCandidates.map((c) => (
                  <div
                    key={c.id}
                    className="bg-card border border-border rounded-xl p-2.5 shadow-2xs hover:shadow-xs hover:border-primary/40 transition group"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-muted truncate">{c.position}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-[10px] text-muted">
                      <span>{c.experience}</span>
                      <span className="font-mono text-[9px] text-slate-400">{c.id}</span>
                    </div>

                    {/* Quick Move Stage Select */}
                    <div className="mt-2">
                      <label className="block text-[9px] uppercase font-bold text-muted mb-0.5">
                        Move Stage
                      </label>
                      <select
                        value={c.stage}
                        onChange={(e) => {
                          const newStage = e.target.value;
                          changeStage(c.id, newStage);
                          showToast(`${c.name} moved to ${newStage}`);
                        }}
                        className="w-full h-6 px-1.5 bg-soft border border-border rounded-lg text-[10px] font-medium text-text focus:outline-none focus:border-primary cursor-pointer transition"
                      >
                        {STAGE_CONFIG.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {colCandidates.length === 0 && (
                  <div className="h-28 border border-dashed border-border/80 rounded-xl flex items-center justify-center text-[11px] text-muted/70 text-center p-2">
                    No candidates
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CandidatePipeline;
