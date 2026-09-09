/**
 * PageHeader — Canonical CRM & ERP Page Header with safe breadcrumbs & guide modal support.
 */
import React, { useState } from 'react';
import { Info, X, HelpCircle, BookOpen, ArrowRight, ChevronRight } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { toTitleCase, safeString } from '../../utils/stringUtils';

export function PageHeader({ title, subtitle, breadcrumb, guide, actions }) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const location = useLocation();

  const pathname = safeString(location?.pathname, '/');
  const pathParts = pathname.split('/').filter(Boolean);
  const defaultBreadcrumbs = [
    { label: 'Dashboard', path: '/' },
    ...pathParts.map((part, index) => ({
      label: toTitleCase(part, part),
      path: `/${pathParts.slice(0, index + 1).join('/')}`,
      isCurrent: index === pathParts.length - 1,
    })),
  ];

  const activeBreadcrumb = breadcrumb || defaultBreadcrumbs;

  return (
    <div className="flex flex-col gap-2 pb-2">
      {/* Breadcrumb Path */}
      {activeBreadcrumb && activeBreadcrumb.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          {activeBreadcrumb.map((bc, idx) => {
            const isLast = idx === activeBreadcrumb.length - 1;
            const label = safeString(bc?.label || bc?.name, 'Section');
            const targetPath = bc?.path || bc?.to || '#';
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight size={12} className="text-slate-300" />}
                {isLast ? (
                  <span className="text-slate-600 font-semibold">{label}</span>
                ) : (
                  <Link
                    to={targetPath}
                    className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    {label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
            {guide && (
              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-bold transition-transform hover:scale-105 cursor-pointer shadow-2xs"
                title="Click for Page Guide & Terminology"
                aria-label="Page Information and Terminology Guide"
              >
                <Info size={13} />
              </button>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1 max-w-3xl">{subtitle}</p>}
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Interactive Page Terminology & Guide Modal */}
      {isGuideOpen && guide && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl text-xs max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">{guide.title} — Guide & Terms</h3>
                  <p className="text-[11px] text-slate-500">{guide.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsGuideOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 mt-4 overflow-y-auto pr-1 flex-1">
              {guide.purpose && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <HelpCircle size={12} className="text-blue-600" /> What is this page for?
                  </span>
                  <p className="text-slate-700 leading-relaxed text-xs">{guide.purpose}</p>
                </div>
              )}

              {guide.workflow && guide.workflow.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Operational Workflow
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {guide.workflow.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-semibold text-slate-700 text-[11px] shrink-0 flex items-center gap-1.5 shadow-2xs">
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                        {idx < guide.workflow.length - 1 && (
                          <ArrowRight size={13} className="text-slate-300 shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {guide.keyTerms && guide.keyTerms.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Key Definitions
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {guide.keyTerms.map((t, idx) => (
                      <div key={idx} className="bg-slate-50/60 p-3 rounded-xl border border-slate-200/80">
                        <span className="font-bold text-slate-800 text-[11px] block">{t.term}</span>
                        <p className="text-slate-600 text-[11px] mt-0.5 leading-normal">{t.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 flex justify-end">
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
    </div>
  );
}

export default PageHeader;

