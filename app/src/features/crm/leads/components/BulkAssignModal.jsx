import React, { useState, useMemo } from 'react';
import { X, UserCheck, Users, Shuffle, Scale, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCrmStore } from '../../../../stores/crmStore';
import { bulkAssignLeads } from '../../../../services/upgradeService';

export default function BulkAssignModal({ isOpen, onClose, selectedLeads = [], onSuccess }) {
  const teamMembers = useCrmStore((s) => s.teamMembers || []);
  const leads = useCrmStore((s) => s.leads || []);

  const [strategy, setStrategy] = useState('single'); // 'single' | 'round_robin' | 'capacity_weighted'
  const [selectedRepId, setSelectedRepId] = useState('');
  const [selectedRepIds, setSelectedRepIds] = useState([]);
  const [transferTasks, setTransferTasks] = useState(true);
  const [reason, setReason] = useState('Territory reallocation');
  const [sendNotification, setSendNotification] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Compute workload for each rep (current active lead count)
  const repWorkloads = useMemo(() => {
    const counts = {};
    leads.forEach((l) => {
      const ownerId = l.ownerId || (l.owner && typeof l.owner === 'object' ? l.owner.id : null);
      if (ownerId) counts[ownerId] = (counts[ownerId] || 0) + 1;
    });
    return teamMembers.map((member) => ({
      ...member,
      activeLeads: counts[member.id] || 0,
    }));
  }, [teamMembers, leads]);

  if (!isOpen) return null;

  const leadCount = selectedLeads.length;

  const toggleRepSelection = (repId) => {
    setSelectedRepIds((prev) =>
      prev.includes(repId) ? prev.filter((id) => id !== repId) : [...prev, repId]
    );
  };

  const handleSelectAllReps = () => {
    if (selectedRepIds.length === teamMembers.length) {
      setSelectedRepIds([]);
    } else {
      setSelectedRepIds(teamMembers.map((m) => m.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const targetAssignees = strategy === 'single'
      ? (selectedRepId ? [selectedRepId] : [])
      : selectedRepIds;

    if (targetAssignees.length === 0) {
      setError('Please select at least one sales representative.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        lead_ids: selectedLeads.map((l) => l.id),
        strategy,
        assignee_ids: targetAssignees,
        transfer_open_tasks: transferTasks,
        reason,
        send_notification: sendNotification,
      };

      const res = await bulkAssignLeads(payload);
      onSuccess?.(res);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to reassign leads.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <UserCheck size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Bulk Reassign Leads</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Reallocating <span className="font-semibold text-blue-600">{leadCount}</span> selected lead{leadCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Strategy Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Distribution Strategy
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStrategy('single')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  strategy === 'single'
                    ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <Users size={14} className={strategy === 'single' ? 'text-blue-600' : 'text-slate-400'} />
                  Single Owner
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">All leads to one sales rep</span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('round_robin')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  strategy === 'round_robin'
                    ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <Shuffle size={14} className={strategy === 'round_robin' ? 'text-blue-600' : 'text-slate-400'} />
                  Round-Robin
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">Split evenly across team</span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('capacity_weighted')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  strategy === 'capacity_weighted'
                    ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <Scale size={14} className={strategy === 'capacity_weighted' ? 'text-blue-600' : 'text-slate-400'} />
                  Capacity Load
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">Fills reps with lower pipeline</span>
              </button>
            </div>
          </div>

          {/* Representative Selector */}
          {strategy === 'single' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assignee Representative <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRepId}
                onChange={(e) => setSelectedRepId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Representative...</option>
                {repWorkloads.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name} ({rep.activeLeads} active leads)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Select Team Cohort <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllReps}
                  className="text-[11px] text-blue-600 font-semibold hover:underline"
                >
                  {selectedRepIds.length === teamMembers.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto p-2 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                {repWorkloads.map((rep) => {
                  const isChecked = selectedRepIds.includes(rep.id);
                  return (
                    <label
                      key={rep.id}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-blue-300 bg-blue-50 text-blue-900'
                          : 'border-transparent hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRepSelection(rep.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium">{rep.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {rep.activeLeads} active
                      </span>
                    </label>
                  );
                })}
              </div>
              {selectedRepIds.length > 0 && (
                <p className="text-[11px] text-slate-500 mt-1 italic">
                  ~{Math.ceil(leadCount / selectedRepIds.length)} leads per representative
                </p>
              )}
            </div>
          )}

          {/* Options & Reason */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reallocation Reason
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Territory realignment Q4"
                className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transferTasks}
                  onChange={(e) => setTransferTasks(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Transfer open lead tasks and scheduled follow-ups to new owner(s)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Send in-app notification & alert to new owner(s)</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              {submitting ? 'Reassigning...' : `Confirm Reassignment (${leadCount})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
