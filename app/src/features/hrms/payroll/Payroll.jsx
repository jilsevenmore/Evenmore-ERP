import { useState, useMemo } from "react";
import {
  Building2,
  Users,
  User,
  Receipt,
  Download,
  Eye,
  CheckCircle2,
  Plus,
  Search,
  X,
  ChevronRight,
  Check,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Edit3,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import {
  usePayrollStore,
  WORKFLOW_STAGES,
  OWN_SALARY_HISTORY,
} from "../../../stores/payrollStore";
import {
  calculateSalaryComponents,
  aggregatePayrollStats,
  formatINR,
} from "./salaryCalculations";
import { Badge } from "../../../components/hrms/Badge";

// Clean browser PDF payslip generator with full formula breakdown
function downloadPayslipPdf(p) {
  const clean = (s) => String(s || "").replace(/[()\\]/g, "");
  const name = clean(p.name || "EMPLOYEE").toUpperCase();
  const id = clean(p.id || "PAY-000");
  const empId = clean(p.empId || "EMP-000");
  const role = clean(p.role || "Team Member");
  const dept = clean(p.department || "General");
  const month = clean(p.month || "October 2024");
  const bank = clean(p.bank || "Direct Deposit (Verified)");

  const std = Number(p.standardSalary || 0);
  const earned = Number(p.earnedSalary || 0);
  const earnings = Number(p.additionalEarnings || 0);
  const deductions = Number(p.deductions || 0);
  const advance = Number(p.advance || 0);
  const remaining = Math.max(0, earned + earnings - deductions - advance);
  const status = clean(p.status || "In Progress");
  const paidDate = clean(p.paymentDate || "N/A");
  const paidAmt = p.paidAmount !== null && p.paidAmount !== undefined ? Number(p.paidAmount) : remaining;

  const lines = [
    "BT",
    "/F1 18 Tf",
    "50 770 Td",
    "(EVENMORE ERP - CONFIDENTIAL SALARY SLIP) Tj",
    "/F1 10 Tf",
    "0 -24 Td",
    `(Pay Period: ${month}   |   Slip Ref: ${id}   |   Status: ${status}) Tj`,
    "0 -20 Td",
    `(Employee: ${name}   |   Staff ID: ${empId}) Tj`,
    "0 -16 Td",
    `(Designation: ${role}   |   Department: ${dept}) Tj`,
    "0 -16 Td",
    `(Disbursal Bank: ${bank}) Tj`,
    "0 -28 Td",
    "/F1 12 Tf",
    "(MONTHLY SALARY CALCULATION BREAKDOWN:)",
    "0 -18 Td",
    "/F1 10 Tf",
    `(Standard Monthly Salary: INR ${std.toLocaleString()}) Tj`,
    "0 -16 Td",
    `(Earned Salary [Pro-rated Attendance]: INR ${earned.toLocaleString()}) Tj`,
    "0 -16 Td",
    `(Additional Earnings [Overtime & Incentives]: (+) INR ${earnings.toLocaleString()}) Tj`,
    "0 -16 Td",
    `(Deductions [PF, Taxes, Insurance]: (-) INR ${deductions.toLocaleString()}) Tj`,
    "0 -16 Td",
    `(Salary Advance Recovered: (-) INR ${advance.toLocaleString()}) Tj`,
    "0 -24 Td",
    "/F1 12 Tf",
    `(FORMULA: Remaining Payable = Earned Salary + Earnings - Deductions - Advance) Tj`,
    "0 -20 Td",
    "/F1 14 Tf",
    `(NET REMAINING PAYABLE: INR ${remaining.toLocaleString()}) Tj`,
    "0 -24 Td",
    "/F1 10 Tf",
    `(Month-End Payout Status: ${status}   |   Paid Amount: INR ${paidAmt.toLocaleString()}   |   Payment Date: ${paidDate}) Tj`,
    "0 -36 Td",
    "/F1 9 Tf",
    "(This is a computer-generated salary slip adhering to standard HRMS payroll formulas.) Tj",
    "0 -14 Td",
    "(Evenmore ERP Technologies - Digitally Certified & Verified.) Tj",
    "ET",
  ];

  const stream = lines.join("\n");
  const streamBytes = new TextEncoder().encode(stream).length;

  let out = "%PDF-1.4\n";
  const offsets = [];

  function addObj(content) {
    offsets.push(new TextEncoder().encode(out).length);
    out += content + "\n";
  }

  addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  addObj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj");
  addObj("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj");
  addObj(`4 0 obj\n<< /Length ${streamBytes} >>\nstream\n${stream}\nendstream\nendobj`);
  addObj("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");

  const startXref = new TextEncoder().encode(out).length;
  out += "xref\n0 " + (offsets.length + 1) + "\n0000000000 65535 f \n";
  for (const off of offsets) {
    out += String(off).padStart(10, "0") + " 00000 n \n";
  }
  out += "trailer\n<< /Size " + (offsets.length + 1) + " /Root 1 0 R >>\nstartxref\n" + startXref + "\n%%EOF";

  const blob = new Blob([out], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Payslip_${(p.name || "Employee").replace(/\s+/g, "_")}_${month.replace(/\s+/g, "_")}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Payroll() {
  const showToast = useAppStore((s) => s.showToast);
  const storeLeaves = useAppStore((s) => s.leaves || []);
  const currentUser = useAppStore((s) => s.currentUser) || {
    name: "Adarsh Gupta",
    role: "Operations Admin",
    email: "admin@evenmore.io",
  };

  const {
    employees: payrollEmployees,
    structures,
    workflowStep,
    currentPeriod,
    setWorkflowStep,
    setCurrentPeriod,
    markEmployeePaid,
    disburseDepartment,
    runPayrollForAll,
    updateEmployeePayroll,
    addStructure,
  } = usePayrollStore();

  // Primary 4 views: 'overall' | 'department' | 'employee' | 'own'
  const [activeTab, setActiveTab] = useState("overall");

  // Filters for Employee-wise tab
  const [empSearch, setEmpSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals state
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [runSuccess, setRunSuccess] = useState(false);
  const [showAddStructureModal, setShowAddStructureModal] = useState(false);
  const [newStructure, setNewStructure] = useState({ name: "", department: "Engineering", employees: "" });

  // Quick edit advance & earnings modal
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editAdvance, setEditAdvance] = useState(0);
  const [editEarnings, setEditEarnings] = useState(0);
  const [editDeductions, setEditDeductions] = useState(0);

  // Switcher for Own Salary perspective
  const [activeOwnUser, setActiveOwnUser] = useState(currentUser.name || "Adarsh Gupta");

  // Dynamic calculations with approved leaves & attendance integration
  const computedEmployeePayrolls = useMemo(() => {
    return payrollEmployees.map((p) => {
      const empLeaves = storeLeaves.filter(
        (l) => l.employee?.toLowerCase() === p.name.toLowerCase() && l.status?.includes("Approved")
      );
      const leaveDays = empLeaves.reduce((sum, l) => sum + (Number(l.days) || 1), 0);

      // Calculation matrix from reusable engine
      const calc = calculateSalaryComponents({
        standardSalary: p.standardSalary,
        earnedSalary: p.earnedSalary,
        totalDays: p.totalDays || 30,
        attendedDays: p.attendedDays !== undefined ? p.attendedDays : (30 - leaveDays),
        paidLeaves: leaveDays,
        additionalEarnings: p.additionalEarnings !== undefined ? p.additionalEarnings : (p.overtime || 0),
        deductions: p.deductions,
        advance: p.advance !== undefined ? p.advance : 0,
        status: p.status || "In Progress",
        paidAmount: p.paidAmount,
        paymentDate: p.paymentDate,
      });

      return {
        ...p,
        ...calc,
        leaveDays,
      };
    });
  }, [payrollEmployees, storeLeaves]);

  // Overall Statistics Aggregation
  const overallStats = useMemo(() => {
    return aggregatePayrollStats(computedEmployeePayrolls);
  }, [computedEmployeePayrolls]);

  // Department-wise Grouping
  const departmentPayrolls = useMemo(() => {
    const groups = {};
    computedEmployeePayrolls.forEach((p) => {
      const d = p.department || "General";
      if (!groups[d]) {
        groups[d] = {
          name: d,
          employees: [],
          totalStandard: 0,
          totalEarned: 0,
          totalEarnings: 0,
          totalDeductions: 0,
          totalAdvance: 0,
          totalRemaining: 0,
          paidCount: 0,
        };
      }
      groups[d].employees.push(p);
      groups[d].totalStandard += p.standardSalary;
      groups[d].totalEarned += p.earnedSalary;
      groups[d].totalEarnings += p.additionalEarnings;
      groups[d].totalDeductions += p.deductions;
      groups[d].totalAdvance += p.advance;
      groups[d].totalRemaining += p.remainingPayable;
      if (p.status === "Paid") groups[d].paidCount += 1;
    });

    return Object.values(groups).map((g) => ({
      ...g,
      headcount: g.employees.length,
      earnedProgress: g.totalStandard > 0 ? Math.round((g.totalEarned / g.totalStandard) * 100) : 100,
      avgSalary: Math.round(g.totalRemaining / (g.employees.length || 1)),
      allPaid: g.paidCount === g.employees.length,
    }));
  }, [computedEmployeePayrolls]);

  // Filtered Employee-wise list
  const filteredEmployees = useMemo(() => {
    return computedEmployeePayrolls.filter((p) => {
      const q = empSearch.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.empId.toLowerCase().includes(q);
      const matchDept = deptFilter === "All" || p.department === deptFilter;
      const matchStatus = statusFilter === "All" || p.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [computedEmployeePayrolls, empSearch, deptFilter, statusFilter]);

  // Own Salary Record
  const ownRecord = useMemo(() => {
    return (
      computedEmployeePayrolls.find(
        (p) => p.name.toLowerCase() === activeOwnUser.toLowerCase()
      ) || computedEmployeePayrolls[0]
    );
  }, [computedEmployeePayrolls, activeOwnUser]);

  // Lifecycle flow helper
  const nextWorkflowStep = (current) => {
    const sequence = ["In Progress", "Ready for Review", "Approved", "Paid"];
    const idx = sequence.indexOf(current);
    if (idx !== -1 && idx < sequence.length - 1) {
      return sequence[idx + 1];
    }
    return current;
  };

  // Handlers
  const handleRunPayroll = () => {
    setRunSuccess(true);
    setTimeout(() => {
      setRunSuccess(false);
      setShowRunModal(false);
      runPayrollForAll();
      showToast("Month-End payroll processed and disbursed for all staff!");
    }, 1200);
  };

  const handleAddStructureSubmit = (e) => {
    e.preventDefault();
    if (!newStructure.name) return;
    addStructure({
      name: newStructure.name,
      department: newStructure.department,
      employees: Number(newStructure.employees) || 12,
    });
    setNewStructure({ name: "", department: "Engineering", employees: "" });
    setShowAddStructureModal(false);
    showToast("New salary structure added successfully");
  };

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setEditAdvance(emp.advance);
    setEditEarnings(emp.additionalEarnings);
    setEditDeductions(emp.deductions);
  };

  const handleSaveParams = (e) => {
    e.preventDefault();
    if (!editingEmployee) return;
    updateEmployeePayroll(editingEmployee.id, {
      advance: Number(editAdvance) || 0,
      additionalEarnings: Number(editEarnings) || 0,
      deductions: Number(editDeductions) || 0,
    });
    showToast(`Updated salary parameters for ${editingEmployee.name}`);
    setEditingEmployee(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900">
            Payroll Management
          </h1>
          <p className="text-[13px] text-muted">
            Advanced monthly calculation formula: <span className="font-semibold text-slate-700">Remaining Payable = Earned Salary + Earnings - Deductions - Advance</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={currentPeriod}
            onChange={(e) => {
              setCurrentPeriod(e.target.value);
              showToast(`Switched cycle to ${e.target.value}`);
            }}
            className="h-10 px-3 bg-white border border-bdr rounded-xl text-[13px] font-medium text-slate-700 shadow-xs focus:outline-none focus:border-navy cursor-pointer"
          >
            <option value="October 2024">October 2024</option>
            <option value="September 2024">September 2024</option>
            <option value="August 2024">August 2024</option>
          </select>

          <button
            type="button"
            onClick={() => setShowRunModal(true)}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-navy text-white rounded-xl text-[13px] font-medium shadow-xs hover:bg-navy/90 transition-colors cursor-pointer"
          >
            <Receipt size={15} />
            <span>Process Month-End Payroll</span>
          </button>
        </div>
      </div>

      {/* ── Minimal 4-Tab Navigation Bar ── */}
      <div className="flex border-b border-bdr gap-1 bg-white px-3 pt-2.5 rounded-2xl border shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("overall")}
          className={`pb-3 px-3 text-[13.5px] font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "overall"
              ? "border-navy text-navy font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 size={16} />
          <span>Overall Salary</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("department")}
          className={`pb-3 px-3 text-[13.5px] font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "department"
              ? "border-navy text-navy font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users size={16} />
          <span>Department-wise</span>
          <span className="px-1.5 py-0.2 text-[10.5px] rounded-md bg-slate-100 text-slate-600 font-medium">
            {departmentPayrolls.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("employee")}
          className={`pb-3 px-3 text-[13.5px] font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "employee"
              ? "border-navy text-navy font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <User size={16} />
          <span>Employee-wise</span>
          <span className="px-1.5 py-0.2 text-[10.5px] rounded-md bg-slate-100 text-slate-600 font-medium">
            {payrollEmployees.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("own")}
          className={`pb-3 px-3 text-[13.5px] font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "own"
              ? "border-navy text-navy font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CreditCard size={16} />
          <span>Own Salary</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: OVERALL SALARY (COMPANY SUMMARY & LIFECYCLE)
         ========================================================================= */}
      {activeTab === "overall" && (
        <div className="flex flex-col gap-6">
          {/* Top KPI Cards - Advanced Salary Matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-bdr rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
              <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">
                Total Standard Budget
              </span>
              <div className="text-[26px] font-extrabold text-slate-900 mt-2 leading-none">
                {formatINR(overallStats.totalStandard)}
              </div>
              <span className="text-[12px] text-muted mt-2">Agreed baseline monthly CTC</span>
            </div>

            <div className="bg-white border border-bdr rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
              <span className="text-[12px] font-semibold text-blue-700 uppercase tracking-wide">
                Total Earned Salary
              </span>
              <div className="text-[26px] font-extrabold text-blue-950 mt-2 leading-none">
                {formatINR(overallStats.totalEarned)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{
                      width: `${Math.round((overallStats.totalEarned / (overallStats.totalStandard || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] text-blue-700 font-semibold">
                  {Math.round((overallStats.totalEarned / (overallStats.totalStandard || 1)) * 100)}%
                </span>
              </div>
            </div>

            <div className="bg-white border border-bdr rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
              <span className="text-[12px] font-semibold text-rose-700 uppercase tracking-wide">
                Advances &amp; Deductions
              </span>
              <div className="text-[26px] font-extrabold text-rose-950 mt-2 leading-none">
                {formatINR(overallStats.totalAdvance + overallStats.totalDeductions)}
              </div>
              <span className="text-[12px] text-muted mt-2">
                Advance: {formatINR(overallStats.totalAdvance)} • Deductions: {formatINR(overallStats.totalDeductions)}
              </span>
            </div>

            <div className="bg-white border border-bdr rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
              <span className="text-[12px] font-semibold text-emerald-700 uppercase tracking-wide">
                Remaining Net Payable
              </span>
              <div className="text-[26px] font-extrabold text-emerald-950 mt-2 leading-none">
                {formatINR(overallStats.totalRemaining)}
              </div>
              <span className="text-[12px] text-emerald-700 mt-2 font-medium">
                {overallStats.paidCount} Paid • {overallStats.totalHeadcount - overallStats.paidCount} Pending
              </span>
            </div>
          </div>

          {/* Month-End Lifecycle Flow Strip */}
          <div className="bg-white border border-bdr rounded-2xl p-4.5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14.5px] font-bold text-slate-900">
                  Month-End Payroll Lifecycle
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Current: {workflowStep}
                </span>
              </div>
              <p className="text-[12px] text-muted mt-0.5">
                Standard progression: In Progress → Ready for Review → Approved → Paid
              </p>
            </div>

            {/* Step Indicators */}
            <div className="flex flex-wrap items-center gap-2">
              {WORKFLOW_STAGES.map((step, idx) => {
                const isActive = workflowStep === step.id;
                const isPassed =
                  (workflowStep === "Ready for Review" && step.id === "In Progress") ||
                  (workflowStep === "Approved" && (step.id === "In Progress" || step.id === "Ready for Review")) ||
                  (workflowStep === "Paid" && step.id !== "Paid");

                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setWorkflowStep(step.id);
                        showToast(`Lifecycle step set to: ${step.label}`);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? "bg-navy text-white shadow-xs"
                          : isPassed
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {isPassed && <Check size={12} className="text-emerald-700" />}
                      <span>{step.label}</span>
                    </button>
                    {idx < WORKFLOW_STAGES.length - 1 && (
                      <ArrowRight size={13} className="text-slate-300" />
                    )}
                  </div>
                );
              })}

              {workflowStep !== "Paid" && (
                <button
                  type="button"
                  onClick={() => {
                    const next = nextWorkflowStep(workflowStep);
                    if (next === "Paid") {
                      setShowRunModal(true);
                    } else {
                      setWorkflowStep(next);
                      showToast(`Advanced payroll lifecycle to: ${next}`);
                    }
                  }}
                  className="ml-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-semibold transition cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <span>Advance Stage</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Two-Column: Salary Structures & Cost Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Salary Band Structures */}
            <div className="lg:col-span-6 bg-white border border-bdr rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-bdr/60 mb-3">
                <div>
                  <h3 className="font-bold text-[15px] text-slate-900">Standard Salary Band Structures</h3>
                  <p className="text-[12px] text-muted">Baseline grade compensation slabs</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddStructureModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[12px] font-medium transition cursor-pointer"
                >
                  <Plus size={13} />
                  Add Band
                </button>
              </div>

              <div className="divide-y divide-bdr/40">
                {structures.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-[13px]">
                    <div>
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-muted">{item.department}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-800">{item.baseMin} - {item.baseMax}</div>
                      <span className="text-[10.5px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                        {item.employees} staff active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Department Cost Share Progress Bars */}
            <div className="lg:col-span-6 bg-white border border-bdr rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-bdr/60 mb-3">
                <div>
                  <h3 className="font-bold text-[15px] text-slate-900">Department Remaining Payable Share</h3>
                  <p className="text-[12px] text-muted">Net payout allocation per department</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("department")}
                  className="text-navy text-[12.5px] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                >
                  View Details
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {departmentPayrolls.slice(0, 5).map((d) => {
                  const percent = Math.round((d.totalRemaining / (overallStats.totalRemaining || 1)) * 100);
                  return (
                    <div key={d.name} className="space-y-1">
                      <div className="flex justify-between items-center text-[12.5px]">
                        <span className="font-medium text-slate-800">
                          {d.name} <span className="text-muted text-[11px]">({d.headcount} staff)</span>
                        </span>
                        <span className="font-semibold text-slate-900">
                          {formatINR(d.totalRemaining)} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-navy rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DEPARTMENT-WISE PAYROLL
         ========================================================================= */}
      {activeTab === "department" && (
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-bdr rounded-2xl p-4 shadow-xs flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="font-bold text-[15px] text-slate-900">Department Allocations &amp; Formulas</h3>
              <p className="text-[12px] text-muted">
                Calculated via: Remaining Payable = Earned Salary + Earnings - Deductions - Advance
              </p>
            </div>
            <span className="text-[12px] text-muted font-medium">
              {departmentPayrolls.length} active departments
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentPayrolls.map((dept) => (
              <div
                key={dept.name}
                className="bg-white border border-bdr rounded-2xl p-4.5 shadow-xs flex flex-col justify-between transition hover:border-slate-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h4 className="font-bold text-[15px] text-slate-900">{dept.name}</h4>
                      <span className="text-[11.5px] text-muted">{dept.headcount} staff members</span>
                    </div>
                    <Badge tone={dept.allPaid ? "success" : "warning"}>
                      {dept.allPaid ? "Disbursed" : `${dept.paidCount}/${dept.headcount} Paid`}
                    </Badge>
                  </div>

                  {/* Clean Formula Metrics Breakdown */}
                  <div className="bg-slate-50 border border-bdr/60 rounded-xl p-3 space-y-1.5 text-[12.5px]">
                    <div className="flex justify-between">
                      <span className="text-muted">Standard Salary:</span>
                      <span className="font-medium text-slate-700">{formatINR(dept.totalStandard)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Earned Salary:</span>
                      <span className="font-medium text-blue-800">{formatINR(dept.totalEarned)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Additional Earnings:</span>
                      <span className="font-medium text-emerald-700">+{formatINR(dept.totalEarnings)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Deductions:</span>
                      <span className="font-medium text-rose-700">-{formatINR(dept.totalDeductions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Salary Advance:</span>
                      <span className="font-medium text-amber-800">-{formatINR(dept.totalAdvance)}</span>
                    </div>

                    <div className="pt-2 border-t border-bdr/60 flex justify-between font-bold text-[13px]">
                      <span className="text-slate-900">Remaining Payable:</span>
                      <span className="text-emerald-700">{formatINR(dept.totalRemaining)}</span>
                    </div>
                  </div>

                  {/* Progress Indicator: Earned vs Standard */}
                  <div className="mt-3 px-1">
                    <div className="flex justify-between text-[11.5px] text-muted mb-1">
                      <span>Earned Progress</span>
                      <span className="font-semibold text-slate-800">{dept.earnedProgress}% of Standard</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-navy rounded-full transition-all duration-300"
                        style={{ width: `${dept.earnedProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-[11.5px] text-muted mt-2.5 px-1">
                    <span>Average Payable per staff:</span>
                    <span className="font-semibold text-slate-800">{formatINR(dept.avgSalary)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-bdr/60 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeptFilter(dept.name);
                      setActiveTab("employee");
                    }}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[12px] font-medium transition cursor-pointer text-center"
                  >
                    View Staff ({dept.headcount})
                  </button>
                  {!dept.allPaid && (
                    <button
                      type="button"
                      onClick={() => {
                        disburseDepartment(dept.name);
                        showToast(`Disbursed payroll for all ${dept.name} personnel`);
                      }}
                      className="px-3 py-1.5 bg-navy text-white hover:bg-navy/90 rounded-xl text-[12px] font-semibold transition cursor-pointer shadow-xs"
                    >
                      Disburse
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: EMPLOYEE-WISE PAYROLL
         ========================================================================= */}
      {activeTab === "employee" && (
        <div className="flex flex-col gap-4">
          {/* Filter Toolbar */}
          <div className="bg-white border border-bdr rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  placeholder="Search name, ID, or designation..."
                  className="w-full h-9.5 pl-9 pr-3.5 bg-off border border-bdr rounded-xl text-[12.5px] text-slate-800 focus:outline-none focus:border-navy"
                />
              </div>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="h-9.5 px-3 bg-off border border-bdr rounded-xl text-[12.5px] text-slate-700 focus:outline-none focus:border-navy cursor-pointer"
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Executive">Executive</option>
                <option value="Operations">Operations</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9.5 px-3 bg-off border border-bdr rounded-xl text-[12.5px] text-slate-700 focus:outline-none focus:border-navy cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Approved">Approved</option>
                <option value="Ready for Review">Ready for Review</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>

            <div className="text-[12px] text-muted">
              Showing <span className="font-semibold text-slate-800">{filteredEmployees.length}</span> staff members
            </div>
          </div>

          {/* Master Employee Table with Advanced Calculation Matrix */}
          <div className="bg-white border border-bdr rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-slate-50/75 border-b border-bdr text-[11px] uppercase tracking-wider text-muted font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-3">Standard Salary</th>
                    <th className="py-3.5 px-3">Earned Salary</th>
                    <th className="py-3.5 px-3">Earnings (+)</th>
                    <th className="py-3.5 px-3">Deductions (-)</th>
                    <th className="py-3.5 px-3">Advance (-)</th>
                    <th className="py-3.5 px-3 font-bold text-slate-900">Remaining Payable</th>
                    <th className="py-3.5 px-3">Status &amp; Payment</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bdr/40">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-muted">
                        No employees found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        {/* Employee Details */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.avatar}
                              alt={p.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{p.name}</span>
                                {p.leaveDays > 0 && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                                    {p.leaveDays}d leave
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted">
                                {p.role} • <span className="font-mono">{p.empId}</span> • {p.department}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Standard Salary (Agreed CTC) */}
                        <td className="py-3.5 px-3 font-medium text-slate-800">
                          <div>{formatINR(p.standardSalary)}</div>
                          <div className="text-[10.5px] text-muted">Agreed base</div>
                        </td>

                        {/* Earned Salary */}
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-blue-900">{formatINR(p.earnedSalary)}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${p.earnedProgress}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {p.payableDays}/{p.totalDays}d
                            </span>
                          </div>
                        </td>

                        {/* Earnings (+) */}
                        <td className="py-3.5 px-3 text-emerald-700 font-medium">
                          {p.additionalEarnings > 0 ? `+${formatINR(p.additionalEarnings)}` : "₹0"}
                        </td>

                        {/* Deductions (-) */}
                        <td className="py-3.5 px-3 text-rose-700 font-medium">
                          -{formatINR(p.deductions)}
                        </td>

                        {/* Advance (-) */}
                        <td className="py-3.5 px-3">
                          {p.advance > 0 ? (
                            <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                              -{formatINR(p.advance)}
                            </span>
                          ) : (
                            <span className="text-slate-400">₹0</span>
                          )}
                        </td>

                        {/* Remaining Payable Salary */}
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          <span className="text-emerald-700 text-[14px]">
                            {formatINR(p.remainingPayable)}
                          </span>
                        </td>

                        {/* Payroll Status & Month-End Info */}
                        <td className="py-3.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <Badge
                              tone={
                                p.status === "Paid"
                                  ? "success"
                                  : p.status === "Approved"
                                  ? "info"
                                  : p.status === "Ready for Review"
                                  ? "warning"
                                  : "neutral"
                              }
                            >
                              {p.status}
                            </Badge>

                            {/* Month-End Flow: Show Paid Amount & Date when Paid */}
                            {p.status === "Paid" && (
                              <div className="text-[10.5px] text-slate-600 mt-1 leading-tight">
                                <span className="font-semibold text-emerald-700">
                                  Paid: {formatINR(p.paidAmount || p.remainingPayable)}
                                </span>
                                <div className="text-muted text-[10px] flex items-center gap-1 mt-0.5">
                                  <Calendar size={10} />
                                  <span>{p.paymentDate || "Oct 31, 2024"}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(p)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-navy transition cursor-pointer"
                              title="Adjust Advance / Earnings"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedPayslip(p)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-navy transition cursor-pointer"
                              title="View Payslip"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                downloadPayslipPdf(p);
                                showToast(`Downloading PDF Payslip for ${p.name}`);
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-emerald-700 transition cursor-pointer"
                              title="Download PDF"
                            >
                              <Download size={15} />
                            </button>
                            {p.status !== "Paid" && (
                              <button
                                type="button"
                                onClick={() => {
                                  markEmployeePaid(p.id, p.remainingPayable);
                                  showToast(`Disbursed & marked ${p.name} as Paid`);
                                }}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[11px] font-semibold transition cursor-pointer ml-1"
                              >
                                Pay
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: OWN SALARY (PERSONAL PORTAL & EXACT FORMULA BREAKDOWN)
         ========================================================================= */}
      {activeTab === "own" && (
        <div className="flex flex-col gap-5">
          {/* Minimal Clean Hero Card */}
          <div className="bg-white border border-bdr rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-navy/5 text-navy border border-navy/15 flex items-center justify-center font-bold text-[18px]">
                {currentUser.initials || "AG"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-bold text-slate-900 leading-tight">
                    {ownRecord.name}
                  </h2>
                  <Badge
                    tone={
                      ownRecord.status === "Paid"
                        ? "success"
                        : ownRecord.status === "Approved"
                        ? "info"
                        : "warning"
                    }
                  >
                    {ownRecord.status}
                  </Badge>
                </div>
                <p className="text-[12.5px] text-muted mt-0.5">
                  {ownRecord.role} • {ownRecord.department} • <span className="text-slate-700 font-mono">{ownRecord.empId}</span>
                </p>
                <div className="text-[11.5px] text-muted mt-1.5">
                  Direct deposit: <b className="text-slate-800">{ownRecord.bank}</b>
                  {ownRecord.status === "Paid" && (
                    <span> • Disbursed on <b className="text-emerald-700">{ownRecord.paymentDate || "Oct 31, 2024"}</b></span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-bdr/60">
              <div className="text-left md:text-right">
                <span className="text-[11px] text-muted uppercase tracking-wider block font-medium">
                  {ownRecord.status === "Paid" ? "Net Paid Amount" : "Remaining Net Payable"}
                </span>
                <span className="text-[26px] font-extrabold text-emerald-950 leading-none">
                  {formatINR(ownRecord.status === "Paid" ? (ownRecord.paidAmount || ownRecord.remainingPayable) : ownRecord.remainingPayable)}
                </span>
                {ownRecord.status === "Paid" && (
                  <span className="block text-[11px] text-emerald-700 font-semibold mt-1">
                    Disbursed on {ownRecord.paymentDate || "Oct 31, 2024"}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  downloadPayslipPdf(ownRecord);
                  showToast(`Downloading ${ownRecord.month} Payslip (PDF)`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-navy text-white rounded-xl text-[13px] font-medium shadow-xs hover:bg-navy/90 transition cursor-pointer shrink-0"
              >
                <Download size={14} />
                <span>Download Payslip PDF</span>
              </button>
            </div>
          </div>

          {/* Perspective Switcher */}
          <div className="bg-white border border-bdr rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
            <div className="flex items-center gap-2 text-slate-600">
              <span>View As Colleague:</span>
              <select
                value={activeOwnUser}
                onChange={(e) => setActiveOwnUser(e.target.value)}
                className="h-8 px-2.5 bg-off border border-bdr rounded-lg font-medium text-slate-900 focus:outline-none focus:border-navy cursor-pointer"
              >
                <option value={currentUser.name}>{currentUser.name} (You)</option>
                {payrollEmployees
                  .filter((p) => p.name !== currentUser.name)
                  .map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.department})
                    </option>
                  ))}
              </select>
            </div>

            <span className="text-muted text-[12px]">
              Cycle: <b className="text-slate-800">{ownRecord.month}</b>
            </span>
          </div>

          {/* Quick Metrics Strip: Standard vs Earned vs Deductions vs Advance */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-bdr rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] text-muted uppercase font-semibold block">Standard Salary</span>
              <span className="text-[17px] font-bold text-slate-900 block mt-1">{formatINR(ownRecord.standardSalary)}</span>
              <span className="text-[10.5px] text-slate-500">Agreed baseline</span>
            </div>

            <div className="bg-white border border-bdr rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] text-blue-700 uppercase font-semibold block">Earned Salary</span>
              <span className="text-[17px] font-bold text-blue-950 block mt-1">{formatINR(ownRecord.earnedSalary)}</span>
              <span className="text-[10.5px] text-blue-700">{ownRecord.payableDays}/{ownRecord.totalDays} days attended</span>
            </div>

            <div className="bg-white border border-bdr rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] text-emerald-700 uppercase font-semibold block">Additional Earnings</span>
              <span className="text-[17px] font-bold text-emerald-800 block mt-1">+{formatINR(ownRecord.additionalEarnings)}</span>
              <span className="text-[10.5px] text-muted">Overtime / bonuses</span>
            </div>

            <div className="bg-white border border-bdr rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] text-rose-700 uppercase font-semibold block">Deductions</span>
              <span className="text-[17px] font-bold text-rose-800 block mt-1">-{formatINR(ownRecord.deductions)}</span>
              <span className="text-[10.5px] text-muted">PF &amp; taxes</span>
            </div>

            <div className="bg-white border border-bdr rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] text-amber-800 uppercase font-semibold block">Advance Taken</span>
              <span className="text-[17px] font-bold text-amber-900 block mt-1">-{formatINR(ownRecord.advance)}</span>
              <span className="text-[10.5px] text-muted">Mid-month advance</span>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] text-emerald-800 uppercase font-bold block">Remaining Payable</span>
              <span className="text-[17px] font-extrabold text-emerald-950 block mt-1">{formatINR(ownRecord.remainingPayable)}</span>
              <span className="text-[10.5px] text-emerald-700 font-medium">
                {ownRecord.status === "Paid" ? "Disbursed" : "Payable"}
              </span>
            </div>
          </div>

          {/* Salary Progress Indicator */}
          <div className="bg-white border border-bdr rounded-2xl p-4.5 shadow-xs">
            <div className="flex justify-between items-center text-[12.5px] mb-2">
              <span className="font-semibold text-slate-800">
                Salary Progress: Earned vs Standard
              </span>
              <span className="font-bold text-slate-900">
                {formatINR(ownRecord.earnedSalary)} of {formatINR(ownRecord.standardSalary)} ({ownRecord.earnedProgress}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-navy rounded-full transition-all duration-300"
                style={{ width: `${ownRecord.earnedProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-muted mt-2">
              <span>Formula: Remaining Payable = Earned Salary + Earnings - Deductions - Advance</span>
              <span className="font-medium text-emerald-700">Net Payable: {formatINR(ownRecord.remainingPayable)}</span>
            </div>
          </div>

          {/* Month-End Payout Card (When status is Paid) */}
          {ownRecord.status === "Paid" && (
            <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                <div>
                  <div className="text-[14px] font-bold text-emerald-950">
                    Month-End Salary Disbursal Confirmed
                  </div>
                  <div className="text-[12px] text-emerald-800 mt-0.5">
                    Your monthly salary has been successfully settled and transferred to your registered bank account.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-[12.5px]">
                <div>
                  <span className="text-muted block text-[11px]">Paid Amount</span>
                  <span className="font-extrabold text-emerald-950 text-[15px]">
                    {formatINR(ownRecord.paidAmount || ownRecord.remainingPayable)}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Payment Date</span>
                  <span className="font-semibold text-slate-800">
                    {ownRecord.paymentDate || "Oct 31, 2024"}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Payment Status</span>
                  <span className="font-bold text-emerald-700">Paid</span>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Earnings vs Deductions Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Earnings Section */}
            <div className="bg-white border border-bdr rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-2.5 border-b border-bdr/60">
                  <h3 className="font-bold text-[15px] text-slate-900">Earnings Components</h3>
                  <span className="font-bold text-slate-900">{formatINR(ownRecord.earnedSalary + ownRecord.additionalEarnings)}</span>
                </div>

                <div className="space-y-2 text-[13px] pt-3">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Standard Base Salary</span>
                    <span className="font-medium text-slate-900">{formatINR(ownRecord.standardSalary)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">
                      Earned Salary ({ownRecord.payableDays}/{ownRecord.totalDays} Days)
                    </span>
                    <span className="font-semibold text-blue-900">{formatINR(ownRecord.earnedSalary)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Overtime &amp; Incentives</span>
                    <span className="font-semibold text-emerald-700">+{formatINR(ownRecord.additionalEarnings)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-bdr/60 mt-4 flex justify-between font-bold text-[14px]">
                <span className="text-slate-900">Total Earned + Additions</span>
                <span className="text-slate-900">{formatINR(ownRecord.earnedSalary + ownRecord.additionalEarnings)}</span>
              </div>
            </div>

            {/* Deductions & Advance Section */}
            <div className="bg-white border border-bdr rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-2.5 border-b border-bdr/60">
                  <h3 className="font-bold text-[15px] text-slate-900">Deductions &amp; Advance</h3>
                  <span className="font-bold text-rose-700">
                    -{formatINR(ownRecord.deductions + ownRecord.advance)}
                  </span>
                </div>

                <div className="space-y-2 text-[13px] pt-3">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Provident Fund (PF) &amp; Insurance</span>
                    <span className="font-medium text-slate-900">-{formatINR(Math.round(ownRecord.deductions * 0.6))}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">TDS &amp; Statutory Deductions</span>
                    <span className="font-medium text-rose-700">-{formatINR(Math.round(ownRecord.deductions * 0.4))}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 bg-amber-50/50 px-2 rounded-lg">
                    <span className="text-amber-800 font-medium">Salary Advance Recovered</span>
                    <span className="font-bold text-amber-900">-{formatINR(ownRecord.advance)}</span>
                  </div>
                  {ownRecord.leaveDays > 0 && (
                    <div className="text-[11.5px] text-muted px-1">
                      * Includes leave adjustments for {ownRecord.leaveDays} approved leaves.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-bdr/60 mt-4 flex justify-between font-bold text-[14px]">
                <span className="text-slate-900">Total Deductions + Advance</span>
                <span className="text-rose-700">
                  -{formatINR(ownRecord.deductions + ownRecord.advance)}
                </span>
              </div>
            </div>
          </div>

          {/* Past Months Payslips History Table */}
          <div className="bg-white border border-bdr rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 pb-2 border-b border-bdr/60 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-[15px] text-slate-900">Payslip Archive &amp; History</h3>
                <p className="text-[12px] text-muted">6-month salary records with PDF download</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-slate-50/75 border-b border-bdr text-[11px] uppercase tracking-wider text-muted font-bold">
                  <tr>
                    <th className="py-3.5 px-5">Month Period</th>
                    <th className="py-3.5 px-5">Slip Ref</th>
                    <th className="py-3.5 px-5">Standard</th>
                    <th className="py-3.5 px-5">Earned</th>
                    <th className="py-3.5 px-5">Advance</th>
                    <th className="py-3.5 px-5 font-bold">Remaining Payable</th>
                    <th className="py-3.5 px-5">Payment Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bdr/40">
                  {OWN_SALARY_HISTORY.map((h, i) => (
                    <tr key={h.slipNo || i} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-5 font-medium text-slate-900">{h.month}</td>
                      <td className="py-3 px-5 font-mono text-[12px] text-slate-500">{h.slipNo}</td>
                      <td className="py-3 px-5 text-slate-700">{formatINR(h.standardSalary)}</td>
                      <td className="py-3 px-5 text-blue-900 font-medium">{formatINR(h.earnedSalary)}</td>
                      <td className="py-3 px-5 text-amber-800">-{formatINR(h.advance)}</td>
                      <td className="py-3 px-5 font-bold text-emerald-700">{h.netPay}</td>
                      <td className="py-3 px-5 text-slate-600">{h.payDate}</td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPayslip({
                                ...ownRecord,
                                month: h.month,
                                standardSalary: h.standardSalary,
                                earnedSalary: h.earnedSalary,
                                additionalEarnings: h.additionalEarnings,
                                deductions: h.deductions,
                                advance: h.advance,
                                remainingPayable: h.remainingPayable,
                                paidAmount: h.remainingPayable,
                                paymentDate: h.payDate,
                                status: "Paid",
                              });
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-navy transition cursor-pointer"
                            title="View Slip"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              downloadPayslipPdf({
                                ...ownRecord,
                                month: h.month,
                                standardSalary: h.standardSalary,
                                earnedSalary: h.earnedSalary,
                                additionalEarnings: h.additionalEarnings,
                                deductions: h.deductions,
                                advance: h.advance,
                                status: "Paid",
                                paymentDate: h.payDate,
                                paidAmount: h.remainingPayable,
                              });
                              showToast(`Downloaded PDF Payslip for ${h.month}`);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-emerald-700 transition cursor-pointer"
                            title="Download PDF"
                          >
                            <Download size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: PAYSLIP DETAIL MODAL (ADVANCED FORMULA BREAKDOWN)
         ========================================================================= */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-md p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-bdr/60 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPayslip.avatar}
                  alt={selectedPayslip.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-[16px] text-slate-900 leading-tight">
                    {selectedPayslip.name}
                  </h3>
                  <p className="text-[12px] text-muted">
                    {selectedPayslip.role} • {selectedPayslip.month || currentPeriod}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formula Calculation Matrix */}
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Standard Salary (Agreed CTC)</span>
                <span className="font-semibold text-slate-800">
                  {formatINR(selectedPayslip.standardSalary)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Earned Salary (Attendance Base)</span>
                <span className="font-semibold text-blue-900">
                  {formatINR(selectedPayslip.earnedSalary)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Additional Earnings (+)</span>
                <span className="font-medium text-emerald-700">
                  +{formatINR(selectedPayslip.additionalEarnings)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Deductions [PF, TDS, Penalty] (-)</span>
                <span className="font-medium text-rose-700">
                  -{formatINR(selectedPayslip.deductions)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Salary Advance Recovered (-)</span>
                <span className="font-medium text-amber-800">
                  -{formatINR(selectedPayslip.advance)}
                </span>
              </div>

              {/* Formula Badge */}
              <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600">
                <b>Formula:</b> Remaining Payable = Earned Salary + Earnings - Deductions - Advance
              </div>

              {/* Net Remaining Payable */}
              <div className="flex justify-between py-2.5 font-bold text-[15px] text-slate-900 bg-emerald-50/70 border border-emerald-200 rounded-xl px-3 mt-2">
                <span>Remaining Payable</span>
                <span className="text-emerald-800">
                  {formatINR(selectedPayslip.remainingPayable)}
                </span>
              </div>

              {/* Month-End Payment Info if Paid */}
              {selectedPayslip.status === "Paid" && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[12px] text-slate-700 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted">Payment Status:</span>
                    <span className="font-bold text-emerald-700">Paid</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Paid Amount:</span>
                    <span className="font-semibold text-slate-900">
                      {formatINR(selectedPayslip.paidAmount || selectedPayslip.remainingPayable)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Payment Date:</span>
                    <span className="font-medium text-slate-800">
                      {selectedPayslip.paymentDate || "Oct 31, 2024"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  downloadPayslipPdf(selectedPayslip);
                  showToast(`Downloaded PDF Payslip for ${selectedPayslip.name}`);
                  setSelectedPayslip(null);
                }}
                className="flex-1 bg-navy hover:bg-navy/90 text-white rounded-xl py-2.5 font-semibold text-[13px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download size={14} />
                Download PDF Payslip
              </button>
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="px-4 bg-off border border-bdr text-slate-700 hover:bg-slate-100 rounded-xl py-2.5 font-medium text-[13px] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: RUN MONTH-END PAYROLL CONFIRMATION MODAL
         ========================================================================= */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-md p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-bdr/60 pb-3">
              <h3 className="font-bold text-[16px] text-slate-900">
                Process Month-End Payroll — {currentPeriod}
              </h3>
              <button
                type="button"
                onClick={() => setShowRunModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {runSuccess ? (
              <div className="py-6 text-center flex flex-col items-center gap-2">
                <CheckCircle2 size={42} className="text-emerald-500" />
                <h4 className="font-bold text-[16px] text-slate-800">Month-End Payroll Disbursed!</h4>
                <p className="text-[13px] text-muted">
                  All {overallStats.totalHeadcount} staff calculations finalized, marked Paid, and stamped with today's date.
                </p>
              </div>
            ) : (
              <>
                <p className="text-[13.5px] text-slate-700 leading-relaxed">
                  Are you sure you want to finalize and disburse month-end payroll for{" "}
                  <b>{overallStats.totalHeadcount} employees</b> for period {currentPeriod}?
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[12.5px] text-slate-700 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Total Standard Budget:</span>
                    <b>{formatINR(overallStats.totalStandard)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Earned Salary:</span>
                    <b className="text-blue-900">{formatINR(overallStats.totalEarned)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Additional Earnings:</span>
                    <b className="text-emerald-700">+{formatINR(overallStats.totalEarnings)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Deductions:</span>
                    <b className="text-rose-700">-{formatINR(overallStats.totalDeductions)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Advance Recovered:</span>
                    <b className="text-amber-800">-{formatINR(overallStats.totalAdvance)}</b>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-[13px]">
                    <span>Total Net Disbursal:</span>
                    <span className="text-emerald-800">{formatINR(overallStats.totalRemaining)}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleRunPayroll}
                    className="flex-1 bg-navy hover:bg-navy/90 text-white rounded-xl py-2.5 font-semibold text-[13px] transition cursor-pointer shadow-xs"
                  >
                    Confirm &amp; Disburse
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRunModal(false)}
                    className="px-4 bg-off border border-bdr text-slate-700 hover:bg-slate-100 rounded-xl py-2.5 font-medium text-[13px] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: QUICK ADJUST ADVANCE / EARNINGS MODAL
         ========================================================================= */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveParams}
            className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-md p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-bdr/60 pb-3">
              <div>
                <h3 className="font-bold text-[16px] text-slate-900">Adjust Advance &amp; Earnings</h3>
                <p className="text-[12px] text-muted">{editingEmployee.name} ({editingEmployee.empId})</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-[12.5px] space-y-1">
              <div className="flex justify-between">
                <span className="text-muted">Standard Salary:</span>
                <span className="font-semibold text-slate-900">{formatINR(editingEmployee.standardSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Earned Salary:</span>
                <span className="font-semibold text-blue-900">{formatINR(editingEmployee.earnedSalary)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Additional Earnings (Overtime / Bonus / Allowance) [₹]
                </label>
                <input
                  type="number"
                  min="0"
                  value={editEarnings}
                  onChange={(e) => setEditEarnings(e.target.value)}
                  className="w-full h-10 px-3 bg-off border border-bdr rounded-xl text-[13px] focus:outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Monthly Deductions (PF / Tax / Deductions) [₹]
                </label>
                <input
                  type="number"
                  min="0"
                  value={editDeductions}
                  onChange={(e) => setEditDeductions(e.target.value)}
                  className="w-full h-10 px-3 bg-off border border-bdr rounded-xl text-[13px] focus:outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Salary Advance Recovered [₹]
                </label>
                <input
                  type="number"
                  min="0"
                  value={editAdvance}
                  onChange={(e) => setEditAdvance(e.target.value)}
                  className="w-full h-10 px-3 bg-off border border-bdr rounded-xl text-[13px] focus:outline-none focus:border-navy"
                />
              </div>

              {/* Live Preview of Formula */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[12.5px] flex justify-between items-center font-bold">
                <span className="text-emerald-950">Calculated Remaining Payable:</span>
                <span className="text-emerald-800 text-[14px]">
                  {formatINR(
                    Math.max(
                      0,
                      editingEmployee.earnedSalary +
                        (Number(editEarnings) || 0) -
                        (Number(editDeductions) || 0) -
                        (Number(editAdvance) || 0)
                    )
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="flex-1 bg-navy hover:bg-navy/90 text-white rounded-xl py-2.5 font-semibold text-[13px] transition cursor-pointer shadow-xs"
              >
                Apply Changes
              </button>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="px-4 bg-off border border-bdr text-slate-700 hover:bg-slate-100 rounded-xl py-2.5 font-medium text-[13px] transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: ADD SALARY STRUCTURE MODAL
         ========================================================================= */}
      {showAddStructureModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddStructureSubmit}
            className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-md p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-bdr/60 pb-3">
              <h3 className="font-bold text-[16px] text-slate-900">Add Salary Band Structure</h3>
              <button
                type="button"
                onClick={() => setShowAddStructureModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Structure / Band Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering — L5 (Staff Dev)"
                  value={newStructure.name}
                  onChange={(e) => setNewStructure({ ...newStructure, name: e.target.value })}
                  className="w-full h-10 px-3 bg-off border border-bdr rounded-xl text-[13px] focus:outline-none focus:border-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={newStructure.department}
                    onChange={(e) => setNewStructure({ ...newStructure, department: e.target.value })}
                    className="w-full h-10 px-3 bg-off border border-bdr rounded-xl text-[12.5px] focus:outline-none focus:border-navy cursor-pointer"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Executive">Executive</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                    Staff Headcount
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 15"
                    value={newStructure.employees}
                    onChange={(e) => setNewStructure({ ...newStructure, employees: e.target.value })}
                    className="w-full h-10 px-3 bg-off border border-bdr rounded-xl text-[13px] focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="flex-1 bg-navy hover:bg-navy/90 text-white rounded-xl py-2.5 font-semibold text-[13px] transition cursor-pointer shadow-xs"
              >
                Save Structure
              </button>
              <button
                type="button"
                onClick={() => setShowAddStructureModal(false)}
                className="px-4 bg-off border border-bdr text-slate-700 hover:bg-slate-100 rounded-xl py-2.5 font-medium text-[13px] transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
