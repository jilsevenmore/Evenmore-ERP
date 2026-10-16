import { useState } from "react";
import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useAppStore } from "../../../stores/appStore";
import { Button } from "../../../components/hrms/Button";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/ui/PageHeader";
import {
  UserCheck,
  CheckCircle2,
  Clock,
  FileCheck,
  Calendar,
  Building2,
  Users,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Check
} from "lucide-react";
import UserInitials from "../../../components/common/UserInitials";

const ONBOARDING_GUIDE = {
  title: "Candidate Onboarding & Induction",
  subtitle: "Track document verification, IT provisioning, and employee directory handoff.",
  purpose: "Manage the crucial transitional phase after offer acceptance to ensure full compliance before day-one orientation.",
  workflow: [
    "Offer Accepted",
    "Collect Pre-boarding Documents",
    "Verify Identity & Compliance",
    "Provision IT & Hardware",
    "Induct into Employee Directory",
  ],
  keyTerms: [
    { term: "Document Verification", definition: "Validation of identity, educational certificates, and employment history." },
    { term: "Directory Induction", definition: "Automatic creation of the employee profile with Employee ID and hierarchy setup." },
  ],
};

export default function Onboarding() {
  const {
    candidates,
    jobs = [],
    offers,
    onboardedMap,
    verifiedDocsMap,
    completeOnboarding,
    verifyDocuments,
  } = useRecruitmentStore();
  const { showToast, addEmployee, employees } = useAppStore();
  const navigate = useNavigate();

  const hired = candidates.filter((c) => c.stage === "Hired");
  const steps = [
    "Offer Accepted",
    "Documents Pending",
    "Documents Verified",
    "Joining Scheduled",
    "Onboarding Complete",
  ];

  async function handleCompleteOnboarding(c) {
    try {
      await completeOnboarding(c.id);
      await useAppStore.getState().refreshHrms("employees");
      showToast(`Onboarding completed & ${c.name} inducted into Employee Directory!`);
    } catch (err) {
      showToast(`Could not complete onboarding: ${err?.message || err}`);
    }
  }

  const completedCount = hired.filter((c) => c.isOnboarded || onboardedMap?.[c.id]).length;
  const pendingCount = hired.length - completedCount;

  return (
    <div className="space-y-5">
      {/* Top Page Header */}
      <PageHeader
        title="Candidate Onboarding"
        subtitle="Track document verification, IT provisioning, and employee directory induction."
        breadcrumb={[
          { label: "HRMS", path: "/hrms" },
          { label: "Recruitment", path: "/hrms/recruitment" },
          { label: "Onboarding" },
        ]}
        guide={ONBOARDING_GUIDE}
        actions={
          <Button
            size="sm"
            variant="outline"
            icon={Users}
            onClick={() => navigate("/hrms/employees")}
          >
            Employee Directory
          </Button>
        }
      />

      {/* Metric Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[
          {
            label: "In Onboarding",
            count: hired.length,
            sub: "Hired candidates transition",
            icon: Users,
            color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200/60",
          },
          {
            label: "Pending Verification",
            count: Math.max(0, pendingCount),
            sub: "Awaiting documents or IT setup",
            icon: Clock,
            color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200/60",
          },
          {
            label: "Fully Inducted",
            count: completedCount,
            sub: "Active in employee directory",
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

      {/* Main Content */}
      {hired.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 grid place-items-center mx-auto mb-3">
            <UserCheck size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Candidates In Onboarding
          </h3>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
            When candidates accept their offers and are marked 'Hired' in the pipeline, their pre-boarding checklist and verification milestones will appear here.
          </p>
          <Button size="sm" onClick={() => navigate("/hrms/recruitment/candidates")}>
            View Pipeline Candidates
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {hired.map((c) => {
            const isDone = Boolean(c.isOnboarded || onboardedMap?.[c.id]);
            const isDocsDone = Boolean(c.documentsVerified || verifiedDocsMap?.[c.id] || isDone);
            const matchingOffer = offers.find((o) => o.candidateId === c.id);

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5"
              >
                {/* Candidate Summary Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <UserInitials name={c.name} className="w-12 h-12 text-sm" iconSize={20} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-[15px]">
                          {c.name}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isDone
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800"
                          }`}
                        >
                          {isDone ? "Inducted Employee" : "Pre-Boarding"}
                        </span>
                      </div>
                      <div className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-3">
                        <span>{c.position}</span>
                        <span>•</span>
                        <span>Experience: {c.experience || "—"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span>Joining: {matchingOffer?.joiningDate || "—"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={ShieldCheck}
                      onClick={() => {
                        verifyDocuments(c.id);
                        showToast(`All documents verified for ${c.name}`);
                      }}
                    >
                      <span>{isDocsDone ? "Docs Verified ✓" : "Verify Docs"}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant={isDone ? "secondary" : "primary"}
                      disabled={isDone}
                      icon={CheckCircle2}
                      onClick={() => handleCompleteOnboarding(c)}
                    >
                      <span>{isDone ? "Onboarding Complete ✓" : "Complete Onboarding"}</span>
                    </Button>

                    {isDone && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Users}
                        onClick={() => navigate("/hrms/employees")}
                      >
                        <span>View in Directory</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {steps.map((step, i) => {
                      const activeStepIndex = isDone ? 4 : isDocsDone ? 3 : 1;
                      const isStepComplete = isDone
                        ? true
                        : i === 0
                        ? true
                        : (i === 1 || i === 2) && isDocsDone;
                      const isCurrent = i === activeStepIndex && !isDone;

                      return (
                        <div
                          key={step}
                          className={`p-3 rounded-xl border transition-all ${
                            isStepComplete
                              ? "bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300"
                              : isCurrent
                              ? "bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 ring-1 ring-amber-400"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`w-5 h-5 rounded-full grid place-items-center text-[10.5px] font-bold ${
                                isStepComplete
                                  ? "bg-emerald-600 text-white"
                                  : isCurrent
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {isStepComplete ? <Check size={11} /> : i + 1}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                              Step {i + 1}
                            </span>
                          </div>
                          <div className="text-[12px] font-semibold truncate">{step}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}