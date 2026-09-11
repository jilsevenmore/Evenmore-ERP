import { useState } from "react";
import { FileSpreadsheet, Download, FileText, ChevronDown } from "lucide-react";
import { useAppStore } from "../../../stores/appStore";

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

const MONTHS = [
  { key: "Jan", label: "Jan" },
  { key: "Feb", label: "Feb" },
  { key: "Mar", label: "Mar" },
  { key: "Apr", label: "Apr" },
  { key: "May", label: "May" },
  { key: "Jun", label: "Jun" },
  { key: "Jul", label: "Jul" },
  { key: "Aug", label: "Aug" },
  { key: "Sep", label: "Sep" },
  { key: "Oct", label: "Oct", isCurrent: true },
  { key: "Nov", label: "Nov", isFuture: true },
  { key: "Dec", label: "Dec", isFuture: true },
];

// Data datasets by tab
const TAB_DATA = {
  Employee: {
    yAxis: "Y-Axis: Total Workforce Volume (scale: 0 - 1,400)",
    growth: "+14.6% YTD",
    seriesNames: ["Full Time", "Contract", "Interns"],
    scaleMax: 1400,
    months: [
      { month: "Jan", s1: 680, s2: 380, s3: 160 },
      { month: "Feb", s1: 720, s2: 410, s3: 190 },
      { month: "Mar", s1: 820, s2: 480, s3: 240 },
      { month: "Apr", s1: 910, s2: 520, s3: 280 },
      { month: "May", s1: 880, s2: 560, s3: 310 },
      { month: "Jun", s1: 940, s2: 630, s3: 350 },
      { month: "Jul", s1: 1040, s2: 680, s3: 370 },
      { month: "Aug", s1: 1060, s2: 740, s3: 420 },
      { month: "Sep", s1: 1110, s2: 810, s3: 490 },
      { month: "Oct", s1: 1140, s2: 860, s3: 520 },
      { month: "Nov", s1: 1020, s2: 790, s3: 410 },
      { month: "Dec", s1: 1080, s2: 830, s3: 450 },
    ],
  },
  Attendance: {
    yAxis: "Y-Axis: Average Attendance % (scale: 0 - 100%)",
    growth: "+3.8% MoM",
    seriesNames: ["On-Site", "Remote", "Half Day"],
    scaleMax: 100,
    months: [
      { month: "Jan", s1: 78, s2: 16, s3: 4 },
      { month: "Feb", s1: 80, s2: 15, s3: 3 },
      { month: "Mar", s1: 82, s2: 14, s3: 3 },
      { month: "Apr", s1: 85, s2: 12, s3: 2 },
      { month: "May", s1: 84, s2: 13, s3: 3 },
      { month: "Jun", s1: 88, s2: 10, s3: 2 },
      { month: "Jul", s1: 89, s2: 9, s3: 2 },
      { month: "Aug", s1: 91, s2: 8, s3: 1 },
      { month: "Sep", s1: 93, s2: 6, s3: 1 },
      { month: "Oct", s1: 94, s2: 5, s3: 1 },
      { month: "Nov", s1: 90, s2: 8, s3: 2 },
      { month: "Dec", s1: 92, s2: 7, s3: 1 },
    ],
  },
  Leave: {
    yAxis: "Y-Axis: Total Leave Applications (scale: 0 - 250)",
    growth: "-5.2% MoM",
    seriesNames: ["Paid / Annual", "Casual / Sick", "Unpaid"],
    scaleMax: 250,
    months: [
      { month: "Jan", s1: 120, s2: 60, s3: 15 },
      { month: "Feb", s1: 95, s2: 45, s3: 10 },
      { month: "Mar", s1: 110, s2: 55, s3: 12 },
      { month: "Apr", s1: 130, s2: 70, s3: 18 },
      { month: "May", s1: 140, s2: 80, s3: 20 },
      { month: "Jun", s1: 155, s2: 75, s3: 22 },
      { month: "Jul", s1: 165, s2: 85, s3: 25 },
      { month: "Aug", s1: 170, s2: 90, s3: 22 },
      { month: "Sep", s1: 145, s2: 65, s3: 15 },
      { month: "Oct", s1: 135, s2: 55, s3: 12 },
      { month: "Nov", s1: 125, s2: 50, s3: 10 },
      { month: "Dec", s1: 190, s2: 80, s3: 25 },
    ],
  },
  Payroll: {
    yAxis: "Y-Axis: Gross Disbursement (in ₹ Lakhs, scale: 0 - 600)",
    growth: "+18.2% YTD",
    seriesNames: ["Salaries", "Allowances", "Overtime & Bonus"],
    scaleMax: 600,
    months: [
      { month: "Jan", s1: 320, s2: 120, s3: 40 },
      { month: "Feb", s1: 330, s2: 125, s3: 45 },
      { month: "Mar", s1: 350, s2: 130, s3: 65 },
      { month: "Apr", s1: 380, s2: 140, s3: 50 },
      { month: "May", s1: 390, s2: 145, s3: 55 },
      { month: "Jun", s1: 410, s2: 150, s3: 60 },
      { month: "Jul", s1: 430, s2: 155, s3: 65 },
      { month: "Aug", s1: 450, s2: 160, s3: 70 },
      { month: "Sep", s1: 470, s2: 165, s3: 80 },
      { month: "Oct", s1: 490, s2: 170, s3: 85 },
      { month: "Nov", s1: 460, s2: 160, s3: 70 },
      { month: "Dec", s1: 520, s2: 180, s3: 95 },
    ],
  },
  Performance: {
    yAxis: "Y-Axis: Completed Review Cycles (scale: 0 - 300)",
    growth: "+22.4% vs Q3",
    seriesNames: ["Exceeds", "Meets Expectations", "Needs Improvement"],
    scaleMax: 300,
    months: [
      { month: "Jan", s1: 45, s2: 140, s3: 20 },
      { month: "Feb", s1: 50, s2: 150, s3: 18 },
      { month: "Mar", s1: 60, s2: 170, s3: 22 },
      { month: "Apr", s1: 65, s2: 180, s3: 20 },
      { month: "May", s1: 70, s2: 190, s3: 15 },
      { month: "Jun", s1: 80, s2: 210, s3: 18 },
      { month: "Jul", s1: 85, s2: 215, s3: 17 },
      { month: "Aug", s1: 90, s2: 220, s3: 16 },
      { month: "Sep", s1: 95, s2: 230, s3: 14 },
      { month: "Oct", s1: 105, s2: 240, s3: 12 },
      { month: "Nov", s1: 85, s2: 200, s3: 15 },
      { month: "Dec", s1: 110, s2: 250, s3: 10 },
    ],
  },
  Recruitment: {
    yAxis: "Y-Axis: Candidate Pipeline (scale: 0 - 500)",
    growth: "+31.0% YTD",
    seriesNames: ["Sourced", "Interviewed", "Offers Accepted"],
    scaleMax: 500,
    months: [
      { month: "Jan", s1: 220, s2: 90, s3: 24 },
      { month: "Feb", s1: 240, s2: 110, s3: 28 },
      { month: "Mar", s1: 280, s2: 130, s3: 35 },
      { month: "Apr", s1: 310, s2: 140, s3: 40 },
      { month: "May", s1: 290, s2: 135, s3: 38 },
      { month: "Jun", s1: 340, s2: 160, s3: 45 },
      { month: "Jul", s1: 360, s2: 175, s3: 50 },
      { month: "Aug", s1: 390, s2: 190, s3: 56 },
      { month: "Sep", s1: 420, s2: 210, s3: 62 },
      { month: "Oct", s1: 440, s2: 225, s3: 68 },
      { month: "Nov", s1: 380, s2: 180, s3: 48 },
      { month: "Dec", s1: 410, s2: 200, s3: 55 },
    ],
  },
  Training: {
    yAxis: "Y-Axis: Total Enrollments & Badges (scale: 0 - 400)",
    growth: "+19.5% YTD",
    seriesNames: ["Technical", "Leadership", "Compliance"],
    scaleMax: 400,
    months: [
      { month: "Jan", s1: 140, s2: 60, s3: 90 },
      { month: "Feb", s1: 160, s2: 70, s3: 95 },
      { month: "Mar", s1: 180, s2: 85, s3: 110 },
      { month: "Apr", s1: 200, s2: 90, s3: 120 },
      { month: "May", s1: 190, s2: 80, s3: 115 },
      { month: "Jun", s1: 220, s2: 100, s3: 130 },
      { month: "Jul", s1: 230, s2: 110, s3: 140 },
      { month: "Aug", s1: 250, s2: 115, s3: 145 },
      { month: "Sep", s1: 270, s2: 125, s3: 155 },
      { month: "Oct", s1: 280, s2: 130, s3: 160 },
      { month: "Nov", s1: 240, s2: 105, s3: 135 },
      { month: "Dec", s1: 260, s2: 120, s3: 150 },
    ],
  },
  Asset: {
    yAxis: "Y-Axis: Total Active Assets Allocated (scale: 0 - 1,200)",
    growth: "+12.1% YTD",
    seriesNames: ["Laptops", "Monitors & Accessories", "Mobile / Test Devices"],
    scaleMax: 1200,
    months: [
      { month: "Jan", s1: 450, s2: 320, s3: 120 },
      { month: "Feb", s1: 480, s2: 340, s3: 130 },
      { month: "Mar", s1: 520, s2: 380, s3: 150 },
      { month: "Apr", s1: 560, s2: 410, s3: 165 },
      { month: "May", s1: 580, s2: 430, s3: 175 },
      { month: "Jun", s1: 620, s2: 460, s3: 190 },
      { month: "Jul", s1: 670, s2: 490, s3: 205 },
      { month: "Aug", s1: 710, s2: 520, s3: 220 },
      { month: "Sep", s1: 760, s2: 560, s3: 240 },
      { month: "Oct", s1: 790, s2: 590, s3: 250 },
      { month: "Nov", s1: 720, s2: 530, s3: 225 },
      { month: "Dec", s1: 750, s2: 550, s3: 235 },
    ],
  },
  Department: {
    yAxis: "Y-Axis: Headcount by Division (scale: 0 - 800)",
    growth: "+8.4% YTD",
    seriesNames: ["Engineering", "Sales & Ops", "Product & Design"],
    scaleMax: 800,
    months: [
      { month: "Jan", s1: 380, s2: 240, s3: 140 },
      { month: "Feb", s1: 400, s2: 255, s3: 150 },
      { month: "Mar", s1: 430, s2: 270, s3: 165 },
      { month: "Apr", s1: 460, s2: 290, s3: 180 },
      { month: "May", s1: 475, s2: 300, s3: 190 },
      { month: "Jun", s1: 510, s2: 320, s3: 205 },
      { month: "Jul", s1: 540, s2: 340, s3: 220 },
      { month: "Aug", s1: 565, s2: 360, s3: 235 },
      { month: "Sep", s1: 590, s2: 380, s3: 250 },
      { month: "Oct", s1: 610, s2: 395, s3: 260 },
      { month: "Nov", s1: 550, s2: 350, s3: 230 },
      { month: "Dec", s1: 580, s2: 370, s3: 245 },
    ],
  },
};

export default function AnalyticsVolumeChart() {
  const showToast = useAppStore((s) => s.showToast);
  const [activeTab, setActiveTab] = useState("Employee");
  const [department, setDepartment] = useState("All Departments");
  const [dateRange, setDateRange] = useState("Jan 2024 - Dec 2024 (Annual)");
  const [hoveredData, setHoveredData] = useState(null);

  const currentDataset = TAB_DATA[activeTab] || TAB_DATA.Employee;

  // Export CSV
  const handleExportCSV = () => {
    const headers = `Month,${currentDataset.seriesNames.join(",")}\n`;
    const rows = currentDataset.months
      .map((m) => `${m.month},${m.s1},${m.s2},${m.s3}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HRMS_${activeTab}_Volume_${department.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (showToast) showToast(`Exported ${activeTab} CSV data`);
  };

  // Export Excel mockup
  const handleExportExcel = () => {
    handleExportCSV();
    if (showToast) showToast(`Exported ${activeTab} Excel file`);
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.04)] mb-5 overflow-hidden">
      {/* ── Top Tabs & Export Bar ── */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#e5e7eb] px-5 pt-3 gap-2">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-6 overflow-x-auto no-scrollbar">
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
                className={`pb-3 text-[13.5px] font-semibold whitespace-nowrap relative transition-colors ${
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#334155] bg-white border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] hover:border-[#94a3b8] transition"
            title="Export CSV"
          >
            <Download size={13} className="text-[#64748b]" />
            CSV
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#334155] bg-white border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] hover:border-[#94a3b8] transition"
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
                  if (showToast) showToast(`Filter updated: ${e.target.value}`);
                }}
                className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-[#cbd5e1] rounded-xl text-[12.5px] font-medium text-[#1e293b] focus:outline-none focus:border-[#1F2E4A] cursor-pointer hover:border-[#94a3b8]"
              >
                <option value="All Departments">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Product">Product</option>
                <option value="Operations">Operations</option>
                <option value="HR & People">HR &amp; People</option>
                <option value="Sales & Marketing">Sales &amp; Marketing</option>
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
                  if (showToast) showToast(`Period set: ${e.target.value}`);
                }}
                className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-[#cbd5e1] rounded-xl text-[12.5px] font-medium text-[#1e293b] focus:outline-none focus:border-[#1F2E4A] cursor-pointer hover:border-[#94a3b8]"
              >
                <option value="Jan 2024 - Dec 2024 (Annual)">Jan 2024 - Dec 2024 (Annual)</option>
                <option value="H1 2024 (Jan - Jun)">H1 2024 (Jan - Jun)</option>
                <option value="H2 2024 (Jul - Dec)">H2 2024 (Jul - Dec)</option>
                <option value="Q3 - Q4 2024">Q3 - Q4 2024</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b]"
              />
            </div>
          </div>
        </div>

        {/* Right Legend */}
        <div className="flex items-center gap-5 text-[12px] text-[#475569]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#1F2E4A]" />
            <span className="font-medium">{currentDataset.seriesNames[0]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#64748B]" />
            <span className="font-medium">{currentDataset.seriesNames[1]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#CBD5E1]" />
            <span className="font-medium">{currentDataset.seriesNames[2]}</span>
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
          {currentDataset.months.map((item, idx) => {
            const isOct = item.month === "Oct";
            const isFuture = item.month === "Nov" || item.month === "Dec";

            // Relative heights based on scaleMax
            const h1 = Math.min(100, Math.max(12, (item.s1 / currentDataset.scaleMax) * 100));
            const h2 = Math.min(100, Math.max(8, (item.s2 / currentDataset.scaleMax) * 100));
            const h3 = Math.min(100, Math.max(6, (item.s3 / currentDataset.scaleMax) * 100));

            return (
              <div
                key={item.month}
                onMouseEnter={() => setHoveredData({ ...item, idx })}
                onMouseLeave={() => setHoveredData(null)}
                className={`relative flex-1 flex flex-col items-center h-full justify-end cursor-pointer group px-0.5 rounded-lg transition-colors ${
                  isOct ? "bg-[#f8fafc]/80" : "hover:bg-[#f8fafc]/60"
                }`}
              >
                {/* Hover Tooltip */}
                {hoveredData && hoveredData.month === item.month && (
                  <div className="absolute -top-14 z-20 bg-[#0f172a] text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap flex flex-col pointer-events-none">
                    <span className="font-bold border-b border-white/20 pb-0.5 mb-0.5">
                      {item.month} • {department}
                    </span>
                    <span>
                      {currentDataset.seriesNames[0]}: <b>{item.s1.toLocaleString()}</b>
                    </span>
                    <span>
                      {currentDataset.seriesNames[1]}: <b>{item.s2.toLocaleString()}</b>
                    </span>
                    <span>
                      {currentDataset.seriesNames[2]}: <b>{item.s3.toLocaleString()}</b>
                    </span>
                  </div>
                )}

                {/* Grouped 3 Bars */}
                <div className="w-full flex items-end justify-center gap-[2px] sm:gap-[3px] h-[190px]">
                  {/* Bar 1: Full Time */}
                  <div
                    style={{ height: `${h1}%` }}
                    className={`w-[6px] sm:w-[9px] md:w-[11px] rounded-t-xs transition-all duration-300 ${
                      isFuture
                        ? "bg-[#64748B]/60 border border-dashed border-[#475569]"
                        : isOct
                        ? "bg-[#1F2E4A] ring-1 ring-[#1F2E4A]"
                        : "bg-[#1F2E4A] group-hover:brightness-110"
                    }`}
                  />
                  {/* Bar 2: Contract */}
                  <div
                    style={{ height: `${h2}%` }}
                    className={`w-[6px] sm:w-[9px] md:w-[11px] rounded-t-xs transition-all duration-300 ${
                      isFuture
                        ? "bg-[#94A3B8]/60 border border-dashed border-[#64748b]"
                        : "bg-[#64748B] group-hover:brightness-110"
                    }`}
                  />
                  {/* Bar 3: Interns */}
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
                    isOct
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
        <div>{currentDataset.yAxis}</div>
        <div className="font-semibold text-[#0f172a] flex items-center gap-1">
          <span>Overall Net Growth:</span>
          <span className="text-[#15803d] font-bold bg-[#dcfce7] px-2 py-0.5 rounded-full">
            {currentDataset.growth}
          </span>
        </div>
      </div>
    </div>
  );
}
