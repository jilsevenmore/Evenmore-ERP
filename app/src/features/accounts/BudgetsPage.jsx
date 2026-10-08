import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  PieChart, 
  Building2, 
  Calendar, 
  Trash2, 
  Edit3, 
  X,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { 
  fetchBudgets, 
  createBudget, 
  updateBudget, 
  deleteBudget, 
  fetchBudgetVarianceSummary 
} from '../../services/upgradeService';

const budgetGuide = {
  title: 'Departmental Budgets & Variance Analysis',
  subtitle: 'Configure operational and capital expenditure envelopes, monitor burn rates, and receive early over-budget alerts.',
  purpose: 'Enables financial controllers and department heads to allocate quarterly/annual budgets across operating divisions, automatically compute live variance against purchase bills and expense vouchers, and trigger warnings before overspending occurs.',
  keyTerms: [
    { term: 'Allocated Budget', definition: 'The financial spending cap authorized for a department within a defined date period.' },
    { term: 'Actual Expenditure', definition: 'Sum of all verified purchase bills, direct expense vouchers, and payroll disbursements.' },
    { term: 'Variance', definition: 'Unspent surplus balance (Budget - Actual). Negative variance indicates a budget overrun.' },
    { term: 'Alert Threshold', definition: 'Utilization percentage (e.g. 80% or 90%) that triggers an amber/red warning.' },
  ],
  tips: [
    'Green gauges indicate healthy burn rates under 80% of allocation.',
    'Amber gauges (80-90%) warn that department spending is nearing authorized ceilings.',
    'Red gauges indicate critical saturation (>90%) requiring executive sign-off for additional purchase orders.',
  ],
  workflow: ['Set Envelope by Department', 'Link POs & Expense Vouchers', 'Monitor Live Variance', 'Adjust Quarterly Caps'],
};

export const BudgetsPage = () => {
  const { formatCurrency, formatDateDDMMYYYY } = useERP();

  const [budgets, setBudgets] = useState([]);
  const [varianceSummary, setVarianceSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [form, setForm] = useState({
    department_name: '',
    category: 'Operational',
    amount: '',
    period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 3, 0).toISOString().slice(0, 10),
    alert_threshold_pct: '80',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchBudgets().catch(() => null);
      if (res?.data && Array.isArray(res.data)) {
        setBudgets(res.data);
      } else if (Array.isArray(res)) {
        setBudgets(res);
      }

      const summaryRes = await fetchBudgetVarianceSummary().catch(() => null);
      if (summaryRes?.data) {
        setVarianceSummary(summaryRes.data);
      } else if (summaryRes) {
        setVarianceSummary(summaryRes);
      }
    } catch (err) {
      console.error('Failed to load budget data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setForm({
      department_name: '',
      category: 'Operational',
      amount: '',
      period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
      period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 3, 0).toISOString().slice(0, 10),
      alert_threshold_pct: '80',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBudget(b);
    setForm({
      department_name: b.department_name || b.name || '',
      category: b.category || 'Operational',
      amount: String(b.amount || ''),
      period_start: b.period_start || '',
      period_end: b.period_end || '',
      alert_threshold_pct: String(b.alert_threshold_pct || 80),
      notes: b.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget envelope?')) return;
    try {
      await deleteBudget(id);
      loadData();
    } catch (err) {
      alert('Failed to delete budget: ' + (err.message || 'Unknown error'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        department_name: form.department_name,
        category: form.category,
        amount: parseFloat(form.amount) || 0,
        period_start: form.period_start,
        period_end: form.period_end,
        alert_threshold_pct: parseFloat(form.alert_threshold_pct) || 80,
        notes: form.notes,
      };

      if (editingBudget) {
        await updateBudget(editingBudget.id, payload);
      } else {
        await createBudget(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('Error saving budget: ' + (err.message || 'Unknown error'));
    }
  };

  // KPIs
  const totalAllocated = budgets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (Number(b.actual_spent) || 0), 0);
  const totalVariance = totalAllocated - totalSpent;
  const overallUtilizationPct = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
  const alertCount = budgets.filter((b) => {
    const consumed = b.percent_consumed || (Number(b.amount) > 0 ? (Number(b.actual_spent || 0) / Number(b.amount)) * 100 : 0);
    return consumed >= (b.alert_threshold_pct || 80);
  }).length;

  const filteredBudgets = budgets.filter((b) => {
    if (categoryFilter === 'ALL') return true;
    return b.category === categoryFilter;
  });

  const getGaugeColor = (pct) => {
    if (pct >= 90) return { bg: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-50 text-rose-800 border-rose-200' };
    if (pct >= 80) return { bg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-800 border-amber-200' };
    return { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  };

  const columns = [
    {
      header: 'Department / Division',
      accessor: 'department_name',
      render: (b) => (
        <div>
          <p className="font-bold text-slate-900">{b.department_name || b.name || 'General'}</p>
          <span className="font-medium text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {b.category || 'Operational'}
          </span>
        </div>
      ),
    },
    {
      header: 'Budget Period',
      render: (b) => (
        <div className="font-mono text-slate-600 text-xs">
          <span>{b.period_start ? formatDateDDMMYYYY(b.period_start) : '—'}</span>
          <span className="text-slate-400 mx-1">→</span>
          <span>{b.period_end ? formatDateDDMMYYYY(b.period_end) : '—'}</span>
        </div>
      ),
    },
    {
      header: 'Allocated Envelope',
      accessor: 'amount',
      align: 'right',
      render: (b) => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(b.amount)}
        </span>
      ),
    },
    {
      header: 'Actual Spent',
      accessor: 'actual_spent',
      align: 'right',
      render: (b) => (
        <span className="font-mono font-semibold text-slate-700">
          {formatCurrency(b.actual_spent || 0)}
        </span>
      ),
    },
    {
      header: 'Variance (Remaining)',
      align: 'right',
      render: (b) => {
        const remaining = (Number(b.amount) || 0) - (Number(b.actual_spent) || 0);
        return (
          <span className={`font-mono font-bold ${remaining < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {formatCurrency(remaining)}
          </span>
        );
      },
    },
    {
      header: 'Live Burn Gauge',
      render: (b) => {
        const pct = Math.round(
          b.percent_consumed !== undefined
            ? b.percent_consumed
            : Number(b.amount) > 0
            ? ((Number(b.actual_spent) || 0) / Number(b.amount)) * 100
            : 0
        );
        const color = getGaugeColor(pct);
        const threshold = b.alert_threshold_pct || 80;

        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className={`font-bold ${color.text}`}>{pct}%</span>
              <span className="text-slate-400">Limit: {threshold}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${color.bg}`}
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Alert Status',
      align: 'center',
      render: (b) => {
        const pct = Math.round(
          b.percent_consumed !== undefined
            ? b.percent_consumed
            : Number(b.amount) > 0
            ? ((Number(b.actual_spent) || 0) / Number(b.amount)) * 100
            : 0
        );
        const threshold = b.alert_threshold_pct || 80;
        const isAlert = pct >= threshold;

        if (pct >= 100) {
          return (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
              <AlertTriangle size={10} /> Over Budget
            </span>
          );
        }
        if (isAlert) {
          return (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
              <AlertTriangle size={10} /> Warning ({threshold}%)
            </span>
          );
        }
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle2 size={10} /> Normal
          </span>
        );
      },
    },
    {
      header: 'Actions',
      align: 'right',
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(b)}
            className="p-1 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition"
            title="Edit Budget Envelope"
          >
            <Edit3 size={13} />
          </button>
          <button
            onClick={() => handleDelete(b.id)}
            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete Budget"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets & Variance Analysis"
        subtitle="Configure departmental financial caps, track real-time expenditure against allowances, and monitor burn rates with early threshold alerts."
        guide={budgetGuide}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={RefreshCw} onClick={loadData}>
              Refresh
            </Button>
            <Button icon={Plus} onClick={handleOpenCreate}>
              New Budget Envelope
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Authorized Budgets"
          value={formatCurrency(totalAllocated)}
          icon={DollarSign}
          subtext={`${budgets.length} departmental allocations`}
        />
        <StatCard
          label="Actual Expenditures Incurred"
          value={formatCurrency(totalSpent)}
          icon={TrendingUp}
          subtext="Purchase bills + direct expenses"
        />
        <StatCard
          label="Remaining Fiscal Surplus"
          value={formatCurrency(totalVariance)}
          icon={PieChart}
          trend={{ positive: totalVariance >= 0, text: `${overallUtilizationPct}% portfolio consumed` }}
        />
        <StatCard
          label="Threshold Alerts"
          value={`${alertCount} Departments`}
          icon={AlertTriangle}
          highlight={alertCount > 0}
          trend={{ positive: false, text: 'Exceeding 80% / 90% allocation' }}
        />
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-slate-200 text-xs">
        {['ALL', 'Operational', 'Capital', 'Revenue'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              categoryFilter === cat
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {cat === 'ALL' ? 'All Allocations' : `${cat} Budgets`}
          </button>
        ))}
      </div>

      <DataTable
        title="Departmental Budgets & Burn Gauge"
        columns={columns}
        data={filteredBudgets}
        keyExtractor={(b) => b.id}
        searchPlaceholder="Search department, category..."
        searchFilter={(b, term) =>
          String(b.department_name || b.name || '').toLowerCase().includes(term) ||
          String(b.category || '').toLowerCase().includes(term)
        }
      />

      {/* Create / Edit Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">
                {editingBudget ? 'Edit Budget Envelope' : 'New Departmental Budget'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Department / Division Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Precision Engineering / Sales & Marketing / IT Ops"
                  value={form.department_name}
                  onChange={(e) => setForm({ ...form, department_name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Budget Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                  >
                    <option value="Operational">Operational (OPEX)</option>
                    <option value="Capital">Capital (CAPEX)</option>
                    <option value="Revenue">Revenue Generation</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Authorized Amount (Rs) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 500000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Period Start *</label>
                  <input
                    type="date"
                    required
                    value={form.period_start}
                    onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Period End *</label>
                  <input
                    type="date"
                    required
                    value={form.period_end}
                    onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Early Alert Threshold (%) *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="50"
                    max="100"
                    required
                    value={form.alert_threshold_pct}
                    onChange={(e) => setForm({ ...form, alert_threshold_pct: e.target.value })}
                    className="w-28 p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                  <span className="text-slate-500 text-xs">% of budget spent before amber alert flag</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Budget Purpose & Guidelines</label>
                <textarea
                  rows={2}
                  placeholder="Justification, authorized personnel, or quarterly scope..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingBudget ? 'Save Changes' : 'Allocate Budget Envelope'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;
