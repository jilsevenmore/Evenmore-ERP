import React, { useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, MessageSquare, Send, FileText,
} from 'lucide-react';

/**
 * MockPdfViewer — stand-in proof renderer with a side-by-side comment stream.
 *
 * There is no backend and no real PDF, so the "pages" are drawn as a technical
 * sheet from the document's own metadata. Comments are local to the viewer
 * session: a proof's durable feedback is the revision reason captured by the
 * approval decision, which is what the designer actually acts on.
 */

function pageCountFor(doc) {
  // Deterministic per file so paging is stable across re-renders.
  const seed = (doc?.fileName ?? '').split('').reduce((n, c) => n + c.charCodeAt(0), 0);
  return 2 + (seed % 3); // 2–4 pages
}

const SHEET_META = [
  ['Scale', '1:20'],
  ['Material', 'SS-304'],
  ['Sheet', '2 mm'],
  ['Tolerance', '±0.1 mm'],
];

export function MockPdfViewer({ document: doc, projectName, annotations = [], onAddAnnotation }) {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [draft, setDraft] = useState('');

  const pages = useMemo(() => pageCountFor(doc), [doc]);
  const safePage = Math.min(page, pages);

  if (!doc) {
    return (
      <div className="rounded-xl border border-dashed border-[#dce5f4] bg-[#f6f9ff] p-10 text-center">
        <FileText size={22} className="text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Select a version to preview it.</p>
      </div>
    );
  }

  function submitComment(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onAddAnnotation?.({ page: safePage, text });
    setDraft('');
  }

  const pageComments = annotations.filter((a) => a.page === safePage);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4">
      {/* Preview pane */}
      <div className="rounded-xl border border-[#dce5f4] bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#dce5f4] bg-[#f6f9ff] flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <FileText size={13} className="text-slate-400 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-700 truncate" title={doc.fileName}>
              {doc.fileName}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 shrink-0">
              v{doc.version}.0
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.2) * 10) / 10))}
              disabled={zoom <= 0.6}
              aria-label="Zoom out"
              className="p-1 rounded text-slate-500 hover:bg-white disabled:opacity-30"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] font-semibold text-slate-500 w-9 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.6, Math.round((z + 0.2) * 10) / 10))}
              disabled={zoom >= 1.6}
              aria-label="Zoom in"
              className="p-1 rounded text-slate-500 hover:bg-white disabled:opacity-30"
            >
              <ZoomIn size={13} />
            </button>

            <span className="w-px h-4 bg-slate-200 mx-1" />

            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              aria-label="Previous page"
              className="p-1 rounded text-slate-500 hover:bg-white disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] font-semibold text-slate-600" data-test="pdf-page">
              {safePage} / {pages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={safePage >= pages}
              aria-label="Next page"
              className="p-1 rounded text-slate-500 hover:bg-white disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Mock sheet */}
        <div className="p-5 bg-slate-100 flex justify-center overflow-auto" style={{ minHeight: 340 }}>
          <div
            className="bg-white border border-slate-300 shadow-sm"
            style={{
              width: 460 * zoom,
              minHeight: 300 * zoom,
              transition: 'width 0.2s ease',
              padding: 16 * zoom,
            }}
          >
            <div className="border-2 border-slate-800 h-full flex flex-col" style={{ minHeight: 268 * zoom }}>
              <div className="border-b-2 border-slate-800 px-3 py-2 text-center">
                <p className="font-bold text-slate-800 tracking-wide" style={{ fontSize: 11 * zoom }}>
                  TECHNICAL BLUEPRINT — {(projectName ?? 'ASSEMBLY').toUpperCase()}
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center p-4">
                {/* A deliberately schematic drawing, not a fake screenshot. */}
                <svg viewBox="0 0 200 120" style={{ width: 240 * zoom, height: 144 * zoom }} role="img" aria-label="Schematic drawing">
                  <rect x="20" y="20" width="160" height="80" fill="none" stroke="#334155" strokeWidth="2" />
                  <rect x="34" y="34" width="60" height="52" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
                  <circle cx="140" cy="46" r="8" fill="none" stroke="#334155" strokeWidth="1.5" />
                  <circle cx="140" cy="76" r="8" fill="none" stroke="#334155" strokeWidth="1.5" />
                  <line x1="20" y1="110" x2="180" y2="110" stroke="#64748b" strokeWidth="0.8" />
                  <text x="100" y="117" textAnchor="middle" fontSize="7" fill="#64748b">2200 mm</text>
                  <text x="46" y="64" fontSize="7" fill="#94a3b8">PANEL {safePage}</text>
                </svg>
              </div>

              <div className="border-t-2 border-slate-800 px-3 py-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                {SHEET_META.map(([k, v]) => (
                  <span key={k} className="text-slate-600" style={{ fontSize: 8 * zoom }}>
                    <strong>{k}:</strong> {v}
                  </span>
                ))}
                <span className="text-slate-400 ml-auto" style={{ fontSize: 8 * zoom }}>
                  Sheet {safePage} of {pages}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comment stream */}
      <aside className="rounded-xl border border-[#dce5f4] bg-white flex flex-col" style={{ maxHeight: 420 }}>
        <header className="flex items-center gap-1.5 px-3 py-2 border-b border-[#dce5f4]">
          <MessageSquare size={12} className="text-slate-400" />
          <span className="text-[11px] font-bold text-slate-700">Comments</span>
          <span className="text-[10px] text-slate-400 ml-auto">page {safePage}</span>
        </header>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {doc.revisionReason && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-2">
              <p className="text-[10px] font-bold text-orange-800 mb-0.5">Revision requested</p>
              <p className="text-[11px] text-orange-900">{doc.revisionReason}</p>
            </div>
          )}
          {doc.comments && (
            <div className="rounded-lg border border-[#dce5f4] bg-[#f6f9ff] px-2.5 py-2">
              <p className="text-[10px] font-bold text-slate-500 mb-0.5">
                {doc.uploadedBy?.name ?? 'Uploader'}
              </p>
              <p className="text-[11px] text-slate-700">{doc.comments}</p>
            </div>
          )}

          {pageComments.length === 0 && !doc.comments && !doc.revisionReason && (
            <p className="text-[11px] text-slate-400 text-center py-6">
              No comments on this page yet.
            </p>
          )}

          {pageComments.map((a) => (
            <div key={a.id} className="rounded-lg border border-[#dce5f4] px-2.5 py-2">
              <p className="text-[10px] font-bold text-slate-500 mb-0.5">{a.author ?? 'You'}</p>
              <p className="text-[11px] text-slate-700">{a.text}</p>
            </div>
          ))}
        </div>

        <form onSubmit={submitComment} className="p-2.5 border-t border-[#dce5f4] flex gap-1.5">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Comment on page ${safePage}…`}
            aria-label="Add a comment"
            className="flex-1 min-w-0 text-[11px] rounded-lg border border-[#dce5f4] px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Post comment"
            className="p-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-30"
          >
            <Send size={12} />
          </button>
        </form>
      </aside>
    </div>
  );
}

export default MockPdfViewer;
