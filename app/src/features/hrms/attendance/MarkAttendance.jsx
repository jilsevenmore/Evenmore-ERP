/**
 * Mark Attendance — two screens behind one route.
 *
 *  - HR admin, super admin and executive roles (`mark_attendance` together
 *    with `view_team_attendance`) get the team register for any day: every
 *    employee, with the check-in / check-out the server already worked out
 *    from their Punch In / Punch Out, editable as a correction.
 *  - Everyone else gets their own attendance: Punch In / Punch Out (the same
 *    punch as the topbar button), today's punches and their own history. The
 *    server only returns their own rows and refuses hand edits from them —
 *    corrections go through regularization.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, Clock, Fingerprint, Loader2, LogIn, LogOut, RefreshCw, Search } from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { useAttendanceStore } from "../../../stores/attendanceStore";
import { hrmsSync } from "../../../services/hrmsSync";
import { api } from "../../../services/api";
import { Badge } from "../../../components/hrms/Badge";
import { PageInfoButton } from "../../../components/common/PageInfoButton";
import { hrmsGuides } from "../../../data/hrms/hrmsGuides";
import { EarlyPunchOutModal } from "./components/EarlyPunchOutModal";
import { usePunchActions } from "./usePunchActions";

const STATUSES = ["Present", "Late", "Half Day", "WFH", "Absent", "On Leave"];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** ISO timestamp → local `HH:MM` for a time input; blank when absent. */
function toHHMM(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function statusTone(status) {
  if (status === "Present" || status === "WFH") return "success";
  if (status === "Late" || status === "Half Day") return "warning";
  if (status === "Absent") return "critical";
  return "neutral";
}

function PageTitle({ subtitle }) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Mark Attendance</h1>
        <PageInfoButton guide={hrmsGuides.attendanceMark} />
      </div>
      <p className="text-[13px] text-muted">{subtitle}</p>
    </div>
  );
}

export default function MarkAttendance() {
  const permissions = useAppStore((s) => s.permissions) || [];
  const canMarkTeam = permissions.includes("mark_attendance") && permissions.includes("view_team_attendance");
  return canMarkTeam ? <TeamMarkAttendance /> : <MyAttendance />;
}

// ── Self-service: Punch In / Punch Out and my own record ───────────────────

function MyAttendance() {
  const {
    todayPunch, fetchTodayPunch, submitting, error,
    doPunchIn, doPunchOut, executePunchOut, earlyModalOpen, setEarlyModalOpen,
  } = usePunchActions();
  // Reading the store loads this user's own attendance rows (server-scoped).
  const records = useAttendanceStore((s) => s.records);
  const refreshAttendance = useAttendanceStore((s) => s.refreshAttendance);

  useEffect(() => { fetchTodayPunch(); }, [fetchTodayPunch]);

  const month = todayISO().slice(0, 7);
  const history = useMemo(
    () => (records || [])
      .filter((r) => String(r.rawDate || "").startsWith(month))
      .sort((a, b) => String(b.rawDate).localeCompare(String(a.rawDate))),
    [records, month]
  );
  const summary = useMemo(() => {
    const count = (fn) => history.filter(fn).length;
    return {
      present: count((r) => ["Present", "Late", "WFH", "Half Day"].includes(r.status)),
      late: count((r) => r.status === "Late"),
      absent: count((r) => r.status === "Absent"),
      leave: count((r) => r.status === "On Leave"),
    };
  }, [history]);

  const punches = todayPunch?.punches || [];
  const noEmployee = todayPunch?.hasEmployee === false;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle subtitle="Punch in when you start and punch out when you leave — your attendance is recorded from your punches." />

      {noEmployee ? (
        <div className="bg-white border border-bdr rounded-2xl p-8 text-center shadow-xs text-[13px] text-muted">
          Your login is not linked to an employee record, so attendance cannot be recorded. Ask HR to link it.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Today */}
          <div className="lg:col-span-5 bg-white border border-bdr rounded-2xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[15px] text-slate-900">Today</h3>
                <p className="text-[12px] text-muted">
                  Shift {todayPunch?.shiftStart || "—"} – {todayPunch?.shiftEnd || "—"}
                </p>
              </div>
              <Badge tone={todayPunch?.isPunchedIn ? "success" : todayPunch?.dayCompleted ? "info" : "neutral"}>
                {todayPunch?.status || "Not Punched In"}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                ["First In", todayPunch?.firstPunch || "—"],
                ["Last Out", todayPunch?.isPunchedIn ? "—" : todayPunch?.lastPunch || "—"],
                ["Worked", todayPunch?.formattedWorkingTime || "00h 00m"],
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-50 border border-bdr/70 rounded-xl p-3">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">{label}</div>
                  <div className="text-[15px] font-bold text-slate-900 mt-0.5">{value}</div>
                </div>
              ))}
            </div>

            {todayPunch?.isPunchedIn ? (
              <button
                type="button"
                onClick={doPunchOut}
                disabled={submitting || todayPunch?.canPunchOut === false}
                className="h-11 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-[14px] flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                Punch Out
              </button>
            ) : (
              <button
                type="button"
                onClick={doPunchIn}
                disabled={submitting || todayPunch?.canPunchIn === false}
                className="h-11 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold text-[14px] flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                {todayPunch?.dayCompleted ? "Punch In Again" : "Punch In"}
              </button>
            )}
            {error && <p className="text-[12px] text-rose-700">{error}</p>}

            <div>
              <div className="text-[12px] font-semibold text-slate-700 mb-2">Today&apos;s punches</div>
              {punches.length === 0 ? (
                <p className="text-[12.5px] text-muted">No punches yet today.</p>
              ) : (
                <ul className="space-y-1.5">
                  {punches.map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-[12.5px] bg-slate-50 border border-bdr/60 rounded-lg px-3 py-1.5">
                      <span className={`font-semibold ${p.punchType === "IN" ? "text-emerald-700" : "text-rose-700"}`}>
                        Punch {p.punchType === "IN" ? "In" : "Out"}
                      </span>
                      <span className="text-slate-700">{p.timeDisplay}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* My month */}
          <div className="lg:col-span-7 bg-white border border-bdr rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 pb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[15px] text-slate-900">My attendance this month</h3>
                <p className="text-[12px] text-muted">Missed a punch or a wrong time? Ask HR for a correction.</p>
              </div>
              <button
                type="button"
                onClick={() => { refreshAttendance?.(); fetchTodayPunch(); }}
                className="btn-outline h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 px-5 pb-4">
              {[
                ["Present", summary.present, "text-emerald-700"],
                ["Late", summary.late, "text-amber-700"],
                ["Absent", summary.absent, "text-rose-700"],
                ["On Leave", summary.leave, "text-slate-700"],
              ].map(([label, value, tone]) => (
                <div key={label} className="bg-slate-50 border border-bdr/70 rounded-xl p-3">
                  <div className="text-[10.5px] font-semibold uppercase text-muted">{label}</div>
                  <div className={`text-[18px] font-bold ${tone}`}>{value}</div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[13px]">
                <thead className="bg-slate-50/75 border-y border-bdr text-[11px] uppercase tracking-wider text-muted font-bold">
                  <tr>
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-5">Check In</th>
                    <th className="py-3 px-5">Check Out</th>
                    <th className="py-3 px-5">Hours</th>
                    <th className="py-3 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bdr/40">
                  {history.length === 0 && (
                    <tr><td colSpan={5} className="py-8 px-5 text-center text-muted">No attendance recorded this month yet.</td></tr>
                  )}
                  {history.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 px-5 font-medium text-slate-900">{r.date}</td>
                      <td className="py-3 px-5">{toHHMM(r.checkIn) || "—"}</td>
                      <td className="py-3 px-5">{toHHMM(r.checkOut) || "—"}</td>
                      <td className="py-3 px-5">{r.workingHours ? `${r.workingHours}h` : "—"}</td>
                      <td className="py-3 px-5"><Badge tone={statusTone(r.status)}>{r.status || "—"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <EarlyPunchOutModal
        isOpen={earlyModalOpen}
        onClose={() => setEarlyModalOpen(false)}
        onConfirm={executePunchOut}
        todayPunch={todayPunch}
        isSubmitting={submitting}
      />
    </div>
  );
}

// ── HR / admin: the team register for a day ────────────────────────────────

function TeamMarkAttendance() {
  const showToast = useAppStore((s) => s.showToast);
  const employees = useAppStore((s) => s.employees);
  // A punch (here or in the topbar) changes today's rows; reload when it does.
  const todayPunch = useAttendanceStore.raw((s) => s.todayPunch);

  const [date, setDate] = useState(todayISO);
  const [dept, setDept] = useState("All");
  const [search, setSearch] = useState("");
  const [serverRows, setServerRows] = useState([]);
  const [edits, setEdits] = useState({});
  const [checked, setChecked] = useState({});
  const [bulkStatus, setBulkStatus] = useState("Present");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setServerRows((await hrmsSync.pull("attendance", { date })) || []);
      setEdits({});
      setChecked({});
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (date === todayISO()) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayPunch?.isPunchedIn, todayPunch?.lastPunchIso]);

  // Everyone on the payroll of people, with the day's row where there is one.
  const rows = useMemo(() => {
    const byEmployee = new Map(serverRows.map((r) => [String(r.employeeId), r]));
    const people = employees?.length
      ? employees.filter((e) => !["Resigned", "Terminated"].includes(e.status))
      : serverRows.map((r) => ({ id: r.employeeId, name: r.name, department: r.dept, empId: r.empId }));
    return people.map((e) => {
      const att = byEmployee.get(String(e.id));
      const base = {
        employeeId: String(e.id),
        name: e.name,
        empId: e.empId || e.employeeCode || att?.empId || "",
        dept: e.department || att?.dept || "",
        checkIn: toHHMM(att?.checkIn),
        checkOut: toHHMM(att?.checkOut),
        status: att?.status || "",
        remark: att?.remark || "",
        source: att?.source || "",
        punchCount: (att?.punches || []).length,
        marked: Boolean(att),
      };
      return { ...base, ...(edits[base.employeeId] || {}) };
    });
  }, [employees, serverRows, edits]);

  const departments = useMemo(() => ["All", ...new Set(rows.map((r) => r.dept).filter(Boolean))], [rows]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) =>
      (dept === "All" || r.dept === dept) &&
      (!q || r.name?.toLowerCase().includes(q) || r.empId?.toLowerCase().includes(q))
    );
  }, [rows, dept, search]);

  const dirtyIds = Object.keys(edits);
  const selectedIds = filtered.filter((r) => checked[r.employeeId]).map((r) => r.employeeId);
  const counts = useMemo(() => ({
    punched: rows.filter((r) => r.source === "punch" || r.punchCount > 0).length,
    marked: rows.filter((r) => r.marked).length,
    notMarked: rows.filter((r) => !r.marked).length,
  }), [rows]);

  function edit(employeeId, patch) {
    setEdits((prev) => ({ ...prev, [employeeId]: { ...(prev[employeeId] || {}), ...patch } }));
  }

  function applyBulkStatus() {
    if (!selectedIds.length) return;
    setEdits((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => { next[id] = { ...(next[id] || {}), status: bulkStatus }; });
      return next;
    });
  }

  async function save() {
    const records = rows
      .filter((r) => edits[r.employeeId])
      .map((r) => ({
        employeeId: r.employeeId,
        checkIn: r.checkIn || null,
        checkOut: r.checkOut || null,
        status: r.status || (r.checkIn ? "Present" : "Absent"),
        remark: r.remark || null,
      }));
    if (!records.length) return;
    setSaving(true);
    try {
      await api.post("/hrms/attendance/bulk/", { date, records });
      showToast?.(`Attendance saved for ${records.length} employee${records.length === 1 ? "" : "s"} on ${date.split("-").reverse().join("-")}`);
      await load();
    } catch (err) {
      showToast?.(`Attendance not saved — ${err?.payload?.message || err?.message || "try again"}`);
    } finally {
      setSaving(false);
    }
  }

  const allChecked = filtered.length > 0 && filtered.every((r) => checked[r.employeeId]);

  return (
    <div className="flex flex-col gap-6">
      <PageTitle subtitle="The day's register, filled from each employee's Punch In / Punch Out. Edit a row to correct it." />

      <div className="grid grid-cols-3 gap-3">
        {[
          ["From punches", counts.punched, "text-emerald-700"],
          ["Marked", counts.marked, "text-slate-900"],
          ["Not marked yet", counts.notMarked, "text-amber-700"],
        ].map(([label, value, tone]) => (
          <div key={label} className="bg-white border border-bdr rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-semibold uppercase text-muted">{label}</div>
            <div className={`text-[22px] font-extrabold ${tone}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-bdr rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]">
          <CalendarIcon size={14} className="text-slate-500" />
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="bg-transparent outline-none" />
        </label>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]">
          {departments.map((d) => <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>)}
        </select>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee or ID…" className="w-full h-9 pl-8 pr-3 bg-off border border-bdr rounded-xl text-[13px] outline-none" />
        </div>
        <button type="button" onClick={load} className="btn-outline h-9 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted">{selectedIds.length} selected →</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="h-9 px-2 bg-off border border-bdr rounded-xl text-[13px]">
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button type="button" onClick={applyBulkStatus} disabled={!selectedIds.length} className="btn-outline h-9 px-3 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer">
            Apply
          </button>
        </div>
      </div>

      <div className="bg-white border border-bdr rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead className="bg-slate-50/75 border-b border-bdr text-[11px] uppercase tracking-wider text-muted font-bold">
              <tr>
                <th className="py-3 pl-5 w-10">
                  <input type="checkbox" checked={allChecked} onChange={(e) => setChecked(Object.fromEntries(filtered.map((r) => [r.employeeId, e.target.checked])))} />
                </th>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Check In</th>
                <th className="py-3 px-3">Check Out</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bdr/40">
              {loading && serverRows.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-muted"><Loader2 size={16} className="inline animate-spin mr-2" />Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-muted">No employees match the filters.</td></tr>
              )}
              {filtered.map((r) => {
                const punched = r.source === "punch" || r.punchCount > 0;
                const dirty = Boolean(edits[r.employeeId]);
                return (
                  <tr key={r.employeeId} className={dirty ? "bg-amber-50/40" : "hover:bg-slate-50/60"}>
                    <td className="py-2.5 pl-5">
                      <input type="checkbox" checked={Boolean(checked[r.employeeId])} onChange={(e) => setChecked((p) => ({ ...p, [r.employeeId]: e.target.checked }))} />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{r.name}</div>
                      <div className="text-[11px] text-muted">{r.empId}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{r.dept || "—"}</td>
                    <td className="py-2.5 px-3">
                      {punched ? (
                        <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                          <Fingerprint size={11} /> Punch{r.punchCount > 1 ? ` ×${r.punchCount}` : ""}
                        </span>
                      ) : r.marked ? (
                        <span className="text-[11.5px] font-semibold text-slate-600 capitalize">{r.source || "manual"}</span>
                      ) : (
                        <span className="text-[11.5px] text-amber-700 inline-flex items-center gap-1"><Clock size={11} /> Not marked</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <input type="time" value={r.checkIn} onChange={(e) => edit(r.employeeId, { checkIn: e.target.value })} className="h-8 px-2 bg-white border border-bdr rounded-lg" />
                    </td>
                    <td className="py-2.5 px-3">
                      <input type="time" value={r.checkOut} onChange={(e) => edit(r.employeeId, { checkOut: e.target.value })} className="h-8 px-2 bg-white border border-bdr rounded-lg" />
                    </td>
                    <td className="py-2.5 px-3">
                      <select value={r.status} onChange={(e) => edit(r.employeeId, { status: e.target.value })} className="h-8 px-2 bg-white border border-bdr rounded-lg">
                        <option value="">—</option>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <input value={r.remark} onChange={(e) => edit(r.employeeId, { remark: e.target.value })} placeholder={punched && dirty ? "Reason for correction" : "—"} className="h-8 px-2 w-40 bg-white border border-bdr rounded-lg" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-bdr/60">
          <span className="text-[12px] text-muted">
            {dirtyIds.length ? `${dirtyIds.length} change${dirtyIds.length === 1 ? "" : "s"} not saved` : "Rows from punches update on their own."}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEdits({})} disabled={!dirtyIds.length || saving} className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer">
              Discard
            </button>
            <button type="button" onClick={save} disabled={!dirtyIds.length || saving} className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer">
              {saving && <Loader2 size={13} className="animate-spin" />} Save Attendance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
