import React, { useEffect, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  MessageSquare,
  Send,
  FileText,
  FileQuestion,
  Image as ImageIcon,
  Download,
  ExternalLink,
} from 'lucide-react';
import { resolveFileUrl } from '../../../services/api';

/**
 * ProofViewer — proof renderer with photo/PDF support and comment stream.
 *
 * Renders the uploaded photo or PDF. A version whose file cannot be shown
 * inline (no file stored, or a type the browser cannot preview) gets an explicit
 * "no preview" state; the comment thread works either way.
 */

function commentStamp(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** The URL a document's file can be read from, or null when it has none. */
function fileSourceFor(doc) {
  if (doc?.fileData) return doc.fileData;
  const url = doc?.previewUrl;
  // Rows written before real uploads carried a '/mock/' placeholder path.
  if (!url || url.startsWith('/mock/')) return null;
  return resolveFileUrl(url);
}

export function ProofViewer({ document: doc, annotations = [], onAddAnnotation }) {
  const [zoom, setZoom] = useState(1);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const fileSource = fileSourceFor(doc);
  const hasRealFile = Boolean(fileSource);
  const isImage =
    doc?.fileType?.startsWith('image/') ||
    doc?.fileData?.startsWith('data:image/') ||
    /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(doc?.fileName || '') ||
    /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(fileSource || '');
  const isPdf =
    doc?.fileType === 'application/pdf' ||
    doc?.fileData?.startsWith('data:application/pdf') ||
    /\.pdf($|\?)/i.test(doc?.fileName || '') ||
    /\.pdf($|\?)/i.test(fileSource || '');

  // The browser plugin gives no usable error when an iframe/img source is
  // dead, so the source is fetched first; a 'failed' fetch renders an explicit
  // fallback with the HTTP status plus working open/download actions instead
  // of a mysterious grey box.
  //
  // PDFs are then shown from a local blob: URL rather than the file URL
  // itself. The signed download URL is absolute (it names the API host, e.g.
  // 127.0.0.1:8000 behind the dev proxy, or a separate API domain), so an
  // <iframe> of it is cross-origin and the server's X-Frame-Options refuses to
  // be framed — the broken-page icon. A blob belongs to this page's origin, so
  // framing rules never apply, on any deployment. Images use <img>, which
  // X-Frame-Options does not govern, so they only get the probe.
  const [sourceState, setSourceState] = useState('ready');
  const [sourceStatus, setSourceStatus] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  useEffect(() => {
    setSourceState('ready');
    setSourceStatus(null);
    setPdfBlobUrl(null);
    if (!fileSource || fileSource.startsWith('data:') || (!isPdf && !isImage)) return;
    let cancelled = false;
    let objectUrl = null;
    const request = isPdf ? fetch(fileSource) : fetch(fileSource, { headers: { Range: 'bytes=0-0' } });
    request
      .then(async (r) => {
        if (cancelled) return;
        setSourceStatus(r.status);
        if (!r.ok) {
          setSourceState('failed');
          return;
        }
        if (!isPdf) return;
        // Typed explicitly: a file stored as octet-stream would otherwise
        // download instead of rendering in the frame.
        const blob = new Blob([await r.arrayBuffer()], { type: 'application/pdf' });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSourceState('failed');
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileSource, isPdf, isImage]);

  // data: URLs (a fresh local upload) are same-origin already.
  const pdfFrameSrc = fileSource?.startsWith('data:') ? fileSource : pdfBlobUrl;

  function handleOpenExternal() {
    if (!fileSource) return;
    const win = window.open();
    if (win) {
      if (isImage) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>${doc.fileName}</title></head>
            <body style="margin:0;background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;overflow:auto;">
              <img src="${fileSource}" alt="${doc.fileName}" style="max-width:96%;max-height:96vh;object-fit:contain;box-shadow:0 10px 30px rgba(0,0,0,0.5);border-radius:6px;" />
            </body>
          </html>
        `);
      } else {
        win.location.href = fileSource;
      }
    }
  }

  function renderFileActions() {
    return (
      <div className="flex items-center gap-2 mt-4">
        <button
          type="button"
          onClick={handleOpenExternal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
        >
          <ExternalLink size={12} /> Open in new tab
        </button>
        <a
          href={fileSource}
          download={doc.fileName}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#dce5f4] bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-blue-600"
        >
          <Download size={12} /> Download
        </a>
      </div>
    );
  }

  function renderSourceFallback() {
    return (
      <div className="p-6 sm:p-10 bg-slate-100 flex flex-col items-center justify-center text-center min-h-[380px]">
        <FileText size={26} className="text-slate-300 mb-3" />
        <p className="text-xs font-bold text-slate-700">
          Preview couldn&apos;t load{sourceStatus ? ` (HTTP ${sourceStatus})` : ''}.
        </p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
          The file itself is fine — open it directly instead.
        </p>
        {renderFileActions()}
      </div>
    );
  }

  function renderNoPreview() {
    return (
      <div className="p-6 sm:p-10 bg-slate-100 flex flex-col items-center justify-center text-center min-h-[340px]">
        <FileQuestion size={26} className="text-slate-300 mb-3" />
        <p className="text-xs font-bold text-slate-700">No preview available</p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-sm break-all">{doc.fileName}</p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
          {hasRealFile
            ? 'This file type cannot be shown inline — open or download it instead.'
            : 'No file is stored for this version. Upload a new version to attach one.'}
        </p>
        {hasRealFile && renderFileActions()}
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="rounded-xl border border-dashed border-[#dce5f4] bg-[#f6f9ff] p-6 sm:p-10 text-center">
        <FileText size={22} className="text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Select a version to preview it.</p>
      </div>
    );
  }

  async function submitComment(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || posting) return;
    setPosting(true);
    setPostError('');
    try {
      await onAddAnnotation?.({ page: null, text });
      setDraft('');
    } catch (err) {
      setPostError(err?.message || 'Your comment could not be sent. Please try again.');
    } finally {
      setPosting(false);
    }
  }

  const canPreview = hasRealFile && (isImage || isPdf);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4">
      {/* Preview pane */}
      <div className="rounded-xl border border-[#dce5f4] bg-white overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#dce5f4] bg-[#f6f9ff] flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            {isImage ? (
              <ImageIcon size={13} className="text-blue-500 shrink-0" />
            ) : (
              <FileText size={13} className={isPdf ? 'text-rose-500 shrink-0' : 'text-slate-400 shrink-0'} />
            )}
            <span className="text-[11px] font-semibold text-slate-700 truncate" title={doc.fileName}>
              {doc.fileName}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 shrink-0">
              v{doc.version}.0
            </span>
            {canPreview && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                  isImage
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {isImage ? 'Photo' : 'PDF'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {canPreview && isImage && (
              <>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.2) * 10) / 10))}
                  disabled={zoom <= 0.6}
                  aria-label="Zoom out"
                  className="p-1 rounded text-slate-500 hover:bg-white disabled:opacity-30"
                >
                  <ZoomOut size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  aria-label="Reset zoom"
                  className="text-[10px] font-semibold text-slate-500 hover:text-blue-600 px-1 py-0.5 rounded"
                  title="Click to reset zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.0, Math.round((z + 0.2) * 10) / 10))}
                  disabled={zoom >= 2.0}
                  aria-label="Zoom in"
                  className="p-1 rounded text-slate-500 hover:bg-white disabled:opacity-30"
                >
                  <ZoomIn size={13} />
                </button>
              </>
            )}

            {hasRealFile && (
              <>
                {canPreview && isImage && <span className="w-px h-4 bg-slate-200 mx-1" />}
                <a
                  href={fileSource}
                  download={doc.fileName}
                  className="p-1 rounded text-slate-500 hover:bg-white hover:text-blue-600 transition-colors"
                  title="Download to PC"
                >
                  <Download size={13} />
                </a>
                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className="p-1 rounded text-slate-500 hover:bg-white hover:text-blue-600 transition-colors"
                  title="Open full preview in new tab"
                >
                  <ExternalLink size={13} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content: photo, PDF, or an explicit no-preview state */}
        {canPreview && isImage ? (
          sourceState === 'failed' ? (
            renderSourceFallback()
          ) : (
            <div className="p-3 sm:p-6 bg-slate-900/5 flex items-center justify-center overflow-auto min-h-[380px] max-h-[580px]">
              <img
                src={fileSource}
                alt={doc.fileName}
                onError={() => setSourceState('failed')}
                className="max-w-full rounded-lg shadow-sm border border-slate-200 object-contain transition-transform duration-150"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
              />
            </div>
          )
        ) : canPreview && isPdf ? (
          sourceState === 'failed' ? (
            renderSourceFallback()
          ) : (
            <div className="w-full bg-slate-100 min-h-[480px] h-[58vh] overflow-hidden">
              {pdfFrameSrc ? (
                <iframe
                  src={pdfFrameSrc}
                  title={doc.fileName}
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                  <FileText size={22} className="animate-pulse" />
                  <span className="text-[11px]">Loading drawing…</span>
                </div>
              )}
            </div>
          )
        ) : (
          renderNoPreview()
        )}
      </div>

      {/* Comment stream */}
      <aside className="rounded-xl border border-[#dce5f4] bg-white flex flex-col" style={{ maxHeight: canPreview ? 'min(58vh, 620px)' : 420, minHeight: 320 }}>
        <header className="flex items-center gap-1.5 px-3 py-2 border-b border-[#dce5f4]">
          <MessageSquare size={12} className="text-slate-400" />
          <span className="text-[11px] font-bold text-slate-700">Comments</span>
          <span className="text-[10px] text-slate-400 ml-auto">{annotations.length}</span>
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

          {annotations.length === 0 && !doc.comments && !doc.revisionReason && (
            <p className="text-[11px] text-slate-400 text-center py-6">No comments on this drawing yet.</p>
          )}

          {annotations.map((a) => {
            const fromClient = a.authorType === 'Client';
            return (
              <div
                key={a.id}
                className="rounded-lg border px-2.5 py-2"
                style={fromClient ? { borderColor: '#fcd34d', background: '#fffbeb' } : { borderColor: '#dce5f4' }}
              >
                <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 mb-0.5">
                  <span className="truncate">{a.author ?? 'You'}</span>
                  {fromClient && (
                    <span className="text-[9px] font-bold px-1.5 py-px rounded-full bg-amber-100 text-amber-800 shrink-0">
                      Client
                    </span>
                  )}
                  {a.createdAt && (
                    <span className="ml-auto font-medium text-slate-400 shrink-0">{commentStamp(a.createdAt)}</span>
                  )}
                </p>
                <p className="text-[11px] text-slate-700 whitespace-pre-wrap break-words">{a.text}</p>
              </div>
            );
          })}
        </div>

        {onAddAnnotation && (
          <form onSubmit={submitComment} className="p-2.5 border-t border-[#dce5f4]">
            {postError && (
              <p className="text-[10.5px] text-rose-600 mb-1.5">{postError}</p>
            )}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a comment…"
                aria-label="Add a comment"
                maxLength={4000}
                className="flex-1 min-w-0 text-[11px] rounded-lg border border-[#dce5f4] px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
              <button
                type="submit"
                disabled={!draft.trim() || posting}
                aria-label="Post comment"
                className="p-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-30"
              >
                <Send size={12} />
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}

export default ProofViewer;
