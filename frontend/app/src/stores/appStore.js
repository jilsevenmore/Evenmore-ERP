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

export const defaultEncashments = [
  {
    id: "ENC-1001",
    employee: "Ayesha Khan",
    department: "Human Resources",
    avatar: "https://randomuser.me/api/portraits/women/24.jpg",
    days: 4,
    perDayRate: 2083,
    amount: 8332,
    requestDate: "2024-10-05",
    status: "Approved",
    processedMonth: "October 2024",
    notes: "Year-end encashment of surplus earned leaves",
  },
  {
    id: "ENC-1002",
    employee: "Priya Patel",
    department: "Engineering",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    days: 3,
    perDayRate: 2083,
    amount: 6249,
    requestDate: "2024-10-12",
    status: "Pending",
    processedMonth: "October 2024",
    notes: "Festive season encashment claim",
  },
];

export const defaultCompOffCredits = [
  {
    id: "CMP-501",
    employee: "David Park",
    department: "Engineering",
    avatar: "https://randomuser.me/api/portraits/men/46.jpg",
    workedDate: "2024-10-06",
    workType: "Full Day (8h)",
    days: 1.0,
    reason: "Production server database migration & downtime maintenance",
    status: "Approved",
    used: false,
    expiryDate: "2024-12-31",
  },
  {
    id: "CMP-502",
    employee: "Ayesha Khan",
    department: "Human Resources",
    avatar: "https://randomuser.me/api/portraits/women/24.jpg",
    workedDate: "2024-10-12",
    workType: "Full Day (8h)",
    days: 1.0,
    reason: "Campus hiring drive & student interviews on Saturday",
    status: "Approved",
    used: false,
    expiryDate: "2024-12-31",
  },
  {
    id: "CMP-503",
    employee: "Marcus Chen",
    department: "Design",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    workedDate: "2024-10-13",
    workType: "Half Day (4h)",
    days: 0.5,
    reason: "Urgent launch brand asset turnaround",
    status: "Pending",
    used: false,
    expiryDate: "2024-12-31",
  },
];

export const defaultCarriedOver = {
  "Ayesha Khan": 4,
  "Priya Patel": 6,
  "David Park": 8,
  "Marcus Chen": 3,
};

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
  encashments: saved?.encashments ?? defaultEncashments,
  compOffCredits: saved?.compOffCredits ?? defaultCompOffCredits,
  sandwichRuleEnabled: saved?.sandwichRuleEnabled ?? true,
  maxCarryForwardDays: saved?.maxCarryForwardDays ?? 12,
  carriedForwardLeaves: saved?.carriedForwardLeaves ?? defaultCarriedOver,
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
  rejectLeave: (id, reason = "") =>
    set((s) => {
      const ns = s.leaves.map((x) => (x.id === id ? { ...x, status: "Rejected", rejectReason: reason } : x));
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
  updateLeaveStatus: (id, status, extra = {}) =>
    set((s) => {
      const ns = s.leaves.map((x) => (x.id === id ? { ...x, status, ...extra } : x));
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

  // ── Leave Encashment Actions ──
  requestEncashment: (req) =>
    set((s) => {
      const newReq = {
        id: "ENC-" + Date.now().toString().slice(-4),
        requestDate: new Date().toISOString().split("T")[0],
        status: "Pending",
        processedMonth: "October 2024",
        ...req,
      };
      const ns = [newReq, ...(s.encashments || [])];
      try {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({
            employees: s.employees,
            leaves: s.leaves,
            attendance: s.attendance,
            candidates: s.candidates,
            showBanner: s.showBanner,
            encashments: ns,
            compOffCredits: s.compOffCredits,
            sandwichRuleEnabled: s.sandwichRuleEnabled,
            maxCarryForwardDays: s.maxCarryForwardDays,
            carriedForwardLeaves: s.carriedForwardLeaves,
          })
        );
      } catch {}
      return { encashments: ns };
    }),

  approveEncashment: (id) =>
    set((s) => {
      const ns = (s.encashments || []).map((x) =>
        x.id === id ? { ...x, status: "Approved" } : x
      );
      try {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({
            employees: s.employees,
            leaves: s.leaves,
            attendance: s.attendance,
            candidates: s.candidates,
            showBanner: s.showBanner,
            encashments: ns,
            compOffCredits: s.compOffCredits,
            sandwichRuleEnabled: s.sandwichRuleEnabled,
            maxCarryForwardDays: s.maxCarryForwardDays,
            carriedForwardLeaves: s.carriedForwardLeaves,
          })
        );
      } catch {}
      return { encashments: ns };
    }),

  rejectEncashment: (id, reason = "") =>
    set((s) => {
      const ns = (s.encashments || []).map((x) =>
        x.id === id ? { ...x, status: "Rejected", rejectReason: reason } : x
      );
      try {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({
            employees: s.employees,
            leaves: s.leaves,
            attendance: s.attendance,
            candidates: s.candidates,
            showBanner: s.showBanner,
            encashments: ns,
            compOffCredits: s.compOffCredits,
            sandwichRuleEnabled: s.sandwichRuleEnabled,
            maxCarryForwardDays: s.maxCarryForwardDays,
            carriedForwardLeaves: s.carriedForwardLeaves,
          })
        );
      } catch {}
      return { encashments: ns };
    }),

  // ── Comp-Off Actions ──
  requestCompOff: (claim) =>
    set((s) => {
      const newClaim = {
        id: "CMP-" + Date.now().toString().slice(-4),
        status: "Pending",
        used: false,
        expiryDate: "2024-12-31",
        ...claim,
      };
      const ns = [newClaim, ...(s.compOffCredits || [])];
      try {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({
            employees: s.employees,
            leaves: s.leaves,
            attendance: s.attendance,
            candidates: s.candidates,
            showBanner: s.showBanner,
            encashments: s.encashments,
            compOffCredits: ns,
            sandwichRuleEnabled: s.sandwichRuleEnabled,
            maxCarryForwardDays: s.maxCarryForwardDays,
            carriedForwardLeaves: s.carriedForwardLeaves,
          })
        );
      } catch {}
      return { compOffCredits: ns };
    }),

  approveCompOff: (id) =>
    set((s) => {
      const ns = (s.compOffCredits || []).map((x) =>
        x.id === id ? { ...x, status: "Approved" } : x
      );
      try {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({
            employees: s.employees,
            leaves: s.leaves,
            attendance: s.attendance,
            candidates: s.candidates,
            showBanner: s.showBanner,
            encashments: s.encashments,
            compOffCredits: ns,
            sandwichRuleEnabled: s.sandwichRuleEnabled,
            maxCarryForwardDays: s.maxCarryForwardDays,
            carriedForwardLeaves: s.carriedForwardLeaves,
          })
        );
      } catch {}
      return { compOffCredits: ns };
    }),

  rejectCompOff: (id, reason = "") =>
    set((s) => {
      const ns = (s.compOffCredits || []).map((x) =>
        x.id === id ? { ...x, status: "Rejected", rejectReason: reason } : x
      );
      try {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({
            employees: s.employees,
            leaves: s.leaves,
            attendance: s.attendance,
            candidates: s.candidates,
            showBanner: s.showBanner,
            encashments: s.encashments,
            compOffCredits: ns,
            sandwichRuleEnabled: s.sandwichRuleEnabled,
            maxCarryForwardDays: s.maxCarryForwardDays,
            carriedForwardLeaves: s.carriedForwardLeaves,
          })
        );
      } catch {}
      return { compOffCredits: ns };
    }),

  // ── Policy: Sandwich Leave & Carry Forward ──
  toggleSandwichRule: (val) =>
    set((s) => {
      const v = typeof val === "boolean" ? val : !s.sandwichRuleEnabled;
      try {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({
            employees: s.employees,
            leaves: s.leaves,
            attendance: s.attendance,
            candidates: s.candidates,
            showBanner: s.showBanner,
            encashments: s.encashments,
            compOffCredits: s.compOffCredits,
            sandwichRuleEnabled: v,
            maxCarryForwardDays: s.maxCarryForwardDays,
            carriedForwardLeaves: s.carriedForwardLeaves,
          })
        );
      } catch {}
      return { sandwichRuleEnabled: v };
    }),

  setMaxCarryForwardDays: (days) =>
    set((s) => {
      const val = Number(days) || 12;
      try {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({
            employees: s.employees,
            leaves: s.leaves,
            attendance: s.attendance,
            candidates: s.candidates,
            showBanner: s.showBanner,
            encashments: s.encashments,
            compOffCredits: s.compOffCredits,
            sandwichRuleEnabled: s.sandwichRuleEnabled,
            maxCarryForwardDays: val,
            carriedForwardLeaves: s.carriedForwardLeaves,
          })
        );
      } catch {}
      return { maxCarryForwardDays: val };
    }),

  executeCarryForwardRollover: () =>
    set((s) => {
      const cap = s.maxCarryForwardDays || 12;
      const newCarried = { ...(s.carriedForwardLeaves || defaultCarriedOver) };
      (s.employees || []).forEach((emp) => {
        const empName = emp.name;
        const used = (s.leaves || [])
          .filter(
            (l) =>
              l.employee?.toLowerCase() === empName?.toLowerCase() &&
              l.type?.includes("Annual") &&
              l.status === "Approved"
          )
          .reduce((sum, l) => sum + (Number(l.days) || 1), 0);
        const remaining = Math.max(0, 18 - used);
        newCarried[empName] = Math.min(cap, remaining);
      });
      try {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({
            employees: s.employees,
            leaves: s.leaves,
            attendance: s.attendance,
            candidates: s.candidates,
            showBanner: s.showBanner,
            encashments: s.encashments,
            compOffCredits: s.compOffCredits,
            sandwichRuleEnabled: s.sandwichRuleEnabled,
            maxCarryForwardDays: s.maxCarryForwardDays,
            carriedForwardLeaves: newCarried,
          })
        );
      } catch {}
      return { carriedForwardLeaves: newCarried };
    }),

  showToast: (msg) => set({ toast: { id: Date.now().toString(), msg } }),
  setToast: (msg) => set({ toast: { id: Date.now().toString(), msg } }),
  clearToast: () => set({ toast: null }),
}));
