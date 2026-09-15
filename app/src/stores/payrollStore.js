import { create } from "zustand";

const STORAGE_KEY = "hrms_payroll_store_v3";

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
    earnedSalary: 32500,
    additionalEarnings: 1000,
    deductions: 2500,
    advance: 5000,
    basic: 24000,
    hra: 6000,
    allowances: 2500,
    status: "Paid",
    paidAmount: 26000,
    paymentDate: "Oct 31, 2024",
    month: "October 2024",
    bank: "ICICI Bank (•••• 4829)",
    attendedDays: 25,
    totalDays: 30,
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
    attendedDays: 30,
    totalDays: 30,
  },
  {
    id: "PAY-103",
    empId: "EMP1025",
    name: "Marcus Chen",
    role: "Lead Designer",
    department: "Design",
    avatar: "https://i.pravatar.cc/100?img=16",
    standardSalary: 55000,
    earnedSalary: 51333,
    additionalEarnings: 1500,
    deductions: 3800,
    advance: 0,
    basic: 33000,
    hra: 12000,
    allowances: 10000,
    status: "Paid",
    paidAmount: 49033,
    paymentDate: "Oct 31, 2024",
    month: "October 2024",
    bank: "Barclays Bank (•••• 7812)",
    attendedDays: 28,
    totalDays: 30,
  },
  {
    id: "PAY-104",
    empId: "EMP1026",
    name: "Liam Cooper",
    role: "DevOps Engineer",
    department: "Engineering",
    avatar: "https://i.pravatar.cc/100?img=20",
    standardSalary: 48000,
    earnedSalary: 41600,
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
    attendedDays: 26,
    totalDays: 30,
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
    attendedDays: 30,
    totalDays: 30,
  },
  {
    id: "PAY-106",
    empId: "EMP1028",
    name: "James Wilson",
    role: "Finance Manager",
    department: "Finance",
    avatar: "https://i.pravatar.cc/100?img=12",
    standardSalary: 72000,
    earnedSalary: 72000,
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
    attendedDays: 30,
    totalDays: 30,
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
    attendedDays: 30,
    totalDays: 30,
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
    attendedDays: 30,
    totalDays: 30,
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
    attendedDays: 30,
    totalDays: 30,
  },
  {
    id: "PAY-110",
    empId: "EMP1032",
    name: "Arjun Sharma",
    role: "Senior Fullstack Engineer",
    department: "Engineering",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    standardSalary: 60000,
    earnedSalary: 56000,
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
    attendedDays: 28,
    totalDays: 30,
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
    attendedDays: 30,
    totalDays: 30,
  },
  {
    id: "PAY-112",
    empId: "EMP1034",
    name: "Rohan Verma",
    role: "Site Reliability Engineer",
    department: "Engineering",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    standardSalary: 52000,
    earnedSalary: 48533,
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
    attendedDays: 28,
    totalDays: 30,
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
    earnedSalary: 32500,
    additionalEarnings: 1000,
    deductions: 2500,
    advance: 5000,
    remainingPayable: 26000,
    netPay: "₹26,000",
    status: "Paid",
    paidAmount: "₹26,000",
    payDate: "Oct 31, 2024",
    slipNo: "SLIP-2024-10",
  },
  {
    month: "September 2024",
    standardSalary: 40000,
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
    earnedSalary: 37333,
    additionalEarnings: 800,
    deductions: 2400,
    advance: 3000,
    remainingPayable: 32733,
    netPay: "₹32,733",
    status: "Paid",
    paidAmount: "₹32,733",
    payDate: "Aug 31, 2024",
    slipNo: "SLIP-2024-08",
  },
  {
    month: "July 2024",
    standardSalary: 38000,
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
    earnedSalary: 35467,
    additionalEarnings: 500,
    deductions: 2100,
    advance: 0,
    remainingPayable: 33867,
    netPay: "₹33,867",
    status: "Paid",
    paidAmount: "₹33,867",
    payDate: "May 31, 2024",
    slipNo: "SLIP-2024-05",
  },
];

function loadSavedPayroll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.employees) && parsed.employees.length > 0) {
        // Ensure every employee has standardSalary
        const hasStandard = parsed.employees.every((e) => typeof e.standardSalary === "number");
        if (hasStandard) {
          return parsed;
        }
      }
    }
  } catch (err) {}
  return {
    employees: INITIAL_EMPLOYEE_PAYROLLS,
    structures: INITIAL_STRUCTURES,
    workflowStep: "Approved",
    currentPeriod: "October 2024",
  };
}

const initialLoaded = loadSavedPayroll();

export const usePayrollStore = create((set, get) => ({
  employees: initialLoaded.employees,
  structures: initialLoaded.structures,
  workflowStep: initialLoaded.workflowStep,
  currentPeriod: initialLoaded.currentPeriod,

  setWorkflowStep: (step) => {
    set({ workflowStep: step });
    get().persist();
  },

  setCurrentPeriod: (period) => {
    set({ currentPeriod: period });
    get().persist();
  },

  updateEmployeePayroll: (id, updates) => {
    const next = get().employees.map((e) => (e.id === id ? { ...e, ...updates } : e));
    set({ employees: next });
    get().persist();
  },

  markEmployeePaid: (id, remainingPayableAmount) => {
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const next = get().employees.map((e) => {
      if (e.id === id) {
        const payable = remainingPayableAmount !== undefined
          ? remainingPayableAmount
          : Math.max(0, (e.earnedSalary ?? e.standardSalary) + (e.additionalEarnings || 0) - (e.deductions || 0) - (e.advance || 0));
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
        const payable = Math.max(0, (e.earnedSalary ?? e.standardSalary) + (e.additionalEarnings || 0) - (e.deductions || 0) - (e.advance || 0));
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
      const payable = Math.max(0, (e.earnedSalary ?? e.standardSalary) + (e.additionalEarnings || 0) - (e.deductions || 0) - (e.advance || 0));
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
    });
  },
}));
