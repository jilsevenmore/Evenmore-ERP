import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../../stores/appStore";
import {
  GraduationCap,
  Users,
  CalendarCheck,
  Award,
  BookOpen,
  TrendingUp,
  Clock,
  BarChart3,
  ArrowRight,
  Eye,
} from "lucide-react";

const STATS = [
  { label: "Active Programs", value: "12", icon: BookOpen, color: "bg-[#eff6ff]", iconColor: "text-[#2563eb]" },
  { label: "Enrolled", value: "186", icon: Users, color: "bg-[#f0fdf4]", iconColor: "text-[#15803d]" },
  { label: "Upcoming", value: "8", icon: Clock, color: "bg-[#fffbeb]", iconColor: "text-[#b45309]" },
  { label: "Completion", value: "74%", icon: TrendingUp, color: "bg-[#faf5ff]", iconColor: "text-[#7c3aed]" },
  { label: "Certificates", value: "94", icon: Award, color: "bg-[#fef2f2]", iconColor: "text-[#dc2626]" },
];

const RECENT_PROGRAMS = [
  { name: "Leadership Essentials", trainer: "Sarah Mitchell", date: "Oct 18 • 2 days", status: "Upcoming", participants: 24 },
  { name: "Secure Coding 101", trainer: "David Park", date: "Oct 08 • 4h", status: "Completed", participants: 18 },
  { name: "Advanced React Patterns", trainer: "Alex Chen", date: "Oct 22 • 3 days", status: "Upcoming", participants: 32 },
  { name: "Effective Communication", trainer: "Lisa Wong", date: "Oct 05 • 1 day", status: "Completed", participants: 42 },
  { name: "Data Analytics Bootcamp", trainer: "James Miller", date: "Oct 25 • 5 days", status: "Planned", participants: 20 },
  { name: "Agile Methodology", trainer: "Priya Patel", date: "Oct 12 • 2 days", status: "In Progress", participants: 28 },
];

const UPCOMING_SESSIONS = [
  { program: "Leadership Essentials", session: "Module 1: Self Awareness", date: "Oct 18, 9:00 AM", trainer: "Sarah Mitchell" },
  { program: "Advanced React Patterns", session: "Server Components Deep Dive", date: "Oct 22, 10:00 AM", trainer: "Alex Chen" },
  { program: "Data Analytics Bootcamp", session: "Kickoff & Orientation", date: "Oct 25, 9:30 AM", trainer: "James Miller" },
];

const statusBadge = (status) => {
  const map = {
    "Completed": "bg-[#e6f4ea] text-[#15803d] border-[#a7f3d0]",
    "In Progress": "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]",
    "Upcoming": "bg-[#fffbeb] text-[#b45309] border-[#fde68a]",
    "Planned": "bg-[#f8fafc] text-[#475569] border-[#e2e8f0]",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${map[status] || map["Planned"]}`}>
      {status}
    </span>
  );
};

export default function TrainingDashboard() {
  const navigate = useNavigate();
  const showToast = useAppStore((s) => s.showToast);

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12px] font-medium text-slate-400 flex items-center gap-1">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-slate-600">Training</span>
          </div>
          <div className="mt-1">
            <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">Training Setup</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Programs, sessions, assessments & certificates
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => showToast("Create program")}
          className="bg-[#1b2b4a] hover:bg-[#111f36] text-white rounded-xl px-5 py-2.5 font-bold text-[13.5px] transition shadow-2xs cursor-pointer"
        >
          Create Program
        </button>
      </div>

      {/* 5 Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-2xs flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center flex-shrink-0`}>
              <s.icon size={18} className={s.iconColor} />
            </div>
            <div>
              <div className="text-[12px] font-medium text-slate-500">{s.label}</div>
              <div className="text-[20px] font-bold text-slate-900 mt-0.5">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <button
          type="button"
          onClick={() => navigate("/hrms/training/list")}
          className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-2xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#eff6ff] flex items-center justify-center">
              <BookOpen size={18} className="text-[#2563eb]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-slate-800">Training Programs</div>
              <div className="text-[12px] text-slate-500">12 active programs</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/hrms/training/training-funnel")}
          className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-2xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#faf5ff] flex items-center justify-center">
              <BarChart3 size={18} className="text-[#7c3aed]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-slate-800">Training Funnel</div>
              <div className="text-[12px] text-slate-500">39% completion rate</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/hrms/training/trainers")}
          className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-2xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] flex items-center justify-center">
              <GraduationCap size={18} className="text-[#15803d]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-slate-800">Trainer Directory</div>
              <div className="text-[12px] text-slate-500">8 active trainers</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400" />
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Recent Programs Table */}
        <div className="lg:col-span-8 bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-slate-800">Recent Programs</h3>
            <button
              type="button"
              onClick={() => navigate("/hrms/training/list")}
              className="text-[12px] font-semibold text-[#1e3a8a] hover:underline cursor-pointer"
            >
              View All →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-2.5">Program</th>
                  <th className="pb-2.5">Trainer</th>
                  <th className="pb-2.5">Date</th>
                  <th className="pb-2.5">Participants</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {RECENT_PROGRAMS.map((p) => (
                  <tr key={p.name} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 font-semibold text-slate-800">{p.name}</td>
                    <td className="py-3 text-slate-600">{p.trainer}</td>
                    <td className="py-3 text-slate-500">{p.date}</td>
                    <td className="py-3 text-slate-700 font-medium">{p.participants}</td>
                    <td className="py-3 text-right">{statusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Upcoming Sessions */}
        <div className="lg:col-span-4 bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-2xs">
          <h3 className="text-[15px] font-bold text-slate-800 mb-4">Upcoming Sessions</h3>

          <div className="flex flex-col gap-3">
            {UPCOMING_SESSIONS.map((s) => (
              <div key={s.session} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5">
                <div className="text-[13px] font-semibold text-slate-800">{s.session}</div>
                <div className="text-[12px] text-slate-500 mt-1">{s.program}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-400 font-medium">{s.date}</span>
                  <span className="text-[11px] text-slate-500 font-medium">{s.trainer}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-4 bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#b45309]">
              <CalendarCheck size={14} />
              <span>3 sessions this week • 8 upcoming total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
