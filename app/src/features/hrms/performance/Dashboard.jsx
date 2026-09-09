import { useState, useMemo } from "react";
import { useAppStore } from "../../../stores/appStore";
import { dashboardMetrics, goalsMock } from "../../../data/hrms/data/performanceMockData";
import { MetricCard } from "../../../components/hrms/MetricCard";
import { DataTable } from "../../../components/hrms/DataTable";
import { StatusBadge } from "../../../components/hrms/StatusBadge";
import { ProgressBar } from "../../../components/hrms/ProgressBar";
import { Target, Award, Users, Star, TrendingUp } from "lucide-react";
import { Button } from "../../../components/hrms/Button";
export default function Dashboard() {
  const showToast = useAppStore((s) => s.showToast);
  const [filter, setFilter] = useState("All");
  const icons = [Target, Award, Users, Star, TrendingUp];
  const filteredGoals = useMemo(() => filter === "All" ? goalsMock.slice(0, 6) : goalsMock.filter((g) => g.status === filter).slice(0, 6), [filter]);
  const cols = [
    { key: "employee", header: "Employee", sortable: true, render: (r) => <div className="flex items-center gap-2"><img src={r.avatar} alt="" className="w-7 h-7 rounded-full" />{r.employee}</div> },
    { key: "goal", header: "Goal", render: (r) => <span className="max-w-[260px] truncate block">{r.goal}</span> },
    { key: "target", header: "Target" },
    { key: "progress", header: "Progress", render: (r) => <ProgressBar value={r.progress} /> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> }
  ];
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate">Performance Management</h1>
          <p className="text-[13px] text-muted">Overview of reviews, goals and ratings.</p>
        </div>
        <Button onClick={() => showToast("New Review Cycle \u2014 Q4 2024 created")}>New Review Cycle</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {dashboardMetrics.map((m, i) => <MetricCard key={m.label} label={m.label} value={m.value} sub={m.sub} icon={icons[i] ?? Target} />)}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap justify-between gap-3 items-center">
          <h2 className="font-semibold text-slate">Goals & KPIs</h2>
          <div className="flex gap-2">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]">
              <option>All</option><option>In Progress</option><option>Completed</option><option>At Risk</option><option>Not Started</option>
            </select>
            <Button variant="secondary" onClick={() => showToast("Add Goal \u2014 open Goal Tracking")}>Add Goal</Button>
          </div>
        </div>
        <DataTable columns={cols} data={filteredGoals} emptyTitle="No goals found" emptyDesc="Adjust filters or add a new goal." />
      </div>
    </div>;
}
