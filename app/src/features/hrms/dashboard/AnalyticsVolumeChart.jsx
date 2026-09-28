import { useState, useMemo } from "react";
import { FileSpreadsheet, Download, ChevronDown } from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { usePayrollStore } from "../../../stores/payrollStore";
import { usePerformanceStore } from "../../../stores/performanceStore";
import { useTrainingStore } from "../../../stores/trainingStore";
import { useAssetStore } from "../../../stores/assetStore";
import { toISODate } from "../../../utils/dateUtils";

const TABS = [
  "Employee",
  "Attendance",
  "Leave",
  "Payroll",
  "Performance",
  "Recruitment",
  "Training",
  "Asset",
  "Department",
];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEAR = new Date().getFullYear();
const CURRENT_MONTH_IDX = new Date().getMonth();

const DATE_RANGE_MAP = {
  [`Jan ${YEAR} - Dec ${YEAR} (Annual)`]: MONTH_LABELS,
  [`H1 ${YEAR} (Jan - Jun)`]: MONTH_LABELS.slice(0, 6),
  [`H2 ${YEAR} (Jul - Dec)`]: MONTH_LABELS.slice(6),
  [`Q1 ${YEAR} (Jan - Mar)`]: MONTH_LABELS.slice(0, 3),
  [`Q2 ${YEAR} (Apr - Jun)`]: MONTH_LABELS.slice(3, 6),
  [`Q3 ${YEAR} (Jul - Sep)`]: MONTH_LABELS.slice(6, 9),
  [`Q4 ${YEAR} (Oct - Dec)`]: MONTH_LABELS.slice(9),
  [`Q3 - Q4 ${YEAR}`]: MONTH_LABELS.slice(6),
};
const DATE_RANGE_OPTIONS = Object.keys(DATE_RANGE_MAP);

const TAB_META = {
  Employee: { yAxisPrefix: "Y-Axis: Total Workforce Volume", seriesNames: ["Full Time", "Contract", "Interns"] },
  Attendance: { yAxisPrefix: "Y-Axis: Attendance Records", seriesNames: ["On-Site", "Remote", "Half Day"] },
  Leave: { yAxisPrefix: "Y-Axis: Total Leave Applications", seriesNames: ["Paid / Annual", "Casual / Sick", "Unpaid"] },
  Payroll: { yAxisPrefix: "Y-Axis: Gross Disbursement (in ₹)", seriesNames: ["Salaries", "Allowances", "Overtime & Bonus"] },
  Performance: { yAxisPrefix: "Y-Axis: Completed Review Cycles", seriesNames: ["Exceeds", "Meets Expectations", "Needs Improvement"] },
  Recruitment: { yAxisPrefix: "Y-Axis: Candidate Pipeline", seriesNames: ["Sourced", "Interviewed", "Offers Accepted"] },
  Training: { yAxisPrefix: "Y-Axis: Total Enrollments", seriesNames: ["Technical", "Leadership", "Compliance"] },
  Asset: { yAxisPrefix: "Y-Axis: Total Assets Registered", seriesNames: ["Laptops", "Monitors & Accessories", "Mobile / Test Devices"] },
  Department: { yAxisPrefix: "Y-Axis: Headcount by Division", seriesNames: [] },
};

/** Month index (0-11) of a date in the current year, or -1. */
function monthOf(value) {
  const iso = toISODate(value);
  if (!iso) return -1;
  const [y, m] = iso.split("-").map(Number);
  return y === YEAR ? m - 1 : -1;
}

/** Month index a row counts from for cumulative headcount (-1 = before this year, 12 = never). */
function startMonthOf(value) {
  const iso = toISODate(value);
  if (!iso) return -1;
  const [y, m] = iso.split("-").map(Number);
  if (y < YEAR) return -1;
  if (y > YEAR) return 12;
  return m - 1;
}

const has = (value, ...needles) => {
  const lower = String(value || "").toLowerCase();
  return needles.some((n) => lower.includes(n));
};

const amount = (value) => {
  const n = Number(String(value ?? "").replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const deptOf = (row) => row.department || row.dept || "";

const isFutureMonth = (month) => MONTH_LABELS.indexOf(month) > CURRENT_MONTH_IDX;

export default function AnalyticsVolumeChart() {
  const showToast = useAppStore((s) => s.showToast || s.setToast);
  const employees = useAppStore((s) => s.employees || []);
  const leaves = useAppStore((s) => s.leaves || []);
  const attendance = useAppStore((s) => s.attendance || []);
  const candidates = useAppStore((s) => s.candidates || []);
  const payroll = usePayrollStore((s) => s.employees || []);
  const appraisals = usePerformanceStore((s) => s.appraisals || []);
  const trainings = useTrainingStore((s) => s.trainings || []);
  const assets = useAssetStore((s) => s.assets || []);

  const [activeTab, setActiveTab] = useState("Employee");
  const [department, setDepartment] = useState("All Departments");
  const [dateRange, setDateRange] = useState(DATE_RANGE_OPTIONS[0]);
  const [selectedMonth, setSelectedMonth] = useState(MONTH_LABELS[CURRENT_MONTH_IDX]);
  const [hoveredData, setHoveredData] = useState(null);

  const baseTemplate = TAB_META[activeTab] || TAB_META.Employee;

  const departmentOptions = useMemo(
    () => [...new Set(employees.map(deptOf).filter(Boolean))].sort(),
    [employees]
  );

  const employeeDept = useMemo(() => {
    const map = new Map();
    employees.forEach((e) => {
      if (e.name) map.set(e.name, deptOf(e));
      if (e.id !== undefined) map.set(String(e.id), deptOf(e));
    });
    return map;
  }, [employees]);

  const inDept = (row, nameKey = "employee") => {
    if (department === "All Departments") return true;
    const d = deptOf(row) || employeeDept.get(String(row.employeeId ?? "")) || employeeDept.get(row[nameKey]) || "";
    return d === department;
  };

  const topDepartments = useMemo(() => {
    const counts = {};
    employees.forEach((e) => {
      const d = deptOf(e);
      if (d) counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d]) => d);
  }, [employees]);

  const seriesNames = useMemo(() => {
    if (activeTab === "Department") {
      const names = [...topDepartments];
      while (names.length < 3) names.push("—");
      return names;
    }
    return baseTemplate.seriesNames;
  }, [activeTab, topDepartments, baseTemplate]);

  // Monthly series built from the live records for the current year.
  const processedMonths = useMemo(() => {
    const buckets = MONTH_LABELS.map((month) => ({ month, s1: 0, s2: 0, s3: 0 }));
    const add = (idx, key, value = 1) => {
      if (idx >= 0 && idx < 12) buckets[idx][key] += value;
    };
    const addFrom = (idx, key) => {
      for (let i = Math.max(0, idx); i < 12; i += 1) buckets[i][key] += 1;
    };

    if (activeTab === "Employee") {
      employees.filter((e) => inDept(e)).forEach((e) => {
        const type = e.employmentType || e.jobType || "";
        const key = has(type, "intern") ? "s3" : has(type, "contract", "consult", "freelance") ? "s2" : "s1";
        addFrom(startMonthOf(e.joiningDate || e.doj), key);
      });
    } else if (activeTab === "Department") {
      employees.forEach((e) => {
        const idx = topDepartments.indexOf(deptOf(e));
        if (idx >= 0) addFrom(startMonthOf(e.joiningDate || e.doj), `s${idx + 1}`);
      });
    } else if (activeTab === "Attendance") {
      attendance.filter((r) => inDept(r)).forEach((r) => {
        const idx = monthOf(r.date);
        if (r.status === "WFH") add(idx, "s2");
        else if (r.status === "Half Day") add(idx, "s3");
        else if (r.status === "Present" || r.status === "Late") add(idx, "s1");
      });
    } else if (activeTab === "Leave") {
      leaves.filter((l) => inDept(l)).forEach((l) => {
        const idx = monthOf(l.fromDate || l.from);
        const type = l.type || l.leaveType || "";
        if (has(type, "unpaid", "loss of pay", "lop")) add(idx, "s3");
        else if (has(type, "casual", "sick", "medical")) add(idx, "s2");
        else add(idx, "s1");
      });
    } else if (activeTab === "Payroll") {
      payroll.filter((p) => inDept(p, "name")).forEach((p) => {
        const idx = monthOf(p.paymentDate) >= 0
          ? monthOf(p.paymentDate)
          : Number(p.year) === YEAR && p.month ? MONTH_LABELS.findIndex((m) => String(p.month).toLowerCase().startsWith(m.toLowerCase())) : -1;
        add(idx, "s1", Math.round(amount(p.earnedSalary ?? p.standardSalary)));
        add(idx, "s2", Math.round(amount(p.additionalEarnings ?? p.allowances)));
        add(idx, "s3", Math.round(amount(p.overtime) + amount(p.bonus)));
      });
    } else if (activeTab === "Performance") {
      appraisals.filter((a) => inDept(a)).forEach((a) => {
        if (a.status !== "Completed" && a.status !== "Approved") return;
        const idx = monthOf(a.hrReview?.approvedAt || a.due);
        const r = Number(a.rating) || 0;
        add(idx, r >= 3.8 ? "s1" : r >= 3 ? "s2" : "s3");
      });
    } else if (activeTab === "Recruitment") {
      candidates.forEach((c) => {
        if (department !== "All Departments" && c.department && c.department !== department) return;
        const idx = monthOf(c.appliedDate || c.applied || c.createdAt);
        add(idx, "s1");
        if (c.interviewStatus || has(c.stage, "interview", "offer", "hired")) add(idx, "s2");
        if (has(c.stage, "hired")) add(idx, "s3");
      });
    } else if (activeTab === "Training") {
      trainings.filter((t) => inDept(t)).forEach((t) => {
        const idx = monthOf(t.startDate || t.start);
        const key = has(t.type, "leader", "management") ? "s2" : has(t.type, "compliance", "policy", "safety") ? "s3" : "s1";
        add(idx, key, Number(t.participants) || 1);
      });
    } else if (activeTab === "Asset") {
      assets.forEach((a) => {
        if (department !== "All Departments" && a.dept !== department) return;
        const idx = monthOf(a.purchaseDate || a.history?.[a.history.length - 1]?.date);
        const key = has(a.category, "mobile", "phone", "tablet", "device") ? "s3" : has(a.category, "laptop") ? "s1" : "s2";
        add(idx, key);
      });
    }

    return buckets.map((b) => ({ ...b, total: b.s1 + b.s2 + b.s3 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, department, employees, leaves, attendance, candidates, payroll, appraisals, trainings, assets, topDepartments, employeeDept]);

  // Filter months according to selected Date Range
  const visibleMonthsData = useMemo(() => {
    const allowed = DATE_RANGE_MAP[dateRange] || MONTH_LABELS;
    return processedMonths.filter((m) => allowed.includes(m.month));
  }, [processedMonths, dateRange]);

  // Ensure selectedMonth stays valid when date range changes
  const activeSelectedMonth = useMemo(() => {
    const hasMonth = visibleMonthsData.some((m) => m.month === selectedMonth);
    if (hasMonth) return selectedMonth;
    return visibleMonthsData[visibleMonthsData.length - 1]?.month || MONTH_LABELS[CURRENT_MONTH_IDX];
  }, [visibleMonthsData, selectedMonth]);

  // Dynamic ScaleMax based on the maximum value in visible range
  const dynamicScaleMax = useMemo(() => {
    const maxVal = Math.max(
      1,
      ...visibleMonthsData.map((m) => Math.max(m.s1, m.s2, m.s3, 1))
    );
    if (maxVal <= 10) return 10;
    if (maxVal <= 50) return 50;
    if (maxVal <= 100) return 100;
    if (maxVal <= 250) return 250;
    if (maxVal <= 500) return 500;
    if (maxVal <= 800) return 800;
    if (maxVal <= 1200) return 1200;
    return Math.ceil((maxVal * 1.2) / 100) * 100;
  }, [visibleMonthsData]);

  // Calculate Net Growth dynamically for the visible range
  const growthInfo = useMemo(() => {
    if (visibleMonthsData.length < 2) return "+0.0%";
    const first = visibleMonthsData[0].total;
    // Compare with the last non-future month (or last available month)
    const validMonths = visibleMonthsData.filter((m) => !isFutureMonth(m.month));
    const lastTarget = validMonths.length > 0 ? validMonths[validMonths.length - 1].total : visibleMonthsData[visibleMonthsData.length - 1].total;
    if (!first) return "+0.0%";
    const diff = ((lastTarget - first) / first) * 100;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${diff.toFixed(1)}%`;
  }, [visibleMonthsData]);

  // Data for the currently selected/active month
  const selectedMonthData = useMemo(() => {
    return visibleMonthsData.find((m) => m.month === activeSelectedMonth) || visibleMonthsData[0];
  }, [visibleMonthsData, activeSelectedMonth]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = `Month,${seriesNames.join(",")},Total\n`;
    const rows = visibleMonthsData
      .map((m) => `${m.month},${m.s1},${m.s2},${m.s3},${m.total}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HRMS_${activeTab}_Volume_${department.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (showToast) showToast(`Exported ${activeTab} CSV data for ${department}`);
  };

  // Export Excel
  const handleExportExcel = () => {
    const headers = `Month\t${seriesNames.join("\t")}\tTotal\n`;
    const rows = visibleMonthsData
      .map((m) => `${m.month}\t${m.s1}\t${m.s2}\t${m.s3}\t${m.total}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HRMS_${activeTab}_Volume_${department.replace(/\s+/g, "_")}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    if (showToast) showToast(`Exported ${activeTab} Excel file for ${department}`);
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.04)] mb-5 overflow-hidden">
      {/* ── Top Tabs & Export Bar ── */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#e5e7eb] px-5 pt-3 gap-2">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar scrollbar-none max-w-full lg:max-w-none">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setHoveredData(null);
                }}
                className={`pb-3 text-[13.5px] font-semibold whitespace-nowrap shrink-0 lg:shrink relative transition-colors ${
                  isActive
                    ? "text-[#0f172a]"
                    : "text-[#64748b] hover:text-[#0f172a]"
                }`}
              >
                {tab}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0f172a] rounded-t" />
                )}
              </button>
            );
          })}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 pb-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#334155] bg-white border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] hover:border-[#94a3b8] transition cursor-pointer"
            title="Export CSV"
          >
            <Download size={13} className="text-[#64748b]" />
            CSV
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#334155] bg-white border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] hover:border-[#94a3b8] transition cursor-pointer"
            title="Export Excel"
          >
            <FileSpreadsheet size={13} className="text-[#15803d]" />
            Excel
          </button>
        </div>
      </div>

      {/* ── Filters & Legend Row ── */}
      <div className="p-5 pb-2 flex flex-wrap items-center justify-between gap-4">
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Select */}
          <div className="flex items-center gap-2 text-[12.5px]">
            <span className="text-[#64748b] font-medium">Department:</span>
            <div className="relative">
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  if (showToast) showToast(`Filtered by ${e.target.value}`);
                }}
                className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-[#cbd5e1] rounded-xl text-[12.5px] font-medium text-[#1e293b] focus:outline-none focus:border-[#1F2E4A] cursor-pointer hover:border-[#94a3b8]"
              >
                <option value="All Departments">All Departments</option>
                {departmentOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b]"
              />
            </div>
          </div>

          {/* Date Range Select */}
          <div className="flex items-center gap-2 text-[12.5px]">
            <span className="text-[#64748b] font-medium">Date Range:</span>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  if (showToast) showToast(`Date range: ${e.target.value}`);
                }}
                className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-[#cbd5e1] rounded-xl text-[12.5px] font-medium text-[#1e293b] focus:outline-none focus:border-[#1F2E4A] cursor-pointer hover:border-[#94a3b8]"
              >
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b]"
              />
            </div>
          </div>
        </div>

        {/* Right Legend */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-x-5 gap-y-1.5 text-[12px] text-[#475569]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#1F2E4A]" />
            <span className="font-medium">{seriesNames[0]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#64748B]" />
            <span className="font-medium">{seriesNames[1]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#CBD5E1]" />
            <span className="font-medium">{seriesNames[2]}</span>
          </div>
        </div>
      </div>

      {/* ── Chart Canvas ── */}
      <div className="px-5 pt-3 pb-2">
        <div className="relative h-[240px] w-full flex items-end justify-between gap-1 sm:gap-2 pt-6">
          {/* Subtle horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-dashed border-[#cbd5e1] w-full" />
            <div className="border-b border-dashed border-[#cbd5e1] w-full" />
            <div className="border-b border-dashed border-[#cbd5e1] w-full" />
            <div className="border-b border-dashed border-[#cbd5e1] w-full" />
          </div>

          {/* Month Columns */}
          {visibleMonthsData.map((item, idx) => {
            const isSelected = activeSelectedMonth === item.month;
            const isFuture = isFutureMonth(item.month);

            // Relative heights based on dynamicScaleMax
            const h1 = Math.min(100, (item.s1 / dynamicScaleMax) * 100);
            const h2 = Math.min(100, (item.s2 / dynamicScaleMax) * 100);
            const h3 = Math.min(100, (item.s3 / dynamicScaleMax) * 100);

            return (
              <div
                key={item.month}
                onClick={() => setSelectedMonth(item.month)}
                onMouseEnter={() => setHoveredData({ ...item, idx })}
                onMouseLeave={() => setHoveredData(null)}
                className={`relative flex-1 flex flex-col items-center h-full justify-end cursor-pointer group px-0.5 rounded-lg transition-all ${
                  isSelected ? "bg-[#f8fafc]/90 ring-1 ring-[#e2e8f0]" : "hover:bg-[#f8fafc]/60"
                }`}
                title={`Click to focus ${item.month}`}
              >
                {/* Hover Tooltip */}
                {hoveredData && hoveredData.month === item.month && (
                  <div className="absolute -top-20 z-30 bg-[#0f172a] text-white text-[11px] rounded-lg px-3 py-2 shadow-xl whitespace-nowrap flex flex-col pointer-events-none transition-all">
                    <div className="flex items-center justify-between gap-4 font-bold border-b border-white/20 pb-1 mb-1">
                      <span>{item.month} {YEAR}</span>
                      <span className="text-[#94a3b8] font-normal">{department}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-[#e2e8f0]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                        {seriesNames[0]}:
                      </span>
                      <b>{item.s1.toLocaleString()}</b>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-[#cbd5e1]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#94a3b8]" />
                        {seriesNames[1]}:
                      </span>
                      <b>{item.s2.toLocaleString()}</b>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-[#94a3b8]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#e2e8f0]" />
                        {seriesNames[2]}:
                      </span>
                      <b>{item.s3.toLocaleString()}</b>
                    </div>
                    <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between font-semibold text-white">
                      <span>Total:</span>
                      <span>{item.total.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Grouped 3 Bars */}
                <div className="w-full flex items-end justify-center gap-[2px] sm:gap-[3px] h-[190px]">
                  {/* Bar 1: Primary Series */}
                  <div
                    style={{ height: `${h1}%` }}
                    className={`w-[6px] sm:w-[9px] md:w-[11px] rounded-t-xs transition-all duration-300 ${
                      isFuture
                        ? "bg-[#64748B]/60 border border-dashed border-[#475569]"
                        : isSelected
                        ? "bg-[#1F2E4A] ring-1 ring-[#1F2E4A]"
                        : "bg-[#1F2E4A] group-hover:brightness-110"
                    }`}
                  />
                  {/* Bar 2: Secondary Series */}
                  <div
                    style={{ height: `${h2}%` }}
                    className={`w-[6px] sm:w-[9px] md:w-[11px] rounded-t-xs transition-all duration-300 ${
                      isFuture
                        ? "bg-[#94A3B8]/60 border border-dashed border-[#64748b]"
                        : "bg-[#64748B] group-hover:brightness-110"
                    }`}
                  />
                  {/* Bar 3: Tertiary Series */}
                  <div
                    style={{ height: `${h3}%` }}
                    className={`w-[6px] sm:w-[9px] md:w-[11px] rounded-t-xs transition-all duration-300 ${
                      isFuture
                        ? "bg-[#E2E8F0]/80 border border-dashed border-[#cbd5e1]"
                        : "bg-[#CBD5E1] group-hover:brightness-105"
                    }`}
                  />
                </div>

                {/* Month Label */}
                <span
                  className={`mt-2 text-[11.5px] tracking-tight ${
                    isSelected
                      ? "font-extrabold text-[#0f172a]"
                      : isFuture
                      ? "font-normal text-[#94a3b8]"
                      : "font-medium text-[#64748b]"
                  }`}
                >
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer Info ── */}
      <div className="px-5 py-3 border-t border-[#f1f5f9] flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#64748b]">
        <div>
          {baseTemplate.yAxisPrefix} (scale: 0 - {dynamicScaleMax.toLocaleString()})
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {selectedMonthData && (
            <span className="text-[#334155]">
              Focused: <strong className="text-[#0f172a]">{selectedMonthData.month}</strong> ({selectedMonthData.total.toLocaleString()} total)
            </span>
          )}
          <div className="font-semibold text-[#0f172a] flex items-center gap-1">
            <span>Overall Net Growth:</span>
            <span className="text-[#15803d] font-bold bg-[#dcfce7] px-2 py-0.5 rounded-full">
              {growthInfo} YTD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
