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
export const useAttendanceStore = create((set, get) => ({
  records: saved?.records ?? dailyRecords,
  requests: saved?.requests ?? attendanceRequestsMock,
  flexibility: saved?.flexibility ?? flexibilityDefaults,
  role: saved?.role ?? "HR",

  saveDailyAttendance: (date, updatedRecords) => set((s) => {
    // Merge or replace records matching this date or employee ID
    const otherRecords = s.records.filter((r) => r.date !== date);
    const combined = [...updatedRecords, ...otherRecords];
    localStorage.setItem(
      LS_K,
      JSON.stringify({ records: combined, requests: s.requests, flexibility: s.flexibility, role: s.role })
    );
    return { records: combined };
  }),

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
    const newReq = {
      id: r.id || `REQ-${Date.now().toString().slice(-4)}`,
      submitted: "Today",
      status: "Pending",
      ...r,
    };
    const reqs = [newReq, ...s.requests];
    localStorage.setItem(
      LS_K,
      JSON.stringify({ records: s.records, requests: reqs, flexibility: s.flexibility, role: s.role })
    );
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

    localStorage.setItem(
      LS_K,
      JSON.stringify({ records: updatedRecords, requests: reqs, flexibility: s.flexibility, role: s.role })
    );
    return { requests: reqs, records: updatedRecords };
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
