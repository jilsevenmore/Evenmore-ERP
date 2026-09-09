import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/ui/DataTable";
import StatCard from "../../../components/ui/StatCard";
const STATS = [
  { label: "Employees Processed", value: "1,248", icon: "users", trend: "100%", note: "this month", trendDirection: "up", tone: "green" },
  { label: "Total Payroll", value: "\u20B942.6L", icon: "chart", trend: "+2.1%", note: "vs last month", trendDirection: "up", tone: "blue" },
  { label: "Pending Approvals", value: "3", icon: "clock", trend: "action needed", note: "", trendDirection: "down", tone: "amber" }
];
const MOCK_PAYROLL = [
  { id: "PAY001", employee: "Arjun Sharma", dept: "Engineering", basic: "\u20B985,000", hra: "\u20B934,000", deductions: "\u20B912,000", net: "\u20B91,07,000", month: "Sep 2026", status: "Processed" },
  { id: "PAY002", employee: "Priya Patel", dept: "HR", basic: "\u20B970,000", hra: "\u20B928,000", deductions: "\u20B99,800", net: "\u20B988,200", month: "Sep 2026", status: "Processed" },
  { id: "PAY003", employee: "Liam Cooper", dept: "Sales", basic: "\u20B965,000", hra: "\u20B926,000", deductions: "\u20B99,100", net: "\u20B981,900", month: "Sep 2026", status: "Processing" },
  { id: "PAY004", employee: "Meera Nair", dept: "Finance", basic: "\u20B972,000", hra: "\u20B928,800", deductions: "\u20B910,000", net: "\u20B990,800", month: "Sep 2026", status: "Processed" }
];
const COLUMNS = [
  { key: "id", label: "Payroll ID" },
  { key: "employee", label: "Employee", sortable: true },
  { key: "dept", label: "Department", sortable: true },
  { key: "basic", label: "Basic" },
  { key: "hra", label: "HRA" },
  { key: "deductions", label: "Deductions" },
  { key: "net", label: "Net Pay" },
  { key: "month", label: "Month" },
  { key: "status", label: "Status", render: (val) => <StatusBadge status={val} /> }
];
export default function Payroll() {
  return <>
      <PageHeader
    title="Payroll"
    subtitle="Process and manage employee salary payroll."
    breadcrumb={[{ label: "HRMS" }, { label: "Payroll" }]}
    actions={<>
            <button type="button" className="btn-outline btn-sm">Export</button>
            <button type="button" className="btn-primary btn-sm">Run Payroll</button>
          </>}
  />
      <div className="section-wrap">
        <div className="dashboard-stats">
          {STATS.map((s) => <StatCard key={s.label} stat={s} />)}
        </div>
        <DataTable
    columns={COLUMNS}
    data={MOCK_PAYROLL}
    rowKey="id"
    searchable
    searchPlaceholder="Search payroll records..."
    emptyMessage="No payroll records found."
    pageSize={10}
  />
      </div>
    </>;
}
