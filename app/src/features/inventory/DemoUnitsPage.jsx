import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { 
  PackageCheck, 
  Plus, 
  RotateCcw, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  ShieldAlert, 
  AlertTriangle, 
  Search, 
  X, 
  ShoppingBag, 
  Building2,
  Calendar,
  Layers,
  Wrench
} from 'lucide-react';
import { 
  fetchDemoUnits, 
  createDemoUnit, 
  returnDemoUnitInspection, 
  convertDemoUnitToSale 
} from '../../services/upgradeService';
import { rowsOf, isServerId } from '../../services/resourceSync';
import { sanitizeNumberInput, handleNumberInputFocus } from '../../utils/stringUtils';

const demoUnitsGuide = {
  title: 'Trial Machines & Demo Units Tracking',
  subtitle: 'Monitor evaluation equipment deployed at customer sites, track return inspections, and manage conversion to final sales.',
  purpose: 'Enables sales and engineering teams to track high-value machinery and demo units sent for proof-of-concept testing, record security deposits held, audit return physical conditions with refurbishment costs, or directly convert trials into commercial sales.',
  keyTerms: [
    { term: 'Demo Unit / Trial Machine', definition: 'High-value machine dispatched to client premises for 7-30 days evaluation testing.' },
    { term: 'Security Deposit', definition: 'Collateral deposit retained until successful machine return or conversion to purchase.' },
    { term: 'Return Inspection', definition: 'Technical audit verifying physical wear, operational damage, and any required refurbishment cost.' },
    { term: 'Conversion to Sale', definition: 'Automatic workflow converting a trial unit into a billable sale with security deposit offset.' },
  ],
  tips: [
    'Always record serial numbers to prevent model confusion upon field return.',
    'Click "Return Inspection" upon receipt to log refurbishment fees or restore unit to available stock.',
    'Click "Convert to Sale" if the customer accepts the unit, automatically adjusting security deposits.',
  ],
  workflow: ['Dispatch Trial', 'Customer Evaluation', 'Return Inspection OR Conversion to Sale', 'Inventory / Deposit Settlement'],
};

// The backend's demo-unit statuses; On Trial and Overdue are still in the field.
const ACTIVE_DEMO = ['On Trial', 'Overdue'];
const STATUS_TABS = [
  { id: 'ALL', label: 'All Units' },
  { id: 'On Trial', label: 'On Trial' },
  { id: 'Returned - Inspected', label: 'Returned' },
  { id: 'Converted to Sale', label: 'Sold' },
];

/** An API demo unit in the shape this page renders. */
const toDemoRow = (u) => ({
  ...u,
  machine_name: u.itemName || '',
  sku: u.itemSku || '',
  serial_number: u.serialNumber || '',
  customer_name: u.prospectName || '',
  dispatch_date: u.dispatchDate,
  expected_return_date: u.expectedReturnDate,
  security_deposit: Number(u.securityDeposit) || 0,
  physical_condition: u.conditionOnReturn || '',
  refurbishment_cost: Number(u.refurbishmentCost) || 0,
  final_sale_price: Number(u.salePrice) || 0,
});

const emptyDeployForm = () => ({
  itemId: '',
  serial_number: '',
  customer: '',
  dispatch_date: new Date().toISOString().slice(0, 10),
  expected_return_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  security_deposit: '',
  notes: '',
});

export const DemoUnitsPage = () => {
  const { customers, items = [], formatCurrency, formatDateDDMMYYYY } = useERP();
  // Machines first: those are what goes out on trial.
  const machineOptions = [...items]
    .filter((it) => isServerId(it.id) && it.itemKind !== 'Service')
    .sort((a, b) => (a.itemKind === 'Machine' ? 0 : 1) - (b.itemKind === 'Machine' ? 0 : 1)
      || String(a.name).localeCompare(String(b.name)));

  const [demoUnits, setDemoUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Deploy Form
  const [deployForm, setDeployForm] = useState(emptyDeployForm);
  const deployItem = items.find((it) => it.id === deployForm.itemId);

  // Return Inspection Form
  const [inspectForm, setInspectForm] = useState({
    return_date: new Date().toISOString().slice(0, 10),
    physical_condition: 'Excellent',
    refurbishment_cost: '',
    notes: '',
  });

  // Convert to Sale Form
  const [convertForm, setConvertForm] = useState({
    invoice_number: '',
    final_sale_price: '',
    security_deposit_applied: '',
    notes: '',
  });

  const loadDemoUnits = async () => {
    setLoading(true);
    try {
      const res = await fetchDemoUnits();
      setDemoUnits(rowsOf(Array.isArray(res?.data) ? res.data : res).map(toDemoRow));
    } catch (err) {
      console.error('Failed to load demo units:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemoUnits();
  }, []);

  const handleDeploySubmit = async (e) => {
    e.preventDefault();
    try {
      const customer = (customers || []).find((c) => c.id === deployForm.customer);
      await createDemoUnit({
        itemId: deployForm.itemId,
        serialNumber: deployForm.serial_number.trim() || undefined,
        prospectName: customer?.name || deployForm.customer,
        prospectPartyId: customer && isServerId(customer.id) ? customer.id : undefined,
        contactPhone: customer?.phone || undefined,
        contactEmail: customer?.email || undefined,
        dispatchDate: deployForm.dispatch_date,
        expectedReturnDate: deployForm.expected_return_date,
        securityDeposit: parseFloat(deployForm.security_deposit) || 0,
        notes: deployForm.notes || undefined,
        status: 'On Trial',
      });
      setShowDeployModal(false);
      setDeployForm(emptyDeployForm());
      loadDemoUnits();
    } catch (err) {
      alert('Error deploying demo unit: ' + (err.message || 'Unknown error'));
    }
  };

  const handleInspectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUnit) return;
    try {
      await returnDemoUnitInspection(selectedUnit.id, {
        returnDate: inspectForm.return_date,
        condition: inspectForm.physical_condition,
        refurbishmentCost: parseFloat(inspectForm.refurbishment_cost) || 0,
        notes: inspectForm.notes,
      });
      setShowInspectModal(false);
      setSelectedUnit(null);
      loadDemoUnits();
    } catch (err) {
      alert('Error saving inspection: ' + (err.message || 'Unknown error'));
    }
  };

  const handleConvertSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUnit) return;
    try {
      const depositOffset = parseFloat(convertForm.security_deposit_applied) || 0;
      await convertDemoUnitToSale(selectedUnit.id, {
        invoice_ref: convertForm.invoice_number,
        salePrice: parseFloat(convertForm.final_sale_price) || 0,
        notes: [convertForm.notes, depositOffset ? `Deposit offset ${depositOffset}` : ''].filter(Boolean).join(' | '),
      });
      setShowConvertModal(false);
      setSelectedUnit(null);
      loadDemoUnits();
    } catch (err) {
      alert('Error converting unit to sale: ' + (err.message || 'Unknown error'));
    }
  };

  // KPIs
  const activeTrials = demoUnits.filter(u => ACTIVE_DEMO.includes(u.status));
  const totalDeposits = activeTrials.reduce((sum, u) => sum + (Number(u.security_deposit) || 0), 0);
  const returnedUnits = demoUnits.filter(u => u.status === 'Returned - Inspected');
  const convertedUnits = demoUnits.filter(u => u.status === 'Converted to Sale');

  const filteredData = demoUnits.filter(u => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'On Trial') return ACTIVE_DEMO.includes(u.status);
    return u.status === statusFilter;
  });

  const columns = [
    {
      header: 'Machine / Model',
      accessor: 'machine_name',
      render: (u) => (
        <div>
          <p className="font-bold text-slate-900">{u.machine_name || '—'}</p>
          <p className="font-mono text-[11px] text-slate-500">
            {u.demoNumber ? `${u.demoNumber} • ` : ''}SN: {u.serial_number || 'N/A'}
          </p>
        </div>
      ),
    },
    {
      header: 'Evaluation Client',
      accessor: 'customer_name',
      render: (u) => (
        <div>
          <p className="font-semibold text-slate-800">{u.customer_name || u.customer || '—'}</p>
          <p className="text-[11px] text-slate-400">Deployed at site</p>
        </div>
      ),
    },
    {
      header: 'Trial Timeline',
      render: (u) => (
        <div className="text-slate-600 font-mono text-xs">
          <span>{u.dispatch_date ? formatDateDDMMYYYY(u.dispatch_date) : '—'}</span>
          <span className="text-slate-400 mx-1">→</span>
          <span className="font-semibold text-slate-800">{u.expected_return_date ? formatDateDDMMYYYY(u.expected_return_date) : 'Open'}</span>
        </div>
      ),
    },
    {
      header: 'Security Deposit',
      accessor: 'security_deposit',
      align: 'right',
      render: (u) => (
        <span className="font-mono font-bold text-slate-800">
          {formatCurrency(u.security_deposit || 0)}
        </span>
      ),
    },
    {
      header: 'Condition / Outcome',
      render: (u) => {
        if (u.physical_condition) {
          return (
            <span className="text-xs">
              <span className="font-semibold text-slate-700">{u.physical_condition}</span>
              {Number(u.refurbishment_cost) > 0 && (
                <span className="text-rose-600 ml-1 font-mono">({formatCurrency(u.refurbishment_cost)})</span>
              )}
            </span>
          );
        }
        if (u.final_sale_price) {
          return (
            <span className="text-xs font-mono font-semibold text-emerald-600">
              Sold: {formatCurrency(u.final_sale_price)}
            </span>
          );
        }
        return <span className="text-slate-400 text-xs">In Field Testing</span>;
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (u) => {
        const canAction = ACTIVE_DEMO.includes(u.status);
        if (!canAction) {
          return <span className="text-[11px] text-slate-400 font-medium">Completed</span>;
        }
        return (
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <button
              onClick={() => {
                setSelectedUnit(u);
                setInspectForm({
                  return_date: new Date().toISOString().slice(0, 10),
                  physical_condition: 'Excellent',
                  refurbishment_cost: '',
                  notes: '',
                });
                setShowInspectModal(true);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium inline-flex items-center gap-1 transition"
              title="Return & Technical Inspection"
            >
              <RotateCcw size={12} /> Return
            </button>
            <button
              onClick={() => {
                setSelectedUnit(u);
                setConvertForm({
                  invoice_number: `INV-TRIAL-${Date.now().toString().slice(-4)}`,
                  final_sale_price: '',
                  security_deposit_applied: u.security_deposit || '',
                  notes: '',
                });
                setShowConvertModal(true);
              }}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold inline-flex items-center gap-1 transition shadow-2xs"
              title="Convert Trial Machine to Permanent Sale"
            >
              <ShoppingBag size={12} /> Convert to Sale
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trial Machines & Demo Units"
        subtitle="Manage customer proof-of-concept units, security deposits, physical return inspections, and conversion to permanent sales."
        guide={demoUnitsGuide}
        actions={
          <Button icon={Plus} onClick={() => setShowDeployModal(true)}>
            Deploy Trial Machine
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Trials in Field"
          value={`${activeTrials.length} Units`}
          icon={Clock}
          trend={{ positive: true, text: 'Under customer evaluation' }}
          highlight={activeTrials.length > 0}
        />
        <StatCard
          label="Security Deposits Held"
          value={formatCurrency(totalDeposits)}
          icon={DollarSign}
          subtext="Collateral across active deployments"
        />
        <StatCard
          label="Inspected & Returned"
          value={`${returnedUnits.length} Units`}
          icon={RotateCcw}
          subtext="Refurbished to available stock"
        />
        <StatCard
          label="Converted to Sale"
          value={`${convertedUnits.length} Units`}
          icon={CheckCircle2}
          trend={{ positive: true, text: 'Commercial realization' }}
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex border-b border-slate-200 text-xs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              statusFilter === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        title="Trial Equipment Register"
        columns={columns}
        data={filteredData}
        keyExtractor={(u) => u.id}
        searchPlaceholder="Search machine model, serial #, customer..."
        searchFilter={(u, term) =>
          String(u.machine_name || '').toLowerCase().includes(term) ||
          String(u.demoNumber || '').toLowerCase().includes(term) ||
          String(u.serial_number || '').toLowerCase().includes(term) ||
          String(u.customer_name || u.customer || '').toLowerCase().includes(term)
        }
      />

      {/* Deploy Trial Machine Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">Deploy Trial / Demo Machine</h3>
              <button onClick={() => setShowDeployModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleDeploySubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Machine / Equipment Model *</label>
                <select
                  required
                  value={deployForm.itemId}
                  onChange={(e) => setDeployForm({ ...deployForm, itemId: e.target.value, serial_number: '' })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                >
                  <option value="">Select machine from Product Master...</option>
                  {machineOptions.map((it) => (
                    <option key={it.id} value={it.id}>
                      [{it.sku}] {it.name}{it.itemKind === 'Machine' ? ' (Machine)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Serial Number</label>
                  <input
                    type="text"
                    list="demo-unit-serials"
                    placeholder="e.g. SN-88392-C"
                    value={deployForm.serial_number}
                    onChange={(e) => setDeployForm({ ...deployForm, serial_number: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                  <datalist id="demo-unit-serials">
                    {(deployItem?.serialNumbers || []).map((sn) => <option key={sn} value={sn} />)}
                  </datalist>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Evaluation Client *</label>
                  <select
                    required
                    value={deployForm.customer}
                    onChange={(e) => setDeployForm({ ...deployForm, customer: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                  >
                    <option value="">Select Customer...</option>
                    {(customers || []).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dispatch Date *</label>
                  <input
                    type="date"
                    required
                    value={deployForm.dispatch_date}
                    onChange={(e) => setDeployForm({ ...deployForm, dispatch_date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expected Return Date *</label>
                  <input
                    type="date"
                    required
                    value={deployForm.expected_return_date}
                    onChange={(e) => setDeployForm({ ...deployForm, expected_return_date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Security Deposit Held (Rs)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 150000"
                  value={deployForm.security_deposit}
                  onFocus={handleNumberInputFocus}
                  onChange={(e) => setDeployForm({ ...deployForm, security_deposit: sanitizeNumberInput(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Testing Terms & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Testing guidelines, trial duration agreement, or technical remarks..."
                  value={deployForm.notes}
                  onChange={(e) => setDeployForm({ ...deployForm, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold shadow-xs"
                >
                  Authorize Field Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return & Inspection Modal */}
      {showInspectModal && selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">Field Return Inspection</h3>
              <button onClick={() => setShowInspectModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleInspectSubmit} className="space-y-3.5 mt-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p className="text-slate-800 font-semibold">{selectedUnit.machine_name}</p>
                <p className="text-slate-500 font-mono text-[11px]">SN: {selectedUnit.serial_number} • Client: {selectedUnit.customer_name || selectedUnit.customer}</p>
                <p className="text-slate-600 text-[11px]">Deposit Held: <span className="font-bold text-slate-900">{formatCurrency(selectedUnit.security_deposit || 0)}</span></p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Return Intake Date *</label>
                <input
                  type="date"
                  required
                  value={inspectForm.return_date}
                  onChange={(e) => setInspectForm({ ...inspectForm, return_date: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Physical & Operational Condition *</label>
                <select
                  value={inspectForm.physical_condition}
                  onChange={(e) => setInspectForm({ ...inspectForm, physical_condition: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                >
                  <option value="Excellent">Excellent — Ready for immediate redeployment</option>
                  <option value="Good">Good — Minor surface wear, passes full QC</option>
                  <option value="Requires Cleaning">Requires Cleaning / Routine Calibration</option>
                  <option value="Damaged">Damaged — Needs major repair / replacement parts</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Refurbishment / Deductible Cost (Rs)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={inspectForm.refurbishment_cost}
                  onFocus={handleNumberInputFocus}
                  onChange={(e) => setInspectForm({ ...inspectForm, refurbishment_cost: sanitizeNumberInput(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                />
                <span className="text-[10px] text-slate-400">Deducted from security deposit if applicable</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Technical Audit Notes</label>
                <textarea
                  rows={2}
                  placeholder="Observation of wear, motor hours, scratches or component status..."
                  value={inspectForm.notes}
                  onChange={(e) => setInspectForm({ ...inspectForm, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowInspectModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Complete Inspection & Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Sale Modal */}
      {showConvertModal && selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">Convert Trial to Permanent Sale</h3>
              <button onClick={() => setShowConvertModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConvertSubmit} className="space-y-3.5 mt-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                <p className="text-emerald-900 font-semibold">{selectedUnit.machine_name}</p>
                <p className="text-emerald-700 font-mono text-[11px]">SN: {selectedUnit.serial_number}</p>
                <p className="text-slate-700 text-[11px]">Available Security Deposit: <span className="font-bold">{formatCurrency(selectedUnit.security_deposit || 0)}</span></p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Invoice Number *</label>
                <input
                  type="text"
                  required
                  value={convertForm.invoice_number}
                  onChange={(e) => setConvertForm({ ...convertForm, invoice_number: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Final Sale Price (Rs) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="1"
                    placeholder="e.g. 750000"
                    value={convertForm.final_sale_price}
                    onFocus={handleNumberInputFocus}
                    onChange={(e) => setConvertForm({ ...convertForm, final_sale_price: sanitizeNumberInput(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Deposit Offset (Rs)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={convertForm.security_deposit_applied}
                    onFocus={handleNumberInputFocus}
                    onChange={(e) => setConvertForm({ ...convertForm, security_deposit_applied: sanitizeNumberInput(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              {Number(convertForm.final_sale_price) > 0 && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between font-semibold">
                  <span className="text-slate-600">Net Receivable from Customer:</span>
                  <span className="font-mono text-emerald-700">
                    {formatCurrency(
                      Math.max(0, Number(convertForm.final_sale_price || 0) - Number(convertForm.security_deposit_applied || 0))
                    )}
                  </span>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sale Conversion Notes</label>
                <textarea
                  rows={2}
                  placeholder="Warranty terms or commercial notes..."
                  value={convertForm.notes}
                  onChange={(e) => setConvertForm({ ...convertForm, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm Sale & Adjust Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoUnitsPage;
