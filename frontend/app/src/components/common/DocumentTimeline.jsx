import React from 'react';
import { CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react';
export const DocumentTimeline = ({ steps, className = '', }) => {
    return (<div className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm ${className}`}>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
        Document Lifecycle Timeline
      </h4>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative">
        {steps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';
            const isLast = idx === steps.length - 1;
            return (<React.Fragment key={idx}>
              <div className="flex items-start sm:flex-col sm:items-center gap-3 sm:gap-1.5 flex-1 min-w-[120px]">
                <div className="relative flex items-center justify-center">
                  {isCompleted ? (<div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4"/>
                    </div>) : isCurrent ? (<div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-600 text-blue-600 flex items-center justify-center animate-pulse">
                      <Clock className="w-4 h-4"/>
                    </div>) : (<div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-400 flex items-center justify-center">
                      <Circle className="w-3.5 h-3.5"/>
                    </div>)}
                </div>

                <div className="text-left sm:text-center">
                  <p className={`text-xs font-semibold ${isCompleted
                    ? 'text-emerald-800'
                    : isCurrent
                        ? 'text-blue-700'
                        : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  {step.docNumber && (<p className="text-[11px] font-mono text-slate-600 font-medium">
                      {step.docNumber}
                    </p>)}
                  {step.amount !== undefined && (<p className="text-[11px] font-mono font-semibold text-slate-700">
                      ${step.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>)}
                  {step.date && (<p className="text-[10px] text-slate-400">{step.date}</p>)}
                </div>
              </div>

              {!isLast && (<div className="hidden sm:flex items-center text-slate-300 px-1 -mt-5">
                  <ArrowRight className="w-4 h-4"/>
                </div>)}
            </React.Fragment>);
        })}
      </div>
    </div>);
};
