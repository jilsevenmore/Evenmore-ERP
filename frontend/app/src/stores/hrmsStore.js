import { create } from "zustand";
export const useHRMSStore = create((set) => ({
  // Employee filters
  employeeSearch: "",
  setEmployeeSearch: (v) => set({ employeeSearch: v }),
  departmentFilter: "all",
  setDepartmentFilter: (v) => set({ departmentFilter: v }),
  // Attendance
  attendanceDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
  setAttendanceDate: (v) => set({ attendanceDate: v }),
  // Leave
  leaveFilter: "all",
  setLeaveFilter: (v) => set({ leaveFilter: v }),
  // Payroll
  payrollMonth: (/* @__PURE__ */ new Date()).toISOString().slice(0, 7),
  setPayrollMonth: (v) => set({ payrollMonth: v })
}));
