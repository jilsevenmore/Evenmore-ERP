import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/ui/DataTable";
const MOCK_LEAVE = [
  { id: "LV001", employee: "Arjun Sharma", dept: "Engineering", type: "Annual Leave", from: "Oct 10, 2026", to: "Oct 12, 2026", days: 3, status: "Approved", applied: "Oct 05, 2026" },
  { id: "LV002", employee: "Priya Patel", dept: "HR", type: "Sick Leave", from: "Oct 14, 2026", to: "Oct 14, 2026", days: 1, status: "Pending Approval", applied: "Oct 13, 2026" },
  { id: "LV003", employee: "Meera Nair", dept: "Finance", type: "Maternity Leave", from: "Oct 01, 2026", to: "Jan 01, 2027", days: 90, status: "Approved", applied: "Sep 25, 2026" },
  { id: "LV004", employee: "Liam Cooper", dept: "Sales", type: "Annual Leave", from: "Oct 20, 2026", to: "Oct 22, 2026", days: 3, status: "Rejected", applied: "Oct 10, 2026" },
  { id: "LV005", employee: "Rahul Das", dept: "Operations", type: "Casual Leave", from: "Oct 17, 2026", to: "Oct 17, 2026", days: 1, status: "Pending Approval", applied: "Oct 15, 2026" }
];
const COLUMNS = [
  { key: "id", label: "Request ID" },
  { key: "employee", label: "Employee", sortable: true },
  { key: "dept", label: "Department", sortable: true },
  { key: "type", label: "Leave Type", sortable: true },
  { key: "from", label: "From" },
  { key: "to", label: "To" },
  { key: "days", label: "Days", render: (v) => `${v} day${v > 1 ? "s" : ""}` },
  { key: "applied", label: "Applied On" },
  { key: "status", label: "Status", render: (val) => <StatusBadge status={val} /> }
];
export default function Leave() {
  return <>
      <PageHeader
    title="Leave Management"
    subtitle="Track and manage employee leave requests."
    breadcrumb={[{ label: "HRMS" }, { label: "Leave" }]}
    actions={<button type="button" className="btn-primary btn-sm">+ Apply Leave</button>}
  />
      <div className="section-wrap">
        <DataTable
    columns={COLUMNS}
    data={MOCK_LEAVE}
    rowKey="id"
    searchable
    searchPlaceholder="Search leave requests..."
    emptyMessage="No leave requests found."
    pageSize={10}
  />
      </div>
    </>;
}
