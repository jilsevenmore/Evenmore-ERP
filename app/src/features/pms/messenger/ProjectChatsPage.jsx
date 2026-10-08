/**
 * Project Chats — the messenger for everyone working on a project.
 *
 * Opens without PMS access: a welder on the Fabrication team has no business
 * in the PMS screens, but should talk to the people on the projects they work
 * on. The list is the server's `/pms/my-chats/` — the projects I am on (as PM,
 * stage or task owner, or on the project's team list), or every project for an
 * administrator — and each opens the same messenger the project page uses.
 */
import { useCallback, useEffect, useState } from 'react';
import { Loader2, MessagesSquare, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../../stores/appStore';
import { pullMyChats } from '../../../services/pmsSync';
import { MessengerTab } from './MessengerTab';
import { useProjectMessenger } from './useProjectMessenger';

export default function ProjectChatsPage() {
  const currentUserId = useAppStore((s) => s.currentUser?.id);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [stageId, setStageId] = useState(null);
  const [highlightMessageId, setHighlightMessageId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await pullMyChats();
      setProjects(rows);
      setSelectedId((current) => (rows.some((p) => p.id === current) ? current : rows[0]?.id ?? null));
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const project = projects.find((p) => p.id === selectedId) || null;
  const messenger = useProjectMessenger(project?.id, { open: Boolean(project) });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Project Chats</h1>
          <p className="text-[13px] text-muted">Talk to everyone on the projects you work on — the whole project, or just your team.</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="btn-outline h-9 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading && projects.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-muted">
          <Loader2 size={16} className="animate-spin" /> Loading your projects…
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-bdr rounded-2xl p-10 text-center shadow-xs">
          <MessagesSquare size={28} className="mx-auto text-slate-400" />
          <p className="mt-3 text-[14px] font-semibold text-slate-900">You are not on any project yet</p>
          <p className="mt-1 text-[13px] text-muted">When a project manager adds you to a project team, its chats appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <aside className="lg:col-span-3 bg-white border border-bdr rounded-2xl shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-bdr/60 text-[11px] font-bold uppercase tracking-wide text-muted">
              Projects
            </div>
            <ul className="divide-y divide-bdr/40">
              {projects.map((p) => {
                const active = p.id === selectedId;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => { setSelectedId(p.id); setStageId(null); setHighlightMessageId(null); }}
                      className={`w-full text-left px-4 py-3 flex items-start gap-2 cursor-pointer transition ${active ? 'bg-blue-50/70' : 'hover:bg-slate-50'}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-mono text-slate-500">{p.code}</div>
                        <div className={`text-[13px] font-semibold truncate ${active ? 'text-blue-800' : 'text-slate-900'}`}>{p.name}</div>
                        {p.customerName && <div className="text-[11px] text-muted truncate">{p.customerName}</div>}
                      </div>
                      {p.totalUnread > 0 && (
                        <span className="shrink-0 text-[10.5px] font-bold rounded-full bg-blue-600 text-white px-1.5 min-w-[20px] text-center">
                          {p.totalUnread}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="lg:col-span-9 min-w-0">
            {project && (
              <MessengerTab
                key={project.id}
                project={project}
                messenger={messenger}
                currentUserId={currentUserId}
                stageId={stageId}
                onStageChange={setStageId}
                highlightMessageId={highlightMessageId}
                onHighlight={setHighlightMessageId}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
