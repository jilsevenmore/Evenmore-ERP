import React, { useState } from 'react';
import { Info, X, HelpCircle, BookOpen, ArrowRight } from 'lucide-react';
import { hrmsGuides } from '../../data/hrms/hrmsGuides';

const TITLE_MAP = {
  'Dashboard Overview': 'dashboard',
  'HRMS Dashboard': 'dashboard',
  'Employee Directory': 'employees',
  'Attendance Management': 'attendanceOverview',
  'Mark Attendance': 'attendanceMark',
  'Individual Attendance': 'attendanceIndividual',
  'Bulk Attendance': 'attendanceBulk',
  'Attendance Requests': 'attendanceRequests',
  'Attendance Flexibility Rules': 'attendanceFlexibility',
  'Leave Management': 'leave',
  'Payroll Management': 'payroll',
  'Recruitment Operations': 'recruitmentDashboard',
  'Recruitment & Talent Hub': 'recruitmentDashboard',
  'Recruitment': 'recruitmentDashboard',
  'Job Requisitions': 'jobs',
  'Job Requisitions & Openings': 'jobs',
  'Job Openings': 'jobs',
  'Jobs': 'jobs',
  'Job Details': 'jobDetails',
  'Job Requisition Details': 'jobDetails',
  'Candidate Directory & Pipeline': 'candidates',
  'Candidates': 'candidates',
  'Candidate Profile': 'candidateDetails',
  'Candidate Profile & Dossier': 'candidateDetails',
  'Interview Schedules': 'interviews',
  'Interviews': 'interviews',
  'Interview Details': 'interviewDetails',
  'Interview Assessment Details': 'interviewDetails',
  'Job Applications': 'applications',
  'Applications': 'applications',
  'Offer Letters & Rollouts': 'offers',
  'Offer Letters & Approvals': 'offers',
  'Offers': 'offers',
  'Candidate Onboarding': 'onboarding',
  'Onboarding': 'onboarding',
  'Career Portal': 'career',
  'Careers': 'career',
  'Custom Screening Questions': 'customQuestions',
  'Custom Questions': 'customQuestions',
  'Recruitment Pipeline Funnel': 'recruitmentFunnel',
  'Recruitment Funnel & Conversion': 'recruitmentFunnel',
  'Recruitment Funnel': 'recruitmentFunnel',
  'Performance Management': 'performanceDashboard',
  'Performance': 'performanceDashboard',
  'Performance Indicators': 'indicators',
  'Indicators': 'indicators',
  'Key Performance Indicators (KPI Data)': 'kpiData',
  'KPI Data': 'kpiData',
  'Performance Appraisal': 'appraisal',
  'Appraisal': 'appraisal',
  'Appraisal Funnel': 'appraisalFunnel',
  'Goal Tracking': 'goalTracking',
  'Goals': 'goalTracking',
  'Goal Funnel': 'goalFunnel',
  'Training Management': 'trainingDashboard',
  'Training Setup': 'trainingDashboard',
  'Training': 'trainingDashboard',
  'Training Programs': 'trainingList',
  'Training Funnel': 'trainingFunnel',
  'Trainer Directory': 'trainers',
  'Trainers': 'trainers',
  'Org Chart': 'orgChart',
  'Organization Chart': 'orgChart',
  'Organization': 'orgChart',
  'Departments': 'departments',
  'Designations': 'designations',
  'Locations': 'locations',
  'Asset Setup & Inventory': 'assets',
  'Asset Setup': 'assets',
  'Assets': 'assets',
  'Document Management': 'documents',
  'Documents': 'documents',
  'Company Policy': 'companyPolicy',
  'Company Policies': 'companyPolicy',
  'Personal & Team Calendar': 'calendar',
  'Calendar': 'calendar',
  'HR Admin Setup & Governance': 'hrAdmin',
  'HR Admin': 'hrAdmin',
};

export function PageInfoButton({ guide, title }) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Allow passing a string key (e.g. guide="payroll") or a custom guide object or infer from title
  const resolvedKey =
    typeof guide === 'string'
      ? guide
      : (title && TITLE_MAP[title]) || (title && TITLE_MAP[title.trim()]) || null;

  const activeGuide =
    typeof guide === 'object' && guide !== null
      ? guide
      : resolvedKey && hrmsGuides[resolvedKey]
      ? hrmsGuides[resolvedKey]
      : (title && hrmsGuides[title]) || null;

  if (!activeGuide) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsGuideOpen(true)}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-bold transition-transform hover:scale-105 cursor-pointer shadow-2xs shrink-0"
        title="Click for Page Guide & Terminology"
        aria-label="Page Information and Terminology Guide"
      >
        <Info size={13} />
      </button>

      {isGuideOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setIsGuideOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-4 sm:p-6 shadow-2xl text-xs max-h-[85vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {activeGuide.title} — Guide &amp; Terms
                  </h3>
                  {activeGuide.subtitle && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{activeGuide.subtitle}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 mt-4 overflow-y-auto pr-1 flex-1">
              {activeGuide.purpose && (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider flex items-center gap-1">
                    <HelpCircle size={12} className="text-blue-600" /> What is this page for?
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">{activeGuide.purpose}</p>
                </div>
              )}

              {activeGuide.workflow && activeGuide.workflow.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">
                    Operational Workflow
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {activeGuide.workflow.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg font-semibold text-slate-800 dark:text-slate-100 text-[11px] shrink-0 flex items-center gap-1.5 shadow-2xs">
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                        {idx < activeGuide.workflow.length - 1 && (
                          <ArrowRight size={13} className="text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {activeGuide.keyTerms && activeGuide.keyTerms.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">
                    Key Definitions
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {activeGuide.keyTerms.map((t, idx) => (
                      <div key={idx} className="bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                        <span className="font-bold text-slate-900 dark:text-white text-[11px] block">{t.term}</span>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-normal">{t.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeGuide.tips && activeGuide.tips.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">
                    Pro Tips &amp; Best Practices
                  </span>
                  <ul className="space-y-1.5">
                    {activeGuide.tips.map((tip, idx) => (
                      <li key={idx} className="text-[11.5px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PageInfoButton;
