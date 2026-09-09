import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/ui/DataTable";
const MOCK_ATTENDANCE = [
  { id: 1, employee: "Arjun Sharma", dept: "Engineering", date: "Oct 09, 2026", checkIn: "09:02 AM", checkOut: "06:15 PM", hours: "9h 13m", status: "Present" },
  { id: 2, employee: "Priya Patel", dept: "HR", date: "Oct 09, 2026", checkIn: "09:28 AM", checkOut: "06:00 PM", hours: "8h 32m", status: "Late" },
  { id: 3, employee: "Liam Cooper", dept: "Sales", date: "Oct 09, 2026", checkIn: "\u2014", checkOut: "\u2014", hours: "\u2014", status: "Absent" },
  { id: 4, employee: "Meera Nair", dept: "Finance", date: "Oct 09, 2026", checkIn: "\u2014", checkOut: "\u2014", hours: "\u2014", status: "Leave" },
  { id: 5, employee: "Rahul Das", dept: "Operations", date: "Oct 09, 2026", checkIn: "08:55 AM", checkOut: "01:00 PM", hours: "4h 05m", status: "Half Day" },
  { id: 6, employee: "Fatima Khan", dept: "Design", date: "Oct 09, 2026", checkIn: "09:00 AM", checkOut: "06:00 PM", hours: "9h 00m", status: "Present" }
];
const COLUMNS = [
  { key: "employee", label: "Employee", sortable: true },
  { key: "dept", label: "Department", sortable: true },
  { key: "date", label: "Date" },
  { key: "checkIn", label: "Check In" },
  { key: "checkOut", label: "Check Out" },
  { key: "hours", label: "Total Hours" },
  { key: "status", label: "Status", render: (val) => <StatusBadge status={val} /> }
];
export default function AttendanceOverview() {
  return <>
      <PageHeader
    title="Attendance Overview"
    subtitle="Daily attendance log for all employees."
    breadcrumb={[{ label: "HRMS" }, { label: "Attendance" }, { label: "Overview" }]}
    actions={<button type="button" className="btn-primary btn-sm">Mark Attendance</button>}
  />
      <div className="section-wrap">
        <DataTable
    columns={COLUMNS}
    data={MOCK_ATTENDANCE}
    rowKey="id"
    searchable
    searchPlaceholder="Search attendance..."
    emptyMessage="No attendance records."
    pageSize={10}
  />
      </div>
    </>;
}
