import { create } from "zustand";
import { lazyStore } from "../services/lazyModules";
import {
  writeThrough,
  pullTracked,
  pullFlexibility,
  pushFlexibility,
  pullTodayPunch,
  recordPunch,
} from "../services/hrmsSync";

function formatSeconds(secs) {
  if (!secs || secs < 0) return "00h 00m";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

const DEFAULT_TODAY_PUNCH = {
  status: "Not Punched In",
  isPunchedIn: false,
  attendanceStatus: null,
  firstPunch: null,
  lastPunch: null,
  firstPunchIso: null,
  lastPunchIso: null,
  workingSeconds: 0,
  formattedWorkingTime: "00h 00m",
  workingHours: 0,
  lateMinutes: 0,
  overtimeHours: 0,
  punches: [],
  pairs: [],
  loading: false,
  error: null,
};

const useAttendanceStoreBase = create((set, get) => ({
  /** Load this module's collections from the API. */
  hydrate: async () => {
    const [attRows, reqRows, flex, punchStatus] = await Promise.all([
      pullTracked("attendance"),
      pullTracked("attendanceRegularizations"),
      pullFlexibility(),
      pullTodayPunch().catch(() => null),
    ]);
    set((s) => ({
      records: attRows || s.records,
      requests: reqRows || s.requests,
      flexibility: flex || s.flexibility,
      todayPunch: punchStatus
        ? {
            status: punchStatus.status || "Not Punched In",
            isPunchedIn: Boolean(punchStatus.is_punched_in),
            attendanceStatus: punchStatus.attendance_status || null,
            firstPunch: punchStatus.first_punch || null,
            lastPunch: punchStatus.last_punch || null,
            firstPunchIso: punchStatus.first_punch_iso || null,
            lastPunchIso: punchStatus.last_punch_iso || null,
            workingSeconds: punchStatus.working_seconds || 0,
            formattedWorkingTime: punchStatus.formatted_working_time || "00h 00m",
            workingHours: punchStatus.working_hours || 0,
            lateMinutes: punchStatus.late_minutes || 0,
            overtimeHours: punchStatus.overtime_hours || 0,
            punches: punchStatus.punches || [],
            pairs: punchStatus.pairs || [],
            loading: false,
            error: null,
          }
        : s.todayPunch,
    }));
    return [attRows, reqRows, flex];
  },

  /** Empty on sign-out so the next user sees nothing of the previous one. */
  clear: () => set({ records: [], requests: [], todayPunch: DEFAULT_TODAY_PUNCH }),

  records: [],
  requests: [],
  todayPunch: DEFAULT_TODAY_PUNCH,

  fetchTodayPunch: async (employeeId = null) => {
    try {
      set((s) => ({ todayPunch: { ...s.todayPunch, loading: true, error: null } }));
      const punchStatus = await pullTodayPunch(employeeId);
      if (punchStatus) {
        set({
          todayPunch: {
            status: punchStatus.status || "Not Punched In",
            isPunchedIn: Boolean(punchStatus.is_punched_in),
            attendanceStatus: punchStatus.attendance_status || null,
            firstPunch: punchStatus.first_punch || null,
            lastPunch: punchStatus.last_punch || null,
            firstPunchIso: punchStatus.first_punch_iso || null,
            lastPunchIso: punchStatus.last_punch_iso || null,
            workingSeconds: punchStatus.working_seconds || 0,
            formattedWorkingTime: punchStatus.formatted_working_time || "00h 00m",
            workingHours: punchStatus.working_hours || 0,
            lateMinutes: punchStatus.late_minutes || 0,
            overtimeHours: punchStatus.overtime_hours || 0,
            punches: punchStatus.punches || [],
            pairs: punchStatus.pairs || [],
            loading: false,
            error: null,
          },
        });
      } else {
        set((s) => ({ todayPunch: { ...s.todayPunch, loading: false } }));
      }
      return punchStatus;
    } catch (err) {
      set((s) => ({
        todayPunch: {
          ...s.todayPunch,
          loading: false,
          error: err?.message || "Failed to load today punch status",
        },
      }));
      return null;
    }
  },

  punchIn: async (notes = "") => {
    try {
      set((s) => ({ todayPunch: { ...s.todayPunch, loading: true, error: null } }));
      const res = await recordPunch({ punchType: "IN", notes });
      if (res) {
        set({
          todayPunch: {
            status: res.status || "Punched In",
            isPunchedIn: true,
            attendanceStatus: res.attendance_status || "Present",
            firstPunch: res.first_punch,
            lastPunch: res.last_punch,
            firstPunchIso: res.first_punch_iso,
            lastPunchIso: res.last_punch_iso,
            workingSeconds: res.working_seconds || 0,
            formattedWorkingTime: res.formatted_working_time || "00h 00m",
            workingHours: res.working_hours || 0,
            lateMinutes: res.late_minutes || 0,
            overtimeHours: res.overtime_hours || 0,
            punches: res.punches || [],
            pairs: res.pairs || [],
            loading: false,
            error: null,
          },
        });
        // Sync attendance records in background
        pullTracked("attendance").then((recs) => {
          if (recs) set({ records: recs });
        });
      }
      return res;
    } catch (err) {
      const msg = err?.message || err?.payload?.message || "Failed to punch in";
      set((s) => ({ todayPunch: { ...s.todayPunch, loading: false, error: msg } }));
      throw err;
    }
  },

  punchOut: async (notes = "") => {
    try {
      set((s) => ({ todayPunch: { ...s.todayPunch, loading: true, error: null } }));
      const res = await recordPunch({ punchType: "OUT", notes });
      if (res) {
        set({
          todayPunch: {
            status: res.status || "Punched Out",
            isPunchedIn: false,
            attendanceStatus: res.attendance_status || null,
            firstPunch: res.first_punch,
            lastPunch: res.last_punch,
            firstPunchIso: res.first_punch_iso,
            lastPunchIso: res.last_punch_iso,
            workingSeconds: res.working_seconds || 0,
            formattedWorkingTime: res.formatted_working_time || "00h 00m",
            workingHours: res.working_hours || 0,
            lateMinutes: res.late_minutes || 0,
            overtimeHours: res.overtime_hours || 0,
            punches: res.punches || [],
            pairs: res.pairs || [],
            loading: false,
            error: null,
          },
        });
        pullTracked("attendance").then((recs) => {
          if (recs) set({ records: recs });
        });
      }
      return res;
    } catch (err) {
      const msg = err?.message || err?.payload?.message || "Failed to punch out";
      set((s) => ({ todayPunch: { ...s.todayPunch, loading: false, error: msg } }));
      throw err;
    }
  },

  tickPunch: () => {
    const { todayPunch } = get();
    if (todayPunch.isPunchedIn) {
      const nextSeconds = (todayPunch.workingSeconds || 0) + 1;
      set({
        todayPunch: {
          ...todayPunch,
          workingSeconds: nextSeconds,
          formattedWorkingTime: formatSeconds(nextSeconds),
        },
      });
    }
  },

  // Refresh attendance records from API
  refreshAttendance: async () => {
    try {
      const recs = await pullTracked("attendance");
      if (recs) set({ records: recs });
      return recs;
    } catch {
      return null;
    }
  },

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
  setRole: (role) => set({ role })
}));

// Hydrated the first time a screen reads it, not at boot — services/lazyModules.
export const useAttendanceStore = lazyStore(useAttendanceStoreBase, "attendance");
