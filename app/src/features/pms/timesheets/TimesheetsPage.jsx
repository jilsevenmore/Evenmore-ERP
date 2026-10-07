import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Button } from '../../../components/ui/Button';
import { 
  fetchTimesheets, 
  createTimesheet, 
  submitTimesheet, 
  approveTimesheet, 
  rejectTimesheet,
  startTimesheetTimer,
  stopTimesheetTimer,
  getActiveTimesheetTimer
} from '../../../services/upgradeService';
import { usePmsStore } from '../../../stores/pmsStore';
import { useERP } from '../../../context/ERPContext';

const timesheetGuide = {
  title: 'Engineering Timesheets & Live Timer',
  subtitle: 'Accurately record billable labor hours, capture live stopwatch work intervals, and route weekly timesheets for approval.',
  purpose: 'Enables technicians, engineers, and project contributors to capture real-time task effort via a live stopwatch or manual entries, feeding accurate labor costs into multi-dimensional project profitability.',
  keyTerms: [
    { term: 'Live Timer', definition: 'Stopwatch running on the server capturing exact start and stop timestamps.' },
    { term: 'Timesheet Entry', definition: 'Single work block logged against a specific project and deliverable task.' },
    { term: 'Approval Routing', definition: 'Managerial sign-off transitioning logged hours from Draft to Approved.' },
  ],
  tips: [
    'Start the live timer before beginning CNC machining or design work.',
    'Timesheet hours automatically factor into project labor cost at the employee rate.',
  ],
  workflow: ['Start Timer / Log Hours', 'Review Weekly Backlog', 'Submit for Approval', 'Manager Signoff & Cost Posting'],
};

export const TimesheetsPage = () => {
  const { formatCurrency } = useERP();
  const storeProjects = usePmsStore((s) => s.projects || []);
  const currentUserId = usePmsStore((s) => s.currentUserId);

  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Manual Log Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    project: '',
    task_name: '',
    hours: '2.0',
    hourly_rate: '650',
    work_date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  // Start timer dropdown
  const [selectedProjectForTimer, setSelectedProjectForTimer] = useState('');
  const [timerTaskName, setTimerTaskName] = useState('');

  const loadTimesheets = async () => {
    setLoading(true);
    try {
      const res = await fetchTimesheets().catch(() => null);
      if (res?.data && Array.isArray(res.data)) {
        setTimesheets(res.data);
      } else if (Array.isArray(res)) {
        setTimesheets(res);
      }
    } catch (err) {
      console.error('Failed to load timesheets:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveTimer = async () => {
    try {
      const res = await getActiveTimesheetTimer().catch(() => null);
      if (res?.data?.active && res.data.entry) {
        setActiveTimer(res.data.entry);
        const start = new Date(res.data.entry.start_time).getTime();
        setTimerSeconds(Math.floor((Date.now() - start) / 1000));
      } else if (res?.active && res.entry) {
        setActiveTimer(res.entry);
        const start = new Date(res.entry.start_time).getTime();
        setTimerSeconds(Math.floor((Date.now() - start) / 1000));
      } else {
        setActiveTimer(null);
      }
    } catch (err) {
      console.error('Error checking active timer:', err);
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
    if (!selectedProjectForTimer) {
      alert('Please select a project before starting the timer.');
      return;
    }
    try {
      const res = await startTimesheetTimer({
        project: selectedProjectForTimer,
        task_name: timerTaskName || 'General Engineering Task',
      });
      setActiveTimer(res.data || res);
      setTimerSeconds(0);
      setTimerTaskName('');
    } catch (err) {
      alert('Failed to start timer: ' + (err.message || 'Unknown error'));
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    try {
      await stopTimesheetTimer({ entry_id: activeTimer.id });
      setActiveTimer(null);
      setTimerSeconds(0);
      loadTimesheets();
      alert('Timer stopped and work hours logged successfully!');
    } catch (err) {
      alert('Failed to stop timer: ' + (err.message || 'Unknown error'));
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTimesheet({
        project: logForm.project,
        task_name: logForm.task_name,
        hours: parseFloat(logForm.hours) || 1,
        hourly_rate: parseFloat(logForm.hourly_rate) || 650,
        work_date: logForm.work_date,
        description: logForm.description,
        status: 'Draft',
      });
      setShowLogModal(false);
      setLogForm({
        project: '',
        task_name: '',
        hours: '2.0',
        hourly_rate: '650',
        work_date: new Date().toISOString().slice(0, 10),
        description: '',
      });
      loadTimesheets();
    } catch (err) {
      alert('Failed to log time: ' + (err.message || 'Unknown error'));
    }
  };

  const handleSubmitForApproval = async (id) => {
    try {
      await submitTimesheet(id);
      loadTimesheets();
    } catch (err) {
      alert('Failed to submit timesheet: ' + (err.message || 'Unknown error'));
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveTimesheet(id);
      loadTimesheets();
    } catch (err) {
      alert('Failed to approve timesheet: ' + (err.message || 'Unknown error'));
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejecting timesheet entry:');
    if (!reason) return;
    try {
      await rejectTimesheet(id, reason);
      loadTimesheets();
    } catch (err) {
      alert('Failed to reject timesheet: ' + (err.message || 'Unknown error'));
    }
  };

  const formatTimerDisplay = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // KPIs
  const totalHours = timesheets.reduce((acc, t) => acc + (Number(t.hours) || 0), 0);
  const totalLaborCost = timesheets.reduce((acc, t) => acc + (Number(t.hours || 0) * Number(t.hourly_rate || 650)), 0);
  const approvedHours = timesheets.filter(t => t.status === 'Approved').reduce((acc, t) => acc + (Number(t.hours) || 0), 0);
  const pendingApprovals = timesheets.filter(t => t.status === 'Submitted' || t.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Engineering Timesheets & Live Stopwatch"
        subtitle="Track precision work hours across manufacturing projects, record live stopwatch intervals, and submit weekly sheets for manager approval."
        guide={timesheetGuide}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={RefreshCw} onClick={loadTimesheets}>
              Refresh
            </Button>
            <Button icon={Plus} onClick={() => setShowLogModal(true)}>
              Manual Time Log
            </Button>
          </div>
        }
      />

      {/* Live Timer Widget Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl grid place-items-center ${activeTimer ? 'bg-rose-500 animate-pulse text-white' : 'bg-slate-700 text-slate-300'}`}>
            <Clock size={24} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              Live Work Stopwatch
              {activeTimer && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  RECORDING
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTimer ? `Tracking: ${activeTimer.task_name || 'Active Task'}` : 'Select a project and task to start recording billable hours'}
            </p>
          </div>
        </div>

        {activeTimer ? (
          <div className="flex items-center gap-4">
            <span className="font-mono text-3xl font-extrabold tracking-wider text-emerald-400">
              {formatTimerDisplay(timerSeconds)}
            </span>
            <button
              onClick={handleStopTimer}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md"
            >
              <Square size={14} /> Stop & Log Hours
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedProjectForTimer}
              onChange={(e) => setSelectedProjectForTimer(e.target.value)}
              className="p-2 border border-slate-700 rounded-xl bg-slate-800 text-white text-xs w-52"
            >
              <option value="">Select Project...</option>
              {storeProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.title || p.name || p.customerName}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Task name / deliverable..."
              value={timerTaskName}
              onChange={(e) => setTimerTaskName(e.target.value)}
              className="p-2 border border-slate-700 rounded-xl bg-slate-800 text-white text-xs w-48 placeholder-slate-500"
            />
            <button
              onClick={handleStartTimer}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md"
            >
              <Play size={14} /> Start Timer
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Logged Hours"
          value={`${totalHours.toFixed(1)} hrs`}
          icon={Clock}
          subtext="Total captured labor time"
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
          value={`${pendingApprovals} Entries`}
          icon={AlertCircle}
          highlight={pendingApprovals > 0}
          trend={{ positive: false, text: 'Awaiting manager signoff' }}
        />
      </div>

      {/* Timesheets List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Logged Work Entries</h3>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
            {timesheets.length} entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Project</th>
                <th className="py-2.5 px-4">Task Deliverable</th>
                <th className="py-2.5 px-4 text-center">Hours</th>
                <th className="py-2.5 px-4 text-right">Hourly Rate</th>
                <th className="py-2.5 px-4 text-right">Labor Cost</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timesheets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    {loading ? 'Loading timesheets...' : 'No logged timesheet hours found. Start the live stopwatch or log time manually.'}
                  </td>
                </tr>
              ) : (
                timesheets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-700">
                      {t.work_date ? new Date(t.work_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-primary">{t.project_name || 'Project'}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{t.task_name}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">
                      {Number(t.hours).toFixed(1)} hrs
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                      Rs {t.hourly_rate || 650}/hr
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(Number(t.hours || 0) * Number(t.hourly_rate || 650))}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        t.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        t.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        t.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status || 'Draft'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {t.status === 'Draft' && (
                          <button
                            onClick={() => handleSubmitForApproval(t.id)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-semibold text-[11px] transition"
                          >
                            Submit
                          </button>
                        )}
                        {(t.status === 'Submitted' || t.status === 'Pending') && (
                          <>
                            <button
                              onClick={() => handleApprove(t.id)}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(t.id)}
                              className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-semibold text-[11px] transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {t.status === 'Approved' && (
                          <span className="text-[11px] text-emerald-600 font-medium">Posted</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Time Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">Log Engineering Work Hours</h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Project *</label>
                <select
                  required
                  value={logForm.project}
                  onChange={(e) => setLogForm({ ...logForm, project: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                >
                  <option value="">Select Project...</option>
                  {storeProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title || p.name || p.customerName}</option>
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
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hours Spent *</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    required
                    value={logForm.hours}
                    onChange={(e) => setLogForm({ ...logForm, hours: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Labor Rate (Rs/hr)</label>
                  <input
                    type="number"
                    value={logForm.hourly_rate}
                    onChange={(e) => setLogForm({ ...logForm, hourly_rate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
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
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Work Description / Summary</label>
                <textarea
                  rows={2}
                  placeholder="Summary of deliverables completed during this work session..."
                  value={logForm.description}
                  onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold shadow-xs"
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
