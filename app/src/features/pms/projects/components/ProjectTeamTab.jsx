import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, MessagesSquare, Trash2, UserPlus, Users } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { pullProjectTeam, addProjectMember, removeProjectMember } from '../../../../services/pmsSync';
import { usePmsStore } from '../../../../stores/pmsStore';

/**
 * ProjectTeamTab — everyone working on the project.
 *
 * The PM and the stage / task assignees are on it automatically; anyone else
 * the PM adds here, optionally into one of the project's teams. Everyone on
 * this list is in the Project chat (and their team's chat), whether or not
 * they have PMS access — they reach it from "Project Chats".
 */
export function ProjectTeamTab({ project, onOpenChat }) {
  const showToast = usePmsStore((s) => s.showToast);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await pullProjectTeam(project.id));
    } catch (err) {
      setError(err?.payload?.message || err?.message || 'The team could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => { load(); }, [load]);

  const candidates = useMemo(() => data?.candidates || [], [data]);

  async function add() {
    if (!userId) return;
    setSaving(true);
    try {
      setData(await addProjectMember(project.id, { userId, departmentId: departmentId || null }));
      const person = candidates.find((c) => c.userId === userId);
      showToast?.(`${person?.name || 'Employee'} added — they can now chat with the project team.`);
      setUserId('');
      setDepartmentId('');
    } catch (err) {
      showToast?.(`Not added — ${err?.payload?.message || err?.message || 'try again'}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(member) {
    if (!window.confirm(`Take ${member.name} off the project team? They will lose access to its chats.`)) return;
    try {
      setData(await removeProjectMember(project.id, member.memberId));
      showToast?.(`${member.name} removed from the team.`);
    } catch (err) {
      showToast?.(`Not removed — ${err?.payload?.message || err?.message || 'try again'}`, 'error');
    }
  }

  async function moveTeam(member, nextDepartmentId) {
    try {
      setData(await addProjectMember(project.id, { userId: member.userId, departmentId: nextDepartmentId || null }));
    } catch (err) {
      showToast?.(`Not changed — ${err?.payload?.message || err?.message || 'try again'}`, 'error');
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500">
        <Loader2 size={14} className="animate-spin" /> Loading team…
      </div>
    );
  }
  if (error) {
    return <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</p>;
  }

  const members = data?.members || [];
  const teams = data?.teams || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Users size={15} /> Project Team
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">{members.length}</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Everyone here is in the Project chat and their team&apos;s chat. The PM and stage / task owners are added automatically.
          </p>
        </div>
        {onOpenChat && (
          <Button variant="secondary" icon={MessagesSquare} onClick={onOpenChat}>Open chat</Button>
        )}
      </div>

      {data?.canManage && (
        <div className="rounded-xl border border-[#dce5f4] bg-[#f6f9ff] p-3 flex flex-wrap items-end gap-2.5">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1" htmlFor="team-add-user">Add employee</label>
            <select
              id="team-add-user"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#dce5f4] bg-white px-3 py-2"
            >
              <option value="">Select employee…</option>
              {candidates.map((c) => (
                <option key={c.userId} value={c.userId}>
                  {c.name}{c.designation || c.department ? ` — ${[c.designation, c.department].filter(Boolean).join(', ')}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1" htmlFor="team-add-dept">Team</label>
            <select
              id="team-add-dept"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#dce5f4] bg-white px-3 py-2"
            >
              <option value="">Project chat only</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name} Team</option>)}
            </select>
          </div>
          <Button icon={saving ? Loader2 : UserPlus} onClick={add} disabled={!userId || saving}>
            Add to team
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-[#dce5f4] bg-white divide-y divide-slate-100">
        {members.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-8">Nobody is on this project yet.</p>
        )}
        {members.map((m) => (
          <div key={m.userId} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center shrink-0">
              {m.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-800">{m.name}</div>
              <div className="text-[11px] text-slate-500 truncate">{m.roles.join(' · ')}</div>
            </div>
            <div className="flex flex-wrap gap-1">
              {m.teams.length === 0 ? (
                <span className="text-[10.5px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">Project chat</span>
              ) : m.teams.map((t) => (
                <span key={t} className="text-[10.5px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">{t} Team</span>
              ))}
            </div>
            {data?.canManage && m.memberId && (
              <div className="flex items-center gap-1.5">
                <select
                  value={m.departmentId || ''}
                  onChange={(e) => moveTeam(m, e.target.value)}
                  className="text-[11px] rounded-lg border border-[#dce5f4] bg-white px-2 py-1"
                  aria-label={`Team for ${m.name}`}
                >
                  <option value="">Project chat only</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name} Team</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => remove(m)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title="Remove from team"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectTeamTab;
