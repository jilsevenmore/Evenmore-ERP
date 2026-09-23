import React, { useState, useMemo } from 'react';
import {
  Users,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  Building2,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { useManufacturingStore } from '../../stores/manufacturingStore';
import { formatCurrency } from '../../utils/currencyUtils';
import { computeLabourCost } from '../../utils/manufacturingUtils';

export default function LabourCostPage() {
  const labourEntries = useManufacturingStore((s) => s.labourEntries);
  const addLabourEntry = useManufacturingStore((s) => s.addLabourEntry);
  const deleteLabourEntry = useManufacturingStore((s) => s.deleteLabourEntry);

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    batchNumber: 'BAT-2026-001',
    employeeName: '',
    department: 'Fabrication',
    shift: 'General',
    regularHours: 8,
    overtimeHours: 0,
    hourlyRate: 350,
    taskDescription: '',
    date: new Date().toISOString().split('T')[0],
  });

  const totals = useMemo(() => {
    return labourEntries.reduce(
      (acc, item) => {
        acc.regularHours += Number(item.regularHours) || 0;
        acc.overtimeHours += Number(item.overtimeHours) || 0;
        acc.totalHours += (Number(item.regularHours) || 0) + (Number(item.overtimeHours) || 0);
        acc.totalCost += Number(item.totalCost) || 0;
        return acc;
      },
      { regularHours: 0, overtimeHours: 0, totalHours: 0, totalCost: 0 }
    );
  }, [labourEntries]);

  const filteredEntries = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    const df = (deptFilter || '').toLowerCase().trim();
    return labourEntries.filter((item) => {
      const matchSearch =
        !q ||
        (item.employeeName || '').toLowerCase().includes(q) ||
        (item.taskDescription || item.taskName || '').toLowerCase().includes(q) ||
        (item.projectNumber || '').toLowerCase().includes(q);
      const matchDept = df === 'all' || (item.department || '').toLowerCase() === df;
      return matchSearch && matchDept;
    });
  }, [labourEntries, searchTerm, deptFilter]);

  function handleSubmit(e) {
    e.preventDefault();
    addLabourEntry({
      ...formData,
      regularHours: Number(formData.regularHours),
      overtimeHours: Number(formData.overtimeHours),
      hourlyRate: Number(formData.hourlyRate),
    });
    setModalOpen(false);
    setFormData({
      projectId: 'PRJ-2026-001',
      projectNumber: 'PRJ-2026-001',
      batchNumber: 'BAT-2026-001',
      employeeName: '',
      department: 'Fabrication',
      shift: 'General',
      regularHours: 8,
      overtimeHours: 0,
      hourlyRate: 350,
      taskDescription: '',
      date: new Date().toISOString().split('T')[0],
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Labour Hours & Shift Cost Capture"
        subtitle="Record shopfloor technician work timesheets, overtime shifts, and direct labour cost absorption into work orders."
        actions={
          <Button
            icon={Plus}
            onClick={() => setModalOpen(true)}
          >
            Add Labour Entry
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748b] mb-1">
            <span className="text-xs">Total Hours</span>
            <Clock size={16} className="text-[#1f6bff]" />
          </div>
          <p className="text-2xl font-bold text-[#0f172a]">{totals.totalHours} hrs</p>
          <span className="text-[11px] text-[#64748b]">Reg: {totals.regularHours} | OT: {totals.overtimeHours}</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748b] mb-1">
            <span className="text-xs">Overtime Ratio</span>
            <Clock size={16} className="text-[#eab308]" />
          </div>
          <p className="text-2xl font-bold text-[#eab308]">
            {totals.totalHours > 0 ? ((totals.overtimeHours / totals.totalHours) * 100).toFixed(1) : 0}%
          </p>
          <span className="text-[11px] text-[#64748b]">Paid at 1.5x hourly rate</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748b] mb-1">
            <span className="text-xs">Total Labour Cost</span>
            <DollarSign size={16} className="text-[#10b981]" />
          </div>
          <p className="text-2xl font-bold text-[#10b981]">{formatCurrency(totals.totalCost)}</p>
          <span className="text-[11px] text-[#64748b]">Direct labor absorbed</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748b] mb-1">
            <span className="text-xs">Effective Rate / Hr</span>
            <Users size={16} className="text-[#6366f1]" />
          </div>
          <p className="text-2xl font-bold text-[#0f172a]">
            {totals.totalHours > 0 ? formatCurrency(Math.round(totals.totalCost / totals.totalHours)) : '₹0'}
          </p>
          <span className="text-[11px] text-[#64748b]">Average loaded rate</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-[#dce5f4] p-4 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search technician, project, task..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#1f6bff] text-[#0f172a]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#64748b]" />
          <span className="text-xs text-[#64748b] font-medium">Department:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs border border-[#cbd5e1] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#1f6bff] text-[#0f172a] bg-white"
          >
            <option value="All">All Departments</option>
            <option value="Fabrication">Fabrication</option>
            <option value="Assembly">Assembly</option>
            <option value="Electrical">Electrical</option>
            <option value="Quality">Quality</option>
          </select>
        </div>
      </div>

      {/* Labour Table */}
      <div className="bg-white border border-[#dce5f4] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#dce5f4] font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Technician / Employee</th>
                <th className="py-3 px-4">Project & Batch</th>
                <th className="py-3 px-4">Department & Shift</th>
                <th className="py-3 px-4">Task Description</th>
                <th className="py-3 px-4 text-center">Regular</th>
                <th className="py-3 px-4 text-center">OT (1.5x)</th>
                <th className="py-3 px-4 text-right">Hourly Rate</th>
                <th className="py-3 px-4 text-right font-bold text-[#0f172a]">Total Labour Cost</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredEntries.map((item) => (
                <tr key={item.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[#64748b]">{item.date}</td>
                  <td className="py-3.5 px-4 font-semibold text-[#0f172a]">{item.employeeName}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#0f172a]">{item.projectNumber}</div>
                    <div className="text-[11px] text-[#64748b] font-mono">{item.batchNumber}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#334155]">{item.department || 'Production'}</div>
                    <div className="text-[11px] text-[#64748b]">Shift: {item.shift || 'General'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-[#475569] max-w-xs truncate" title={item.taskDescription || item.taskName}>
                    {item.taskDescription || item.taskName}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-[#0f172a]">
                    {item.regularHours || item.hours || 0}h
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-[#eab308]">
                    {(item.overtimeHours || 0) > 0 ? `${item.overtimeHours}h` : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#64748b]">
                    {formatCurrency(item.hourlyRate || item.ratePerHour || 0)}/h
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#10b981] bg-[#f0fdf4]/40">
                    {formatCurrency(item.totalCost)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => deleteLabourEntry(item.id)}
                      className="text-[#94a3b8] hover:text-[#ef4444] p-1 rounded transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Labour Entry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#dce5f4] w-full max-w-md p-5">
            <h3 className="text-base font-bold text-[#0f172a] mb-4">Log Shopfloor Labour Timesheet</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Project Number</label>
                  <input
                    type="text"
                    required
                    value={formData.projectNumber}
                    onChange={(e) => setFormData({ ...formData, projectNumber: e.target.value, projectId: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748b] font-medium mb-1">Technician / Employee Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar (Senior Welder)"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff] bg-white"
                  >
                    <option value="Fabrication">Fabrication</option>
                    <option value="Assembly">Assembly</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Quality">Quality</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff] bg-white"
                  >
                    <option value="General">General (8am - 5pm)</option>
                    <option value="Morning">Shift 1 (6am - 2pm)</option>
                    <option value="Evening">Shift 2 (2pm - 10pm)</option>
                    <option value="Night">Night Shift (10pm - 6am)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Reg. Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="16"
                    step="0.5"
                    required
                    value={formData.regularHours}
                    onChange={(e) => setFormData({ ...formData, regularHours: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">OT Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    step="0.5"
                    value={formData.overtimeHours}
                    onChange={(e) => setFormData({ ...formData, overtimeHours: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748b] font-medium mb-1">Rate / Hr (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748b] font-medium mb-1">Task Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Base frame weldment and diagonal bracing"
                  value={formData.taskDescription}
                  onChange={(e) => setFormData({ ...formData, taskDescription: e.target.value })}
                  className="w-full border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#1f6bff]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f1f5f9]">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" icon={Plus}>
                  Save Timesheet
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
