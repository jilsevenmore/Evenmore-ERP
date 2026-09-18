import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Info, GitBranch, ListChecks, FileText, ShieldCheck, History } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { EmptyStatePms } from '../components/EmptyStatePms';
import { usePmsStore, getProjectRowMeta } from '../../../stores/pmsStore';
import { ProjectHeader } from './components/ProjectHeader';
import { ProjectInfoTab } from './components/ProjectInfoTab';
import { StageTimelineTab } from './components/StageTimelineTab';
import { StageTasksTab } from './components/StageTasksTab';
import { DocumentsProofTab } from './components/DocumentsProofTab';
import { ApprovalsTab } from './components/ApprovalsTab';
import { ActivityAuditTab } from './components/ActivityAuditTab';

/**
 * ProjectDetailPage (/pms/projects/:id) — the project workspace.
 *
 * Six tabs over one project. All figures derive from the store, so an edit in
 * the Tasks tab moves the stage bar in Timeline and the hero gauge at once.
 */

const TABS = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'timeline', label: 'Stage Timeline', icon: GitBranch },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'documents', label: 'Design Proofs', icon: FileText },
  { id: 'approvals', label: 'Approvals', icon: ShieldCheck },
  { id: 'activity', label: 'Activity', icon: History },
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const projects = usePmsStore((s) => s.projects);
  const stageConfigs = usePmsStore((s) => s.stageConfigs);
  const startStage = usePmsStore((s) => s.startStage);
  const setStageStatus = usePmsStore((s) => s.setStageStatus);
  const updateTask = usePmsStore((s) => s.updateTask);
  const completeProject = usePmsStore((s) => s.completeProject);

  const [tab, setTab] = useState('timeline');
  const [focusStageId, setFocusStageId] = useState(null);
  const [confirmComplete, setConfirmComplete] = useState(false);

  const project = useMemo(() => projects.find((p) => p.id === id) ?? null, [projects, id]);
  const meta = useMemo(() => (project ? getProjectRowMeta(project) : null), [project]);

  const counts = useMemo(() => {
    if (!project) return {};
    const stages = project.stages ?? [];
    return {
      tasks: stages.reduce((n, s) => n + (s.tasks?.length ?? 0), 0),
      documents: stages.reduce((n, s) => n + (s.documents?.length ?? 0), 0),
      approvals: stages.reduce((n, s) => n + (s.approvals?.length ?? 0), 0),
      activity: project.activityLog?.length ?? 0,
      timeline: stages.length,
    };
  }, [project]);

  if (!project) {
    return (
      <div className="rounded-xl border border-[#dce5f4] bg-white shadow-2xs">
        <EmptyStatePms
          variant="projects"
          title="Project not found"
          description={`No project matches "${id}". It may have been deleted.`}
          action={<Button onClick={() => navigate('/pms/projects')}>Back to all projects</Button>}
        />
      </div>
    );
  }

  const currentStage = meta?.currentStage ?? null;

  function handleManageTasks(stage) {
    setFocusStageId(stage.id);
    setTab('tasks');
  }

  function handleSubmitStage(stage) {
    setStageStatus(project.id, stage.id, 'Submitted', project.projectManager);
  }

  return (
    <div className="space-y-5">
      <ProjectHeader
        project={project}
        meta={meta}
        onAssignStage={() => {
          setTab('timeline');
          setFocusStageId(currentStage?.id ?? null);
        }}
        onSubmitForReview={() => currentStage && handleSubmitStage(currentStage)}
        onLogDelay={() => navigate(`/pms/delays?project=${project.id}`)}
        onCompleteProject={() => setConfirmComplete(true)}
      />

      {/* Tabs */}
      <div className="border-b border-[#dce5f4] overflow-x-auto">
        <nav className="flex gap-1 min-w-max" role="tablist" aria-label="Project sections">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            const count = counts[t.id];
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap"
                style={
                  active
                    ? { borderColor: '#1f6bff', color: '#1f6bff' }
                    : { borderColor: 'transparent', color: '#64748b' }
                }
              >
                <Icon size={13} />
                {t.label}
                {count > 0 && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={
                      active
                        ? { background: '#dbeafe', color: '#1d4ed8' }
                        : { background: '#f1f5f9', color: '#94a3b8' }
                    }
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Panels */}
      <div role="tabpanel">
        {tab === 'overview' && <ProjectInfoTab project={project} meta={meta} />}

        {tab === 'timeline' && (
          <StageTimelineTab
            project={project}
            stageConfigs={stageConfigs}
            onStart={(stage) => startStage(project.id, stage.id, project.projectManager)}
            onManageTasks={handleManageTasks}
            onSubmit={handleSubmitStage}
          />
        )}

        {tab === 'tasks' && (
          <StageTasksTab
            project={project}
            focusStageId={focusStageId}
            onToggleTask={(stageId, task) =>
              updateTask(project.id, stageId, task.id, {
                status: task.status === 'Completed' ? 'In Progress' : 'Completed',
              })
            }
            onTaskProgress={(stageId, task, pct) =>
              updateTask(project.id, stageId, task.id, { completionPct: pct })
            }
          />
        )}

        {tab === 'documents' && <DocumentsProofTab project={project} />}
        {tab === 'approvals' && <ApprovalsTab project={project} />}
        {tab === 'activity' && <ActivityAuditTab project={project} />}
      </div>

      {/* Complete project confirmation */}
      <Modal
        isOpen={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        title="Complete this project?"
        subtitle={`${project.id} — ${project.customerName}`}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setConfirmComplete(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                completeProject(project.id, project.projectManager);
                setConfirmComplete(false);
              }}
            >
              Complete Project
            </Button>
          </>
        }
      >
        <div className="space-y-2.5">
          <p className="text-xs text-slate-600">
            This stamps the actual completion date and closes the project. Completion is terminal —
            later stage edits will not reopen it.
          </p>
          {project.overallCompletionPct < 100 && (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              This project is at <strong>{project.overallCompletionPct}%</strong>. Completing it now
              closes it with stages still outstanding.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
