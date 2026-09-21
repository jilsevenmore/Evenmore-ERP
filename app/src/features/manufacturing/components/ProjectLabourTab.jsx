import React, { useState, useMemo } from 'react';
import {
  Users,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  AlertCircle,
  Calendar,
  Building2,
} from 'lucide-react';
import { useManufacturingStore } from '../../../stores/manufacturingStore';
import { formatCurrency } from '../../../utils/currencyUtils';
import { computeLabourCost } from '../../../utils/manufacturingUtils';
import { Button } from '../../../components/ui/Button';

export function ProjectLabourTab({ project }) {
  const labourEntries = useManufacturingStore((s) => s.labourEntries);
  const addLabourEntry = useManufacturingStore((s) => s.addLabourEntry);
  const deleteLabourEntry = useManufacturingStore((s) => s.deleteLabourEntry);

  const projectLabour = labourEntries.filter(
    (l) => l.projectId === project.id || l.projectNumber === project.id
  );

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState({
    employeeName: 'Vikram Singh',
    department: 'Production',
    stageName: 'Production & Fabrication',
    taskName: 'Sheet Metal CNC Bending',
    hours: 8,
    ratePerHour: 220,
    overtimeHours: 0,
    remarks: '',
  });

  const totals = useMemo(() => {
    return projectLabour.reduce(
      (acc, it) => ({
        hours: acc.hours + Number(it.hours || 0),
        overtime: acc.overtime + Number(it.overtimeHours || 0),
        regularCost: acc.regularCost + Number(it.labourCost || 0),
        overtimeCost: acc.overtimeCost + Number(it.overtimeCost || 0),
        totalCost: acc.totalCost + Number(it.totalCost || 0),
      }),
      { hours: 0, overtime: 0, regularCost: 0, overtimeCost: 0, totalCost: 0 }
    );
  }, [projectLabour]);

  const handleSubmit = (e) => {
    e.preventDefault();
    addLabourEntry({
      projectId: project.id,
      projectNumber: project.id,
      ...form,
    });
    setAddModalOpen(false);
    setForm({
      employeeName: 'Vikram Singh',
      department: 'Production',
      stageName: 'Production & Fabrication',
      taskName: '',
      hours: 8,
      ratePerHour: 220,
      overtimeHours: 0,
      remarks: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top KPI Cards for Labour */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Regular Hours</span>
          <span className="text-xl font-black text-slate-800 font-mono mt-0.5 block">{totals.hours} hrs</span>
          <span className="text-[11px] text-slate-500 font-mono">{formatCurrency(totals.regularCost)}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overtime Hours</span>
          <span className="text-xl font-black text-amber-700 font-mono mt-0.5 block">{totals.overtime} hrs</span>
          <span className="text-[11px] text-amber-600 font-mono">{formatCurrency(totals.overtimeCost)} (1.5x)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Work Hours</span>
          <span className="text-xl font-black text-indigo-700 font-mono mt-0.5 block">{totals.hours + totals.overtime} hrs</span>
          <span className="text-[11px] text-slate-500">Across {projectLabour.length} shifts</span>
        </div>

        <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 shadow-2xs">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Total Labour Cost</span>
          <span className="text-xl font-black text-indigo-900 font-mono mt-0.5 block">{formatCurrency(totals.totalCost)}</span>
          <span className="text-[11px] text-indigo-600 font-medium">Applied to Project Costing</span>
        </div>
      </div>

      {/* Labour Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Shift Labour Logs & Rate Allocations
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tracks actual technician and operator hours spent per production stage.
            </p>
          </div>

          <Button size="sm" icon={Plus} onClick={() => setAddModalOpen(true)}>
            Add Labour Entry
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Date / Shift</th>
                <th className="py-2.5 px-3">Technician / Dept</th>
                <th className="py-2.5 px-3">Stage / Task Description</th>
                <th className="py-2.5 px-3 text-center">Regular Hrs</th>
                <th className="py-2.5 px-3 text-center">Rate / Hr</th>
                <th className="py-2.5 px-3 text-center">OT Hrs</th>
                <th className="py-2.5 px-3 text-right">Total Labour Cost</th>
                <th className="py-2.5 px-3">Remarks</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectLabour.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                    {item.date}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-800 block">{item.employeeName}</span>
                    <span className="text-[10px] text-slate-400 block">{item.department}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-700 block">{item.stageName}</span>
                    <span className="text-[11px] text-slate-500 block">{item.taskName}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                    {item.hours} hrs
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                    {formatCurrency(item.ratePerHour)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-amber-700 font-semibold">
                    {item.overtimeHours > 0 ? `+${item.overtimeHours} hrs` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.totalCost)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-[200px] truncate" title={item.remarks}>
                    {item.remarks || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => deleteLabourEntry(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Labour Entry Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="text-indigo-600" size={16} />
              Add Labour Time Entry
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Employee / Operator *</label>
                <input
                  required
                  value={form.employeeName}
                  onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Production">Production</option>
                    <option value="Design">Design</option>
                    <option value="Quality">Quality</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Installation">Installation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Production Stage</label>
                  <input
                    value={form.stageName}
                    onChange={(e) => setForm({ ...form, stageName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Task Performed *</label>
                <input
                  required
                  value={form.taskName}
                  onChange={(e) => setForm({ ...form, taskName: e.target.value })}
                  placeholder="e.g. Frame cutting, seam welding, surface prep"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Regular Hours *</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rate / Hr (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.ratePerHour}
                    onChange={(e) => setForm({ ...form, ratePerHour: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">OT Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.overtimeHours}
                    onChange={(e) => setForm({ ...form, overtimeHours: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Shift Remarks</label>
                <input
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Completed units, tooling notes"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={() => setAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Log Labour Entry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectLabourTab;
