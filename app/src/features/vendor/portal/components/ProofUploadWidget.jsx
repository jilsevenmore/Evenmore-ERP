import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, X, CheckCircle2, AlertCircle } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ProofUploadWidget({
  files = [],
  onChange,
  isRequired = false,
  maxFiles = 5,
  label = 'Upload Verification Proof',
  helpText = 'Upload inspection photos, test reports, or QC certificates (JPG, PNG, PDF up to 10MB each)',
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFiles = (incomingFileList) => {
    setUploadError('');
    const newFiles = Array.from(incomingFileList);

    if (files.length + newFiles.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    const validNewFiles = [];

    for (const file of newFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError(`Unsupported file format: "${file.name}". Please upload JPG, PNG, or PDF.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`File "${file.name}" exceeds 10MB size limit.`);
        return;
      }

      // Create preview URL if it's an image
      const isImg = file.type.startsWith('image/');
      const previewUrl = isImg ? URL.createObjectURL(file) : null;
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

      validNewFiles.push({
        name: file.name,
        size: sizeStr,
        type: file.type,
        url: previewUrl,
        rawFile: file,
      });
    }

    if (validNewFiles.length > 0) {
      // Simulate realistic upload progress
      setUploadingFiles(validNewFiles.map((f) => ({ ...f, progress: 10 })));

      const timer = setInterval(() => {
        setUploadingFiles((prev) => {
          const updated = prev.map((f) => ({ ...f, progress: Math.min(100, f.progress + 30) }));
          if (updated.every((f) => f.progress >= 100)) {
            clearInterval(timer);
            setTimeout(() => {
              setUploadingFiles([]);
              onChange([...files, ...validNewFiles]);
            }, 300);
          }
          return updated;
        });
      }, 100);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (indexToRemove) => {
    const updated = files.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-text">
          {label} {isRequired && <span className="text-rose-500 font-bold">*</span>}
        </label>
        {isRequired && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            Mandatory Proof
          </span>
        )}
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer select-none ${
          dragActive
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 hover:border-primary hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <UploadCloud size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-text">
              <span className="text-primary hover:underline">Click to browse</span> or drag & drop files here
            </p>
            <p className="text-[11px] text-muted mt-0.5">{helpText}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle size={14} className="shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Simulated Uploading in Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((f, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-medium text-text truncate max-w-[200px]">{f.name}</span>
                <span className="text-[11px] text-muted">{f.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-150"
                  style={{ width: `${f.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files List / Previews */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Uploaded Proof ({files.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map((file, idx) => {
              const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {file.url && !isPdf ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-9 h-9 object-cover rounded-md border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                        {isPdf ? <FileText size={18} /> : <ImageIcon size={18} />}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-text truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-muted flex items-center gap-1.5 mt-0.5">
                        <span>{file.size || '1.5 MB'}</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-medium inline-flex items-center gap-0.5">
                          <CheckCircle2 size={10} /> Ready
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProofUploadWidget;
