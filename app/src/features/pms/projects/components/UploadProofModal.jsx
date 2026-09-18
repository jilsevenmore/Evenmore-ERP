import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Upload, Layers, FileText, X, Paperclip } from 'lucide-react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { usePmsStore, getLatestDocument } from '../../../../stores/pmsStore';
import { makeFileKey, putProofFile, formatFileSize, previewKindFor } from '../../approval/proofFileStore';

/**
 * UploadProofModal — register the next version of a design proof.
 *
 * Pick the drawing off your device and it is stored for real (in IndexedDB, keyed
 * by fileKey) so the viewer and any approval link show the actual document. The
 * file is optional: a version can still be registered by name alone, which is how
 * the seeded projects carry their history.
 *
 * The version number is allocated by the store, never typed in, which is what
 * keeps the stack strictly non-overwriting.
 */

/** Sensible ceiling for a drawing — keeps IndexedDB writes from stalling the UI. */
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.webp,.svg,.dwg,.dxf,.step,.stp,.iges,.igs,.zip';

const fieldClass =
  'w-full text-xs rounded-lg border border-[#dce5f4] bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400';
const labelClass = 'block text-[11px] font-semibold text-slate-600 mb-1.5';

function suggestName(project, stage, nextVersion) {
  const base = (project?.customerName ?? 'Proof').split(' ')[0];
  const part = (stage?.name ?? 'Design').replace(/[^A-Za-z]+/g, '');
  return `${base}_${part}_v${nextVersion}.0.pdf`;
}

export function UploadProofModal({ isOpen, onClose, project, stage, onUploaded }) {
  const employees = usePmsStore((s) => s.employees);
  const addDocument = usePmsStore((s) => s.addDocument);
  const showToast = usePmsStore((s) => s.showToast);

  const latest = getLatestDocument(stage);
  const nextVersion = (latest?.version ?? 0) + 1;

  const [fileName, setFileName] = useState('');
  const [uploaderId, setUploaderId] = useState('');
  const [comments, setComments] = useState('');
  const [errors, setErrors] = useState({});
  const [picked, setPicked] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setFileName(suggestName(project, stage, nextVersion));
    setUploaderId(stage?.assignedUser?.id ?? '');
    setComments('');
    setErrors({});
    setPicked(null);
    setDragging(false);
    setSaving(false);
  }, [isOpen, project, stage, nextVersion]);

  /** Take a File from the picker or a drop, and name the version after it. */
  function acceptFile(file) {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setErrors((prev) => ({
        ...prev,
        file: `${file.name} is ${formatFileSize(file.size)} — the limit is ${formatFileSize(MAX_FILE_BYTES)}.`,
      }));
      return;
    }
    setPicked(file);
    setFileName(file.name);
    setErrors((prev) => ({ ...prev, file: undefined, fileName: undefined }));
  }

  function clearFile() {
    setPicked(null);
    setFileName(suggestName(project, stage, nextVersion));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!fileName.trim()) found.fileName = 'A file name is required.';
    if (!uploaderId) found.uploaderId = 'Record who produced this version.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);

    // Park the bytes first — a document that claims a file it cannot show is
    // worse than one that falls back to the schematic preview.
    let fileKey = null;
    if (picked) {
      const key = makeFileKey();
      const stored = await putProofFile(key, picked);
      if (!stored) {
        setSaving(false);
        setErrors({ file: 'The file could not be stored in this browser. Try again, or upload without attaching it.' });
        return;
      }
      fileKey = key;
    }

    const uploader = employees.find((emp) => emp.id === uploaderId);
    addDocument(
      project.id,
      stage.id,
      {
        fileName: fileName.trim(),
        fileSize: picked ? formatFileSize(picked.size) : `${(2 + Math.random() * 4).toFixed(1)} MB`,
        previewUrl: `/mock/pdf/${fileName.trim().toLowerCase()}`,
        fileKey,
        mimeType: picked?.type || null,
        uploadedBy: { id: uploader.id, name: uploader.name },
        comments: comments.trim(),
      },
      project.projectManager
    );

    setSaving(false);
    showToast(
      picked ? `v${nextVersion}.0 uploaded — ${picked.name} attached.` : `v${nextVersion}.0 uploaded.`,
      'success',
      'onApproval'
    );
    onUploaded?.();
    onClose?.();
  }

  if (!project || !stage) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Upload Version ${nextVersion}.0`}
      subtitle={`${stage.name} — ${project.id}`}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="pms-upload-proof" icon={Upload} disabled={saving}>
            {saving ? 'Uploading…' : 'Upload Version'}
          </Button>
        </>
      }
    >
      <form id="pms-upload-proof" onSubmit={handleSubmit} className="space-y-4">
        {latest && (
          <div className="flex items-start gap-2 rounded-lg border border-[#dce5f4] bg-[#f6f9ff] px-3 py-2">
            <Layers size={12} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600">
              Current latest is <strong>v{latest.version}.0</strong> ({latest.approvalStatus}). This
              upload becomes <strong>v{nextVersion}.0</strong> — earlier versions stay untouched.
              {latest.revisionReason && (
                <>
                  <br />
                  <span className="text-orange-700">To address: {latest.revisionReason}</span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Device file picker */}
        <div>
          <span className={labelClass}>Design file</span>

          {picked ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-[#dce5f4] bg-white px-3 py-2.5">
              <span className="w-9 h-9 rounded-lg bg-[#f6f9ff] border border-[#dce5f4] flex items-center justify-center shrink-0">
                <FileText size={15} className="text-blue-500" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-800 truncate" title={picked.name}>
                  {picked.name}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {formatFileSize(picked.size)} · {previewKindFor(picked.type, picked.name) === 'file'
                    ? 'download only'
                    : 'previews in the approval portal'}
                </p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                aria-label="Remove the selected file"
                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                acceptFile(e.dataTransfer.files?.[0]);
              }}
              className="rounded-lg border border-dashed px-3 py-5 text-center transition-colors"
              style={
                dragging
                  ? { borderColor: '#1f6bff', background: '#f6f9ff' }
                  : { borderColor: '#dce5f4', background: '#fbfdff' }
              }
            >
              <Paperclip size={16} className="text-slate-300 mx-auto mb-1.5" />
              <p className="text-[11px] text-slate-600">
                Drag a drawing here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  browse your device
                </button>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                PDF, image or CAD export · up to {formatFileSize(MAX_FILE_BYTES)} · optional
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => acceptFile(e.target.files?.[0])}
          />

          {errors.file && (
            <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
              <AlertCircle size={11} /> {errors.file}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="proof-file">
            File name <span className="text-rose-500">*</span>
          </label>
          <input
            id="proof-file"
            type="text"
            className={fieldClass}
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
          {errors.fileName && (
            <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
              <AlertCircle size={11} /> {errors.fileName}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="proof-by">
            Uploaded by <span className="text-rose-500">*</span>
          </label>
          <select
            id="proof-by"
            className={fieldClass}
            value={uploaderId}
            onChange={(e) => setUploaderId(e.target.value)}
          >
            <option value="">Select the designer…</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name} — {emp.role}</option>
            ))}
          </select>
          {errors.uploaderId && (
            <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
              <AlertCircle size={11} /> {errors.uploaderId}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="proof-notes">What changed in this version</label>
          <textarea
            id="proof-notes"
            rows={2}
            className={fieldClass}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="e.g. Flange extended to 40 mm, hole tolerance tightened."
          />
        </div>
      </form>
    </Modal>
  );
}

export default UploadProofModal;
