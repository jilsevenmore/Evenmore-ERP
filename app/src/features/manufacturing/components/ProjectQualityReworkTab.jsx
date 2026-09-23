import React, { useState } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  History,
} from 'lucide-react';
import { useManufacturingStore } from '../../../stores/manufacturingStore';
import { getManufacturingStatusStyle } from '../../../utils/manufacturingUtils';
import { Button } from '../../../components/ui/Button';

export function ProjectQualityReworkTab({ project }) {
  const reworkRecords = useManufacturingStore((s) => s.reworkRecords);
  const recordRework = useManufacturingStore((s) => s.recordRework);
  const updateReworkStatus = useManufacturingStore((s) => s.updateReworkStatus);

  const projectRework = reworkRecords.filter(
    (r) => r.projectId === project.id || r.projectNumber === project.id
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    reworkReason: '',
    relatedStage: 'Production & Fabrication',
    relatedTask: '',
    assignedEmployee: 'Imran Shaikh',
    expectedCompletion: new Date().toISOString().slice(0, 10),
    remarks: '',
  });

  const totalDaysLost = projectRework.reduce((acc, r) => acc + Number(r.daysLost || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    recordRework({
      projectId: project.id,
      projectNumber: project.id,
      createdBy: 'QA Inspector',
      ...form,
    });
    setModalOpen(false);
    setForm({
      reworkReason: '',
      relatedStage: 'Production & Fabrication',
      relatedTask: '',
      assignedEmployee: '',
      expectedCompletion: new Date().toISOString().slice(0, 10),
      remarks: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top QA & Rework Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rework Incidents</span>
          <span className="text-xl font-black text-slate-800 font-mono mt-0.5 block">{projectRework.length} Recorded</span>
          <span className="text-[11px] text-slate-500">Historical non-conformities</span>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-100 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Cumulative Schedule Impact</span>
          <span className="text-xl font-black text-amber-900 font-mono mt-0.5 block">{totalDaysLost} Days Lost</span>
          <span className="text-[11px] text-amber-700">Rework cycle turnaround</span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">First-Time-Right Yield</span>
          <span className="text-xl font-black text-emerald-900 font-mono mt-0.5 block">
            {projectRework.length === 0 ? '100%' : '94.2%'}
          </span>
          <span className="text-[11px] text-emerald-700">Quality gate benchmark</span>
        </div>
      </div>

      {/* Rework History Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <RotateCcw size={14} className="text-rose-600" />
              Non-Conformance & Rework History
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Preserves the original production audit trail while tracking engineering corrections and days lost.
            </p>
          </div>

          <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
            Record Rework
          </Button>
        </div>

        {projectRework.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
            <h5 className="text-sm font-bold text-slate-800">Zero Rework Recorded</h5>
            <p className="text-xs text-slate-500">All manufacturing stages completed first-pass quality gates without corrective rework.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Ticket # / Date</th>
                  <th className="py-2.5 px-3">Rework Reason & Defect</th>
                  <th className="py-2.5 px-3">Stage / Related Task</th>
                  <th className="py-2.5 px-3">Assigned Tech</th>
                  <th className="py-2.5 px-3 text-center">Days Lost</th>
                  <th className="py-2.5 px-3 text-center">Revision</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectRework.map((item) => {
                  const statusStyle = getManufacturingStatusStyle(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono">
                        <span className="font-bold text-slate-800">{item.reworkNumber}</span>
                        <span className="text-[10px] text-slate-400 block">{item.createdDate}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 max-w-[260px]">
                        <span className="font-semibold block">{item.reworkReason}</span>
                        {item.remarks && (
                          <span className="text-[10px] text-slate-500 block italic">Note: {item.remarks}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <span className="block font-medium">{item.relatedStage}</span>
                        <span className="text-[10px] text-slate-400 block">{item.relatedTask || '—'}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {item.assignedEmployee || 'Unassigned'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">
                        +{item.daysLost || 1} d
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-600">
                        {item.revisionNumber || 'REV-01'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.status !== 'Completed' && (
                          <button
                            onClick={() => updateReworkStatus(item.id, 'Completed', new Date().toISOString().slice(0, 10))}
                            className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] cursor-pointer"
                            title="Mark Rework Completed"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Rework Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <RotateCcw className="text-rose-600" size={16} />
              Raise Rework Order
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rework Defect Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={form.reworkReason}
                  onChange={(e) => setForm({ ...form, reworkReason: e.target.value })}
                  placeholder="Describe dimensional, surface, or functional non-conformance..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Related Stage</label>
                  <input
                    value={form.relatedStage}
                    onChange={(e) => setForm({ ...form, relatedStage: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Assigned Technician</label>
                  <input
                    required
                    value={form.assignedEmployee}
                    onChange={(e) => setForm({ ...form, assignedEmployee: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Resolution Date</label>
                <input
                  type="date"
                  value={form.expectedCompletion}
                  onChange={(e) => setForm({ ...form, expectedCompletion: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Corrective Action Remarks</label>
                <input
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Tooling or welding process adjustment"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  File Rework Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectQualityReworkTab;
