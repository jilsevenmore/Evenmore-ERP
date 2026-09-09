import { useState } from "react";
import PageHeader from "../../../components/ui/PageHeader";
import StatCard from "../../../components/ui/StatCard";
import StatusBadge from "../../../components/ui/StatusBadge";
const STATS = [
  { label: "Total Employees", value: "1,248", icon: "users", trend: "+4.2%", note: "this quarter", trendDirection: "up", tone: "blue" },
  { label: "Present Today", value: "1,102", icon: "users", trend: "94.2%", note: "attendance rate", trendDirection: "up", tone: "green" },
  { label: "On Leave", value: "34", icon: "clock", trend: "4 pending", note: "across teams", trendDirection: "down", tone: "amber" },
  { label: "Open Positions", value: "24", icon: "chart", trend: "4 closing soon", note: "142 candidates", trendDirection: "down", tone: "purple" }
];
const SCHEDULE_DATA = [
  { time: "09:00 AM", person: "Arjun Sharma", dept: "Engineering", type: "Interview", status: "Confirmed" },
  { time: "10:30 AM", person: "Priya Patel", dept: "HR", type: "Onboarding", status: "In Progress" },
  { time: "11:00 AM", person: "Liam Cooper", dept: "Sales", type: "Reviews", status: "Pending" },
  { time: "02:00 PM", person: "Meera Nair", dept: "Finance", type: "Interviews", status: "Confirmed" },
  { time: "03:30 PM", person: "Rahul Das", dept: "Operations", type: "Onboarding", status: "Confirmed" }
];
const ACTIVITY = [
  { who: "Priya Patel", what: "requested 3 days annual leave.", when: "12 mins ago \xB7 Leave Management" },
  { who: "Liam Cooper", what: "submitted Q3 evaluation.", when: "45 mins ago \xB7 Performance" },
  { who: "Arjun Sharma", what: "joined as Senior Engineer.", when: "1 hour ago \xB7 Onboarding" },
  { who: "Meera Nair", what: "approved payroll for October.", when: "2 hours ago \xB7 Payroll" }
];
export default function HRMSDashboard() {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? SCHEDULE_DATA : SCHEDULE_DATA.filter((r) => r.type.includes(filter));
  return <>
      <PageHeader
    title="HRMS Dashboard"
    subtitle="People overview — attendance, leave, and team activity."
    breadcrumb={[{ label: "HRMS" }, { label: "Dashboard" }]}
    actions={<button type="button" className="btn-primary btn-sm">+ Add Record</button>}
  />

      <div className="section-wrap">
        {
    /* Stats */
  }
        <div className="dashboard-stats">
          {STATS.map((stat) => <StatCard key={stat.label} stat={stat} />)}
        </div>

        {
    /* Main Grid */
  }
        <div className="dashboard-main-grid">
          {
    /* Schedule Table */
  }
          <div className="dashboard-panel dashboard-chart-card">
            <div className="panel-head panel-head-spread">
              <div>
                <h3>Today's Schedule & Meetings</h3>
                <p>Sessions scheduled for today</p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["All", "Interviews", "Onboarding", "Reviews"].map((f) => <button
    key={f}
    type="button"
    className={filter === f ? "btn-primary btn-sm" : "btn-outline btn-sm"}
    onClick={() => setFilter(f)}
  >
                    {f}
                  </button>)}
              </div>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Employee / Candidate</th>
                    <th>Department</th>
                    <th>Event Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => <tr key={i}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{row.time}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span className="profile-avatar" style={{ width: 28, height: 28, fontSize: "0.7rem" }}>
                            {(row?.person || 'E').charAt(0)}
                          </span>
                          {row?.person || 'Employee'}
                        </div>
                      </td>
                      <td className="muted">{row.dept}</td>
                      <td><span className="badge badge-blue">{row.type}</span></td>
                      <td><StatusBadge status={row.status} /></td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </div>

          {
    /* Recent Activity */
  }
          <div className="dashboard-panel dashboard-activity-card">
            <div className="panel-head panel-head-spread">
              <div>
                <h3>Recent Activity</h3>
                <p>Latest HR movements</p>
              </div>
              <button type="button" className="view-all-link">View All</button>
            </div>
            <div className="activity-list">
              {ACTIVITY.map((item, i) => <div key={i} className="activity-item">
                  <span className="activity-badge" style={{ background: "linear-gradient(180deg, #f0f6ff 0%, #e7f0ff 100%)", color: "#1f6bff" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person</span>
                  </span>
                  <div className="activity-copy">
                    <strong>{item.who}</strong>
                    <p>{item.what}</p>
                  </div>
                  <time>{item.when}</time>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </>;
}
