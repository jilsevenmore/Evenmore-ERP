import { useState, useMemo } from "react";
import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useAppStore } from "../../../stores/appStore";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/ui/PageHeader";
import { DataTable } from "../../../components/hrms/DataTable";
import { FilterBar } from "../../../components/hrms/FilterBar";
import { Button } from "../../../components/hrms/Button";
import { StatusBadge } from "../../../components/hrms/StatusBadge";
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck,
  Eye,
  HelpCircle,
  Plus,
  Briefcase,
  Layers,
  ArrowRight
} from "lucide-react";
import UserInitials from "../../../components/common/UserInitials";

const APPLICATIONS_GUIDE = {
  title: "Job Applications Intake",
  subtitle: "Track incoming applicant records, qualification stages, and candidate progress.",
  purpose: "Monitor candidate submissions, advance candidate pipeline stages directly, and access complete applicant dossiers.",
  workflow: [
    "Application Submission",
    "Stage Triage & Review",
    "Candidate Dossier Inspection",
    "Advance to Interview or Offer",
    "Hired Directory Induction",
  ],
  keyTerms: [
    { term: "Application Source", definition: "Channel through which candidate submitted (Career Portal, Direct, Referral)." },
    { term: "Quick Progression", definition: "Update candidate pipeline stage directly from the application table." },
  ],
};

export default function Applications() {
  const applications = useRecruitmentStore((s) => s.applications) || [];
  const candidates = useRecruitmentStore((s) => s.candidates) || [];
  const changeStage = useRecruitmentStore((s) => s.changeStage);
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");

  // All candidates in the pipeline are represented as applications, combined with any standalone application records
  const allApplicationRecords = useMemo(() => {
    const list = candidates.map((cand) => {
      const matchedApp = applications.find(
        (a) => a.candidateId === cand.id || (a.email && cand.email && a.email.toLowerCase() === cand.email.toLowerCase())
      );
      return {
        id: cand.id,
        candidateId: cand.id,
        name: cand.name,
        email: cand.email || "",
        avatar: cand.avatar,
        position: cand.position || matchedApp?.jobTitle || "Staff",
        appliedDate: cand.appliedDate || matchedApp?.appliedDate || "—",
        source: cand.source || matchedApp?.source || "Career Portal",
        stage: cand.stage || "Applied",
        recruiter: cand.recruiter || matchedApp?.recruiter || "—",
      };
    });

    // Also include any standalone applications not yet converted to pipeline candidates
    applications.forEach((app) => {
      const alreadyIncluded = list.some(
        (c) => c.candidateId === app.candidateId || (c.email && app.email && c.email.toLowerCase() === app.email.toLowerCase())
      );
      if (!alreadyIncluded) {
        list.push({
          id: app.id,
          candidateId: app.candidateId || app.id,
          name: app.candidateName || app.name || "Candidate",
          email: app.email || "",
          avatar: app.avatar,
          position: app.jobTitle || app.position || "—",
          appliedDate: app.appliedDate || "—",
          source: app.source || "Portal",
          stage: app.stage || "Applied",
          recruiter: app.recruiter || "—",
        });
      }
    });

    return list;
  }, [applications, candidates]);

  const filtered = useMemo(() => {
    return allApplicationRecords.filter((c) => {
      if (
        search &&
        !`${c.name} ${c.position} ${c.source || ""}`.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (stageFilter !== "All" && c.stage !== stageFilter) {
        return false;
      }
      return true;
    });
  }, [allApplicationRecords, search, stageFilter]);

  const stages = ["Applied", "Screening", "Interview", "Shortlisted", "Offer", "Hired", "Rejected"];

  const appliedCount = allApplicationRecords.filter((c) => c.stage === "Applied").length;
  const screeningOrInterview = allApplicationRecords.filter(
    (c) => c.stage === "Screening" || c.stage === "Interview"
  ).length;
  const offeredOrHired = allApplicationRecords.filter((c) => c.stage === "Offer" || c.stage === "Hired").length;

  const cols = [
    {
      key: "name",
      header: "Candidate",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <UserInitials name={r.name} className="w-8 h-8 text-xs" />
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-100 block text-[13px]">
              {r.name}
            </span>
            <span className="text-[11px] text-muted block">{r.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "position",
      header: "Position Applied",
      sortable: true,
      render: (r) => (
        <div className="font-medium text-slate-800 dark:text-slate-200 text-[12.5px] flex items-center gap-1.5">
          <Briefcase size={13} className="text-slate-400" />
          <span>{r.position}</span>
        </div>
      ),
    },
    {
      key: "appliedDate",
      header: "Applied Date",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-1.5 text-[12px] text-slate-600 dark:text-slate-300">
          <Calendar size={13} className="text-slate-400" />
          <span>{r.appliedDate || "—"}</span>
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
          {r.source || "Website"}
        </span>
      ),
    },
    {
      key: "stage",
      header: "Pipeline Stage",
      render: (r) => (
        <select
          value={r.stage}
          onChange={(e) => {
            const nextStage = e.target.value;
            changeStage(r.id, nextStage);
            if (nextStage === "Hired") {
              showToast(`${r.name} hired and added to Employee Directory!`);
            } else {
              showToast(`Moved ${r.name} to ${nextStage}`);
            }
          }}
          className={`h-7 px-2 text-xs font-semibold rounded-lg border outline-none cursor-pointer transition ${
            r.stage === "Hired"
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
              : r.stage === "Offer"
              ? "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800"
              : r.stage === "Rejected"
              ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800"
              : r.stage === "Interview"
              ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
              : "bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
          }`}
        >
          {stages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "recruiter",
      header: "Assigned Recruiter",
      render: (r) => (
        <span className="text-[12px] text-slate-600 dark:text-slate-300">
          {r.recruiter || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => navigate(`/hrms/recruitment/candidates/${r.id}`)}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-navy dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
          >
            <Eye size={13} />
            <span>Profile</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Page Header */}
      <PageHeader
        title="Job Applications"
        subtitle="Track incoming resumes, application stages, and candidate progress."
        breadcrumb={[
          { label: "HRMS", path: "/hrms" },
          { label: "Recruitment", path: "/hrms/recruitment" },
          { label: "Applications" },
        ]}
        guide={APPLICATIONS_GUIDE}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => navigate("/hrms/recruitment/candidates", { state: { openRegister: true } })}
            className="shadow-xs whitespace-nowrap font-medium"
          >
            Add Candidate
          </Button>
        }
      />

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          {
            label: "Total Applications",
            count: candidates.length,
            sub: "Across all postings",
            icon: FileText,
            color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200/60",
          },
          {
            label: "Newly Applied",
            count: appliedCount,
            sub: "Pending initial review",
            icon: Clock,
            color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200/60",
          },
          {
            label: "Screening / Interview",
            count: screeningOrInterview,
            sub: "In active evaluation",
            icon: Layers,
            color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200/60",
          },
          {
            label: "Offered & Hired",
            count: offeredOrHired,
            sub: "Successful conversions",
            icon: CheckCircle2,
            color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60",
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

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearch={setSearch}
        selects={[
          {
            value: stageFilter,
            onChange: setStageFilter,
            options: [
              { label: "All Stages", value: "All" },
              { label: "Applied", value: "Applied" },
              { label: "Screening", value: "Screening" },
              { label: "Interview", value: "Interview" },
              { label: "Shortlisted", value: "Shortlisted" },
              { label: "Offer", value: "Offer" },
              { label: "Hired", value: "Hired" },
              { label: "Rejected", value: "Rejected" },
            ],
          },
        ]}
        onClear={() => {
          setSearch("");
          setStageFilter("All");
        }}
      />

      {/* Table */}
      <DataTable
        columns={cols}
        data={filtered}
        emptyTitle="No applications found"
        emptyDesc="Applications will appear here once candidates apply or are imported."
      />
    </div>
  );
}
