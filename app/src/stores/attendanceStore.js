import { create } from "zustand";
import { attendanceRequestsMock, dailyRecords, flexibilityDefaults } from "../data/hrms/mocks/attendanceExtended";
const LS_K = "hrms_attendance_v1";
function load() {
  try {
    const v = localStorage.getItem(LS_K);
    if (v) return JSON.parse(v);
  } catch {
  }
  return null;
}
const saved = load();
export const useAttendanceStore = create((set) => ({
  records: saved?.records ?? dailyRecords,
  requests: saved?.requests ?? attendanceRequestsMock,
  flexibility: saved?.flexibility ?? flexibilityDefaults,
  role: saved?.role ?? "HR",
  updateRecord: (id, patch) => set((s) => {
    const recs = s.records.map((r) => r.id === id ? { ...r, ...patch } : r);
    localStorage.setItem(
      LS_K,
      JSON.stringify({ records: recs, requests: s.requests, flexibility: s.flexibility, role: s.role })
    );
    return { records: recs };
  }),
  bulkUpdate: (ids, status) => set((s) => {
    const recs = s.records.map((r) => ids.includes(r.id) ? { ...r, status } : r);
    localStorage.setItem(
      LS_K,
      JSON.stringify({ records: recs, requests: s.requests, flexibility: s.flexibility, role: s.role })
    );
    return { records: recs };
  }),
  addRequest: (r) => set((s) => {
    const reqs = [r, ...s.requests];
    localStorage.setItem(
      LS_K,
      JSON.stringify({ records: s.records, requests: reqs, flexibility: s.flexibility, role: s.role })
    );
    return { requests: reqs };
  }),
  setRequestStatus: (id, status, extra) => set((s) => {
    const reqs = s.requests.map((r) => r.id === id ? { ...r, status, ...extra } : r);
    localStorage.setItem(
      LS_K,
      JSON.stringify({ records: s.records, requests: reqs, flexibility: s.flexibility, role: s.role })
    );
    return { requests: reqs };
  }),
  saveFlexibility: (p) => set((s) => {
    localStorage.setItem(
      LS_K,
      JSON.stringify({ records: s.records, requests: s.requests, flexibility: p, role: s.role })
    );
    return { flexibility: p };
  }),
  setRole: (role) => set((s) => {
    localStorage.setItem(
      LS_K,
      JSON.stringify({ records: s.records, requests: s.requests, flexibility: s.flexibility, role })
    );
    return { role };
  })
}));
