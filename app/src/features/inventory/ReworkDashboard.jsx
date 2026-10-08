import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { 
  RotateCcw, 
  Trash2, 
  Plus, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Scale, 
  X, 
  Layers,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { 
  fetchReworkOrders, 
  createReworkOrder, 
  logScrapFromRework, 
  fetchScrapLogs, 
  createScrapLog 
} from '../../services/upgradeService';

const reworkGuide = {
  title: 'Rework Loop & Scrap Tracking',
  subtitle: 'Audit non-conforming items, monitor rework labor and material loops, and log physical scrap generation.',
  purpose: 'Tracks parts or machines identified as defective from dock intake or assembly line audits. Captures secondary rework costs (additional technician hours + component consumption) and enables formal write-off to the scrap register if non-recoverable.',
  keyTerms: [
    { term: 'Rework Order', definition: 'Job order issued to technician shop to disassemble, modify, or recalibrate a non-conforming part.' },
    { term: 'Secondary Loop Cost', definition: 'Sum of technician labor plus replacement components spent repairing a defect.' },
    { term: 'Scrap Log', definition: 'Accounting write-off recording unrecoverable waste, weight, and salvage scrap value.' },
  ],
  tips: [
    'Log additional labor and replacement parts to calculate accurate landed product costs.',
    'If an item is determined unrepairable during rework, click "Log Scrap" to retire it directly from WIP.',
  ],
  workflow: ['Defect Flagged', 'Rework Order Initiated', 'Labor/Parts Logged', 'Repaired to Stock OR Scrapped'],
};

export const ReworkDashboard = () => {
  const { items: masterItems, formatCurrency, formatDateDDMMYYYY } = useERP();

  const [activeTab, setActiveTab] = useState('rework'); // 'rework' | 'scrap'
  const [reworkOrders, setReworkOrders] = useState([]);
  const [scrapLogs, setScrapLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [showScrapModal, setShowScrapModal] = useState(false);
  const [selectedRework, setSelectedRework] = useState(null);

  // Form states
  const [reworkForm, setReworkForm] = useState({
    item_name: '',
    defect_reason: '',
    initial_qty: '1',
    labor_cost: '0.00',
    material_cost: '0.00',
    assigned_technician: '',
    notes: '',
  });

  const [scrapForm, setScrapForm] = useState({
    item_name: '',
    quantity: '1',
    weight_kg: '',
    scrap_reason: 'Machining Defect / Beyond Economical Repair',
    estimated_salvage_value: '0.00',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const reworkRes = await fetchReworkOrders().catch(() => null);
      if (reworkRes?.data && Array.isArray(reworkRes.data)) {
        setReworkOrders(reworkRes.data);
      } else if (Array.isArray(reworkRes)) {
        setReworkOrders(reworkRes);
      }

      const scrapRes = await fetchScrapLogs().catch(() => null);
      if (scrapRes?.data && Array.isArray(scrapRes.data)) {
        setScrapLogs(scrapRes.data);
      } else if (Array.isArray(scrapRes)) {
        setScrapLogs(scrapRes);
      }
    } catch (err) {
      console.error('Failed to load rework/scrap data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateReworkSubmit = async (e) => {
    e.preventDefault();
    try {
      await createReworkOrder({
        item_name: reworkForm.item_name,
        defect_reason: reworkForm.defect_reason,
        initial_qty: parseInt(reworkForm.initial_qty, 10) || 1,
        labor_cost: parseFloat(reworkForm.labor_cost) || 0,
        material_cost: parseFloat(reworkForm.material_cost) || 0,
        assigned_technician: reworkForm.assigned_technician,
        notes: reworkForm.notes,
        status: 'Open',
      });
      setShowReworkModal(false);
      setReworkForm({
        item_name: '',
        defect_reason: '',
        initial_qty: '1',
        labor_cost: '0.00',
        material_cost: '0.00',
        assigned_technician: '',
        notes: '',
      });
      loadData();
    } catch (err) {
      alert('Failed to initiate rework order: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCreateScrapSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRework) {
        await logScrapFromRework(selectedRework.id, {
          scrap_qty: parseInt(scrapForm.quantity, 10) || 1,
          weight_kg: parseFloat(scrapForm.weight_kg) || 0,
          scrap_reason: scrapForm.scrap_reason,
          salvage_value: parseFloat(scrapForm.estimated_salvage_value) || 0,
          notes: scrapForm.notes,
        });
      } else {
        await createScrapLog({
          item_name: scrapForm.item_name,
          quantity: parseInt(scrapForm.quantity, 10) || 1,
          weight_kg: parseFloat(scrapForm.weight_kg) || 0,
          scrap_reason: scrapForm.scrap_reason,
          estimated_salvage_value: parseFloat(scrapForm.estimated_salvage_value) || 0,
          notes: scrapForm.notes,
        });
      }
      setShowScrapModal(false);
      setSelectedRework(null);
      setScrapForm({
        item_name: '',
        quantity: '1',
        weight_kg: '',
        scrap_reason: 'Machining Defect / Beyond Economical Repair',
        estimated_salvage_value: '0.00',
        notes: '',
      });
      loadData();
    } catch (err) {
      alert('Failed to record scrap log: ' + (err.message || 'Unknown error'));
    }
  };

  // KPIs
  const activeReworkCount = reworkOrders.filter(r => r.status === 'Open' || r.status === 'In Progress').length;
  const totalReworkCost = reworkOrders.reduce(
    (sum, r) => sum + (Number(r.labor_cost) || 0) + (Number(r.material_cost) || 0),
    0
  );
  const totalScrapQty = scrapLogs.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  const totalSalvageValue = scrapLogs.reduce((sum, s) => sum + (Number(s.estimated_salvage_value) || 0), 0);

  const reworkColumns = [
    {
      header: 'Rework Order #',
      accessor: 'order_number',
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-primary">{r.order_number || `RWK-${r.id?.slice(0, 5)}`}</span>
          <p className="text-[11px] text-slate-500">{r.created_at ? formatDateDDMMYYYY(r.created_at) : '—'}</p>
        </div>
      ),
    },
    {
      header: 'Defective Component',
      accessor: 'item_name',
      render: (r) => (
        <div>
          <p className="font-bold text-slate-800">{r.item_name || r.name}</p>
          <p className="text-[11px] text-rose-600 font-medium">{r.defect_reason}</p>
        </div>
      ),
    },
    {
      header: 'Quantity',
      accessor: 'initial_qty',
      align: 'center',
      render: (r) => <span className="font-mono font-bold text-slate-800">{r.initial_qty || 1} units</span>,
    },
    {
      header: 'Technician',
      accessor: 'assigned_technician',
      render: (r) => <span className="text-slate-700">{r.assigned_technician || 'Shop Floor Team'}</span>,
    },
    {
      header: 'Labor Cost',
      align: 'right',
      render: (r) => <span className="font-mono text-slate-600">{formatCurrency(r.labor_cost || 0)}</span>,
    },
    {
      header: 'Material Cost',
      align: 'right',
      render: (r) => <span className="font-mono text-slate-600">{formatCurrency(r.material_cost || 0)}</span>,
    },
    {
      header: 'Total Repair Loop Cost',
      align: 'right',
      render: (r) => (
        <span className="font-mono font-bold text-amber-700">
          {formatCurrency((Number(r.labor_cost) || 0) + (Number(r.material_cost) || 0))}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (r) => <StatusBadge status={r.status || 'In Progress'} />,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (r) => {
        if (r.status === 'Completed' || r.status === 'Scrapped') {
          return <span className="text-[11px] text-slate-400 font-medium">Closed</span>;
        }
        return (
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <button
              onClick={() => {
                setSelectedRework(r);
                setScrapForm({
                  item_name: r.item_name,
                  quantity: String(r.initial_qty || 1),
                  weight_kg: '',
                  scrap_reason: `Unrecoverable defect during rework: ${r.defect_reason || ''}`,
                  estimated_salvage_value: '0.00',
                  notes: '',
                });
                setShowScrapModal(true);
              }}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition"
              title="Scrap Unrecoverable Item"
            >
              <Trash2 size={12} /> Log Scrap
            </button>
          </div>
        );
      },
    },
  ];

  const scrapColumns = [
    {
      header: 'Scrap Log #',
      accessor: 'log_number',
      render: (s) => (
        <span className="font-mono font-bold text-slate-800">
          {s.log_number || `SCR-${s.id?.slice(0, 5)}`}
        </span>
      ),
    },
    {
      header: 'Scrapped Material / Item',
      accessor: 'item_name',
      render: (s) => (
        <div>
          <p className="font-bold text-slate-800">{s.item_name}</p>
          <p className="text-[11px] text-slate-500">{s.scrap_reason}</p>
        </div>
      ),
    },
    {
      header: 'Qty Scrapped',
      accessor: 'quantity',
      align: 'center',
      render: (s) => <span className="font-mono font-bold text-rose-700">{s.quantity || 1} units</span>,
    },
    {
      header: 'Measured Weight',
      accessor: 'weight_kg',
      align: 'center',
      render: (s) => (
        <span className="font-mono text-slate-700">
          {s.weight_kg ? `${s.weight_kg} kg` : '—'}
        </span>
      ),
    },
    {
      header: 'Estimated Salvage Value',
      accessor: 'estimated_salvage_value',
      align: 'right',
      render: (s) => (
        <span className="font-mono font-bold text-emerald-700">
          {formatCurrency(s.estimated_salvage_value || 0)}
        </span>
      ),
    },
    {
      header: 'Date Logged',
      render: (s) => (
        <span className="text-slate-600 text-xs">
          {s.created_at ? formatDateDDMMYYYY(s.created_at) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rework Loop & Scrap Management"
        subtitle="Track non-conforming items, log repair labor and replacement parts, and write off unrecoverable material to scrap."
        guide={reworkGuide}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={Trash2}
              onClick={() => {
                setSelectedRework(null);
                setScrapForm({
                  item_name: '',
                  quantity: '1',
                  weight_kg: '',
                  scrap_reason: 'Machining Defect / Beyond Economical Repair',
                  estimated_salvage_value: '0.00',
                  notes: '',
                });
                setShowScrapModal(true);
              }}
            >
              Direct Scrap Log
            </Button>
            <Button icon={Plus} onClick={() => setShowReworkModal(true)}>
              New Rework Order
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Rework Orders"
          value={`${activeReworkCount} Orders`}
          icon={Wrench}
          highlight={activeReworkCount > 0}
          trend={{ positive: false, text: 'In shop floor repair' }}
        />
        <StatCard
          label="Total Repair Loop Cost"
          value={formatCurrency(totalReworkCost)}
          icon={DollarSign}
          subtext="Technician labor + repair materials"
        />
        <StatCard
          label="Total Scrapped Units"
          value={`${totalScrapQty} Items`}
          icon={Trash2}
          subtext={`${scrapLogs.length} scrap incidents logged`}
        />
        <StatCard
          label="Scrap Salvage Recovered"
          value={formatCurrency(totalSalvageValue)}
          icon={Scale}
          trend={{ positive: true, text: 'Realized scrap value' }}
        />
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('rework')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'rework'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw size={14} />
          Rework Orders ({reworkOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('scrap')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'scrap'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trash2 size={14} />
          Scrap & Waste Register ({scrapLogs.length})
        </button>
      </div>

      {activeTab === 'rework' ? (
        <DataTable
          title="Active & Historical Rework Orders"
          columns={reworkColumns}
          data={reworkOrders}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search rework order #, component, technician..."
          searchFilter={(r, term) =>
            String(r.order_number || '').toLowerCase().includes(term) ||
            String(r.item_name || '').toLowerCase().includes(term) ||
            String(r.defect_reason || '').toLowerCase().includes(term)
          }
        />
      ) : (
        <DataTable
          title="Scrap & Waste Disposition Log"
          columns={scrapColumns}
          data={scrapLogs}
          keyExtractor={(s) => s.id}
          searchPlaceholder="Search scrapped material, reason..."
          searchFilter={(s, term) =>
            String(s.item_name || '').toLowerCase().includes(term) ||
            String(s.scrap_reason || '').toLowerCase().includes(term)
          }
        />
      )}

      {/* New Rework Order Modal */}
      {showReworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">Initiate Rework Job Order</h3>
              <button onClick={() => setShowReworkModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateReworkSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Component / Machine *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spindle Housing / Control Board"
                  value={reworkForm.item_name}
                  onChange={(e) => setReworkForm({ ...reworkForm, item_name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Defect / Failure Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clearance out of tolerance by 0.05mm / Loose solder bridge"
                  value={reworkForm.defect_reason}
                  onChange={(e) => setReworkForm({ ...reworkForm, defect_reason: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Quantity Affected *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={reworkForm.initial_qty}
                    onChange={(e) => setReworkForm({ ...reworkForm, initial_qty: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned Technician</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh K. (Precision Shop)"
                    value={reworkForm.assigned_technician}
                    onChange={(e) => setReworkForm({ ...reworkForm, assigned_technician: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estimated Labor Cost (Rs)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1500"
                    value={reworkForm.labor_cost}
                    onChange={(e) => setReworkForm({ ...reworkForm, labor_cost: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estimated Material Cost (Rs)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 800"
                    value={reworkForm.material_cost}
                    onChange={(e) => setReworkForm({ ...reworkForm, material_cost: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Technical Correction Plan</label>
                <textarea
                  rows={2}
                  placeholder="Steps to re-grind, re-machine, or re-solder the defective component..."
                  value={reworkForm.notes}
                  onChange={(e) => setReworkForm({ ...reworkForm, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowReworkModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold shadow-xs"
                >
                  Authorize Rework Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scrap Write-Off Modal */}
      {showScrapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-rose-700 flex items-center gap-1.5">
                <Trash2 size={16} /> Record Physical Scrap Disposition
              </h3>
              <button onClick={() => setShowScrapModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateScrapSubmit} className="space-y-3.5 mt-4">
              {selectedRework && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
                  Scrapping from Rework Order: <span className="font-mono font-bold">{selectedRework.order_number}</span>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scrapped Material / Item *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Defective Cast Iron Gear Housing"
                  value={scrapForm.item_name}
                  onChange={(e) => setScrapForm({ ...scrapForm, item_name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Quantity (Units) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={scrapForm.quantity}
                    onChange={(e) => setScrapForm({ ...scrapForm, quantity: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Measured Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 42.5"
                    value={scrapForm.weight_kg}
                    onChange={(e) => setScrapForm({ ...scrapForm, weight_kg: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scrap Reason *</label>
                <input
                  type="text"
                  required
                  value={scrapForm.scrap_reason}
                  onChange={(e) => setScrapForm({ ...scrapForm, scrap_reason: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Estimated Salvage Scrap Value (Rs)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1200"
                  value={scrapForm.estimated_salvage_value}
                  onChange={(e) => setScrapForm({ ...scrapForm, estimated_salvage_value: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                />
                <span className="text-[10px] text-slate-400">Scrap metal dealer expected realization</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowScrapModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm Scrap Write-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReworkDashboard;
