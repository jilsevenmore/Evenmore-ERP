import { create } from "zustand";
import { employeesMock, leaveRequestsMock, attendanceMock, candidatesMock } from "../data/hrms/mocks/data";

const LS_KEY = "hrms_store_v1";
const THEME_KEY = "evenmore_theme";

function applyThemeAttributes(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (theme !== "light") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && ["light", "dark", "midnight", "emerald"].includes(saved)) {
      applyThemeAttributes(saved);
      return saved;
    }
  } catch {}
  applyThemeAttributes("light");
  return "light";
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

const saved = load();

export const useAppStore = create((set) => ({
  // Theme state
  theme: loadTheme(),
  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
      applyThemeAttributes(theme);
    } catch {}
    set({ theme });
  },

  // Layout & Global App State
  currentUser: {
    name: "Adarsh Gupta",
    initials: "AG",
    role: "Operations Admin",
    email: "admin@evenmore.io",
    avatar: null,
  },
  setCurrentUser: (user) => set({ currentUser: user }),
  globalSearch: "",
  setGlobalSearch: (globalSearch) => set({ globalSearch }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  sidebarWidth: 280,
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),

  // HRMS & Unified State
  employees: saved?.employees ?? employeesMock,
  leaves: saved?.leaves ?? leaveRequestsMock,
  attendance: saved?.attendance ?? attendanceMock,
  candidates: saved?.candidates ?? candidatesMock,
  toast: null,
  showBanner: saved?.showBanner ?? true,
  setBanner: (v) =>
    set((s) => {
      const ns = { ...s, showBanner: v };
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          employees: ns.employees,
          leaves: ns.leaves,
          attendance: ns.attendance,
          candidates: ns.candidates,
          showBanner: v,
        })
      );
      return { showBanner: v };
    }),
  addEmployee: (e) =>
    set((s) => {
      const ns = [e, ...s.employees];
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          employees: ns,
          leaves: s.leaves,
          attendance: s.attendance,
          candidates: s.candidates,
          showBanner: s.showBanner,
        })
      );
      return { employees: ns };
    }),
  deleteEmployee: (id) =>
    set((s) => {
      const ns = s.employees.filter((x) => x.id !== id);
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          employees: ns,
          leaves: s.leaves,
          attendance: s.attendance,
          candidates: s.candidates,
          showBanner: s.showBanner,
        })
      );
      return { employees: ns };
    }),
  updateEmployee: (id, updates) =>
    set((s) => {
      const ns = s.employees.map((x) => (x.id === id || x.name === id ? { ...x, ...updates } : x));
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          employees: ns,
          leaves: s.leaves,
          attendance: s.attendance,
          candidates: s.candidates,
          showBanner: s.showBanner,
        })
      );
      return { employees: ns };
    }),
  updateEmployeeStatus: (idOrName, status) =>
    set((s) => {
      const ns = s.employees.map((x) =>
        x.id === idOrName || x.name?.toLowerCase() === idOrName?.toLowerCase()
          ? { ...x, status }
          : x
      );
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          employees: ns,
          leaves: s.leaves,
          attendance: s.attendance,
          candidates: s.candidates,
          showBanner: s.showBanner,
        })
      );
      return { employees: ns };
    }),
  addLeave: (l) =>
    set((s) => {
      const ns = [l, ...s.leaves];
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          employees: s.employees,
          leaves: ns,
          attendance: s.attendance,
          candidates: s.candidates,
          showBanner: s.showBanner,
        })
      );
      return { leaves: ns };
    }),
  approveLeave: (id, delegate) =>
    set((s) => {
      const ns = s.leaves.map((x) => (x.id === id ? { ...x, delegate, status: "Approved" } : x));
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          employees: s.employees,
          leaves: ns,
          attendance: s.attendance,
          candidates: s.candidates,
          showBanner: s.showBanner,
        })
      );
      return { leaves: ns };
    }),
  addAttendance: (a) =>
    set((s) => {
      const ns = [a, ...s.attendance];
      return { attendance: ns };
    }),
  moveCandidate: (id, stage) =>
    set((s) => {
      const ns = s.candidates.map((c) => (c.id === id ? { ...c, stage } : c));
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          employees: s.employees,
          leaves: s.leaves,
          attendance: s.attendance,
          candidates: ns,
          showBanner: s.showBanner,
        })
      );
      return { candidates: ns };
    }),
  showToast: (msg) => set({ toast: { id: Date.now().toString(), msg } }),
  clearToast: () => set({ toast: null }),
}));
