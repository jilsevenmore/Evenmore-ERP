import { useState, useMemo, useEffect } from "react";
import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useAppStore } from "../../../stores/appStore";
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../../../components/ui/PageHeader";
import { DataTable } from "../../../components/hrms/DataTable";
import { FilterBar } from "../../../components/hrms/FilterBar";
import { Modal } from "../../../components/hrms/Modal";
import { Button } from "../../../components/hrms/Button";
import { StatusBadge } from "../../../components/hrms/StatusBadge";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Plus,
  List,
  CalendarDays,
  ExternalLink,
  Eye,
  HelpCircle,
  Users,
  AlertCircle
} from "lucide-react";

export default function Interviews() {
  const { interviews, addInterview, candidates, jobs } = useRecruitmentStore();
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [view, setView] = useState("List");
  const [typeFilter, setTypeFilter] = useState("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (location.state?.openSchedule) {
      setDrawerOpen(true);
    }
  }, [location.state]);

  const [form, setForm] = useState({
    candidateId: "CAND-001",
    job: "Senior Backend Developer",
    type: "Technical Interview",
    interviewer: "Rahul Mehta",
    date: "10 Sep 2026",
    start: "10:30 AM",
    end: "11:30 AM",
    mode: "Video Call",
    meetingLink: "https://meet.google.com/abc",
    notes: "",
  });

  const filtered = useMemo(() => {
    return interviews.filter((i) => {
      if (
        search &&
        !`${i.candidateName} ${i.job} ${i.interviewer}`.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (typeFilter !== "All" && i.type !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [interviews, search, typeFilter]);

  const scheduledCount = interviews.filter((i) => i.status === "Scheduled").length;
  const completedCount = interviews.filter((i) => i.status === "Completed").length;
  const cancelledCount = interviews.filter((i) => i.status === "Cancelled").length;

  function schedule() {
    if (!form.candidateId) {
      showToast("Candidate required");
      return;
    }
    const cand = candidates.find((c) => c.id === form.candidateId);
    addInterview({
      id: `INT-${Date.now()}`,
      candidateId: form.candidateId,
      candidateName: cand?.name || "Candidate",
      avatar: cand?.avatar || "https://i.pravatar.cc/100?img=15",
      job: form.job,
      type: form.type,
      date: form.date,
      start: form.start,
      end: form.end,
      duration: "60m",
      interviewer: form.interviewer,
      mode: form.mode,
      location: form.mode === "Video Call" ? form.meetingLink : "Office",
      status: "Scheduled",
      meetingLink: form.meetingLink,
    });
    showToast("Interview scheduled successfully.");
    setDrawerOpen(false);
  }

  const cols = [
    {
      key: "candidateName",
      header: "Candidate",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <img
            src={r.avatar}
            alt={r.candidateName}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
          />
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-100 block text-[13px]">
              {r.candidateName}
            </span>
            <span className="text-[11px] text-muted block truncate max-w-[180px]">{r.job}</span>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Interview Type",
      render: (r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
          {r.type}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date & Time",
      sortable: true,
      render: (r) => (
        <div>
          <div className="flex items-center gap-1.5 font-medium text-[12.5px] text-slate-800 dark:text-slate-200">
            <Calendar size={13} className="text-slate-400" />
            <span>{r.date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted mt-0.5">
            <Clock size={12} className="text-slate-400" />
            <span>
              {r.start} - {r.end} ({r.duration || "60m"})
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "interviewer",
      header: "Interviewer",
      render: (r) => (
        <div className="flex items-center gap-1.5 text-[12.5px] text-slate-700 dark:text-slate-300 font-medium">
          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 grid place-items-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
            {r.interviewer.charAt(0)}
          </div>
          <span>{r.interviewer}</span>
        </div>
      ),
    },
    {
      key: "mode",
      header: "Mode",
      render: (r) => {
        const isVideo = r.mode?.toLowerCase().includes("video") || r.mode?.toLowerCase().includes("meet");
        const isPhone = r.mode?.toLowerCase().includes("phone");
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
              isVideo
                ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                : isPhone
                ? "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
                : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
            }`}
          >
            {isVideo ? <Video size={11} /> : isPhone ? <Phone size={11} /> : <MapPin size={11} />}
            <span>{r.mode}</span>
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const statusMap = {
          Scheduled: "Pending",
          Completed: "Active",
          Cancelled: "Cancelled",
        };
        return <StatusBadge status={statusMap[r.status] || r.status} label={r.status} />;
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/hrms/recruitment/interviews/${r.id}`)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-medium text-slate-700 dark:text-slate-200 hover:text-navy dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            <Eye size={12} />
            <span>View</span>
          </button>
          {r.meetingLink && (
            <button
              onClick={() => window.open(r.meetingLink || "#", "_blank")}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg transition"
            >
              <ExternalLink size={12} />
              <span>Join</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <PageHeader
        title="Interview Schedules"
        subtitle="Manage panel discussions, technical assessments, and interview statuses."
        breadcrumb={[
          { label: "HRMS", path: "/hrms" },
          { label: "Recruitment", path: "/hrms/recruitment" },
          { label: "Interviews" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[12px] font-medium transition cursor-pointer"
            >
              <HelpCircle size={14} />
              <span>Guide</span>
            </button>
            <Button
              size="sm"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={15} />
              <span>Schedule Interview</span>
            </Button>
          </div>
        }
      />

      {/* Metric Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          {
            label: "Upcoming Interviews",
            count: scheduledCount,
            sub: "Scheduled sessions",
            icon: Clock,
            color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200/60",
          },
          {
            label: "Total Sessions",
            count: interviews.length,
            sub: "All pipeline rounds",
            icon: Calendar,
            color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200/60",
          },
          {
            label: "Completed",
            count: completedCount,
            sub: "Evaluated & scored",
            icon: CheckCircle2,
            color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60",
          },
          {
            label: "Cancelled / Missed",
            count: cancelledCount,
            sub: "Rescheduled or closed",
            icon: XCircle,
            color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-200/60",
          },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between"
            >
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {m.label}
                </div>
                <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                  {m.count}
                </div>
                <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {m.sub}
                </div>
              </div>
              <div className={`p-2.5 rounded-xl border ${m.color}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Bar: View Switcher + Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl w-fit">
          <button
            onClick={() => setView("List")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition cursor-pointer ${
              view === "List"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <List size={14} />
            <span>List View</span>
          </button>
          <button
            onClick={() => setView("Calendar")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition cursor-pointer ${
              view === "Calendar"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <CalendarDays size={14} />
            <span>Calendar View</span>
          </button>
        </div>

        <div className="flex-1 sm:max-w-md">
          <FilterBar
            search={search}
            onSearch={setSearch}
            selects={[
              {
                value: typeFilter,
                onChange: setTypeFilter,
                options: [
                  { label: "All Types", value: "All" },
                  { label: "Technical Interview", value: "Technical Interview" },
                  { label: "HR Interview", value: "HR Interview" },
                  { label: "Manager Interview", value: "Manager Interview" },
                  { label: "Final Interview", value: "Final Interview" },
                ],
              },
            ]}
            onClear={() => {
              setSearch("");
              setTypeFilter("All");
            }}
          />
        </div>
      </div>

      {/* Content Area */}
      {view === "List" ? (
        <DataTable
          columns={cols}
          data={filtered}
          emptyTitle="No interviews found"
          emptyDesc="Schedule an interview to start evaluation rounds."
          emptyAction={
            <Button size="sm" onClick={() => setDrawerOpen(true)}>
              + Schedule Interview
            </Button>
          }
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar size={16} className="text-indigo-600" />
              <span>September 2026 Schedule</span>
            </h3>
            <span className="text-[11.5px] text-muted">Click any scheduled card to open details</span>
          </div>
          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-center text-[11px]">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="bg-slate-50 dark:bg-slate-800/90 py-2.5 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: 28 }).map((_, i) => {
              const dayStr = String(i + 1).padStart(2, "0");
              const matchingInterviews = interviews.filter((iv) => iv.date.includes(dayStr));
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 min-h-[90px] p-1.5 text-left flex flex-col justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition"
                >
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {i + 1}
                  </span>
                  <div className="space-y-1 mt-1">
                    {matchingInterviews.map((day) => (
                      <div
                        key={day.id}
                        onClick={() => navigate(`/hrms/recruitment/interviews/${day.id}`)}
                        className="px-1.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80 rounded text-[10.5px] truncate cursor-pointer transition text-indigo-900 dark:text-indigo-200 font-medium"
                      >
                        <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                          {day.start}
                        </span>{" "}
                        {day.candidateName}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Schedule Interview"
        subtitle="Set panel members, meeting links, and candidate slots"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={schedule}>Schedule Interview</Button>
          </>
        }
      >
        <div className="grid sm:grid-cols-2 gap-3.5 text-[13px]">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300">
              Candidate *
            </span>
            <select
              value={form.candidateId}
              onChange={(e) => {
                const found = candidates.find((c) => c.id === e.target.value);
                setForm({
                  ...form,
                  candidateId: e.target.value,
                  job: found?.position || form.job,
                });
              }}
              className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-[13px]"
            >
              <option value="">Select Candidate</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.position}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300">
              Job Position *
            </span>
            <select
              value={form.job}
              onChange={(e) => setForm({ ...form, job: e.target.value })}
              className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-[13px]"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.title}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300">
              Interview Type *
            </span>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-[13px]"
            >
              <option>Technical Interview</option>
              <option>HR Interview</option>
              <option>Manager Interview</option>
              <option>Final Interview</option>
              <option>Coding Assessment</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300">
              Interviewer Name *
            </span>
            <input
              value={form.interviewer}
              onChange={(e) => setForm({ ...form, interviewer: e.target.value })}
              className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-[13px]"
              placeholder="e.g. Rahul Mehta"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300">
              Date *
            </span>
            <input
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-[13px]"
              placeholder="e.g. 10 Sep 2026"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300">
              Start Time *
            </span>
            <input
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
              className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-[13px]"
              placeholder="10:30 AM"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300">
              End Time *
            </span>
            <input
              value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
              className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-[13px]"
              placeholder="11:30 AM"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300">
              Interview Mode *
            </span>
            <select
              value={form.mode}
              onChange={(e) => setForm({ ...form, mode: e.target.value })}
              className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-[13px]"
            >
              <option>Video Call</option>
              <option>In Person</option>
              <option>Phone</option>
            </select>
          </label>

          <label className="sm:col-span-2 flex flex-col gap-1">
            <span className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300">
              Meeting Link or Office Room
            </span>
            <input
              value={form.meetingLink}
              onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
              className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-[13px]"
              placeholder="https://meet.google.com/... or Conference Room B"
            />
          </label>

          <label className="sm:col-span-2 flex flex-col gap-1">
            <span className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300">
              Preparation Notes / Questions
            </span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-[13px] resize-none"
              placeholder="Areas to evaluate: system design, concurrency, culture fit..."
            />
          </label>
        </div>
      </Modal>

      {/* Guide Modal */}
      {guideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setGuideOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 text-[13px] text-slate-600 dark:text-slate-300 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                  <HelpCircle size={18} />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                  Interviews Guide
                </h3>
              </div>
              <button
                onClick={() => setGuideOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                <div className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                  1. Multi-Stage Scheduling
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  Assign technical, HR, and managerial rounds. Add meeting links to enable direct one-click access for interviewers and candidates.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                <div className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                  2. Calendar & List Modes
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  Switch between standard table and a monthly calendar grid to avoid double booking panel interviewers.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                <div className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                  3. Feedback & Scoring
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  Click 'View' on any session to score the candidate and log evaluation feedback.
                </p>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={() => setGuideOpen(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
