import { create } from "zustand";
<<<<<<< Updated upstream
import { lazyStore } from "../services/lazyModules";
import { writeThrough, pullTracked, pullFlexibility, pushFlexibility } from "../services/hrmsSync";
const useAttendanceStoreBase = create((set, get) => ({
=======
import { writeThrough, pullTracked, pullFlexibility, pushFlexibility } from "../services/hrmsSync";

const PUNCH_KEY = "evenmore_punch_records";
const GRACE_MINUTES = 10;
const STANDARD_SHIFT_MINUTES = 480;

function todayISODate() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function shiftStartMinutes(shift) {
  if (shift === "Flexible") return 10 * 60;
  if (shift === "Night") return 22 * 60;
  return 9 * 60;
}

function shiftEndMinutes(shift) {
  if (shift === "Flexible") return 19 * 60;
  if (shift === "Night") return 6 * 60;
  return 18 * 60;
}

function loadPunchRecords() {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(PUNCH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePunchRecords(rows) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(PUNCH_KEY, JSON.stringify(rows || []));
  } catch {}
}
export const useAttendanceStore = create((set, get) => ({
>>>>>>> Stashed changes
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
    }));
    return rows;
  },

  /** Empty on sign-out so the next user sees nothing of the previous one. */
<<<<<<< Updated upstream
  clear: () => set({ records: [], requests: [] }),

  records: [],
  requests: [],
=======
  clear: () => {
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem(PUNCH_KEY);
    } catch {}
    return set({ records: [], requests: [], punchRecords: [] });
  },

  records: [],
  requests: [],
  // Web clock-in/out sessions (Today page + Topbar shortcut). Local-only;
  // the daily roster above stays server-owned.
  punchRecords: typeof localStorage !== "undefined" ? loadPunchRecords() : [],
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
  // ── Web punch clock (Today page + Topbar fingerprint shortcut) ──

  punchIn: (payload = {}) => {
    const employeeId = payload.employeeId;
    if (!employeeId) return null;
    const date = payload.date || todayISODate();
    const existing = get().punchRecords.find(
      (r) => r.employeeId === employeeId && r.date === date
    );
    // One session per employee per day — return the open/completed session.
    if (existing?.punchIn) return existing;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const shift = payload.shift || existing?.shift || "General";
    const lateMinutes = Math.max(0, nowMinutes - (shiftStartMinutes(shift) + GRACE_MINUTES));

    const record = {
      id: `PUNCH-${employeeId}-${date}`,
      employeeId,
      employeeName: payload.employeeName || existing?.employeeName || employeeId,
      date,
      shift,
      branch: payload.branch ?? existing?.branch ?? null,
      attendanceMethod: "WEB",
      punchIn: now.toISOString(),
      punchOut: null,
      status: lateMinutes > 0 ? "Late" : "Present",
      lateMinutes,
      earlyOutMinutes: 0,
      workingMinutes: 0,
      overtimeMinutes: 0,
    };
    set((s) => {
      const rows = [...(s.punchRecords || []), record];
      savePunchRecords(rows);
      return { punchRecords: rows };
    });
    return record;
  },

  punchOut: (employeeId, opts = {}) => {
    if (!employeeId) return null;
    const date = opts.date || todayISODate();
    const now = new Date();
    let updated = null;
    set((s) => {
      const rows = (s.punchRecords || []).map((r) => {
        const isTarget =
          r.employeeId === employeeId &&
          (r.date === date || (!r.punchOut && r.punchIn));
        if (!isTarget || r.punchOut || !r.punchIn) return r;
        const start = new Date(r.punchIn).getTime();
        const workingMinutes = Number.isFinite(start)
          ? Math.max(0, Math.floor((now.getTime() - start) / 60000))
          : 0;
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const startMin = shiftStartMinutes(r.shift || "General");
        const endMin = shiftEndMinutes(r.shift || "General");
        const isDayShift = endMin > startMin;
        const earlyOutMinutes = isDayShift ? Math.max(0, endMin - nowMinutes) : 0;
        const overtimeMinutes = Math.max(0, workingMinutes - STANDARD_SHIFT_MINUTES);
        updated = {
          ...r,
          punchOut: now.toISOString(),
          workingMinutes,
          earlyOutMinutes,
          overtimeMinutes,
        };
        return updated;
      });
      savePunchRecords(rows);
      return { punchRecords: rows };
    });
    return updated;
  },

>>>>>>> Stashed changes
  // Which view the screen shows (HR vs employee); a UI choice, not stored data.
  setRole: (role) => set({ role })
}));

// Hydrated the first time a screen reads it, not at boot — services/lazyModules.
export const useAttendanceStore = lazyStore(useAttendanceStoreBase, "attendance");
