import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

/**
 * ApprovalWorkflowRules — global sign-off policy.
 *
 * These are floors applied on top of each stage template's own
 * requiredApproval / requiredDocument flags. A template can always demand more;
 * these stop a gate being skipped because someone forgot to tick a box when
 * defining the stage.
 */

function PolicyRow({ id, title, detail, effect, checked, onChange }) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 rounded-lg border border-[#dce5f4] px-3 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-blue-600 mt-0.5"
      />
      <span className="min-w-0">
        <span className="block text-[11px] font-bold text-slate-700">{title}</span>
        <span className="block text-[10px] text-slate-500 mt-0.5">{detail}</span>
        <span
          className="inline-block text-[10px] font-semibold mt-1.5 px-1.5 py-0.5 rounded"
          style={checked
            ? { background: '#d1fae5', color: '#065f46' }
            : { background: '#f1f5f9', color: '#64748b' }}
        >
          {checked ? effect : 'Not enforced'}
        </span>
      </span>
    </label>
  );
}

export function ApprovalWorkflowRules({ draft, onChange }) {
  return (
    <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs">
      <header className="flex items-center gap-2 mb-1">
        <ShieldCheck size={14} className="text-slate-400" />
        <h3 className="text-sm font-bold text-slate-800">Approval Workflow Rules</h3>
      </header>
      <p className="text-[11px] text-slate-500 mb-4">
        Sign-off requirements enforced across every project.
      </p>

      <div className="space-y-2.5">
        <PolicyRow
          id="policy-design-approval"
          title="Design proofs require client approval"
          detail="A Design stage carrying an uploaded proof cannot be handed off until a client or PM approval is recorded against it."
          effect="Blocks handoff without approval"
          checked={draft.requireClientApprovalOnDesign}
          onChange={(v) => onChange({ requireClientApprovalOnDesign: v })}
        />
        <PolicyRow
          id="policy-qa-certificate"
          title="Quality stages require a QA certificate"
          detail="A Quality stage cannot be handed off until at least one document has been uploaded against it."
          effect="Blocks handoff without a document"
          checked={draft.requireQaCertificate}
          onChange={(v) => onChange({ requireQaCertificate: v })}
        />
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-[#dce5f4] bg-[#f6f9ff] px-3 py-2.5 mt-4">
        <Info size={12} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-600">
          These are minimums. A stage template that sets its own approval or document
          requirement still enforces it, whether or not the policy here is on.
        </p>
      </div>
    </section>
  );
}

export default ApprovalWorkflowRules;
