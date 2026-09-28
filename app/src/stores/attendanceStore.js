import { create } from "zustand";
import { lazyStore } from "../services/lazyModules";
import {
  writeThrough,
  pullTracked,
  pullFlexibility,
  pushFlexibility,
  pullTodayPunch,
  recordPunch,
  isBackendEnabled,
  isServerId,
} from "../services/hrmsSync";
import { api } from "../services/api";

function formatSeconds(secs) {
  if (!secs || secs < 0) return "00h 00m";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

const DEFAULT_TODAY_PUNCH = {
  hasEmployee: true,
  employee: null,
  status: "Not Punched In",
  isPunchedIn: false,
  dayCompleted: false,
  canPunchIn: true,
  canPunchOut: false,
  isEarlyOut: false,
  earlyLeavingMinutes: 0,
  shiftStart: "09:30",
  shiftEnd: "18:30",
  fullDayHours: 8,
  halfDayThresholdHours: 4,
  hasPendingRegularization: false,
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

function mapPunchPayload(res) {
  if (!res) return null;
  return {
    hasEmployee: res.has_employee !== false,
    employee: res.employee || null,
    status: res.status || "Not Punched In",
    isPunchedIn: Boolean(res.is_punched_in),
    dayCompleted: Boolean(res.day_completed),
    canPunchIn: res.can_punch_in !== undefined ? Boolean(res.can_punch_in) : (!res.is_punched_in && !res.day_completed),
    canPunchOut: res.can_punch_out !== undefined ? Boolean(res.can_punch_out) : Boolean(res.is_punched_in),
    isEarlyOut: Boolean(res.is_early_out),
    earlyLeavingMinutes: res.early_leaving_minutes || res.early_minutes || 0,
    shiftStart: res.shift_start || "09:30",
    shiftEnd: res.shift_end || "18:30",
    fullDayHours: res.full_day_hours || 8,
    halfDayThresholdHours: res.half_day_threshold_hours || 4,
    hasPendingRegularization: Boolean(res.has_pending_regularization),
    attendanceStatus: res.attendance_status || null,
    firstPunch: res.first_punch || null,
    lastPunch: res.last_punch || null,
    firstPunchIso: res.first_punch_iso || null,
    lastPunchIso: res.last_punch_iso || null,
    workingSeconds: res.working_seconds || 0,
    formattedWorkingTime: res.formatted_working_time || "00h 00m",
    workingHours: res.working_hours || 0,
    lateMinutes: res.late_minutes || 0,
    overtimeHours: res.overtime_hours || 0,
    punches: res.punches || [],
    pairs: res.pairs || [],
    loading: false,
    error: null,
  };
}

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
      todayPunch: punchStatus ? mapPunchPayload(punchStatus) : s.todayPunch,
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
          todayPunch: mapPunchPayload(punchStatus),
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
          todayPunch: mapPunchPayload(res),
        });
        // Sync attendance records in background
        get().refreshAttendance();
      }
      return res;
    } catch (err) {
      const msg = err?.payload?.message || err?.message || "Failed to punch in";
      set((s) => ({ todayPunch: { ...s.todayPunch, loading: false, error: msg } }));
      throw err;
    }
  },

  punchOut: async (payload = {}) => {
    try {
      set((s) => ({ todayPunch: { ...s.todayPunch, loading: true, error: null } }));
      const notes = typeof payload === "string" ? payload : (payload?.notes || payload?.remark || "");
      const earlyReason = typeof payload === "object" ? payload?.earlyReason : undefined;
      const requestRegularization = typeof payload === "object" ? payload?.requestRegularization : undefined;

      const res = await recordPunch({
        punchType: "OUT",
        notes,
        earlyReason,
        requestRegularization,
      });
      if (res) {
        set({
          todayPunch: mapPunchPayload(res),
        });
        get().refreshAttendance();
      }
      return res;
    } catch (err) {
      const msg = err?.payload?.message || err?.message || "Failed to punch out";
      set((s) => ({ todayPunch: { ...s.todayPunch, loading: false, error: msg } }));
      throw err;
    }
  },

  tickPunch: () => {
    const { todayPunch } = get();
    if (todayPunch.isPunchedIn) {
      const nextSeconds = (todayPunch.workingSeconds || 0) + 1;
      const nextHours = Number((nextSeconds / 3600).toFixed(2));
      set({
        todayPunch: {
          ...todayPunch,
          workingSeconds: nextSeconds,
          workingHours: nextHours,
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

  setRequestStatus: async (id, status, extra = {}) => {
    const targetReq = get().requests.find((r) => r.id === id);
    const approved = status === "Approved";

    if (isBackendEnabled() && isServerId(id)) {
      try {
        await api.patch(`/hrms/attendance/regularizations/${id}/`, {
          approved,
          remark: extra?.rejectReason || extra?.remark || (approved ? "Approved" : "Rejected"),
        });
      } catch (err) {
        console.warn("[HRMS] Failed to update regularization status on backend:", err);
      }
    }

    set((s) => {
      const reqs = s.requests.map((r) => (r.id === id ? { ...r, status, ...extra } : r));

      let updatedRecords = s.records;
      // If approved and was a regularization or early clock-out, write directly to matching record
      if (status === "Approved" && targetReq) {
        updatedRecords = s.records.map((rec) => {
          const matches =
            (targetReq.employeeId && rec.id === targetReq.employeeId) ||
            (rec.name &&
              targetReq.employee &&
              String(rec.name ?? "").toLowerCase() === String(targetReq.employee ?? "").toLowerCase());

          if (matches) {
            return {
              ...rec,
              checkIn: targetReq.requestedIn || rec.checkIn,
              checkOut: targetReq.requestedOut || rec.checkOut,
              status: targetReq.type === "Regularization" ? "Present" : rec.status,
              earlyLeavingMinutes: 0,
              earlyMins: 0,
              workHours: "08:30",
            };
          }
          return rec;
        });
      }

      writeThrough("attendanceRegularizations", reqs);
      writeThrough("attendance", updatedRecords);
      return { requests: reqs, records: updatedRecords };
    });

    get().fetchTodayPunch();
  },

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
