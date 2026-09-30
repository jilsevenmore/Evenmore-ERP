import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import {
  Download,
  Search,
  Minus,
  Plus,
  ChevronDown,
  Building,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Users,
  X,
  FileSpreadsheet,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import PageInfoButton from '../../components/common/PageInfoButton';
import { hrmsGuides } from '../../data/hrms/hrmsGuides';
import { hrmsSync, pullOrgChart, describeError } from '../../services/hrmsSync';
import { useEmployeeOptions } from './useOrgCollection';
import OrgTreeView from './OrgTreeView';
import {
  buildTree,
  indexTree,
  branchKeys,
  defaultExpanded,
  searchTree,
  exportRows,
  ORG_KEY,
} from './orgTree';

function avatarFor(item) {
  return item.avatar || `https://i.pravatar.cc/100?u=${encodeURIComponent(item.id || item.name)}`;
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function OrgChartPage() {
  const navigate = useNavigate();
  const showToast = useAppStore((s) => s.showToast);
  const refreshHrms = useAppStore((s) => s.refreshHrms);
  const employees = useEmployeeOptions();

  // Organization -> Department -> Head -> reporting lines, from the server.
  const [chart, setChart] = useState(null);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [chartFailed, setChartFailed] = useState(false);
  const tree = useMemo(() => buildTree(chart), [chart]);
  const byKey = useMemo(() => indexTree(tree), [tree]);
  const allBranches = useMemo(() => branchKeys(tree), [tree]);
  const headcount = tree.employeeCount;
  const issues = chart?.issues || [];

  const [expanded, setExpanded] = useState(() => new Set([ORG_KEY]));
  // Bumped by view-wide changes so the canvas re-centres on the organisation.
  const [centerSignal, setCenterSignal] = useState(0);

  const reloadChart = useCallback(() => pullOrgChart().then((body) => {
    if (body?.departments) setChart(body);
    setChartFailed(!body?.departments);
    setChartLoaded(true);
    return body;
  }), []);

  useEffect(() => {
    reloadChart().then((body) => {
      if (body?.departments) setExpanded(defaultExpanded(buildTree(body)));
      setCenterSignal((n) => n + 1);
    });
  }, [reloadChart]);

  // View Controls
  const [zoom, setZoom] = useState(100);
  const [q, setQ] = useState('');

  // Feature Integrations
  const departmentCount = tree.departmentCount;
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const selectedEmployee = selectedKey ? byKey.get(selectedKey) || null : null;
  const [managerDraft, setManagerDraft] = useState('');
  const [savingManager, setSavingManager] = useState(false);

  const [newDept, setNewDept] = useState({ name: '', headEmployeeId: '', budget: '' });

  // Search keeps the path to every match open; otherwise the user's choice.
  const search = useMemo(() => searchTree(tree, q), [tree, q]);
  const visibleExpanded = search.expand || expanded;
  const allOpen = allBranches.size > 0 && [...allBranches].every((key) => expanded.has(key));

  const toggleBranch = useCallback((key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  function handleExpandAll() {
    setQ('');
    setExpanded(new Set(allBranches));
    setCenterSignal((n) => n + 1);
  }

  function handleCollapseAll() {
    setQ('');
    setExpanded(new Set([ORG_KEY]));
    setCenterSignal((n) => n + 1);
  }

  useEffect(() => {
    setCenterSignal((n) => n + 1);
  }, [q]);

  const selectEmployee = useCallback((item) => {
    setSelectedKey(item.key);
    setManagerDraft(item.managerId || '');
  }, []);

  // Handle Add Department submission
  async function handleAddDepartment(e) {
    e.preventDefault();
    if (!newDept.name.trim()) return;

    try {
      await hrmsSync.create('departments', { ...newDept, status: 'Active' });
    } catch (err) {
      showToast(`Department not saved — ${describeError(err)}`);
      return;
    }
    setIsAddDeptOpen(false);
    reloadChart();
    showToast(`Department "${newDept.name.trim()}" created successfully`);
    setNewDept({ name: '', headEmployeeId: '', budget: '' });
  }

  // The reporting line is the employee record's manager; the server refuses
  // self-reporting, loops and people who have left.
  async function handleSaveManager() {
    if (!selectedEmployee || savingManager) return;
    setSavingManager(true);
    try {
      await hrmsSync.update('employees', selectedEmployee.id, { managerId: managerDraft || null });
      await reloadChart();
      refreshHrms?.('employees');
      showToast(`Reporting manager updated for ${selectedEmployee.name}`);
    } catch (err) {
      showToast(`Reporting manager not saved — ${describeError(err)}`);
    } finally {
      setSavingManager(false);
    }
  }

  // Handle CSV Export
  function exportCSV() {
    setIsExportOpen(false);
    const csvContent = exportRows(tree).map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Evenmore_Org_Chart.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Org Chart exported as CSV');
  }

  // Handle Print Export
  function exportPrint() {
    setIsExportOpen(false);
    showToast('Preparing Org Chart print view');
    setTimeout(() => {
      window.print();
    }, 250);
  }

  const noMatches = Boolean(q.trim()) && search.root.children.length === 0;
  const managerOptions = employees.filter((emp) => String(emp.id) !== String(selectedEmployee?.id));

  return (
    <div className="flex flex-col gap-6 p-2 sm:p-6 max-w-[1600px] mx-auto w-full printable-document">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">Org Chart</h1>
            <PageInfoButton guide={hrmsGuides.orgChart} />
          </div>
          <p className="text-[13px] text-muted mt-1">
            {departmentCount} Departments • {headcount.toLocaleString()} Employees • Last updated{' '}
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5">
          {/* Export Dropdown / Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="px-4 h-9 border border-border bg-card hover:bg-card-hover text-text rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              <Download size={16} />
              <span>Export</span>
              <ChevronDown size={14} className="text-muted" />
            </button>

            {isExportOpen && (
              <div className="absolute left-0 lg:left-auto lg:right-0 mt-2 w-48 bg-white border border-bdr rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  type="button"
                  onClick={exportCSV}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <FileSpreadsheet size={16} className="text-emerald-600" />
                  <span>Export as CSV</span>
                </button>
                <button
                  type="button"
                  onClick={exportPrint}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <Printer size={16} className="text-blue-600" />
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Add Department Button */}
          <button
            type="button"
            onClick={() => setIsAddDeptOpen(true)}
            className="px-4 h-9 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-2xs active:scale-[0.99] transition-colors cursor-pointer"
          >
            Add Department
          </button>
        </div>
      </div>

      {/* ── Control Bar ─────────────────────────────────────────── */}
      <div className="bg-white border border-bdr rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-auto">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, employee ID, designation, department"
              className="pl-10 pr-4 h-9 w-full sm:w-80 bg-off border border-bdr rounded-xl text-[13px] text-slate-800 placeholder:text-muted focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-slate-700 text-[12px] p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Collapse / Expand all */}
          <button
            type="button"
            onClick={handleExpandAll}
            disabled={allOpen && !q}
            className="px-3 py-1 text-navy hover:bg-slate-100 rounded-xl text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-40"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-3 py-1 text-navy hover:bg-slate-100 rounded-xl text-[13px] font-medium transition-colors cursor-pointer"
          >
            Collapse all
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-muted font-medium">Zoom</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(60, z - 10))}
            disabled={zoom <= 60}
            className="w-8 h-8 border border-bdr rounded-xl grid place-items-center bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-40"
            title="Zoom out"
          >
            <Minus size={15} />
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            className="w-10 text-center font-medium hover:text-navy cursor-pointer"
            title="Reset to 100%"
          >
            {zoom}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(140, z + 10))}
            disabled={zoom >= 140}
            className="w-8 h-8 border border-bdr rounded-xl grid place-items-center bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-40"
            title="Zoom in"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* ── Data checks ─────────────────────────────────────────── */}
      {issues.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[12.5px] text-amber-800 no-print">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertTriangle size={14} /> {issues.length} record{issues.length === 1 ? '' : 's'} to fix in HR data
          </div>
          <ul className="mt-1 list-disc pl-5 space-y-0.5">
            {issues.slice(0, 5).map((issue, i) => <li key={i}>{issue.message}</li>)}
          </ul>
        </div>
      )}

      {/* ── Main Org Chart Canvas ───────────────────────────────── */}
      <div className="bg-white border border-bdr rounded-xl shadow-xs">
        {!chartLoaded ? (
          <div className="text-center py-24 text-muted text-[13px]">Loading org chart…</div>
        ) : chartFailed && !chart ? (
          <div className="text-center py-24 text-muted text-[13px]">
            Couldn’t load the org chart. Refresh the page to try again.
          </div>
        ) : headcount === 0 && tree.children.length === 0 ? (
          <div className="text-center py-24 text-muted text-[13px]">
            No departments or employees yet. Add them to build the org chart.
          </div>
        ) : noMatches ? (
          <div className="text-center py-24 text-muted text-[13px]">
            No employees found matching &quot;{q}&quot;
          </div>
        ) : (
          <OrgTreeView
            root={search.root}
            expanded={visibleExpanded}
            matched={search.matched}
            zoom={zoom}
            onToggle={toggleBranch}
            onSelect={selectEmployee}
            centerSignal={centerSignal}
          />
        )}
      </div>

      {/* ── ADD DEPARTMENT MODAL ─────────────────────────────────── */}
      <Modal
        isOpen={isAddDeptOpen}
        onClose={() => setIsAddDeptOpen(false)}
        title="Add Department"
        size="md"
      >
        <form onSubmit={handleAddDepartment} className="flex flex-col gap-4">
          <p className="text-[13px] text-muted -mt-1">
            Create an organizational unit to streamline reporting, budget allocations, and employee assignments.
          </p>

          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newDept.name}
              onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
              placeholder="e.g. Artificial Intelligence & Analytics"
              className="w-full px-3.5 py-2 bg-off border border-bdr rounded-xl text-[13.5px] text-slate-800 placeholder:text-muted focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
                Department Head
              </label>
              <select
                value={newDept.headEmployeeId}
                onChange={(e) => setNewDept({ ...newDept, headEmployeeId: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-bdr rounded-xl text-[13.5px] text-slate-800 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 cursor-pointer"
              >
                <option value="">Not assigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}{emp.designation ? ` (${emp.designation})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
                Annual Budget
              </label>
              <input
                type="number"
                min="0"
                value={newDept.budget}
                onChange={(e) => setNewDept({ ...newDept, budget: e.target.value })}
                placeholder="e.g. 3500000"
                className="w-full px-3.5 py-2 bg-off border border-bdr rounded-xl text-[13.5px] text-slate-800 placeholder:text-muted focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0 pt-3 border-t border-bdr mt-2">
            <button
              type="button"
              onClick={() => {
                setIsAddDeptOpen(false);
                navigate('/organization/departments');
              }}
              className="text-navy text-[13px] font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Building size={14} /> Go to Departments Directory
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddDeptOpen(false)}
                className="px-4 h-9 bg-card border border-border text-text hover:bg-card-hover rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 h-9 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-2xs active:scale-[0.99] transition cursor-pointer"
              >
                Create Department
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── EMPLOYEE QUICK VIEW MODAL / DRAWER ─────────────────────── */}
      <Modal
        isOpen={Boolean(selectedEmployee)}
        onClose={() => setSelectedKey(null)}
        title="Employee Profile"
        size="md"
      >
        {selectedEmployee && (
          <div className="flex flex-col gap-5">
            {/* Top Employee Card */}
            <div className="flex items-center gap-4 p-4 bg-off border border-bdr rounded-xl">
              <img
                src={avatarFor(selectedEmployee)}
                alt={selectedEmployee.name}
                className="w-14 h-14 rounded-full ring-2 ring-navy/20 object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-bold text-slate-900 truncate">
                    {selectedEmployee.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selectedEmployee.status}
                  </span>
                </div>
                <div className="text-[13px] text-slate-600 font-medium">
                  {selectedEmployee.designation || '—'}
                  {selectedEmployee.code && <span className="text-muted font-normal"> • {selectedEmployee.code}</span>}
                </div>
                <div className="text-[12px] text-muted flex items-center gap-1.5 mt-0.5">
                  <Building size={13} /> {selectedEmployee.department || 'No department'}
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <div className="p-3 border border-bdr rounded-xl flex items-center gap-3">
                <Mail size={16} className="text-muted shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-muted font-medium">Work Email</div>
                  <a
                    href={`mailto:${selectedEmployee.email}`}
                    className="text-navy hover:underline truncate block font-medium"
                  >
                    {selectedEmployee.email || '—'}
                  </a>
                </div>
              </div>

              <div className="p-3 border border-bdr rounded-xl flex items-center gap-3">
                <Phone size={16} className="text-muted shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-muted font-medium">Phone</div>
                  <a
                    href={`tel:${selectedEmployee.phone}`}
                    className="text-slate-800 hover:underline truncate block font-medium"
                  >
                    {selectedEmployee.phone || '—'}
                  </a>
                </div>
              </div>

              <div className="p-3 border border-bdr rounded-xl flex items-center gap-3">
                <MapPin size={16} className="text-muted shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-muted font-medium">Location</div>
                  <div className="text-slate-800 font-medium">{selectedEmployee.location || '—'}</div>
                </div>
              </div>

              <div className="p-3 border border-bdr rounded-xl flex items-center gap-3">
                <Users size={16} className="text-muted shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-muted font-medium">Reports To</div>
                  <div className="text-slate-800 font-medium">
                    {selectedEmployee.manager
                      || (selectedEmployee.relation === 'department' ? 'Department head (no manager set)' : '—')}
                  </div>
                </div>
              </div>
            </div>

            {/* Reporting manager (the employee record's manager) */}
            <div className="p-3.5 border border-bdr rounded-xl no-print">
              <div className="text-[12px] font-semibold text-slate-700 mb-2">Change Reporting Manager</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={managerDraft}
                  onChange={(e) => setManagerDraft(e.target.value)}
                  className="flex-1 min-w-0 h-9 px-3 bg-white border border-bdr rounded-xl text-[13px] text-slate-800 focus:outline-none focus:border-navy"
                >
                  <option value="">No reporting manager</option>
                  {managerOptions.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}{emp.designation ? ` (${emp.designation})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleSaveManager}
                  disabled={savingManager || managerDraft === (selectedEmployee.managerId || '')}
                  className="px-4 h-9 bg-navy hover:bg-navy/90 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingManager ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            {/* Direct Reports Count if any */}
            {selectedEmployee.children && selectedEmployee.children.length > 0 && (
              <div className="p-3.5 bg-slate-50 border border-bdr rounded-xl">
                <div className="text-[12px] font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Users size={14} className="text-navy" /> Direct Reports ({selectedEmployee.children.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedEmployee.children.map((rep) => (
                    <div
                      key={rep.key}
                      onClick={() => selectEmployee(rep)}
                      className="px-2.5 h-8 bg-white border border-bdr rounded-xl text-xs flex items-center gap-2 hover:border-navy cursor-pointer transition-colors"
                    >
                      <img src={avatarFor(rep)} alt={rep.name} className="w-4 h-4 rounded-full" />
                      <span className="font-medium text-slate-800">{rep.name}</span>
                      {rep.designation && <span className="text-[11px] text-muted">({rep.designation})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0 pt-3 border-t border-bdr">
              <button
                type="button"
                onClick={() => {
                  setSelectedKey(null);
                  navigate('/hrms/employees');
                }}
                className="px-4 py-2 bg-white border border-bdr hover:bg-slate-50 text-slate-700 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>View in Employees Directory</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = `mailto:${selectedEmployee.email}`;
                }}
                className="px-5 py-2 bg-navy hover:bg-navy/90 text-white rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Mail size={14} />
                <span>Send Email</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default OrgChartPage;

