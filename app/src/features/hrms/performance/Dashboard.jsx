import { useState, useMemo } from "react";
import { useAppStore } from "../../../stores/appStore";
// import { dashboardMetrics, goalsMock } from "../../../data/hrms/data/performanceMockData";
import { dashboardMetrics } from "../../../data/hrms/data/performanceMockData";
import { MetricCard } from "../../../components/hrms/MetricCard";
import { DataTable } from "../../../components/hrms/DataTable";
import { StatusBadge } from "../../../components/hrms/StatusBadge";
import { ProgressBar } from "../../../components/hrms/ProgressBar";
import { Target, Award, Users, Star, TrendingUp } from "lucide-react";
import { Button } from "../../../components/hrms/Button";
export default function Dashboard() {
  const showToast = useAppStore((s) => s.showToast);
  // const [filter, setFilter] = useState("All");
  const icons = [Target, Award, Users, Star, TrendingUp];
  // const filteredGoals = useMemo(() => filter === "All" ? goalsMock.slice(0, 6) : goalsMock.filter((g) => g.status === filter).slice(0, 6), [filter]);
  // const cols = [
  //   {
  //     key: "employee",
  //     header: "EMPLOYEE —",
  //     sortable: true,
  //     render: (r) => (
  //       <div className="flex items-center gap-2.5">
  //         <img src={r.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
  //         <span className="font-medium text-slate-800 text-[13px]">{r.employee}</span>
  //       </div>
  //     ),
  //   },
  //   {
  //     key: "goal",
  //     header: "GOAL",
  //     render: (r) => <span className="text-slate-700 text-[13px] font-normal">{r.goal}</span>,
  //   },
  //   {
  //     key: "target",
  //     header: "TARGET",
  //     render: (r) => <span className="text-slate-700 text-[13px] font-medium">{r.target}</span>,
  //   },
  //   {
  //     key: "progress",
  //     header: "PROGRESS",
  //     render: (r) => (
  //       <div className="flex items-center gap-3 min-w-[130px]">
  //         <div className="w-24 h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
  //           <div
  //             className={`h-full ${r.progress === 100 ? "bg-[#10b981]" : "bg-[#16233a]"} rounded-full`}
  //             style={{ width: `${r.progress}%` }}
  //           />
  //         </div>
  //         <span className="text-[12px] font-medium text-slate-500">{r.progress}%</span>
  //       </div>
  //     ),
  //   },
  //   {
  //     key: "status",
  //     header: "STATUS",
  //     render: (r) => {
  //       if (r.status === "Completed") {
  //         return (
  //           <span className="px-3 py-0.5 rounded-full text-[12px] font-medium bg-[#e6f4ea] text-[#15803d] border border-[#a7f3d0]">
  //             Completed
  //           </span>
  //         );
  //       }
  //       if (r.status === "At Risk") {
  //         return (
  //           <span className="px-3 py-0.5 rounded-full text-[12px] font-medium bg-[#fee2e2] text-[#dc2626] border border-[#fca5a5]">
  //             At Risk
  //           </span>
  //         );
  //       }
  //       return (
  //         <span className="px-3 py-0.5 rounded-full text-[12px] font-medium bg-[#fffbeb] text-[#b45309] border border-[#fef08a]">
  //           In Progress
  //         </span>
  //       );
  //     },
  //   },
  // ];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-800">Performance Management</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Overview of reviews and ratings.</p>
          {/* <p className="text-[13px] text-slate-500 mt-0.5">Overview of reviews, goals and ratings.</p> */}
        </div>
        <button
          onClick={() => showToast("New Review Cycle — Q4 2024 created")}
          className="bg-[#16233a] text-white px-4 py-2 rounded-xl text-[13px] font-medium hover:bg-[#0f172a] transition shadow-2xs"
        >
          New Review Cycle
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {dashboardMetrics.map((m, i) => (
          <MetricCard key={m.label} label={m.label} value={m.value} sub={m.sub} icon={icons[i] ?? Target} />
        ))}
      </div>

      {/* Hidden: Goal Tracking / Goals & KPIs feature disconnected and commented out */}
      {/*
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap justify-between gap-3 items-center">
          <h2 className="font-bold text-[16px] text-slate-800">Goals & KPIs</h2>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-9 pl-3 pr-8 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[right_10px_center] bg-no-repeat cursor-pointer focus:outline-none focus:border-[#1e3a8a]"
            >
              <option>All</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>At Risk</option>
              <option>Not Started</option>
            </select>
            <button
              onClick={() => showToast("Add Goal — open Goal Tracking")}
              className="h-9 px-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              Add Goal
            </button>
          </div>
        </div>
        <DataTable columns={cols} data={filteredGoals} emptyTitle="No goals found" emptyDesc="Adjust filters or add a new goal." />
      </div>
      */}
    </div>
  );
}
