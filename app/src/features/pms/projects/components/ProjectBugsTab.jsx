import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  X,
  User,
  ArrowRight
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { 
  fetchProjectBugs, 
  createProjectBug, 
  updateProjectBug 
} from '../../../../services/upgradeService';

export function ProjectBugsTab({ project }) {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBug, setNewBug] = useState({
    title: '',
    severity: 'Medium',
    description: '',
    assigned_to: '',
  });

  const loadBugs = async () => {
    if (!project?.id) return;
    setLoading(true);
    try {
      const res = await fetchProjectBugs({ project: project.id });
      if (res?.data && Array.isArray(res.data)) {
        setBugs(res.data);
      } else if (Array.isArray(res)) {
        setBugs(res);
      }
    } catch (err) {
      console.error('Failed to load project bugs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBugs();
  }, [project?.id]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProjectBug({
        project: project.id,
        title: newBug.title,
        severity: newBug.severity,
        description: newBug.description,
        assigned_to: newBug.assigned_to || undefined,
        status: 'Reported',
      });
      setShowCreateModal(false);
      setNewBug({
        title: '',
        severity: 'Medium',
        description: '',
        assigned_to: '',
      });
      loadBugs();
    } catch (err) {
      alert('Failed to report bug: ' + (err.message || 'Unknown error'));
    }
  };

  const handleAdvanceStatus = async (bug) => {
    const nextStatus = 
      bug.status === 'Reported' ? 'In Progress' :
      bug.status === 'In Progress' ? 'Resolved' :
      bug.status === 'Resolved' ? 'Closed' : 'Reported';
    try {
      await updateProjectBug(bug.id, { status: nextStatus });
      loadBugs();
    } catch (err) {
      alert('Failed to update bug status: ' + (err.message || 'Unknown error'));
    }
  };

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'Critical': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'High': return 'bg-red-50 text-red-700 border-red-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredBugs = bugs.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Bug className="text-rose-600" size={18} />
            Bugs & Defect Tracking
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Log technical bugs, quality failures, and assign resolutions for {project.title || project.name}
          </p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
          Report Defect / Bug
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 text-xs">
        {['ALL', 'Reported', 'In Progress', 'Resolved', 'Closed'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              statusFilter === st
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {st} ({st === 'ALL' ? bugs.length : bugs.filter(b => b.status === st).length})
          </button>
        ))}
      </div>

      {/* Bugs List */}
      <div className="space-y-2.5">
        {filteredBugs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
            {loading ? 'Loading defects...' : 'No bugs or defects recorded in this category.'}
          </div>
        ) : (
          filteredBugs.map((bug) => (
            <div
              key={bug.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 hover:border-slate-300 transition shadow-2xs text-xs"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${getSeverityStyle(bug.severity)}`}>
                    {bug.severity}
                  </span>
                  <span className="font-bold text-slate-900 text-[13px]">{bug.title}</span>
                </div>
                {bug.description && (
                  <p className="text-slate-600 text-xs line-clamp-2">{bug.description}</p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>Reported: {bug.created_at ? new Date(bug.created_at).toLocaleDateString() : 'Recent'}</span>
                  {bug.assigned_to_name && (
                    <span>• Assigned: <strong className="text-slate-700">{bug.assigned_to_name}</strong></span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  bug.status === 'Resolved' || bug.status === 'Closed'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : bug.status === 'In Progress'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {bug.status}
                </span>
                <button
                  onClick={() => handleAdvanceStatus(bug)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition flex items-center gap-1 cursor-pointer"
                  title="Advance Status"
                >
                  <span>Advance</span> <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Bug Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A] flex items-center gap-2">
                <Bug className="text-rose-600" size={16} /> Report Project Defect / Bug
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Defect Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coolant leak during high-RPM spindle test"
                  value={newBug.title}
                  onChange={(e) => setNewBug({ ...newBug, title: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Severity Level</label>
                <select
                  value={newBug.severity}
                  onChange={(e) => setNewBug({ ...newBug, severity: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                >
                  <option value="Low">Low — Cosmetic or minor issue</option>
                  <option value="Medium">Medium — Standard functional defect</option>
                  <option value="High">High — Key feature blocked</option>
                  <option value="Critical">Critical — Hardware safety or shipment blocker</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reproduction & Failure Steps</label>
                <textarea
                  rows={3}
                  placeholder="Steps to reproduce, error codes, or observed physical defects..."
                  value={newBug.description}
                  onChange={(e) => setNewBug({ ...newBug, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  File Defect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
