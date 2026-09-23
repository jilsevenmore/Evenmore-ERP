import { create } from "zustand";
import { writeThrough, pullTracked, pullFlexibility, pushFlexibility } from "../services/hrmsSync";
import { getShiftTiming, minutesOfTime } from "../data/hrms/mocks/attendanceExtended";

const PUNCH_LS_K = "hrms_punch_v1";

function loadPunches() {
  try {
    const v = localStorage.getItem(PUNCH_LS_K);
    if (v) return JSON.parse(v) || [];
  } catch {}
  return [];
}

function persistPunches(rows) {
  try {
    localStorage.setItem(PUNCH_LS_K, JSON.stringify(rows));
  } catch {}
}

function todayIso() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export const useAttendanceStore = create((set, get) => ({
  /** Load this module's collections from the API. */
  hydrate: async () => {
    const rows = await Promise.all([
      pullTracked("attendance"),
      pullTracked("attendanceRegularizations"),
      pullFlexibility(),
    ]);
    set((s) => ({
      records: rows[0] || s.records,
      requests: rows[1] || s.requests,
      flexibility: rows[2] || s.flexibility,
      punchRecords: loadPunches(),
    }));
    return rows;
  },

  /** Empty on sign-out so the next user sees nothing of the previous one. */
  clear: () => set({ records: [], requests: [], punchRecords: [] }),

  records: [],
  requests: [],
  punchRecords: loadPunches(),
  // Grace periods and the like are tenant settings the server owns.
  flexibility: {},
  role: "HR",

  saveDailyAttendance: (date, updatedRecords) => set((s) => {
    // Merge or replace records matching this date or employee ID
    const otherRecords = s.records.filter((r) => r.date !== date);
    const combined = [...updatedRecords, ...otherRecords];
    writeThrough("attendance", combined);
    return { records: combined };
  }),

  updateRecord: (id, patch) => set((s) => {
    const recs = s.records.map((r) => r.id === id ? { ...r, ...patch } : r);
    writeThrough("attendance", recs);
    return { records: recs };
  }),

  bulkUpdate: (ids, status) => set((s) => {
    const recs = s.records.map((r) => ids.includes(r.id) ? { ...r, status } : r);
    writeThrough("attendance", recs);
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
    writeThrough("attendanceRegularizations", reqs);
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
          (rec.name && targetReq.employee && String(rec.name ?? '').toLowerCase() === String(targetReq.employee ?? '').toLowerCase());

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

    writeThrough("attendance", updatedRecords);
    return { requests: reqs, records: updatedRecords };
  }),

  saveFlexibility: (flexibility) => {
    set({ flexibility });
    pushFlexibility(flexibility).catch((err) => {
      console.warn("[HRMS] flexibility not saved:", err?.message || err);
    });
  },

  // Which view the screen shows (HR vs employee); a UI choice, not stored data.
  setRole: (role) => set({ role }),

  // ── Web punch in / out (Today page + Topbar button) ──────────────
  // Local-first: persists to localStorage so it works without a backend
  // punch endpoint; also mirrors a Present/Late row into `records` via
  // writeThrough so the Overview table stays consistent.
  punchIn: (payload) => set((s) => {
    const employeeId = payload?.employeeId;
    const date = payload?.date || todayIso();
    if (!employeeId) return s;
    const existing = (s.punchRecords || []).find((r) => r.employeeId === employeeId && r.date === date);
    if (existing) return s;
    const now = new Date();
    let timing = { name: payload?.shift || "General" };
    let threshold = null;
    try {
      timing = getShiftTiming(payload?.shift);
      const lateAfterText = s.flexibility?.lateAfter;
      threshold = lateAfterText
        ? minutesOfTime(lateAfterText)
        : minutesOfTime(timing.start) + (parseInt(s.flexibility?.gracePeriod, 10) || 10);
    } catch {}
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const lateMinutes = threshold != null && nowMinutes > threshold ? nowMinutes - threshold : 0;
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
    const ns = [record, ... (s.punchRecords || [])];
    persistPunches(ns);
    return { punchRecords: ns };
  }),

  punchOut: (employeeId, options = {}) => set((s) => {
    const date = options.date || todayIso();
    const session = (s.punchRecords || []).find(
      (r) => r.employeeId === employeeId && r.date === date && r.punchIn && !r.punchOut
    );
    if (!session) return s;
    const now = new Date();
    const workingMinutes = Math.max(0, Math.round((now.getTime() - new Date(session.punchIn).getTime()) / 60000));
    let endMinutes = null;
    try {
      endMinutes = minutesOfTime(getShiftTiming(session.shift).end);
    } catch {}
    const outMinutes = now.getHours() * 60 + now.getMinutes();
    const earlyOutMinutes = endMinutes != null && outMinutes < endMinutes ? endMinutes - outMinutes : 0;
    const overtimeRuleText = s.flexibility?.overtimeStartsAfter;
    const overtimeAfter = (parseInt(overtimeRuleText, 10) || 8) * 60;
    const overtimeMinutes = workingMinutes > overtimeAfter ? workingMinutes - overtimeAfter : 0;
    const iso = now.toISOString();
    const ns = (s.punchRecords || []).map((r) =>
      r.id === session.id
        ? { ...r, punchOut: iso, workingMinutes, earlyOutMinutes, overtimeMinutes, updatedAt: iso }
        : r
    );
    persistPunches(ns);
    return { punchRecords: ns };
  }),
}));
