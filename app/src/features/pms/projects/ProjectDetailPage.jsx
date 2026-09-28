import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Info, GitBranch, ListChecks, FileText, ShieldCheck, History, MessagesSquare } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { EmptyStatePms } from '../components/EmptyStatePms';
import { usePmsStore, getProjectRowMeta } from '../../../stores/pmsStore';
import { ProjectHeader } from './components/ProjectHeader';
import { ProjectInfoTab } from './components/ProjectInfoTab';
import { StageTimelineTab } from './components/StageTimelineTab';
import { StageTasksTab } from './components/StageTasksTab';
import { DocumentsProofTab } from './components/DocumentsProofTab';
import { ApprovalsTab } from './components/ApprovalsTab';
import { ActivityAuditTab } from './components/ActivityAuditTab';
import { AssignStageModal } from './components/AssignStageModal';
import { StageHandoffModal } from '../components/StageHandoffModal';
import { CompleteProjectModal } from './components/CompleteProjectModal';
import { PmsToast } from '../components/PmsToast';
import { MessengerTab } from '../messenger/MessengerTab';
import { useProjectMessenger } from '../messenger/useProjectMessenger';
import { useAppStore } from '../../../stores/appStore';

/**
 * ProjectDetailPage (/pms/projects/:id) — the project workspace.
 *
 * Seven tabs over one project. All figures derive from the store, so an edit in
 * the Tasks tab moves the stage bar in Timeline and the hero gauge at once.
 * Messenger is the exception: chat is server-only, read through
 * useProjectMessenger, and its tab badge is the caller's unread count.
 * `?tab=messenger&conversation=<id>` (the link in a chat notification) opens
 * straight into that conversation.
 */

const TABS = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'timeline', label: 'Stage Timeline', icon: GitBranch },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'documents', label: 'Design Proofs', icon: FileText },
  { id: 'approvals', label: 'Approvals', icon: ShieldCheck },
  { id: 'activity', label: 'Activity', icon: History },
  { id: 'messenger', label: 'Messenger', icon: MessagesSquare },
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const projects = usePmsStore((s) => s.projects);
  const stageConfigs = usePmsStore((s) => s.stageConfigs);
  const startStage = usePmsStore((s) => s.startStage);
  const setStageStatus = usePmsStore((s) => s.setStageStatus);
  const updateTask = usePmsStore((s) => s.updateTask);

  const [searchParams, setSearchParams] = useSearchParams();
  const currentUserId = useAppStore((s) => s.currentUser?.id);

  const [tab, setTab] = useState(() => (searchParams.get('tab') === 'messenger' ? 'messenger' : 'timeline'));
  const [focusStageId, setFocusStageId] = useState(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [assignStageId, setAssignStageId] = useState(null); // null = closed
  const [handoffStageId, setHandoffStageId] = useState(null);

  const project = useMemo(() => projects.find((p) => p.id === id) ?? null, [projects, id]);
  const meta = useMemo(() => (project ? getProjectRowMeta(project) : null), [project]);

  const messenger = useProjectMessenger(project?.id, { open: tab === 'messenger' });
  const [chatStageId, setChatStageId] = useState(null);
  const [highlightMessageId, setHighlightMessageId] = useState(null);
  // A conversation to open once the list has loaded: an id, or a stage's team.
  const [pendingChat, setPendingChat] = useState(null);

  // Chat notifications link here with ?tab=messenger&conversation=<id>, which
  // can arrive while the page is already open. Consume the params once.
  useEffect(() => {
    if (searchParams.get('tab') !== 'messenger') return;
    const conversationId = searchParams.get('conversation');
    setTab('messenger');
    if (conversationId) setPendingChat({ conversationId });
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const { status: chatStatus, conversations, openConversation } = messenger;
  useEffect(() => {
    if (!pendingChat || chatStatus !== 'ready') return;
    const { conversationId, stage } = pendingChat;
    let target = conversationId ? conversations.find((c) => c.id === conversationId) : null;
    if (stage) {
      // The stage's team chat, or the Project Chat if the caller is not on that team.
      target =
        conversations.find(
          (c) =>
            c.kind === 'Team' &&
            ((stage.departmentId && c.departmentId === stage.departmentId) || c.departmentName === stage.department),
        ) ?? conversations.find((c) => c.kind === 'Project');
    }
    if (target) openConversation(target.id);
    setPendingChat(null);
  }, [pendingChat, chatStatus, conversations, openConversation]);

  const chatUnreadByDepartment = useMemo(() => {
    const map = {};
    conversations.forEach((c) => {
      if (c.kind === 'Team' && c.departmentName) map[c.departmentName] = c.unreadCount ?? 0;
    });
    return map;
  }, [conversations]);

  const counts = useMemo(() => {
    if (!project) return {};
    const stages = project.stages ?? [];
    return {
      tasks: stages.reduce((n, s) => n + (s.tasks?.length ?? 0), 0),
      documents: stages.reduce((n, s) => n + (s.documents?.length ?? 0), 0),
      approvals: stages.reduce((n, s) => n + (s.approvals?.length ?? 0), 0),
      activity: project.activityLog?.length ?? 0,
      timeline: stages.length,
      messenger: messenger.totalUnread,
    };
  }, [project, messenger.totalUnread]);

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

  function handleOpenStageChat(stage) {
    setChatStageId(stage.id);
    setHighlightMessageId(null);
    setPendingChat({ stage });
    setTab('messenger');
  }

  function handleSubmitStage(stage) {
    setStageStatus(project.id, stage.id, 'Submitted', project.projectManager);
  }

  return (
    <div className="space-y-5">
      <ProjectHeader
        project={project}
        meta={meta}
        onAssignStage={() => setAssignStageId(currentStage?.id ?? '')}
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
            onHandoff={(stage) => setHandoffStageId(stage.id)}
            onChat={chatStatus === 'offline' ? undefined : handleOpenStageChat}
            chatUnread={chatUnreadByDepartment}
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
        {tab === 'messenger' && (
          <MessengerTab
            project={project}
            messenger={messenger}
            currentUserId={currentUserId}
            stageId={chatStageId}
            onStageChange={setChatStageId}
            highlightMessageId={highlightMessageId}
            onHighlight={setHighlightMessageId}
          />
        )}
      </div>

      <AssignStageModal
        isOpen={assignStageId !== null}
        initialStageId={assignStageId || null}
        project={project}
        onClose={() => setAssignStageId(null)}
      />

      <StageHandoffModal
        isOpen={handoffStageId !== null}
        stageId={handoffStageId}
        project={project}
        onClose={() => setHandoffStageId(null)}
        onHandedOff={(nextId) => setFocusStageId(nextId)}
      />

      <CompleteProjectModal
        isOpen={confirmComplete}
        project={project}
        onClose={() => setConfirmComplete(false)}
      />

      <PmsToast />
    </div>
  );
}
