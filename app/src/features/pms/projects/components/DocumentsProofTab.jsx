import React from 'react';
import { FileText, Download, Eye, Layers } from 'lucide-react';
import { EmptyStatePms } from '../../components/EmptyStatePms';

/**
 * DocumentsProofTab — the design proof version stack.
 *
 * Shows every revision of every stage document newest-first, with the reason a
 * revision was raised. The interactive PDF preview pane itself is the Stage 9
 * proofing centre; this tab is the version history that feeds it.
 */

const APPROVAL_TONES = {
  Approved: { bg: '#d1fae5', fg: '#065f46' },
  Pending: { bg: '#fef3c7', fg: '#92400e' },
  'Need Improvement': { bg: '#ffedd5', fg: '#9a3412' },
};

function stamp(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function DocumentsProofTab({ project }) {
  const stages = [...(project.stages ?? [])].sort((a, b) => a.sequence - b.sequence);
  const withDocs = stages.filter((s) => (s.documents ?? []).length > 0);

  if (withDocs.length === 0) {
    return (
      <div className="rounded-xl border border-[#dce5f4] bg-white shadow-2xs">
        <EmptyStatePms variant="documents" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {withDocs.map((stage) => {
        const versions = [...(stage.documents ?? [])].sort((a, b) => b.version - a.version);
        const latest = versions[0];

        return (
          <section key={stage.id} className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs">
            <header className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <Layers size={14} className="text-slate-400 shrink-0" />
                <h3 className="text-sm font-bold text-slate-800 truncate">{stage.name}</h3>
              </div>
              <span className="text-[11px] text-slate-500">
                {versions.length} {versions.length === 1 ? 'version' : 'versions'} · latest v{latest.version}.0
              </span>
            </header>

            <ol className="space-y-2.5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {versions.map((doc) => {
                const tone = APPROVAL_TONES[doc.approvalStatus] ?? APPROVAL_TONES.Pending;
                const isLatest = doc.version === latest.version;

                return (
                  <li
                    key={doc.id}
                    className="rounded-lg border p-3"
                    style={{ borderColor: isLatest ? '#bfdbfe' : '#e8eef8', background: isLatest ? '#f6f9ff' : '#fff' }}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <FileText size={14} className="text-slate-400" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-800 truncate">{doc.fileName}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              v{doc.version}.0
                            </span>
                            {isLatest && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                Latest
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {doc.uploadedBy?.name ?? 'Unknown'} · {stamp(doc.uploadedAt)} · {doc.fileSize}
                          </p>
                          {doc.comments && (
                            <p className="text-[11px] text-slate-600 mt-1">{doc.comments}</p>
                          )}
                          {doc.revisionReason && (
                            <p className="text-[11px] text-orange-700 bg-orange-50 border border-orange-100 rounded px-2 py-1 mt-1.5">
                              <strong>Revision requested:</strong> {doc.revisionReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: tone.bg, color: tone.fg }}
                        >
                          {doc.approvalStatus}
                        </span>
                        <button
                          type="button"
                          title="Preview arrives with the Stage 9 proofing centre"
                          disabled
                          className="p-1.5 rounded-md text-slate-300 cursor-not-allowed"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          title="Mock file — no download available"
                          disabled
                          className="p-1.5 rounded-md text-slate-300 cursor-not-allowed"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

export default DocumentsProofTab;
