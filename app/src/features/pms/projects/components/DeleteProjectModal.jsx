import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { StageStatusBadge } from '../../components/StageStatusBadge';

export function DeleteProjectModal({ isOpen, onClose, project, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!project) return null;

  const currentStageName =
    project._meta?.currentStage?.name ||
    project.stages?.find((s) => s.status === 'In Progress' || s.status === 'Delayed')?.name ||
    project.stages?.[0]?.name;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm?.(project);
      onClose();
    } catch {
      // Error is handled & toasted by pmsStore
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isDeleting ? undefined : onClose}
      title="Delete Project"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            icon={Trash2}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-600 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="text-xs space-y-1">
            <p className="font-semibold text-rose-800 text-sm">
              Are you sure you want to delete this project?
            </p>
            <p className="text-rose-700/90 leading-relaxed">
              This action cannot be undone. The project <strong>{project.code || project.id}</strong>, its stages, tasks, timeline records, and related files will be removed.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Project ID</span>
            <span className="font-bold text-slate-800">{project.code || project.id}</span>
          </div>

          {project.customerName && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Customer</span>
              <span className="font-semibold text-slate-700 truncate max-w-[220px]" title={project.customerName}>
                {project.customerName}
              </span>
            </div>
          )}

          {(project.crmOrderId || project.productDetails?.productName) && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Order / Product</span>
              <span
                className="font-semibold text-slate-700 truncate max-w-[220px]"
                title={`${project.crmOrderId ? `${project.crmOrderId} - ` : ''}${project.productDetails?.productName || ''}`}
              >
                {project.crmOrderId ? `${project.crmOrderId} · ` : ''}
                {project.productDetails?.productName || '—'}
              </span>
            </div>
          )}

          {currentStageName && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Current Stage</span>
              <span className="font-semibold text-slate-700">{currentStageName}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Status</span>
            <StageStatusBadge status={project.status} size="sm" />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteProjectModal;
