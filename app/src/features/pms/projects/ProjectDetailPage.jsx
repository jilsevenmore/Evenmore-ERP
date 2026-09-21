import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Info,
  GitBranch,
  ListChecks,
  FileText,
  ShieldCheck,
  History,
  Layers,
  Sliders,
  Boxes,
  Wrench,
  Users,
  DollarSign,
  RotateCcw,
  Package,
  Truck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { EmptyStatePms } from '../components/EmptyStatePms';
import { usePmsStore, getProjectRowMeta } from '../../../stores/pmsStore';
import { useManufacturingStore } from '../../../stores/manufacturingStore';
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
import { ManufacturingHeroCard } from '../../manufacturing/components/ManufacturingHeroCard';
import { ProjectBomTab } from '../../manufacturing/components/ProjectBomTab';
import { ProjectMaterialPlanningTab } from '../../manufacturing/components/ProjectMaterialPlanningTab';
import { ProjectMaterialConsumptionTab } from '../../manufacturing/components/ProjectMaterialConsumptionTab';
import { ProjectLabourTab } from '../../manufacturing/components/ProjectLabourTab';
import { ProjectCostingTab } from '../../manufacturing/components/ProjectCostingTab';
import { ProjectQualityReworkTab } from '../../manufacturing/components/ProjectQualityReworkTab';
import { ProjectPackagingTab } from '../../manufacturing/components/ProjectPackagingTab';
import { ProjectDispatchTab } from '../../manufacturing/components/ProjectDispatchTab';
import { ProjectProfitabilityTab } from '../../manufacturing/components/ProjectProfitabilityTab';
import { BomCompareModal } from '../../manufacturing/components/BomCompareModal';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'timeline', label: 'Stage Timeline', icon: GitBranch },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'documents', label: 'Design Proofs', icon: FileText },
  { id: 'approvals', label: 'Approvals', icon: ShieldCheck },
  { id: 'bom', label: 'BOM Version', icon: Layers },
  { id: 'planning', label: 'Material Planning', icon: Sliders },
  { id: 'consumption', label: 'Material Consumption', icon: Boxes },
  { id: 'labour', label: 'Labour Costing', icon: Users },
  { id: 'costing', label: 'Production Cost', icon: DollarSign },
  { id: 'quality', label: 'Quality & Rework', icon: RotateCcw },
  { id: 'packaging', label: 'Packaging', icon: Package },
  { id: 'dispatch', label: 'Dispatch', icon: Truck },
  { id: 'profitability', label: 'Profitability', icon: TrendingUp },
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

  const [tab, setTab] = useState('timeline');
  const [focusStageId, setFocusStageId] = useState(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [assignStageId, setAssignStageId] = useState(null); // null = closed
  const [handoffStageId, setHandoffStageId] = useState(null);
  const [bomCompareOpen, setBomCompareOpen] = useState(false);

  const bomVersions = useManufacturingStore((s) => s.bomVersions);
  const getProjectWeightedProgress = useManufacturingStore((s) => s.getProjectWeightedProgress);
  const getProjectPlan = useManufacturingStore((s) => s.getProjectPlan);
  const getProjectBatches = useManufacturingStore((s) => s.getProjectBatches);
  const getProjectLabour = useManufacturingStore((s) => s.getProjectLabour);

  const project = useMemo(() => projects.find((p) => p.id === id) ?? null, [projects, id]);
  const meta = useMemo(() => (project ? getProjectRowMeta(project) : null), [project]);

  const weightedProgress = useMemo(() => {
    if (!project) return 0;
    return getProjectWeightedProgress(project.id);
  }, [project, getProjectWeightedProgress]);

  const plan = useMemo(() => {
    if (!project) return null;
    return getProjectPlan(project.id);
  }, [project, getProjectPlan]);

  const batches = useMemo(() => {
    if (!project) return [];
    return getProjectBatches(project.id);
  }, [project, getProjectBatches]);

  const labourList = useMemo(() => {
    if (!project) return [];
    return getProjectLabour(project.id);
  }, [project, getProjectLabour]);

  const activeBatch = batches[0];
  const materialCost = activeBatch ? (activeBatch.costSummary?.materialCost || 0) : 0;
  const labourCost = useMemo(() => {
    return labourList.reduce((sum, l) => sum + (Number(l.totalCost) || 0), 0);
  }, [labourList]);
  const productionCost = activeBatch ? (activeBatch.costSummary?.totalActualCost || 0) : (materialCost + labourCost);
  const contractRevenue = project?.contractValue || project?.budget || 2400000;
  const grossProfit = contractRevenue - productionCost;
  const profitMargin = contractRevenue > 0 ? (grossProfit / contractRevenue) * 100 : 0;

  const relevantBoms = useMemo(() => {
    if (!project) return [];
    return bomVersions.filter(
      (b) =>
        b.productId === project.id ||
        b.productName === project.productDetails?.productName ||
        b.productId === 'itm-mach-1'
    );
  }, [bomVersions, project]);

  const counts = useMemo(() => {
    if (!project) return {};
    const stages = project.stages ?? [];
    return {
      tasks: stages.reduce((n, s) => n + (s.tasks?.length ?? 0), 0),
      documents: stages.reduce((n, s) => n + (s.documents?.length ?? 0), 0),
      approvals: stages.reduce((n, s) => n + (s.approvals?.length ?? 0), 0),
      bom: relevantBoms.length,
      planning: plan?.requiredMaterials?.length ?? 0,
      labour: labourList.length,
      activity: project.activityLog?.length ?? 0,
      timeline: stages.length,
    };
  }, [project, relevantBoms, plan, labourList]);

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
        onAssignStage={() => setAssignStageId(currentStage?.id ?? '')}
        onSubmitForReview={() => currentStage && handleSubmitStage(currentStage)}
        onLogDelay={() => navigate(`/pms/delays?project=${project.id}`)}
        onCompleteProject={() => setConfirmComplete(true)}
      />

      {/* Manufacturing Hero Pipeline Card */}
      <ManufacturingHeroCard
        project={project}
        weightedProgress={weightedProgress}
        productionCost={productionCost}
        labourCost={labourCost}
        materialCost={materialCost}
        revenue={contractRevenue}
        profit={grossProfit}
        profitMargin={profitMargin}
        productionStatus={activeBatch?.status || (project.status === 'In Progress' ? 'In Production' : project.status)}
        currentStageName={currentStage?.name || 'Production & Fabrication'}
        onSelectTab={(tabId) => setTab(tabId)}
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
        {tab === 'bom' && (
          <ProjectBomTab
            project={project}
            onOpenCompare={() => setBomCompareOpen(true)}
          />
        )}
        {tab === 'planning' && <ProjectMaterialPlanningTab project={project} />}
        {tab === 'consumption' && <ProjectMaterialConsumptionTab project={project} />}
        {tab === 'labour' && <ProjectLabourTab project={project} />}
        {tab === 'costing' && <ProjectCostingTab project={project} />}
        {tab === 'quality' && <ProjectQualityReworkTab project={project} />}
        {tab === 'packaging' && <ProjectPackagingTab project={project} />}
        {tab === 'dispatch' && <ProjectDispatchTab project={project} />}
        {tab === 'profitability' && <ProjectProfitabilityTab project={project} />}
        {tab === 'activity' && <ActivityAuditTab project={project} />}
      </div>

      <BomCompareModal
        isOpen={bomCompareOpen}
        onClose={() => setBomCompareOpen(false)}
        availableVersions={relevantBoms}
      />

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
