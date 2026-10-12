import { ShieldCheck, FileCheck, CheckCircle2, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';

export function ApprovalPoliciesTab({ draft, onChange }) {
  const requireDesignApproval = Boolean(draft.requireClientApprovalOnDesign ?? true);
  const requireQaCert = Boolean(draft.requireQaCertificate ?? true);

  const toggleDesignApproval = () => {
    onChange({ requireClientApprovalOnDesign: !requireDesignApproval });
  };

  const toggleQaCert = () => {
    onChange({ requireQaCertificate: !requireQaCert });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-100 bg-[#f6f9ff]">
        <ShieldCheck size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-800">
            Enforced Quality &amp; Approval Gateways
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Approval policies enforce strict workflow gates between stages. Active gates prevent project
            managers and assignees from advancing stages or closing projects until all verified sign-offs are submitted.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Gate 1: Design Stage Client Approval */}
        <section
          className={`rounded-xl border transition-all p-5 shadow-2xs flex flex-col justify-between ${
            requireDesignApproval
              ? 'border-blue-200 bg-white ring-1 ring-blue-100'
              : 'border-slate-200 bg-slate-50/50'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    requireDesignApproval
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  <FileCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Client Approval on Design</h3>
                  <span className="text-[11px] font-semibold text-blue-600">Design Gate Rule</span>
                </div>
              </div>

              {/* Toggle switch */}
              <ToggleSwitch
                checked={requireDesignApproval}
                onChange={toggleDesignApproval}
                ariaLabel="Client Approval on Design"
                activeColor="#1f6bff"
              />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Requires an explicit client proof approval or customer sign-off document before the PM can
              complete the <strong>Design Stage</strong> and hand off to Production/Execution.
            </p>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 size={13} className="text-blue-500 mt-0.5 shrink-0" />
                <span>Prevents unauthorized production starts without client consent.</span>
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 size={13} className="text-blue-500 mt-0.5 shrink-0" />
                <span>Enables Client Proof Approval portal links.</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Status:</span>
            <span
              className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full ${
                requireDesignApproval
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {requireDesignApproval ? <Lock size={11} /> : <AlertCircle size={11} />}
              {requireDesignApproval ? 'Enforced' : 'Optional / Bypassed'}
            </span>
          </div>
        </section>

        {/* Gate 2: QA Certificate Gate */}
        <section
          className={`rounded-xl border transition-all p-5 shadow-2xs flex flex-col justify-between ${
            requireQaCert
              ? 'border-emerald-200 bg-white ring-1 ring-emerald-100'
              : 'border-slate-200 bg-slate-50/50'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    requireQaCert
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Quality Assurance Certificate</h3>
                  <span className="text-[11px] font-semibold text-emerald-600">Completion Gate Rule</span>
                </div>
              </div>

              {/* Toggle switch */}
              <ToggleSwitch
                checked={requireQaCert}
                onChange={toggleQaCert}
                ariaLabel="Quality Assurance Certificate"
                activeColor="#059669"
              />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Enforces a mandatory QA inspection certificate or checklist approval before a project can be
              officially signed off as <strong>Completed</strong>.
            </p>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>Blocks premature project completion sign-offs.</span>
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>Records immutable QA audit timestamp in the activity ledger.</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Status:</span>
            <span
              className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full ${
                requireQaCert
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {requireQaCert ? <Lock size={11} /> : <AlertCircle size={11} />}
              {requireQaCert ? 'Enforced' : 'Optional / Bypassed'}
            </span>
          </div>
        </section>
      </div>

      {/* Guidelines Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-amber-500" />
          Recommended Operational Practice
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          Both gates are recommended for production environments. When testing new stage sequences or during onboarding,
          gates can be temporarily set to optional so managers can move test projects rapidly across stages.
        </p>
      </div>
    </div>
  );
}

export default ApprovalPoliciesTab;
