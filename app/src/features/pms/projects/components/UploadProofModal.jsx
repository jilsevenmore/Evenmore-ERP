import React, { useEffect, useState } from 'react';
import { AlertCircle, Upload, Layers } from 'lucide-react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { usePmsStore, getLatestDocument } from '../../../../stores/pmsStore';

/**
 * UploadProofModal — register the next version of a design proof.
 *
 * There is no file storage here, so this captures the metadata a version record
 * needs. The version number is allocated by the store, never typed in, which is
 * what keeps the stack strictly non-overwriting.
 */

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

  useEffect(() => {
    if (!isOpen) return;
    setFileName(suggestName(project, stage, nextVersion));
    setUploaderId(stage?.assignedUser?.id ?? '');
    setComments('');
    setErrors({});
  }, [isOpen, project, stage, nextVersion]);

  function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!fileName.trim()) found.fileName = 'A file name is required.';
    if (!uploaderId) found.uploaderId = 'Record who produced this version.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const uploader = employees.find((emp) => emp.id === uploaderId);
    addDocument(
      project.id,
      stage.id,
      {
        fileName: fileName.trim(),
        fileSize: `${(2 + Math.random() * 4).toFixed(1)} MB`,
        previewUrl: `/mock/pdf/${fileName.trim().toLowerCase()}`,
        uploadedBy: { id: uploader.id, name: uploader.name },
        comments: comments.trim(),
      },
      project.projectManager
    );

    showToast(`v${nextVersion}.0 uploaded.`, 'success', 'onApproval');
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
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="pms-upload-proof" icon={Upload}>Upload Version</Button>
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
