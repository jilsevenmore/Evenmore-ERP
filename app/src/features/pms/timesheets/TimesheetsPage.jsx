import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Clock, 
  Play, 
  Square, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Calendar, 
  DollarSign, 
  User, 
  Briefcase, 
  RefreshCw,
  AlertCircle,
  Trash2,
  Search,
  Filter,
  Zap,
  Timer,
  Check,
  ChevronDown,
  Info,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { 
  fetchTimesheetEntries,
  logTimesheetHours,
  submitTimesheet, 
  approveTimesheet, 
  rejectTimesheet,
  startTimesheetTimer,
  stopTimesheetTimer,
  deleteTimesheetEntry,
  getActiveTimesheetTimer
} from '../../../services/upgradeService';
import { usePmsStore } from '../../../stores/pmsStore';
import { useERP } from '../../../context/ERPContext';
import { useAppStore } from '../../../stores/appStore';
import { rowsOf } from '../../../services/resourceSync';

/** Who signs off timesheets (the server's PMS_MANAGERS). */
const PMS_MANAGERS = ['create_pms_project', 'assign_stage'];

/** Industry task presets with recommended standard hourly rates */
const TASK_PRESETS = [
  { name: 'Fabrication work', rate: 400, category: 'Production' },
  { name: 'CNC Machining', rate: 500, category: 'Machining' },
  { name: 'Assembly & Wiring', rate: 450, category: 'Assembly' },
  { name: 'CAD / Design Engineering', rate: 750, category: 'Design' },
  { name: 'Project Review & QA', rate: 900, category: 'Engineering' },
];

/** A logged entry as a table row; its approval state is its week's timesheet. */
function toRow(e) {
  return {
    id: e.id,
    timesheetId: e.timesheetId || e.timesheet_id,
    timesheetNumber: e.timesheetNumber || e.timesheet_number,
    work_date: e.date,
    projectId: e.projectId || e.project_id,
    project_name: typeof e.projectName === 'object' && e.projectName !== null ? (e.projectName.name || 'Project') : (e.projectName || e.project_name || e.projectCode || e.project_code || 'Project'),
    project_code: e.projectCode || e.project_code || '',
    task_name: e.taskName || e.task_name || e.description || 'General Work',
    hours: Number(e.durationHours ?? e.duration_hours ?? 0),
    hourly_rate: e.hourlyRate != null ? Number(e.hourlyRate) : (e.hourly_rate != null ? Number(e.hourly_rate) : null),
    status: (e.isRunning ?? e.is_running) ? 'Recording' : (e.timesheetStatus || e.timesheet_status || 'Draft'),
    userName: typeof e.userName === 'object' && e.userName !== null ? (e.userName.name || 'Engineer') : (e.userName || e.user_name || 'Engineer'),
    isBillable: e.isBillable ?? e.is_billable ?? true,
    startTime: e.startTime || e.start_time,
  };
}

function errorText(err) {
  return err?.payload?.message || err?.message || 'Unknown error';
}

function getProjectDisplayName(p) {
  if (!p) return 'Project';
  if (typeof p === 'string') return p;
  const title = typeof p.title === 'string' ? p.title : '';
  const prodName = typeof p.productDetails === 'object' && p.productDetails !== null
    ? (p.productDetails.productName || '')
    : (typeof p.productDetails === 'string' ? p.productDetails : '');
  const directProd = typeof p.product_name === 'string' ? p.product_name : '';
  const name = typeof p.name === 'string' ? p.name : '';
  const custName = typeof p.customerName === 'object' && p.customerName !== null
    ? (p.customerName.name || '')
    : (typeof p.customerName === 'string' ? p.customerName : (typeof p.customer_name === 'string' ? p.customer_name : ''));

  return title || prodName || directProd || name || custName || p.code || 'Project';
}

const timesheetGuide = {
  title: 'Engineering Timesheets & Live Stopwatch',
  subtitle: 'Accurately record billable labor hours, capture live stopwatch work intervals, and route weekly timesheets for manager approval.',
  purpose: 'Enables technicians, engineers, and workshop contributors to capture real-time task effort via a live stopwatch or manual entries, feeding accurate labor costs into multi-dimensional project profitability.',
  keyTerms: [
    { term: 'Live Stopwatch', definition: 'High-precision server timer capturing start/end timestamps and calculating active labor costs.' },
    { term: 'Task Hourly Rate', definition: 'Standard labor cost per hour based on skill category (Fabrication ₹400/hr, Machining ₹500/hr, CAD ₹750/hr, Review ₹900/hr).' },
    { term: 'Approval Routing', definition: 'Managerial sign-off transitioning logged hours from Draft to Approved & Posted.' },
  ],
  tips: [
    'Select a task preset below or adjust the hourly labor rate based on skill level and project contract.',
    'Start the live stopwatch before beginning fabrication, CNC machining, or CAD design work.',
  ],
  workflow: ['Select Project & Task', 'Choose or Enter Hourly Rate', 'Run Live Stopwatch / Log Hours', 'Submit Weekly Sheet', 'Manager Approval & Cost Posting'],
};

export const TimesheetsPage = () => {
  const { formatCurrency, showToast: erpToast } = useERP();
  const storeProjects = usePmsStore((s) => s.projects || []);
  const permissions = useAppStore((s) => s.permissions);
  const appToast = useAppStore((s) => s.showToast);
  const canApprove = PMS_MANAGERS.some((code) => (permissions || []).includes(code));

  const showToast = useCallback((msg, type = 'info') => {
    if (erpToast) { erpToast(msg); }
    else if (appToast) { appToast(msg); }
    else { console.log('[Toast]', msg); }
  }, [erpToast, appToast]);

  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Rate Helper popup toggle
  const [showRateGuide, setShowRateGuide] = useState(false);

  // Manual Log Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    project: '',
    task_name: '',
    hours: '2.0',
    hourly_rate: '500',
    work_date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  // Start timer state
  const [selectedProjectForTimer, setSelectedProjectForTimer] = useState('');
  const [timerTaskName, setTimerTaskName] = useState('');
  const [timerHourlyRate, setTimerHourlyRate] = useState('500');
  const [timerIsBillable, setTimerIsBillable] = useState(true);

  // Auto-hydrate PMS store so projects are always available
  useEffect(() => {
    usePmsStore.getState().hydrate?.().catch((err) => {
      console.warn('[Timesheets] Error hydrating PMS store:', err);
    });
  }, []);

  // Auto-select first available project if none is selected yet
  useEffect(() => {
    if (!selectedProjectForTimer && storeProjects.length > 0) {
      setSelectedProjectForTimer(storeProjects[0].id);
    }
  }, [storeProjects, selectedProjectForTimer]);

  const loadTimesheets = async () => {
    setLoading(true);
    try {
      console.log('[Timesheets] Fetching timesheet entries...');
      const res = await fetchTimesheetEntries({ page_size: 200 });
      console.log('[Timesheets] Timesheet entries response:', res);
      setTimesheets(rowsOf(res).map(toRow));
    } catch (err) {
      console.error('[Timesheets] Failed to load timesheets:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveTimer = async () => {
    try {
      console.log('[Timesheets] Checking active stopwatch timer...');
      const res = await getActiveTimesheetTimer().catch((err) => {
        console.warn('[Timesheets] Active timer check returned error/none:', err);
        return null;
      });
      console.log('[Timesheets] Active timer result:', res);
      if (res?.active && res.timer) {
        setActiveTimer(res.timer);
        const startTimeStr = res.timer.startTime || res.timer.start_time;
        const start = startTimeStr ? new Date(startTimeStr).getTime() : Date.now();
        setTimerSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
      } else {
        setActiveTimer(null);
      }
    } catch (err) {
      console.error('[Timesheets] Error checking active timer:', err);
    }
  };

  useEffect(() => {
    loadTimesheets();
    checkActiveTimer();
  }, []);

  // Timer interval
  useEffect(() => {
    let interval = null;
    if (activeTimer) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const handleStartTimer = async () => {
    const targetProjectId = selectedProjectForTimer || (storeProjects.length > 0 ? storeProjects[0].id : null);
    if (!targetProjectId) {
      showToast('Please select a project before starting the stopwatch.', 'error');
      console.warn('[Stopwatch] Cannot start timer: No project selected or available.');
      return;
    }
    if (!selectedProjectForTimer) {
      setSelectedProjectForTimer(targetProjectId);
    }

    const payload = {
      projectId: targetProjectId,
      description: timerTaskName || 'General Engineering Task',
      hourlyRate: timerHourlyRate ? parseFloat(timerHourlyRate) : null,
      isBillable: timerIsBillable,
    };

    console.log('[Stopwatch] Starting stopwatch timer with payload:', payload);
    try {
      const res = await startTimesheetTimer(payload);
      console.log('[Stopwatch] Started stopwatch successfully, server response:', res);
      setActiveTimer(res);
      setTimerSeconds(0);
      setTimerTaskName('');
      showToast('Live stopwatch started successfully!', 'success');
      loadTimesheets();
    } catch (err) {
      console.error('[Stopwatch] Failed to start stopwatch:', err);
      showToast('Failed to start stopwatch: ' + errorText(err), 'error');
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    console.log('[Stopwatch] Stopping active stopwatch timer ID:', activeTimer.id);
    try {
      const res = await stopTimesheetTimer(activeTimer.id);
      console.log('[Stopwatch] Stopwatch stopped successfully, server response:', res);
      setActiveTimer(null);
      setTimerSeconds(0);
      showToast('Stopwatch recorded and hours saved to timesheet.', 'success');
      loadTimesheets();
    } catch (err) {
      console.error('[Stopwatch] Failed to stop stopwatch:', err);
      showToast('Failed to stop stopwatch: ' + errorText(err), 'error');
    }
  };

  const handleDiscardTimer = async () => {
    if (!activeTimer) return;
    if (!window.confirm('Are you sure you want to discard this live stopwatch session without saving?')) {
      return;
    }
    console.log('[Stopwatch] Discarding live timer session ID:', activeTimer.id);
    try {
      await deleteTimesheetEntry(activeTimer.id);
      console.log('[Stopwatch] Discarded timer session successfully.');
      setActiveTimer(null);
      setTimerSeconds(0);
      showToast('Stopwatch session discarded.', 'info');
      loadTimesheets();
    } catch (err) {
      console.error('[Stopwatch] Failed to discard stopwatch session:', err);
      showToast('Failed to discard stopwatch session: ' + errorText(err), 'error');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this timesheet entry?')) return;
    console.log('[Timesheets] Deleting timesheet entry ID:', entryId);
    try {
      await deleteTimesheetEntry(entryId);
      console.log('[Timesheets] Deleted entry successfully.');
      showToast('Timesheet entry deleted.', 'info');
      loadTimesheets();
    } catch (err) {
      console.error('[Timesheets] Failed to delete timesheet entry:', err);
      showToast('Failed to delete timesheet entry: ' + errorText(err), 'error');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const targetProject = logForm.project || (storeProjects.length > 0 ? storeProjects[0].id : null);
    if (!targetProject) {
      showToast('Please select a project before logging hours.', 'error');
      return;
    }
    const payload = {
      projectId: targetProject,
      taskName: logForm.task_name,
      hours: parseFloat(logForm.hours) || 0,
      hourlyRate: logForm.hourly_rate === '' ? null : parseFloat(logForm.hourly_rate),
      date: logForm.work_date,
      description: logForm.description,
    };
    console.log('[Timesheets] Logging manual time:', payload);
    try {
      const res = await logTimesheetHours(payload);
      console.log('[Timesheets] Manual time logged successfully:', res);
      setShowLogModal(false);
      setLogForm({
        project: storeProjects[0]?.id || '',
        task_name: '',
        hours: '2.0',
        hourly_rate: '500',
        work_date: new Date().toISOString().slice(0, 10),
        description: '',
      });
      showToast('Work hours successfully logged to timesheet.', 'success');
      loadTimesheets();
    } catch (err) {
      console.error('[Timesheets] Failed to log time:', err);
      showToast('Failed to log time: ' + errorText(err), 'error');
    }
  };

  const handleSubmitForApproval = async (id, timesheetNum) => {
    console.log('[Timesheets] Submitting timesheet for approval ID:', id);
    try {
      await submitTimesheet(id);
      showToast('Timesheet submitted for manager approval.', 'success');
      loadTimesheets();
    } catch (err) {
      console.error('[Timesheets] Failed to submit timesheet:', err);
      showToast('Failed to submit timesheet: ' + errorText(err), 'error');
    }
  };

  const handleApprove = async (id) => {
    console.log('[Timesheets] Approving timesheet ID:', id);
    try {
      await approveTimesheet(id);
      showToast('Timesheet approved.', 'success');
      loadTimesheets();
    } catch (err) {
      console.error('[Timesheets] Failed to approve timesheet:', err);
      showToast('Failed to approve timesheet: ' + errorText(err), 'error');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejecting timesheet entry:');
    if (!reason) return;
    console.log('[Timesheets] Rejecting timesheet ID:', id, 'reason:', reason);
    try {
      await rejectTimesheet(id, reason);
      showToast('Timesheet rejected.', 'info');
      loadTimesheets();
    } catch (err) {
      console.error('[Timesheets] Failed to reject timesheet:', err);
      showToast('Failed to reject timesheet: ' + errorText(err), 'error');
    }
  };

  const formatTimerDisplay = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return {
      hours: String(hrs).padStart(2, '0'),
      minutes: String(mins).padStart(2, '0'),
      seconds: String(s).padStart(2, '0'),
    };
  };

  const handleApplyPreset = (preset) => {
    setTimerTaskName(preset.name);
    setTimerHourlyRate(String(preset.rate));
    if (!selectedProjectForTimer && storeProjects.length > 0) {
      setSelectedProjectForTimer(storeProjects[0].id);
    }
  };

  // Active timer details
  const activeProject = useMemo(() => {
    if (!activeTimer) return null;
    const projId = activeTimer.projectId || activeTimer.project_id;
    return storeProjects.find((p) => String(p.id) === String(projId)) || null;
  }, [activeTimer, storeProjects]);

  const activeRate = activeTimer?.hourlyRate || activeTimer?.hourly_rate || Number(timerHourlyRate) || 650;
  const liveCostAccrued = (timerSeconds / 3600) * Number(activeRate);

  // KPIs
  const totalHours = timesheets.reduce((acc, t) => acc + (Number(t.hours) || 0), 0);
  const totalLaborCost = timesheets.reduce((acc, t) => acc + (Number(t.hours || 0) * Number(t.hourly_rate || 0)), 0);
  const approvedHours = timesheets.filter((t) => t.status === 'Approved').reduce((acc, t) => acc + (Number(t.hours) || 0), 0);
  const pendingApprovals = new Set(timesheets.filter((t) => t.status === 'Submitted').map((t) => t.timesheetId)).size;

  // Filtered Entries
  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((t) => {
      // Status filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      // Project filter
      if (projectFilter !== 'ALL' && t.projectId !== projectFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesProject = (t.project_name || '').toLowerCase().includes(q);
        const matchesCode = (t.project_code || '').toLowerCase().includes(q);
        const matchesTask = (t.task_name || '').toLowerCase().includes(q);
        const matchesUser = (t.userName || '').toLowerCase().includes(q);
        if (!matchesProject && !matchesCode && !matchesTask && !matchesUser) return false;
      }
      return true;
    });
  }, [timesheets, statusFilter, projectFilter, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, projectFilter, searchQuery]);

  const pagedTimesheets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTimesheets.slice(start, start + pageSize);
  }, [filteredTimesheets, page, pageSize]);

  const formattedTimer = formatTimerDisplay(timerSeconds);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Engineering Timesheets & Live Stopwatch"
        subtitle="Track precision work hours across manufacturing projects, record live stopwatch intervals, and submit weekly sheets for manager approval."
        guide={timesheetGuide}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={RefreshCw} onClick={() => { loadTimesheets(); checkActiveTimer(); }}>
              Refresh
            </Button>
            <Button icon={Plus} onClick={() => setShowLogModal(true)}>
              Manual Time Log
            </Button>
          </div>
        }
      />

      {/* ─── LIVE WORK STOPWATCH HERO CARD (Light Project UI Theme) ───────── */}
      <div className={`rounded-2xl border transition-all duration-300 shadow-xs overflow-hidden ${
        activeTimer 
          ? 'bg-gradient-to-br from-rose-50/70 via-white to-amber-50/30 border-rose-300 shadow-rose-100/50' 
          : 'bg-white border-slate-200/90'
      }`}>
        {/* Stopwatch Card Header Banner */}
        <div className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-3 ${
          activeTimer 
            ? 'bg-rose-100/60 border-rose-200' 
            : 'bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border-slate-200/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl grid place-items-center shadow-xs ${
              activeTimer 
                ? 'bg-rose-500 text-white' 
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}>
              <Clock size={22} className={activeTimer ? 'animate-spin' : ''} style={{ animationDuration: '6s' }} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-base">
                  Live Work Stopwatch
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase ${
                  activeTimer 
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse' 
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {activeTimer ? 'Recording Active' : 'Standby'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTimer 
                  ? 'Capturing real-time interval effort and calculating live labor cost' 
                  : 'Select project, deliverable, and hourly labor rate to begin live tracking'}
              </p>
            </div>
          </div>

          {/* Rate Decision Helper Pill / Button */}
          {!activeTimer && (
            <button
              type="button"
              onClick={() => setShowRateGuide(!showRateGuide)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-white hover:bg-blue-50/80 border border-blue-200 rounded-lg shadow-2xs transition cursor-pointer"
            >
              <HelpCircle size={14} className="text-primary" />
              <span>How to decide Hourly Rate?</span>
            </button>
          )}
        </div>

        {/* Expandable Hourly Rate Decision Guide */}
        {showRateGuide && !activeTimer && (
          <div className="p-4 bg-blue-50/60 border-b border-blue-100 text-xs text-slate-700 animate-in fade-in duration-150">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={14} className="text-primary" />
                  How is a Task Hourly Rate decided?
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                    <span className="font-semibold text-slate-800 block text-[11px]">1. Skill Level / Role Standard</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Production & Fabrication: ₹350–₹450/hr<br />
                      CNC & Precision Machining: ₹500–₹650/hr<br />
                      CAD Design & Engineering: ₹750–₹900/hr
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                    <span className="font-semibold text-slate-800 block text-[11px]">2. Project Client Contract</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Client-agreed billing rate from project quotation or labor budget agreements.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                    <span className="font-semibold text-slate-800 block text-[11px]">3. Quick Presets</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Click any preset chip below to auto-fill the deliverable name and recommended hourly rate.
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowRateGuide(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Stopwatch Body: Active vs Idle */}
        <div className="p-5 sm:p-6">
          {activeTimer ? (
            /* ── ACTIVE RECORDING STATE (Light Theme) ── */
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Active Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary text-white shadow-2xs">
                    {activeProject ? getProjectDisplayName(activeProject) : (typeof activeTimer.projectName === 'string' ? activeTimer.projectName : (typeof activeTimer.project_name === 'string' ? activeTimer.project_name : 'Active Project'))}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Started at {activeTimer.startTime || activeTimer.start_time ? new Date(activeTimer.startTime || activeTimer.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                  </span>
                </div>

                <h3 className="font-bold text-xl text-slate-900">
                  {activeTimer.description || activeTimer.taskName || 'Engineering Workshop Task'}
                </h3>

                <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                  <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 font-mono">
                    Rate: ₹{activeRate}/hr
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-emerald-700 font-semibold">Billable Client Work</span>
                </div>
              </div>

              {/* Digital Stopwatch Counter & Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-slate-200/80 pt-4 lg:pt-0">
                {/* LCD Display */}
                <div className="text-left sm:text-right">
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <div className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-2xl sm:text-3xl font-black text-slate-800 shadow-2xs">
                      {formattedTimer.hours}
                    </div>
                    <span className="text-rose-500 font-black text-xl animate-pulse">:</span>
                    <div className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-2xl sm:text-3xl font-black text-slate-800 shadow-2xs">
                      {formattedTimer.minutes}
                    </div>
                    <span className="text-rose-500 font-black text-xl animate-pulse">:</span>
                    <div className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-2xl sm:text-3xl font-black text-slate-800 shadow-2xs">
                      {formattedTimer.seconds}
                    </div>
                  </div>

                  {/* Accrued Cost Ticker */}
                  <div className="flex items-center sm:justify-end gap-1.5 mt-2 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    <Zap size={13} className="text-emerald-600 animate-bounce" />
                    <span>Accrued: {formatCurrency(liveCostAccrued)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleStopTimer}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <Square size={14} className="fill-white" /> Stop & Log Hours
                  </button>
                  <button
                    onClick={handleDiscardTimer}
                    title="Discard without saving"
                    className="p-2.5 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition cursor-pointer border border-slate-200 shadow-2xs text-xs"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ── IDLE / SETUP CONTROLS STATE (Light Theme) ── */
            <div className="space-y-4">
              {/* Quick Task & Rate Presets */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Quick Select Task & Recommended Rate:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {TASK_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                        timerTaskName === p.name
                          ? 'bg-blue-50 text-primary border-primary shadow-2xs font-semibold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{p.name}</span>
                      <span className="font-mono text-[11px] text-slate-500 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        ₹{p.rate}/hr
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Form Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end pt-1">
                {/* Target Project Dropdown */}
                <div className="lg:col-span-4">
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Target Project *
                  </label>
                  <div className="relative">
                    <select
                      value={selectedProjectForTimer}
                      onChange={(e) => setSelectedProjectForTimer(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-300 hover:border-slate-400 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-slate-800 text-xs appearance-none transition outline-hidden pr-8 cursor-pointer shadow-2xs"
                    >
                      <option value="">Select Project ({storeProjects.length} available)...</option>
                      {storeProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code ? `[${p.code}] ` : ''}{getProjectDisplayName(p)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Task / Deliverable Input */}
                <div className="lg:col-span-4">
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Task Deliverable / Description *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fabrication work, CNC machining, Wiring..."
                    value={timerTaskName}
                    onChange={(e) => setTimerTaskName(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-slate-300 hover:border-slate-400 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-slate-800 text-xs placeholder-slate-400 transition outline-hidden shadow-2xs"
                  />
                </div>

                {/* Hourly Rate */}
                <div className="sm:col-span-1 lg:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Hourly Rate (₹/hr) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={timerHourlyRate}
                      onChange={(e) => setTimerHourlyRate(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-300 hover:border-slate-400 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-slate-800 text-xs font-mono transition outline-hidden shadow-2xs"
                    />
                  </div>
                </div>

                {/* Start Button */}
                <div className="sm:col-span-1 lg:col-span-2">
                  <button
                    onClick={handleStartTimer}
                    className="w-full py-2 px-4 bg-primary hover:bg-primary-hover active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <Play size={14} className="fill-white" /> Start Stopwatch
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── KPI METRIC CARDS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Logged Hours"
          value={`${totalHours.toFixed(1)} hrs`}
          icon={Clock}
          subtext="Total captured workshop time"
        />
        <StatCard
          label="Total Labor Cost Incurred"
          value={formatCurrency(totalLaborCost)}
          icon={DollarSign}
          subtext="Hours × Effective hourly rate"
        />
        <StatCard
          label="Approved Billable Hours"
          value={`${approvedHours.toFixed(1)} hrs`}
          icon={CheckCircle2}
          trend={{ positive: true, text: 'Authorized by project manager' }}
        />
        <StatCard
          label="Pending Approvals"
          value={`${pendingApprovals} Week${pendingApprovals === 1 ? '' : 's'}`}
          icon={AlertCircle}
          highlight={pendingApprovals > 0}
          trend={{ positive: false, text: 'Awaiting manager signoff' }}
        />
      </div>

      {/* ─── LOGGED WORK ENTRIES TABLE & TOOLBAR ─────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        {/* Table Header & Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-slate-800 text-base">Logged Work Entries</h3>
              <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                {filteredTimesheets.length} / {timesheets.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual work logs, stopwatch intervals, and weekly manager signoff routing
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search project or task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-primary"
              />
            </div>

            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="py-1.5 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Projects</option>
              {storeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code ? `[${p.code}] ` : ''}{getProjectDisplayName(p)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-100/60 border-b border-slate-200/80 overflow-x-auto text-xs">
          {[
            { id: 'ALL', label: 'All Entries' },
            { id: 'Draft', label: 'Drafts' },
            { id: 'Submitted', label: 'Pending Signoff' },
            { id: 'Approved', label: 'Approved & Posted' },
            { id: 'Rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white text-primary shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold text-slate-700">Date</th>
                <th className="py-3 px-4 font-semibold text-slate-700">Project</th>
                <th className="py-3 px-4 font-semibold text-slate-700">Task Deliverable</th>
                <th className="py-3 px-4 text-center font-semibold text-slate-700">Hours</th>
                <th className="py-3 px-4 text-right font-semibold text-slate-700">Hourly Rate</th>
                <th className="py-3 px-4 text-right font-semibold text-slate-700">Labor Cost</th>
                <th className="py-3 px-4 text-center font-semibold text-slate-700">Status</th>
                <th className="py-3 px-4 text-center font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTimesheets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock size={32} className="text-slate-300" />
                      <p className="font-medium text-slate-500">
                        {loading 
                          ? 'Loading timesheet entries...' 
                          : searchQuery || statusFilter !== 'ALL' || projectFilter !== 'ALL'
                            ? 'No entries match your search/filter criteria.'
                            : 'No logged timesheet hours found. Start the live stopwatch or log time manually.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedTimesheets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {t.work_date 
                        ? new Date(t.work_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-primary">{t.project_name}</div>
                      {t.project_code && (
                        <div className="text-[10px] text-slate-400 font-mono">{t.project_code}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{t.task_name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <User size={11} className="text-slate-400" /> {t.userName}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 whitespace-nowrap">
                      {Number(t.hours).toFixed(1)} hrs
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      {t.hourly_rate != null ? `Rs ${t.hourly_rate}/hr` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {t.hourly_rate != null ? formatCurrency(Number(t.hours || 0) * t.hourly_rate) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        t.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        t.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        t.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        t.status === 'Recording' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {t.status === 'Approved' && <Check size={11} />}
                        {t.status || 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {(t.status === 'Draft' || t.status === 'Rejected') && t.timesheetId && (
                          <button
                            onClick={() => handleSubmitForApproval(t.timesheetId, t.timesheetNumber)}
                            title={`Submit week for approval (${t.timesheetNumber || 'timesheet'})`}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-[11px] transition cursor-pointer"
                          >
                            Submit Week
                          </button>
                        )}
                        {(t.status === 'Draft' || t.status === 'Rejected') && (
                          <button
                            onClick={() => handleDeleteEntry(t.id)}
                            title="Delete entry"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {t.status === 'Submitted' && !canApprove && (
                          <span className="text-[11px] text-blue-600 font-medium">Awaiting approval</span>
                        )}
                        {t.status === 'Submitted' && canApprove && (
                          <>
                            <button
                              onClick={() => handleApprove(t.timesheetId)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] transition cursor-pointer shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(t.timesheetId)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold text-[11px] transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {t.status === 'Approved' && (
                          <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1">
                            <Check size={12} /> Posted
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredTimesheets.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2">
            <Pagination
              total={filteredTimesheets.length}
              page={page}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              onChange={setPage}
            />
          </div>
        )}
      </div>

      {/* ─── MANUAL TIME LOG MODAL ───────────────────────────────────────── */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-[#1F2E4A]">Log Engineering Work Hours</h3>
                <p className="text-xs text-slate-500 mt-0.5">Add work interval manually to your current weekly timesheet</p>
              </div>
              <button 
                onClick={() => setShowLogModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 mt-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Project *</label>
                <select
                  required
                  value={logForm.project}
                  onChange={(e) => setLogForm({ ...logForm, project: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
                >
                  <option value="">Select Project...</option>
                  {storeProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code ? `[${p.code}] ` : ''}{getProjectDisplayName(p)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Task Deliverable *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electrical panel wiring and testing"
                  value={logForm.task_name}
                  onChange={(e) => setLogForm({ ...logForm, task_name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hours Spent *</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    required
                    value={logForm.hours}
                    onChange={(e) => setLogForm({ ...logForm, hours: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Labor Rate (₹/hr)</label>
                  <input
                    type="number"
                    value={logForm.hourly_rate}
                    onChange={(e) => setLogForm({ ...logForm, hourly_rate: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Work Date *</label>
                <input
                  type="date"
                  required
                  value={logForm.work_date}
                  onChange={(e) => setLogForm({ ...logForm, work_date: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Work Description / Summary</label>
                <textarea
                  rows={2}
                  placeholder="Summary of deliverables completed during this work session..."
                  value={logForm.description}
                  onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold shadow-xs transition cursor-pointer"
                >
                  Post Timesheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetsPage;
