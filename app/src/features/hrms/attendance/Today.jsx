import { useState, useMemo, useEffect } from "react";
import { ChevronRight, LogIn, LogOut, Clock, CalendarDays, CheckCircle2, AlertTriangle, Timer, Globe, X } from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { useAttendanceStore } from "../../../stores/attendanceStore";
import { attendanceEmployees, getShiftTiming, minutesOfTime } from "../../../data/hrms/mocks/attendanceExtended";
import Modal from "../../../components/ui/Modal";
import Pagination from "../../../components/ui/Pagination";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function todayISO() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function formatClock(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
}

function formatHHMM(hhmm) {
  if (!hhmm) return "—";
  const parts = String(hhmm).split(":");
  let h = parseInt(parts[0], 10);
  const m = String(parts[1]).padStart(2, "0");
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function durationLabel(minutes) {
  if (minutes === null || minutes === undefined) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function minuteLabel(minutes) {
  if (!minutes && minutes !== 0) return "—";
  return `${minutes} min`;
}

const statusStyles = {
  Present: { background: "#e6f4ea", color: "#15803d", border: "#a7f3d0" },
  Late: { background: "#fef3c7", color: "#b45309", border: "#fde68a" },
  Absent: { background: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
  WFH: { background: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  "Half Day": { background: "#f3e8ff", color: "#7e22ce", border: "#d8b4fe" },
  "On Leave": { background: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
};

export default function Today() {
  const setToast = useAppStore((s) => s.setToast || s.showToast);
  const storeEmployees = useAppStore((s) => s.employees || []);
  const currentUser = useAppStore((s) => s.currentUser || {});
  const punchRecords = useAttendanceStore((s) => s.punchRecords || []);
  const punchIn = useAttendanceStore((s) => s.punchIn);
  const punchOut = useAttendanceStore((s) => s.punchOut);
  const addRequest = useAttendanceStore((s) => s.addRequest);

  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [earlyOpen, setEarlyOpen] = useState(false);
  const [earlyReason, setEarlyReason] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const employeesList = useMemo(() => {
    const map = new Map();
    [...attendanceEmployees, ...storeEmployees].forEach((e) => {
      if (!e || !e.id) return;
      const ext = attendanceEmployees.find((x) => x.id === e.id);
      map.set(e.id, {
        id: e.id,
        name: e.name,
        designation: e.designation || ext?.designation || "Employee",
        dept: e.department || e.dept || ext?.dept || "General",
        avatar: e.avatar || `https://i.pravatar.cc/100?u=${e.id}`,
        shift: ext?.shift || "General",
        location: e.location || ext?.location || null,
      });
    });
    return [...map.values()];
  }, [storeEmployees]);

  useEffect(() => {
    if (!selectedEmpId && employeesList.length > 0) {
      const matched = employeesList.find(
        (e) => e.name?.toLowerCase() === String(currentUser?.name || "").toLowerCase()
      );
      setSelectedEmpId(matched?.id || employeesList[0].id);
    }
  }, [employeesList, currentUser, selectedEmpId]);

  const currentEmp = useMemo(
    () => employeesList.find((e) => e.id === selectedEmpId) || employeesList[0] || null,
    [employeesList, selectedEmpId]
  );

  const today = todayISO();
  const todaySession = useMemo(
    () => punchRecords.find((r) => r.employeeId === selectedEmpId && r.date === today) || null,
    [punchRecords, selectedEmpId, today]
  );
  const hasPunchedIn = Boolean(todaySession?.punchIn);
  const hasPunchedOut = Boolean(todaySession?.punchOut);

  const timing = useMemo(() => (currentEmp ? getShiftTiming(currentEmp.shift) : getShiftTiming("General")), [currentEmp]);

  const runningMinutes = useMemo(() => {
    if (!todaySession?.punchIn || todaySession?.punchOut) return 0;
    return Math.max(0, Math.floor((now.getTime() - new Date(todaySession.punchIn).getTime()) / 60000));
  }, [todaySession, now]);

  const history = useMemo(() => {
    return punchRecords
      .filter((r) => r.employeeId === selectedEmpId)
      .sort((a, b) => `${b.date} ${b.punchIn || ""}`.localeCompare(`${a.date} ${a.punchIn || ""}`));
  }, [punchRecords, selectedEmpId]);

  const TDY_PAGE_SIZE = 8;
  const [tdyPage, setTdyPage] = useState(1);
  useEffect(() => {
    setTdyPage(1);
  }, [selectedEmpId, punchRecords.length]);
  const tdyTotalPages = Math.max(1, Math.ceil(history.length / TDY_PAGE_SIZE));
  useEffect(() => {
    if (tdyPage > tdyTotalPages) setTdyPage(tdyTotalPages);
  }, [tdyPage, tdyTotalPages]);
  const paginatedHistory = useMemo(() => {
    const start = (tdyPage - 1) * TDY_PAGE_SIZE;
    return history.slice(start, start + TDY_PAGE_SIZE);
  }, [history, tdyPage]);

  const handlePunchIn = () => {
    if (!currentEmp) return;
    punchIn({
      employeeId: currentEmp.id,
      employeeName: currentEmp.name,
      date: today,
      shift: currentEmp.shift,
      branch: currentEmp.location,
    });
    setToast(`Punch In Successful · ${formatClock(new Date().toISOString())}`);
  };

  const completePunchOut = () => {
    punchOut(selectedEmpId, { date: today });
    setToast("Punch Out Successful · Attendance record updated.");
    setEarlyOpen(false);
    setEarlyReason("");
  };

  const handlePunchOut = () => {
    if (!currentEmp) return;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const endMinutes = minutesOfTime(getShiftTiming(currentEmp.shift).end);
    if (nowMinutes < endMinutes) {
      setEarlyOpen(true);
      return;
    }
    completePunchOut();
  };

  const submitEarlyRequest = () => {
    if (!earlyReason.trim()) {
      setToast("Please enter a reason for early clock-out.");
      return;
    }
    const nowIso = new Date().toISOString();
    addRequest({
      employee: currentEmp.name,
      employeeId: currentEmp.id,
      dept: currentEmp.dept,
      type: "Early Clock-Out",
      date: formatDate(today),
      currentIn: formatClock(todaySession?.punchIn),
      currentOut: formatClock(nowIso),
      requestedIn: formatClock(todaySession?.punchIn),
      requestedOut: formatClock(nowIso),
      reason: earlyReason,
      requestedBy: currentEmp.name,
    });
    punchOut(selectedEmpId, { date: today });
    setToast("Early clock-out request submitted · Punch out recorded.");
    setEarlyOpen(false);
    setEarlyReason("");
  };

  let statusLabel = "Not Checked In";
  let statusTone = "muted";
  if (hasPunchedIn && !hasPunchedOut) {
    statusLabel = "Checked In";
    statusTone = "blue";
  }
  if (hasPunchedOut) {
    statusLabel = "Attendance Completed";
    statusTone = "green";
  }
  if (hasPunchedIn && todaySession?.status === "Late") {
    statusLabel = hasPunchedOut ? "Attendance Completed · Late" : "Checked In · Late";
  }

  const statusSub = useMemo(() => {
    if (!todaySession) return `Shift ${timing.name} · ${formatHHMM(timing.start)} – ${formatHHMM(timing.end)}`;
    const parts = [`Shift ${timing.name}`];
    if (todaySession.lateMinutes > 0) parts.push(`Late by ${minuteLabel(todaySession.lateMinutes)}`);
    if (todaySession.earlyOutMinutes > 0) parts.push(`Early out ${minuteLabel(todaySession.earlyOutMinutes)}`);
    return parts.join(" · ");
  }, [todaySession, timing]);

  return (
    <div className="tdy-page">
      <nav className="tdy-crumb">
        <span style={{ cursor: "pointer" }}>Home</span>
        <ChevronRight size={13} style={{ color: "#9aa7bd" }} />
        <span style={{ color: "#111f36", fontWeight: 600 }}>Attendance / Today's Attendance</span>
      </nav>

      <div className="tdy-title-row">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="tdy-title">Today's Attendance</h1>
          </div>
          <p className="tdy-sub">Web clock in / clock out with live working hours, late and early-out tracking.</p>
        </div>
        <div className="tdy-date-badge">
          <CalendarDays size={15} />
          {formatDate(today)}
        </div>
      </div>

      <div className="tdy-card tdy-toolbar">
        <div className="tdy-toolbar-left">
          <span className="tdy-toolbar-label">Employee</span>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="tdy-select tdy-select-emp"
          >
            {employeesList.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.id}
              </option>
            ))}
          </select>
        </div>
        <div className="tdy-method-pill">
          <Globe size={13} />
          Method: WEB
        </div>
      </div>

      <div className="tdy-main-grid">
        <div className="tdy-card tdy-hero">
          <div className="tdy-emp-row">
            <img src={currentEmp?.avatar} alt={currentEmp?.name} className="tdy-avatar" />
            <div className="min-w-0">
              <div className="tdy-emp-name">{currentEmp?.name}</div>
              <div className="tdy-emp-meta">
                {currentEmp?.id} · {currentEmp?.designation} · {currentEmp?.dept}
              </div>
            </div>
            <span className="tdy-shift-pill">{timing.name}</span>
          </div>

          <div className="tdy-divider" />

          <div className="tdy-status-row">
            <span className={`tdy-status-dot ${statusTone}`} />
            <div className="min-w-0">
              <div className="tdy-status-label">{statusLabel}</div>
              <div className="tdy-status-sub">{statusSub}</div>
            </div>
          </div>

          <div className="tdy-times">
            <div className="tdy-time-block">
              <span className="tdy-time-label">Punch In</span>
              <span className="tdy-time-value">{formatClock(todaySession?.punchIn)}</span>
            </div>
            <div className="tdy-time-block">
              <span className="tdy-time-label">Punch Out</span>
              <span className="tdy-time-value">{formatClock(todaySession?.punchOut)}</span>
            </div>
            <div className="tdy-time-block">
              <span className="tdy-time-label">{hasPunchedOut ? "Working Hours" : "Current Working Time"}</span>
              <span className="tdy-time-value tdy-time-live">
                <Timer size={14} />
                {hasPunchedIn && !hasPunchedOut ? durationLabel(runningMinutes) : durationLabel(todaySession?.workingMinutes)}
              </span>
            </div>
          </div>

          <div className="tdy-clock-row">
            <Clock size={15} />
            <span>{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            <span className="tdy-clock-dash">—</span>
            <span>Now</span>
          </div>

          {!hasPunchedIn && (
            <button type="button" onClick={handlePunchIn} className="tdy-btn tdy-btn-in">
              <LogIn size={17} />
              Punch In
            </button>
          )}
          {hasPunchedIn && !hasPunchedOut && (
            <button type="button" onClick={handlePunchOut} className="tdy-btn tdy-btn-out">
              <LogOut size={17} />
              Punch Out
            </button>
          )}
          {hasPunchedOut && (
            <div className="tdy-completed">
              <CheckCircle2 size={18} />
              Attendance Completed
              <span className="tdy-completed-sub">Working {durationLabel(todaySession?.workingMinutes)} · {todaySession?.status}</span>
            </div>
          )}
        </div>

        <div className="tdy-summary">
          <div className="tdy-summary-card">
            <span className="tdy-summary-label">Punch In</span>
            <span className="tdy-summary-value">{formatClock(todaySession?.punchIn)}</span>
            <span className="tdy-summary-sub">{todaySession ? `Method ${todaySession.attendanceMethod}` : "Not yet"}</span>
          </div>
          <div className="tdy-summary-card">
            <span className="tdy-summary-label">Working Hours</span>
            <span className="tdy-summary-value">
              {hasPunchedIn && !hasPunchedOut ? durationLabel(runningMinutes) : durationLabel(todaySession?.workingMinutes)}
            </span>
            <span className="tdy-summary-sub">{hasPunchedIn && !hasPunchedOut ? "Live" : todaySession?.overtimeMinutes > 0 ? `+${minuteLabel(todaySession.overtimeMinutes)} OT` : todaySession ? "Final" : "—"}</span>
          </div>
          <div className="tdy-summary-card">
            <span className="tdy-summary-label">Late</span>
            <span className="tdy-summary-value">{minuteLabel(todaySession?.lateMinutes)}</span>
            <span className="tdy-summary-sub">Grace applied</span>
          </div>
          <div className="tdy-summary-card">
            <span className="tdy-summary-label">Status</span>
            <span className="tdy-summary-value">{todaySession ? todaySession.status : "—"}</span>
            <span className="tdy-summary-sub">{todaySession?.earlyOutMinutes > 0 ? `Early out ${minuteLabel(todaySession.earlyOutMinutes)}` : todaySession?.overtimeMinutes > 0 ? "Overtime" : "Web mark"}</span>
          </div>
        </div>
      </div>

      <div className="tdy-card tdy-main-card">
        <div className="tdy-section-head">
          <h3 className="tdy-section-title">Recent Attendance</h3>
          <span className="tdy-section-hint">Web attendance history for {currentEmp?.name}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tdy-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>PUNCH IN</th>
                <th>PUNCH OUT</th>
                <th>WORKING HOURS</th>
                <th>LATE</th>
                <th>EARLY OUT</th>
                <th>METHOD</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHistory.map((r) => (
                <tr key={r.id}>
                  <td className="tdy-date">{formatDate(r.date)}</td>
                  <td className="tdy-time">{formatClock(r.punchIn)}</td>
                  <td className="tdy-time">{formatClock(r.punchOut)}</td>
                  <td className="tdy-time">{durationLabel(r.workingMinutes)}</td>
                  <td className="tdy-time">{minuteLabel(r.lateMinutes)}</td>
                  <td className="tdy-time">{minuteLabel(r.earlyOutMinutes)}</td>
                  <td>
                    <span className="tdy-method-pill">{r.attendanceMethod}</span>
                  </td>
                  <td>
                    <span className="tdy-status" style={{ ...statusStyles[r.status], ...(r.earlyOutMinutes > 0 ? { background: "#f3e8ff", color: "#7e22ce", border: "#d8b4fe" } : {}) }}>
                      {r.earlyOutMinutes > 0 ? "Early Out" : r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "#6b7280", padding: "32px" }}>
                    No web attendance recorded yet for {currentEmp?.name}. Use Punch In to start today's session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ borderTop: "1px solid #f1f5f9", padding: "6px 20px 6px 8px", background: "#fff" }}>
          <Pagination total={history.length} page={tdyPage} pageSize={TDY_PAGE_SIZE} onChange={setTdyPage} />
        </div>
      </div>

      <Modal
        isOpen={earlyOpen}
        onClose={() => {
          setEarlyOpen(false);
          setEarlyReason("");
        }}
        title="Early Clock-Out"
        footer={
          <>
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                setEarlyOpen(false);
                setEarlyReason("");
              }}
            >
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={submitEarlyRequest}>
              Request Punch Out
            </button>
          </>
        }
      >
        <div className="tdy-early">
          <div className="tdy-early-alert">
            <AlertTriangle size={18} />
            <span>You are clocking out before your configured shift ends.</span>
          </div>
          <div className="tdy-early-grid">
            <div className="tdy-early-block">
              <span className="tdy-time-label">Expected Punch Out</span>
              <span className="tdy-time-value">{formatHHMM(timing.end)}</span>
            </div>
            <div className="tdy-early-block">
              <span className="tdy-time-label">Current Time</span>
              <span className="tdy-time-value">{formatClock(new Date().toISOString())}</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason <span className="required">*</span></label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Explain the reason for early clock-out..."
              value={earlyReason}
              onChange={(e) => setEarlyReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <style>{`
        .tdy-page { background: #f8fafc; margin: -24px -28px -40px; padding: 18px 26px 28px; min-height: calc(100vh - 62px); }
        .tdy-crumb { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7a90; margin-bottom: 10px; }
        .tdy-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
        .tdy-title { margin: 0; font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.01em; }
        .tdy-sub { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
        .tdy-date-badge { display: inline-flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e8edf3; border-radius: 12px; padding: 8px 16px; font-size: 13px; font-weight: 600; color: #334155; box-shadow: 0 1px 2px rgba(16,24,40,0.03); }

        .tdy-card { background: #fff; border: 1px solid #e8edf3; border-radius: 16px; box-shadow: 0 1px 3px rgba(16,24,40,0.03); }
        .tdy-toolbar { border: none; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .tdy-toolbar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .tdy-toolbar-label { font-size: 12px; font-weight: 700; letter-spacing: 0.04em; color: #6b7280; text-transform: uppercase; }
        .tdy-select { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 7px 32px 7px 14px; font-size: 13px; color: #374151; font-weight: 500; outline: none; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%230f172a' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 12px; }
        .tdy-select:focus { border-color: #94a3b8; background-color: #fff; }
        .tdy-select-emp { min-width: 220px; }
        .tdy-method-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.04em; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 999px; padding: 4px 12px; white-space: nowrap; }

        .tdy-main-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 16px; margin-bottom: 16px; }
        .tdy-hero { padding: 20px; }
        .tdy-emp-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .tdy-avatar { width: 46px; height: 46px; border-radius: 999px; object-fit: cover; }
        .tdy-emp-name { font-size: 17px; font-weight: 800; color: #111827; line-height: 1.2; }
        .tdy-emp-meta { font-size: 12.5px; color: #6b7280; margin-top: 2px; }
        .tdy-shift-pill { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; font-size: 12px; font-weight: 600; color: #374151; background: #f3f4f6; border-radius: 999px; padding: 4px 13px; white-space: nowrap; }
        .tdy-divider { height: 1px; background: #f1f5f9; margin: 16px 0; }

        .tdy-status-row { display: flex; align-items: center; gap: 10px; }
        .tdy-status-dot { width: 10px; height: 10px; border-radius: 999px; flex-shrink: 0; background: #94a3b8; }
        .tdy-status-dot.blue { background: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.15); }
        .tdy-status-dot.green { background: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,0.15); }
        .tdy-status-dot.muted { background: #94a3b8; box-shadow: 0 0 0 4px rgba(148,163,184,0.15); }
        .tdy-status-label { font-size: 15px; font-weight: 700; color: #111827; }
        .tdy-status-sub { font-size: 12.5px; color: #6b7280; margin-top: 2px; }

        .tdy-times { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
        .tdy-time-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; }
        .tdy-time-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #6b7280; text-transform: uppercase; }
        .tdy-time-value { display: flex; align-items: center; gap: 6px; font-size: 18px; font-weight: 800; color: #111827; margin-top: 4px; letter-spacing: -0.01em; }
        .tdy-time-live { color: #1f6bff; }

        .tdy-clock-row { display: flex; align-items: center; gap: 8px; margin-top: 16px; font-size: 12.5px; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 14px; }
        .tdy-clock-dash { color: #cbd5e1; }

        .tdy-btn { display: inline-flex; align-items: center; justify-content: center; gap: 9px; width: 100%; margin-top: 18px; border: none; border-radius: 12px; padding: 13px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 1px 3px rgba(16,24,40,0.06); }
        .tdy-btn-in { background: #1f6bff; color: #fff; }
        .tdy-btn-in:hover { background: #1a5bd6; }
        .tdy-btn-out { background: #16233a; color: #fff; }
        .tdy-btn-out:hover { background: #0f172a; }

        .tdy-completed { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 18px; background: #e6f4ea; border: 1px solid #a7f3d0; color: #15803d; border-radius: 12px; padding: 13px; font-size: 15px; font-weight: 700; }
        .tdy-completed-sub { font-size: 12.5px; font-weight: 500; color: #16a34a; }

        .tdy-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .tdy-summary-card { background: #fff; border: 1px solid #e8edf3; border-radius: 14px; padding: 14px 16px; box-shadow: 0 1px 2px rgba(16,24,40,0.03); }
        .tdy-summary-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #6b7280; text-transform: uppercase; }
        .tdy-summary-value { display: block; font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.02em; margin-top: 6px; }
        .tdy-summary-sub { display: block; font-size: 11.5px; color: #64748b; margin-top: 4px; }

        .tdy-main-card { overflow: hidden; }
        .tdy-section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 16px 20px 0; }
        .tdy-section-title { margin: 0; font-size: 15px; font-weight: 700; color: #111827; }
        .tdy-section-hint { font-size: 12px; color: #64748b; }
        .tdy-table { width: 100%; border-collapse: collapse; min-width: 760px; font-size: 13.5px; margin-top: 12px; }
        .tdy-table thead tr { background: #ffffff; border-bottom: 1px solid #e2e8f0; }
        .tdy-table th { text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #7b8aa0; padding: 12px 20px; white-space: nowrap; }
        .tdy-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.12s ease; }
        .tdy-table tbody tr:hover { background: #f8fafc; }
        .tdy-table td { padding: 12px 20px; vertical-align: middle; }
        .tdy-date { font-weight: 600; color: #111827; white-space: nowrap; }
        .tdy-time { font-weight: 500; color: #334155; white-space: nowrap; }
        .tdy-status { display: inline-block; font-size: 12px; font-weight: 600; border-radius: 999px; padding: 3px 12px; border: 1px solid; white-space: nowrap; }

        .tdy-early { display: grid; gap: 16px; }
        .tdy-early-alert { display: flex; align-items: center; gap: 9px; background: #fef3c7; border: 1px solid #fde68a; color: #92400e; border-radius: 12px; padding: 11px 14px; font-size: 13px; font-weight: 500; }
        .tdy-early-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .tdy-early-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; }

        @media (max-width: 1024px) {
          .tdy-main-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .tdy-times { grid-template-columns: 1fr; }
          .tdy-summary { grid-template-columns: 1fr 1fr; }
          .tdy-page { padding: 14px 14px 22px; }
        }
      `}</style>
    </div>
  );
}