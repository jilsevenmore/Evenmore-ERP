import { create } from "zustand";

const STORAGE_KEY = "hrms_payroll_store_v4";

export const WORKFLOW_STAGES = [
  { id: "In Progress", label: "In Progress" },
  { id: "Ready for Review", label: "Ready for Review" },
  { id: "Approved", label: "Approved" },
  { id: "Paid", label: "Paid" },
];

export const INITIAL_EMPLOYEE_PAYROLLS = [
  {
    id: "PAY-101",
    empId: "EMP1099",
    name: "Adarsh Gupta",
    role: "Operations Admin",
    department: "Operations",
    avatar: "https://i.pravatar.cc/100?img=33",
    standardSalary: 40000,
    earnedSalary: 33333,
    additionalEarnings: 1000,
    deductions: 2500,
    advance: 5000,
    basic: 24000,
    hra: 6000,
    allowances: 2500,
    status: "Paid",
    paidAmount: 26833,
    paymentDate: "Oct 31, 2024",
    month: "October 2024",
    bank: "ICICI Bank (•••• 4829)",
    attendedDays: 20,
    totalDays: 24,
  },
  {
    id: "PAY-102",
    empId: "EMP1024",
    name: "Priya Patel",
    role: "Senior Engineer",
    department: "Engineering",
    avatar: "https://i.pravatar.cc/100?img=15",
    standardSalary: 65000,
    earnedSalary: 65000,
    additionalEarnings: 2500,
    deductions: 4500,
    advance: 5000,
    basic: 39000,
    hra: 15000,
    allowances: 11000,
    status: "Approved",
    paidAmount: null,
    paymentDate: null,
    month: "October 2024",
    bank: "HDFC Bank (•••• 3921)",
    attendedDays: 24,
    totalDays: 24,
  },
  {
    id: "PAY-103",
    empId: "EMP1025",
    name: "Marcus Chen",
    role: "Lead Designer",
    department: "Design",
    avatar: "https://i.pravatar.cc/100?img=16",
    standardSalary: 55000,
    earnedSalary: 50417,
    additionalEarnings: 1500,
    deductions: 3800,
    advance: 0,
    basic: 33000,
    hra: 12000,
    allowances: 10000,
    status: "Paid",
    paidAmount: 48117,
    paymentDate: "Oct 31, 2024",
    month: "October 2024",
    bank: "Barclays Bank (•••• 7812)",
    attendedDays: 22,
    totalDays: 24,
  },
  {
    id: "PAY-104",
    empId: "EMP1026",
    name: "Liam Cooper",
    role: "DevOps Engineer",
    department: "Engineering",
    avatar: "https://i.pravatar.cc/100?img=20",
    standardSalary: 48000,
    earnedSalary: 42000,
    additionalEarnings: 3000,
    deductions: 3200,
    advance: 4000,
    basic: 28800,
    hra: 10000,
    allowances: 9200,
    status: "In Progress",
    paidAmount: null,
    paymentDate: null,
    month: "October 2024",
    bank: "Chase Bank (•••• 4120)",
    attendedDays: 21,
    totalDays: 24,
  },
  {
    id: "PAY-105",
    empId: "EMP1027",
    name: "Elena Rostova",
    role: "Brand Strategist",
    department: "Marketing",
    avatar: "https://i.pravatar.cc/100?img=21",
    standardSalary: 45000,
    earnedSalary: 45000,
    additionalEarnings: 0,
    deductions: 2800,
    advance: 3000,
    basic: 27000,
    hra: 9000,
    allowances: 9000,
    status: "Ready for Review",
    paidAmount: null,
    paymentDate: null,
    month: "October 2024",
    bank: "Emirates NBD (•••• 9901)",
    attendedDays: 24,
    totalDays: 24,
  },
  {
    id: "PAY-106",
    empId: "EMP1028",
    name: "James Wilson",
    role: "Finance Manager",
    department: "Finance",
    avatar: "https://i.pravatar.cc/100?img=12",
    standardSalary: 72000,
    earnedSalary: 69000,
    additionalEarnings: 2000,
    deductions: 5500,
    advance: 0,
    basic: 43200,
    hra: 16000,
    allowances: 12800,
    status: "Approved",
    paidAmount: null,
    paymentDate: null,
    month: "October 2024",
    bank: "Citibank (•••• 6044)",
    attendedDays: 23,
    totalDays: 24,
  },
  {
    id: "PAY-107",
    empId: "EMP1029",
    name: "Ayesha Khan",
    role: "HR Director",
    department: "Human Resources",
    avatar: "https://i.pravatar.cc/100?img=5",
    standardSalary: 80000,
    earnedSalary: 80000,
    additionalEarnings: 3500,
    deductions: 6000,
    advance: 0,
    basic: 48000,
    hra: 18000,
    allowances: 14000,
    status: "Paid",
    paidAmount: 77500,
    paymentDate: "Oct 31, 2024",
    month: "October 2024",
    bank: "Standard Chartered (•••• 3319)",
    attendedDays: 24,
    totalDays: 24,
  },
  {
    id: "PAY-108",
    empId: "EMP1030",
    name: "David Park",
    role: "CTO",
    department: "Engineering",
    avatar: "https://i.pravatar.cc/100?img=11",
    standardSalary: 110000,
    earnedSalary: 110000,
    additionalEarnings: 5000,
    deductions: 9500,
    advance: 10000,
    basic: 66000,
    hra: 24000,
    allowances: 20000,
    status: "Approved",
    paidAmount: null,
    paymentDate: null,
    month: "October 2024",
    bank: "HSBC Bank (•••• 8820)",
    attendedDays: 24,
    totalDays: 24,
  },
  {
    id: "PAY-109",
    empId: "EMP1031",
    name: "Sarah Mitchell",
    role: "Chief Executive Officer",
    department: "Executive",
    avatar: "https://i.pravatar.cc/100?img=8",
    standardSalary: 150000,
    earnedSalary: 150000,
    additionalEarnings: 0,
    deductions: 15000,
    advance: 0,
    basic: 90000,
    hra: 35000,
    allowances: 25000,
    status: "Paid",
    paidAmount: 135000,
    paymentDate: "Oct 31, 2024",
    month: "October 2024",
    bank: "J.P. Morgan (•••• 1002)",
    attendedDays: 24,
    totalDays: 24,
  },
  {
    id: "PAY-110",
    empId: "EMP1032",
    name: "Arjun Sharma",
    role: "Senior Fullstack Engineer",
    department: "Engineering",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    standardSalary: 60000,
    earnedSalary: 55000,
    additionalEarnings: 2000,
    deductions: 4200,
    advance: 5000,
    basic: 36000,
    hra: 14000,
    allowances: 10000,
    status: "Ready for Review",
    paidAmount: null,
    paymentDate: null,
    month: "October 2024",
    bank: "State Bank of India (•••• 5521)",
    attendedDays: 22,
    totalDays: 24,
  },
  {
    id: "PAY-111",
    empId: "EMP1033",
    name: "Meera Nair",
    role: "Financial Analyst",
    department: "Finance",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    standardSalary: 46000,
    earnedSalary: 46000,
    additionalEarnings: 1000,
    deductions: 3100,
    advance: 2000,
    basic: 27600,
    hra: 10000,
    allowances: 8400,
    status: "Paid",
    paidAmount: 41900,
    paymentDate: "Oct 31, 2024",
    month: "October 2024",
    bank: "Axis Bank (•••• 2209)",
    attendedDays: 24,
    totalDays: 24,
  },
  {
    id: "PAY-112",
    empId: "EMP1034",
    name: "Rohan Verma",
    role: "Site Reliability Engineer",
    department: "Engineering",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    standardSalary: 52000,
    earnedSalary: 45500,
    additionalEarnings: 1800,
    deductions: 3600,
    advance: 3500,
    basic: 31200,
    hra: 11000,
    allowances: 9800,
    status: "In Progress",
    paidAmount: null,
    paymentDate: null,
    month: "October 2024",
    bank: "Wells Fargo (•••• 6710)",
    attendedDays: 21,
    totalDays: 24,
  },
];

export const INITIAL_STRUCTURES = [
  { id: 1, name: "Engineering — L4 (Principal & Staff)", department: "Engineering", employees: 42, baseMin: "₹75,000", baseMax: "₹1,20,000", status: "Active" },
  { id: 2, name: "Engineering — L3 (Senior Dev)", department: "Engineering", employees: 38, baseMin: "₹50,000", baseMax: "₹70,000", status: "Active" },
  { id: 3, name: "Design — L2 (UI/UX Leads)", department: "Design", employees: 18, baseMin: "₹45,000", baseMax: "₹65,000", status: "Active" },
  { id: 4, name: "Sales & Marketing — L3", department: "Marketing", employees: 35, baseMin: "₹40,000", baseMax: "₹60,000", status: "Active" },
  { id: 5, name: "HR & Operations — L2", department: "Human Resources", employees: 24, baseMin: "₹42,000", baseMax: "₹58,000", status: "Active" },
  { id: 6, name: "Finance & Accounting — L3", department: "Finance", employees: 16, baseMin: "₹48,000", baseMax: "₹75,000", status: "Active" },
];

export const OWN_SALARY_HISTORY = [
  {
    month: "October 2024",
    standardSalary: 40000,
    totalDays: 24,
    attendedDays: 20,
    absentDays: 4,
    attendanceDeduction: 6667,
    earnedSalary: 33333,
    additionalEarnings: 1000,
    deductions: 2500,
    advance: 5000,
    remainingPayable: 26833,
    netPay: "₹26,833",
    status: "Paid",
    paidAmount: "₹26,833",
    payDate: "Oct 31, 2024",
    slipNo: "SLIP-2024-10",
  },
  {
    month: "September 2024",
    standardSalary: 40000,
    totalDays: 24,
    attendedDays: 24,
    absentDays: 0,
    attendanceDeduction: 0,
    earnedSalary: 40000,
    additionalEarnings: 1500,
    deductions: 2500,
    advance: 0,
    remainingPayable: 39000,
    netPay: "₹39,000",
    status: "Paid",
    paidAmount: "₹39,000",
    payDate: "Sep 30, 2024",
    slipNo: "SLIP-2024-09",
  },
  {
    month: "August 2024",
    standardSalary: 40000,
    totalDays: 24,
    attendedDays: 22,
    absentDays: 2,
    attendanceDeduction: 3333,
    earnedSalary: 36667,
    additionalEarnings: 800,
    deductions: 2400,
    advance: 3000,
    remainingPayable: 32067,
    netPay: "₹32,067",
    status: "Paid",
    paidAmount: "₹32,067",
    payDate: "Aug 31, 2024",
    slipNo: "SLIP-2024-08",
  },
  {
    month: "July 2024",
    standardSalary: 38000,
    totalDays: 24,
    attendedDays: 24,
    absentDays: 0,
    attendanceDeduction: 0,
    earnedSalary: 38000,
    additionalEarnings: 1200,
    deductions: 2200,
    advance: 0,
    remainingPayable: 37000,
    netPay: "₹37,000",
    status: "Paid",
    paidAmount: "₹37,000",
    payDate: "Jul 31, 2024",
    slipNo: "SLIP-2024-07",
  },
  {
    month: "June 2024",
    standardSalary: 38000,
    totalDays: 24,
    attendedDays: 24,
    absentDays: 0,
    attendanceDeduction: 0,
    earnedSalary: 38000,
    additionalEarnings: 0,
    deductions: 2200,
    advance: 2000,
    remainingPayable: 33800,
    netPay: "₹33,800",
    status: "Paid",
    paidAmount: "₹33,800",
    payDate: "Jun 30, 2024",
    slipNo: "SLIP-2024-06",
  },
  {
    month: "May 2024",
    standardSalary: 38000,
    totalDays: 24,
    attendedDays: 22,
    absentDays: 2,
    attendanceDeduction: 3167,
    earnedSalary: 34833,
    additionalEarnings: 500,
    deductions: 2100,
    advance: 0,
    remainingPayable: 33233,
    netPay: "₹33,233",
    status: "Paid",
    paidAmount: "₹33,233",
    payDate: "May 31, 2024",
    slipNo: "SLIP-2024-05",
  },
];

export const DEFAULT_DEPARTMENT_WORKING_DAYS = {
  "Engineering": 24,
  "Operations": 24,
  "Design": 24,
  "Marketing": 24,
  "Finance": 22,
  "Human Resources": 24,
  "Sales & CRM": 26,
  "Warehouse & Inventory": 26,
  "Executive": 22,
};

export const DEFAULT_DEPARTMENT_WORKING_HOURS = {
  "Engineering": 8,
  "Operations": 9,
  "Design": 8,
  "Marketing": 8,
  "Finance": 8,
  "Human Resources": 8,
  "Sales & CRM": 9,
  "Warehouse & Inventory": 9,
  "Executive": 8,
};

export function getDepartmentDays(departmentWorkingDays, deptName) {
  if (!deptName) return 24;
  if (departmentWorkingDays && departmentWorkingDays[deptName]) {
    return departmentWorkingDays[deptName];
  }
  const lower = deptName.toLowerCase();
  const found = Object.keys(departmentWorkingDays || {}).find(
    (k) => k.toLowerCase() === lower || lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)
  );
  if (found && departmentWorkingDays[found]) {
    return departmentWorkingDays[found];
  }
  return 24;
}

export function getDepartmentHours(departmentWorkingHours, deptName) {
  if (!deptName) return 8;
  if (departmentWorkingHours && departmentWorkingHours[deptName]) {
    return Number(departmentWorkingHours[deptName]);
  }
  const lower = deptName.toLowerCase();
  const found = Object.keys(departmentWorkingHours || {}).find(
    (k) => k.toLowerCase() === lower || lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)
  );
  if (found && departmentWorkingHours[found]) {
    return Number(departmentWorkingHours[found]);
  }
  return 8;
}

function calcEmployeePayable(e) {
  const std = Math.max(0, Number(e.standardSalary) || 0);
  const totalD = Math.max(1, Number(e.totalDays) || 24);
  const attended = e.attendedDays !== undefined ? Math.max(0, Number(e.attendedDays)) : totalD;
  const absent = Math.max(0, totalD - attended);
  const perDay = totalD > 0 ? std / totalD : 0;
  const attDeduction = Math.round(perDay * absent);
  const earned = Math.max(0, std - attDeduction);
  const earnings = Math.max(0, Number(e.additionalEarnings) || 0);
  const deductions = Math.max(0, Number(e.deductions) || 0);
  const advance = Math.max(0, Number(e.advance) || 0);
  return Math.max(0, earned + earnings - deductions - advance);
}

function loadSavedPayroll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.employees) && parsed.employees.length > 0) {
        // Ensure every employee has standardSalary
        const hasStandard = parsed.employees.every((e) => typeof e.standardSalary === "number");
        if (hasStandard) {
          const deptDays = parsed.departmentWorkingDays || DEFAULT_DEPARTMENT_WORKING_DAYS;
          const deptHours = parsed.departmentWorkingHours || DEFAULT_DEPARTMENT_WORKING_HOURS;
          return {
            ...parsed,
            defaultWorkingDays: parsed.defaultWorkingDays || 24,
            departmentWorkingDays: deptDays,
            departmentWorkingHours: deptHours,
          };
        }
      }
    }
  } catch (err) {}
  return {
    employees: INITIAL_EMPLOYEE_PAYROLLS,
    structures: INITIAL_STRUCTURES,
    workflowStep: "Approved",
    currentPeriod: "October 2024",
    defaultWorkingDays: 24,
    departmentWorkingDays: DEFAULT_DEPARTMENT_WORKING_DAYS,
    departmentWorkingHours: DEFAULT_DEPARTMENT_WORKING_HOURS,
  };
}

const initialLoaded = loadSavedPayroll();

export const usePayrollStore = create((set, get) => ({
  employees: initialLoaded.employees,
  structures: initialLoaded.structures,
  workflowStep: initialLoaded.workflowStep,
  currentPeriod: initialLoaded.currentPeriod,
  defaultWorkingDays: initialLoaded.defaultWorkingDays || 24,
  departmentWorkingDays: initialLoaded.departmentWorkingDays || DEFAULT_DEPARTMENT_WORKING_DAYS,
  departmentWorkingHours: initialLoaded.departmentWorkingHours || DEFAULT_DEPARTMENT_WORKING_HOURS,

  setWorkflowStep: (step) => {
    set({ workflowStep: step });
    get().persist();
  },

  setCurrentPeriod: (period) => {
    set({ currentPeriod: period });
    get().persist();
  },

  setDepartmentWorkingDays: (deptName, days) => {
    const d = Math.max(1, Math.min(31, Number(days) || 24));
    const currentMap = get().departmentWorkingDays || DEFAULT_DEPARTMENT_WORKING_DAYS;
    const nextMap = { ...currentMap, [deptName]: d };

    // Recalculate all employees in this department
    const nextEmployees = get().employees.map((e) => {
      const isMatch =
        e.department?.toLowerCase() === deptName.toLowerCase() ||
        (deptName === "HR" && e.department?.toLowerCase().includes("human")) ||
        (deptName === "Human Resources" && e.department?.toLowerCase() === "hr") ||
        (deptName.includes("Sales") && e.department?.toLowerCase().includes("sales")) ||
        (deptName.includes("Warehouse") && e.department?.toLowerCase().includes("warehouse"));

      if (isMatch) {
        const std = Math.max(0, Number(e.standardSalary) || 0);
        const totalD = d;
        const h = e.dailyHours || getDepartmentHours(get().departmentWorkingHours, e.department);
        const totalH = totalD * h;
        const hourlyRate = totalH > 0 ? Math.round(std / totalH) : 0;
        const attended = Math.min(totalD, e.attendedDays !== undefined ? Math.max(0, Number(e.attendedDays)) : totalD);
        const absent = Math.max(0, totalD - attended);
        const perDay = totalD > 0 ? std / totalD : 0;
        const attDeduction = Math.round(perDay * absent);
        const earned = Math.max(0, std - attDeduction);
        return {
          ...e,
          totalDays: totalD,
          dailyHours: h,
          totalHours: totalH,
          hourlyRate: hourlyRate,
          attendedDays: attended,
          earnedSalary: earned,
        };
      }
      return e;
    });

    set({ departmentWorkingDays: nextMap, employees: nextEmployees });
    get().persist();
  },

  setDepartmentWorkingHours: (deptName, hours) => {
    const h = Math.max(1, Math.min(24, Number(hours) || 8));
    const currentMap = get().departmentWorkingHours || DEFAULT_DEPARTMENT_WORKING_HOURS;
    const nextMap = { ...currentMap, [deptName]: h };

    // Recalculate all employees in this department
    const nextEmployees = get().employees.map((e) => {
      const isMatch =
        e.department?.toLowerCase() === deptName.toLowerCase() ||
        (deptName === "HR" && e.department?.toLowerCase().includes("human")) ||
        (deptName === "Human Resources" && e.department?.toLowerCase() === "hr") ||
        (deptName.includes("Sales") && e.department?.toLowerCase().includes("sales")) ||
        (deptName.includes("Warehouse") && e.department?.toLowerCase().includes("warehouse"));

      if (isMatch) {
        const std = Math.max(0, Number(e.standardSalary) || 0);
        const totalD = Number(e.totalDays) || 24;
        const totalH = totalD * h;
        const hourlyRate = totalH > 0 ? Math.round(std / totalH) : 0;
        return {
          ...e,
          dailyHours: h,
          totalHours: totalH,
          hourlyRate: hourlyRate,
        };
      }
      return e;
    });

    set({ departmentWorkingHours: nextMap, employees: nextEmployees });
    get().persist();
  },

  resetDepartmentWorkingDays: () => {
    const nextDaysMap = { ...DEFAULT_DEPARTMENT_WORKING_DAYS };
    const nextHoursMap = { ...DEFAULT_DEPARTMENT_WORKING_HOURS };
    const nextEmployees = get().employees.map((e) => {
      const d = getDepartmentDays(nextDaysMap, e.department);
      const h = getDepartmentHours(nextHoursMap, e.department);
      const std = Math.max(0, Number(e.standardSalary) || 0);
      const totalH = d * h;
      const hourlyRate = totalH > 0 ? Math.round(std / totalH) : 0;
      const attended = Math.min(d, e.attendedDays !== undefined ? Math.max(0, Number(e.attendedDays)) : d);
      const absent = Math.max(0, d - attended);
      const perDay = d > 0 ? std / d : 0;
      const attDeduction = Math.round(perDay * absent);
      const earned = Math.max(0, std - attDeduction);
      return {
        ...e,
        totalDays: d,
        dailyHours: h,
        totalHours: totalH,
        hourlyRate: hourlyRate,
        attendedDays: attended,
        earnedSalary: earned,
      };
    });
    set({
      departmentWorkingDays: nextDaysMap,
      departmentWorkingHours: nextHoursMap,
      employees: nextEmployees,
    });
    get().persist();
  },

  setDefaultWorkingDays: (days) => {
    const d = Math.max(1, Number(days) || 24);
    const next = get().employees.map((e) => {
      const std = Math.max(0, Number(e.standardSalary) || 0);
      const attended = Math.min(d, e.attendedDays !== undefined ? Math.max(0, Number(e.attendedDays)) : d);
      const absent = Math.max(0, d - attended);
      const perDay = d > 0 ? std / d : 0;
      const attDeduction = Math.round(perDay * absent);
      const earned = Math.max(0, std - attDeduction);
      return {
        ...e,
        totalDays: d,
        attendedDays: attended,
        earnedSalary: earned,
      };
    });
    set({ defaultWorkingDays: d, employees: next });
    get().persist();
  },

  updateEmployeePayroll: (id, updates) => {
    const next = get().employees.map((e) => {
      if (e.id === id) {
        const merged = { ...e, ...updates };
        const std = Math.max(0, Number(merged.standardSalary) || 0);
        const totalD = Math.max(1, Number(merged.totalDays) || get().defaultWorkingDays || 24);
        const attended = merged.attendedDays !== undefined ? Math.max(0, Number(merged.attendedDays)) : totalD;
        const absent = Math.max(0, totalD - attended);
        const perDay = totalD > 0 ? std / totalD : 0;
        const attDeduction = Math.round(perDay * absent);
        const earned = Math.max(0, std - attDeduction);
        return {
          ...merged,
          totalDays: totalD,
          attendedDays: attended,
          earnedSalary: earned,
        };
      }
      return e;
    });
    set({ employees: next });
    get().persist();
  },

  markEmployeePaid: (id, remainingPayableAmount) => {
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const next = get().employees.map((e) => {
      if (e.id === id) {
        const payable = remainingPayableAmount !== undefined
          ? remainingPayableAmount
          : calcEmployeePayable(e);
        return {
          ...e,
          status: "Paid",
          paidAmount: payable,
          paymentDate: today,
        };
      }
      return e;
    });
    set({ employees: next });
    get().persist();
  },

  disburseDepartment: (deptName) => {
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const next = get().employees.map((e) => {
      if (e.department.toLowerCase() === deptName.toLowerCase()) {
        const payable = calcEmployeePayable(e);
        return {
          ...e,
          status: "Paid",
          paidAmount: payable,
          paymentDate: today,
        };
      }
      return e;
    });
    set({ employees: next });
    get().persist();
  },

  runPayrollForAll: () => {
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const next = get().employees.map((e) => {
      const payable = calcEmployeePayable(e);
      return {
        ...e,
        status: "Paid",
        paidAmount: payable,
        paymentDate: today,
      };
    });
    set({ employees: next, workflowStep: "Paid" });
    get().persist();
  },

  addStructure: (newStruct) => {
    const next = [
      ...get().structures,
      {
        id: Date.now(),
        status: "Active",
        baseMin: "₹45,000",
        baseMax: "₹70,000",
        ...newStruct,
      },
    ];
    set({ structures: next });
    get().persist();
  },

  persist: () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          employees: get().employees,
          structures: get().structures,
          workflowStep: get().workflowStep,
          currentPeriod: get().currentPeriod,
          defaultWorkingDays: get().defaultWorkingDays,
          departmentWorkingDays: get().departmentWorkingDays,
          departmentWorkingHours: get().departmentWorkingHours,
        })
      );
    } catch (e) {}
  },

  resetDefaults: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    set({
      employees: INITIAL_EMPLOYEE_PAYROLLS,
      structures: INITIAL_STRUCTURES,
      workflowStep: "Approved",
      currentPeriod: "October 2024",
      defaultWorkingDays: 24,
      departmentWorkingDays: DEFAULT_DEPARTMENT_WORKING_DAYS,
      departmentWorkingHours: DEFAULT_DEPARTMENT_WORKING_HOURS,
    });
  },
}));
