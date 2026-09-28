import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Package, Calendar, Clock, CheckCircle2, AlertTriangle, ArrowLeft,
  RefreshCw, ShieldCheck, FileText, ExternalLink, ChevronRight, Eye,
  Sparkles, Layers, Info, Check, Circle, Building2, Download, AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { fetchCustomerProjectTracking } from '../../../services/customerTrackingService';
import { useAppStore } from '../../../stores/appStore';

function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(bytes) {
  if (!bytes || Number.isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function calculateRemainingTime(stage) {
  if (stage.status === 'Completed') {
    return stage.actualCompletionDateTime
      ? `Completed on ${formatDate(stage.actualCompletionDateTime)}`
      : 'Completed';
  }
  const target = stage.expectedCompletionDateTime || stage.startDateTime;
  if (!target) {
    if (stage.plannedDuration) {
      return `Planned duration: ${stage.plannedDuration} ${stage.durationUnit || 'Days'}`;
    }
    return 'Timeline pending';
  }
  const targetDate = new Date(target);
  const now = new Date();
  const diffDays = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} past target date`;
  }
  if (diffDays === 0) return 'Due today';
  return `${diffDays} day${diffDays === 1 ? '' : 's'} remaining`;
}

export default function CustomerTrackingPage() {
  const { id, projectId } = useParams();
  const projectLookup = id || projectId;
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!projectLookup) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await fetchCustomerProjectTracking(projectLookup);
      if (!data) {
        setError('Project tracking details not found or access denied.');
      } else {
        setProject(data);
        // Default selected stage: current stage or first in-progress/upcoming stage
        if (!selectedStageId && data.stages?.length > 0) {
          const active = data.stages.find((s) => s.status === 'In Progress' || s.status === 'Delayed') || data.stages[0];
          setSelectedStageId(active?.id || data.stages[0]?.id);
        }
      }
    } catch (err) {
      console.error('Failed to load customer project tracking:', err);
      if (err?.status === 403) {
        setError('You do not have authorization to view this customer project. Access is restricted to project owners.');
      } else if (err?.status === 404) {
        setError('The requested project could not be found.');
      } else {
        setError(err?.message || 'Failed to load project tracking. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectLookup, selectedStageId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedStage = useMemo(() => {
    if (!project?.stages) return null;
    return project.stages.find((s) => s.id === selectedStageId) || project.stages[0] || null;
  }, [project, selectedStageId]);

  // Stage classification for tracker styling
  const getStageMeta = (stage) => {
    const isCompleted = stage.status === 'Completed' || stage.status === 'Approved';
    const isDelayed = Boolean(stage.isDelayed || stage.status === 'Delayed');
    const isInProgress = stage.status === 'In Progress' || stage.status === 'Under Review' || stage.status === 'Assigned';
    const isUpcoming = !isCompleted && !isDelayed && !isInProgress;

    return {
      isCompleted,
      isDelayed,
      isInProgress,
      isUpcoming,
    };
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <div className="w-10 h-10 rounded-full border-3 border-blue-600 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">Loading Order & Project Tracking...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving latest dynamic stage progress</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Access Restricted or Unavailable</h2>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">{error || 'Project data could not be retrieved.'}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/customer/projects')}>
            <ArrowLeft size={14} className="mr-1.5" /> Back to My Projects
          </Button>
          <Button variant="primary" size="sm" onClick={() => loadData(true)}>
            <RefreshCw size={14} className="mr-1.5" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  const overallPct = project.overallCompletionPct ?? 0;

  return (
    <div className="space-y-5">
      {/* ── Top Bar: Back, Badge, Refresh ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            to="/customer/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft size={14} />
            <span>All Projects</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-semibold text-slate-500 font-mono">{project.code}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Verified Customer Tracking</span>
          </span>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            title="Refresh latest updates"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* ── Section 3: Customer Project Header ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Product & Project Identifiers */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-start gap-4">
              {/* Product Thumbnail or Styled Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                {project.productImage ? (
                  <img
                    src={project.productImage}
                    alt={project.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package size={32} className="text-blue-600" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                    {project.code}
                  </span>
                  {project.orderNumber && (
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Order: {project.orderNumber}
                    </span>
                  )}
                  <StatusBadge status={project.status || 'In Progress'} />
                </div>

                <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {project.productName}
                </h1>

                {project.customerName && (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <Building2 size={13} className="text-slate-400" />
                    <span>Customer: <strong className="font-semibold text-slate-700">{project.customerName}</strong></span>
                  </p>
                )}
              </div>
            </div>

            {/* Specifications if present */}
            {project.specifications && (
              <div className="text-xs text-slate-600 bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-start gap-2">
                <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{project.specifications}</span>
              </div>
            )}
          </div>

          {/* Progress Gauge & Milestones Summary */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 pt-4 lg:pt-0 lg:border-l lg:border-slate-100 lg:pl-6">
            {/* Overall Progress Card */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overall Progress</span>
              <div className="my-1.5">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">{overallPct}%</span>
                  <span className="text-[11px] font-semibold text-blue-600">
                    {overallPct === 100 ? 'Completed' : 'On Track'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, overallPct))}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-400">Weighted stage rollup</span>
            </div>

            {/* Current Stage Card */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Current Stage</span>
              <div className="my-1">
                <p className="text-sm font-bold text-slate-900 line-clamp-1">
                  {project.currentStage?.name || 'In Production'}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-600">
                    {project.currentStage?.completionPct ?? 0}% Complete
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400">
                {project.currentStage?.status || 'Active'}
              </span>
            </div>

            {/* Expected Delivery Date Card */}
            <div className="col-span-2 sm:col-span-1 lg:col-span-2 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-xl p-3.5 border border-blue-100/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar size={18} />
                </span>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Expected Delivery</p>
                  <p className="text-sm font-bold text-slate-900">
                    {formatDate(project.expectedDeliveryDate)}
                  </p>
                </div>
              </div>
              {project.actualCompletionDate && (
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-emerald-600">Delivered On</p>
                  <p className="text-xs font-bold text-slate-800">{formatDate(project.actualCompletionDate)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Dynamic E-Commerce Stage Tracker ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers size={18} className="text-blue-600" />
              <span>Project Stages & Live Milestones</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any stage below to inspect progress, milestones, and customer evidence.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {project.stages?.length || 0} Dynamic PMS Stages
          </span>
        </div>

        {/* ── Desktop Horizontal Step Tracker ── */}
        <div className="hidden md:block overflow-x-auto pb-4 pt-2">
          <div className="flex items-start min-w-[700px] justify-between relative">
            {/* Connecting baseline line */}
            <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

            {project.stages?.map((stage, idx) => {
              const meta = getStageMeta(stage);
              const isSelected = stage.id === selectedStageId;

              let nodeBg = 'bg-white border-2 border-slate-300 text-slate-400';
              let badgeColor = 'bg-slate-100 text-slate-600';
              let lineHighlight = false;

              if (meta.isCompleted) {
                nodeBg = 'bg-emerald-600 border-2 border-emerald-600 text-white shadow-xs';
                badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                lineHighlight = true;
              } else if (meta.isDelayed) {
                nodeBg = 'bg-rose-500 border-2 border-rose-600 text-white shadow-xs animate-pulse';
                badgeColor = 'bg-rose-50 text-rose-700 border border-rose-200';
              } else if (meta.isInProgress) {
                nodeBg = 'bg-blue-600 border-2 border-blue-600 text-white shadow-sm ring-4 ring-blue-100';
                badgeColor = 'bg-blue-50 text-blue-700 border border-blue-200';
              }

              return (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`flex flex-col items-center text-center group cursor-pointer relative z-10 max-w-[130px] flex-1 transition-all ${
                    isSelected ? 'scale-105' : 'hover:scale-102'
                  }`}
                >
                  {/* Stage Icon Node */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${nodeBg} ${
                      isSelected ? 'ring-3 ring-offset-2 ring-blue-500' : ''
                    }`}
                  >
                    {meta.isCompleted && <Check size={18} strokeWidth={2.5} />}
                    {meta.isDelayed && <AlertTriangle size={18} strokeWidth={2.5} />}
                    {meta.isInProgress && <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />}
                    {meta.isUpcoming && <Circle size={14} className="text-slate-400" />}
                  </div>

                  {/* Stage Name */}
                  <span
                    className={`mt-2.5 text-xs font-bold leading-tight px-1 line-clamp-2 ${
                      isSelected ? 'text-blue-600 font-extrabold' : 'text-slate-800'
                    }`}
                  >
                    {stage.name}
                  </span>

                  {/* Stage Status & Weight % Tag */}
                  <div className="mt-1 flex flex-col items-center gap-0.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
                      {stage.status}
                    </span>
                    {meta.isInProgress && (
                      <span className="text-[10px] font-bold text-blue-600">
                        {stage.completionPct}% Complete
                      </span>
                    )}
                    {stage.percentage > 0 && (
                      <span className="text-[9.5px] text-slate-400">
                        Weight: {stage.percentage}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Mobile Vertical Step Tracker ── */}
        <div className="md:hidden space-y-4">
          {project.stages?.map((stage, idx) => {
            const meta = getStageMeta(stage);
            const isSelected = stage.id === selectedStageId;
            const isLast = idx === (project.stages?.length || 0) - 1;

            let dotColor = 'bg-slate-300 text-slate-500';
            if (meta.isCompleted) dotColor = 'bg-emerald-600 text-white';
            else if (meta.isDelayed) dotColor = 'bg-rose-500 text-white';
            else if (meta.isInProgress) dotColor = 'bg-blue-600 text-white ring-4 ring-blue-100';

            return (
              <div key={stage.id} className="relative flex items-start gap-3">
                {/* Connecting Vertical Line */}
                {!isLast && (
                  <div className="absolute left-4 top-8 bottom--2 w-0.5 bg-slate-200 -z-0" />
                )}

                {/* Status Dot */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${dotColor}`}
                >
                  {meta.isCompleted && <Check size={14} strokeWidth={2.5} />}
                  {meta.isDelayed && <AlertTriangle size={14} strokeWidth={2.5} />}
                  {meta.isInProgress && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                  {meta.isUpcoming && <Circle size={10} />}
                </div>

                {/* Stage Info Card */}
                <div
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`flex-1 rounded-xl p-3 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/50 border-blue-300 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{stage.name}</span>
                    <StatusBadge status={stage.status} />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Progress: <strong>{stage.completionPct}%</strong></span>
                    {stage.percentage > 0 && <span>Weight: {stage.percentage}%</span>}
                  </div>

                  {meta.isInProgress && (
                    <div className="mt-1.5 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${stage.completionPct}%` }}
                      />
                    </div>
                  )}

                  {meta.isDelayed && stage.delayNotice && (
                    <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
                      <strong>Delayed</strong> — New Expected Date: {formatDate(stage.delayNotice.newExpectedDate)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 4: Stage Details Card (When Customer Opens a Stage) ── */}
      {selectedStage && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                #{selectedStage.sequence}
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedStage.name}</h3>
                <p className="text-xs text-slate-500">
                  {selectedStage.department ? `Department: ${selectedStage.department}` : 'Production Stage'} • Stage Weight: <strong>{selectedStage.percentage}%</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={selectedStage.status} />
            </div>
          </div>

          {/* Delayed Stage Customer-Safe Notice (Section 5) */}
          {selectedStage.isDelayed && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900">
                  {selectedStage.name} — Delayed
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Production schedule has been updated.
                  {selectedStage.delayNotice?.newExpectedDate && (
                    <> New Expected Date: <strong className="font-semibold text-rose-950">{formatDate(selectedStage.delayNotice.newExpectedDate)}</strong></>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Key Stage Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10.5px] uppercase font-bold text-slate-400">Progress</p>
              <p className="text-lg font-black text-slate-800 mt-0.5">{selectedStage.completionPct}%</p>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${selectedStage.completionPct}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10.5px] uppercase font-bold text-slate-400">Start Date</p>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {formatDate(selectedStage.actualStartDateTime || selectedStage.startDateTime)}
              </p>
              <span className="text-[10px] text-slate-400">
                {selectedStage.actualStartDateTime ? 'Actual start' : 'Scheduled start'}
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10.5px] uppercase font-bold text-slate-400">Expected Date</p>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {formatDate(selectedStage.expectedCompletionDateTime)}
              </p>
              <span className="text-[10px] text-slate-400">Target completion</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10.5px] uppercase font-bold text-slate-400">Actual Completion</p>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {selectedStage.actualCompletionDateTime ? formatDate(selectedStage.actualCompletionDateTime) : 'In Progress'}
              </p>
              <span className="text-[10px] text-slate-400">
                {calculateRemainingTime(selectedStage)}
              </span>
            </div>
          </div>

          {/* Customer-Visible Description */}
          {selectedStage.description && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Stage Overview
              </h4>
              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                {selectedStage.description}
              </div>
            </div>
          )}

          {/* Customer-Visible Images, Documents & Evidence */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Customer Evidence & Documents</span>
              <span className="text-[11px] font-normal text-slate-400">
                {selectedStage.documents?.length || 0} file(s) available
              </span>
            </h4>

            {selectedStage.documents && selectedStage.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedStage.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={doc.fileName}>
                          {doc.fileName}
                        </p>
                        <p className="text-[10.5px] text-slate-400">
                          {formatFileSize(doc.fileSize)} • v{doc.version || 1} • {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {doc.approvalStatus && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          doc.approvalStatus === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {doc.approvalStatus}
                        </span>
                      )}
                      {doc.previewUrl && (
                        <a
                          href={doc.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View / Download"
                        >
                          <Eye size={15} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                No customer documents or proofs uploaded for this stage yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Footer Notice ── */}
      <div className="text-center py-4">
        <p className="text-[11px] text-slate-400">
          This tracking page displays live dynamic stages directly synchronized from the Project Management System (PMS).
        </p>
      </div>
    </div>
  );
}
