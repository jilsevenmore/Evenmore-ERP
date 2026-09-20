import { create } from "zustand";
import {
  attendanceRequestsMock,
  dailyRecords,
  flexibilityDefaults,
  getShiftTiming,
  minutesOfTime,
} from "../data/hrms/mocks/attendanceExtended";
const LS_K = "hrms_attendance_v1";
function load() {
  try {
    const v = localStorage.getItem(LS_K);
    if (v) return JSON.parse(v);
  } catch {
  }
  return null;
}
function todayIso() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}
function saveState(s, punchRecords) {
  localStorage.setItem(
    LS_K,
    JSON.stringify({
      records: s.records,
      requests: s.requests,
      flexibility: s.flexibility,
      role: s.role,
      punchRecords,
    })
  );
}
const saved = load();
export const useAttendanceStore = create((set, get) => ({
  records: saved?.records ?? dailyRecords,
  requests: saved?.requests ?? attendanceRequestsMock,
  flexibility: saved?.flexibility ?? flexibilityDefaults,
  role: saved?.role ?? "HR",
  punchRecords: saved?.punchRecords ?? [],

  saveDailyAttendance: (date, updatedRecords) => set((s) => {
    const otherRecords = s.records.filter((r) => r.date !== date);
    const combined = [...updatedRecords, ...otherRecords];
    saveState(s, s.punchRecords);
    return { records: combined };
  }),

  updateRecord: (id, patch) => set((s) => {
    const recs = s.records.map((r) => r.id === id ? { ...r, ...patch } : r);
    saveState(s, s.punchRecords);
    return { records: recs };
  }),

  bulkUpdate: (ids, status) => set((s) => {
    const recs = s.records.map((r) => ids.includes(r.id) ? { ...r, status } : r);
    saveState(s, s.punchRecords);
    return { records: recs };
  }),

  addRequest: (r) => set((s) => {
    const newReq = {
      id: r.id || `REQ-${Date.now().toString().slice(-4)}`,
      submitted: "Today",
      status: "Pending",
      ...r,
    };
    const reqs = [newReq, ...s.requests];
    saveState(s, s.punchRecords);
    return { requests: reqs };
  }),

  setRequestStatus: (id, status, extra = {}) => set((s) => {
    const targetReq = s.requests.find((r) => r.id === id);
    const reqs = s.requests.map((r) => r.id === id ? { ...r, status, ...extra } : r);

    let updatedRecords = s.records;
    // If approved and was a regularization or early clock-out, write directly to matching record
    if (status === "Approved" && targetReq) {
      updatedRecords = s.records.map((rec) => {
        const matches =
          (targetReq.employeeId && rec.id === targetReq.employeeId) ||
          (rec.name && targetReq.employee && rec.name.toLowerCase() === targetReq.employee.toLowerCase());

        if (matches) {
          return {
            ...rec,
            checkIn: targetReq.requestedIn || rec.checkIn,
            checkOut: targetReq.requestedOut || rec.checkOut,
            status: targetReq.type === "Regularization" ? "Present" : rec.status,
            workHours: "08:30",
          };
        }
        return rec;
      });
    }

    saveState(s, s.punchRecords);
    return { requests: reqs, records: updatedRecords };
  }),

  saveFlexibility: (p) => set((s) => {
    saveState(s, s.punchRecords);
    return { flexibility: p };
  }),

  setRole: (role) => set((s) => {
    saveState(s, s.punchRecords);
    return { role };
  }),

  punchIn: (payload) => set((s) => {
    const employeeId = payload?.employeeId;
    const date = payload?.date || todayIso();
    const existing = s.punchRecords.find((r) => r.employeeId === employeeId && r.date === date);
    if (existing) return s;
    const now = new Date();
    const timing = getShiftTiming(payload?.shift);
    const lateAfterText = s.flexibility?.lateAfter;
    const threshold = lateAfterText
      ? minutesOfTime(lateAfterText)
      : minutesOfTime(timing.start) + (parseInt(s.flexibility?.gracePeriod, 10) || 10);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const lateMinutes = nowMinutes > threshold ? nowMinutes - threshold : 0;
    const iso = now.toISOString();
    const record = {
      id: `ATT-${now.getTime()}`,
      employeeId,
      employeeName: payload?.employeeName || "",
      date,
      punchIn: iso,
      punchOut: null,
      attendanceMethod: "WEB",
      status: lateMinutes > 0 ? "Late" : "Present",
      lateMinutes,
      earlyOutMinutes: 0,
      workingMinutes: 0,
      overtimeMinutes: 0,
      shift: timing.name,
      branch: payload?.branch || null,
      createdAt: iso,
      updatedAt: iso,
    };
    const ns = [record, ...s.punchRecords];
    saveState(s, ns);
    return { punchRecords: ns };
  }),

  punchOut: (employeeId, options = {}) => set((s) => {
    const date = options.date || todayIso();
    const session = s.punchRecords.find(
      (r) => r.employeeId === employeeId && r.date === date && r.punchIn && !r.punchOut
    );
    if (!session) return s;
    const now = new Date();
    const workingMinutes = Math.max(0, Math.round((now.getTime() - new Date(session.punchIn).getTime()) / 60000));
    const timing = getShiftTiming(session.shift);
    const endMinutes = minutesOfTime(timing.end);
    const outMinutes = now.getHours() * 60 + now.getMinutes();
    const earlyOutMinutes = outMinutes < endMinutes ? endMinutes - outMinutes : 0;
    const overtimeRuleText = s.flexibility?.overtimeStartsAfter;
    const overtimeAfter = (parseInt(overtimeRuleText, 10) || 8) * 60;
    const overtimeMinutes = workingMinutes > overtimeAfter ? workingMinutes - overtimeAfter : 0;
    const iso = now.toISOString();
    const ns = s.punchRecords.map((r) =>
      r.id === session.id
        ? {
            ...r,
            punchOut: iso,
            workingMinutes,
            earlyOutMinutes,
            overtimeMinutes,
            updatedAt: iso,
          }
        : r
    );
    saveState(s, ns);
    return { punchRecords: ns };
  })
}));
