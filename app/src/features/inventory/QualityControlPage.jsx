// Hidden: QC out of scope (Dev Spec §2.2 excluded from active scope)
/*
import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  XCircle,
  ClipboardCheck,
  Search,
  Filter,
  Plus,
  FileText,
  ShieldCheck,
  Download,
  Check,
  X,
  Clock,
  Layers,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { useERP } from '../../context/ERPContext';
import {
  fetchQualityInspections,
  createQualityInspection,
  completeQualityInspection,
} from '../../services/upgradeService';

const qcGuide = {
  title: 'Quality Assurance & Inspection Desk',
  subtitle: 'Verify inbound lot chemistry, physical dimensions, mill test certificates, and pass/fail specs before releasing inventory to active warehouse stock.',
  purpose: 'The QC Desk enforces standard operating quality standards across all incoming Goods Receipts (GRN) and internal shop floor batch lots.',
  keyTerms: [
    { term: 'AQL (Acceptable Quality Limit)', definition: 'Statistical sample size tested per batch lot.' },
    { term: 'First-Time Pass Rate (FTPR)', definition: 'Percentage of inspected lots that pass without needing rework quarantine.' },
    { term: 'Quarantine / Rework', definition: 'Routing out-of-spec lots to the Rework Station before either restock or scrap.' },
  ],
  tips: [
    'Measure physical tolerances against the nominal spec in the inspection sheet.',
    'Selecting "Quarantine for Rework" auto-creates a Rework Order in the Rework Dashboard.',
  ],
  workflow: ['Dock Intake (GRN)', 'QC Sample Inspection', 'Disposition: Accept / Rework / Reject', 'Stock Release / Quarantine'],
};

export function QualityControlPageOriginal() {
  const { items } = useERP() || {};
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all | pending | passed | rework | rejected
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form states for completing inspection
  const [checklist, setChecklist] = useState([
    { parameter: 'Physical Dimension / Thickness', nominal: '12.0 mm', measured: '12.0 mm', tolerance: '±0.1 mm', pass: true },
    { parameter: 'Surface Finish & Visual Defects', nominal: 'No burrs / scratches', measured: 'Clean', tolerance: 'Grade A', pass: true },
    { parameter: 'Hardness / Tensile Test', nominal: '45 HRC', measured: '46 HRC', tolerance: '42-48 HRC', pass: true },
    { parameter: 'Packaging & Mill Test Cert', nominal: 'MTC Attached', measured: 'Verified', tolerance: 'EN 10204 3.1', pass: true },
  ]);
  const [acceptedQty, setAcceptedQty] = useState(0);
  const [rejectedQty, setRejectedQty] = useState(0);
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Inspection form
  const [newItemId, setNewItemId] = useState('');
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [newReceivedQty, setNewReceivedQty] = useState(100);
  const [newSampleSize, setNewSampleSize] = useState(5);

  const loadInspections = async () => {
    try {
      setLoading(true);
      const res = await fetchQualityInspections();
      const list = Array.isArray(res) ? res : res?.results || [];
      setInspections(list);
    } catch (err) {
      console.error('Failed to load quality inspections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspections();
  }, []);

  // Compute Metrics
  const metrics = useMemo(() => {
    const total = inspections.length;
    const pending = inspections.filter((i) => i.status === 'pending').length;
    const passed = inspections.filter((i) => i.status === 'passed').length;
    const rework = inspections.filter((i) => i.status === 'rework').length;
    const rejected = inspections.filter((i) => i.status === 'rejected').length;
    const completed = passed + rework + rejected;
    const passRate = completed > 0 ? Math.round((passed / completed) * 100) : 100;
    const totalRejectedUnits = inspections.reduce((sum, i) => sum + Number(i.rejected_qty || 0), 0);

    return { total, pending, passed, rework, rejected, passRate, totalRejectedUnits };
  }, [inspections]);

  // Filtered list
  const filteredInspections = useMemo(() => {
    return inspections.filter((insp) => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'pending' && insp.status === 'pending') ||
        (activeTab === 'passed' && insp.status === 'passed') ||
        (activeTab === 'rework' && insp.status === 'rework') ||
        (activeTab === 'rejected' && insp.status === 'rejected');

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        insp.inspection_number?.toLowerCase().includes(q) ||
        insp.itemName?.toLowerCase().includes(q) ||
        insp.itemSku?.toLowerCase().includes(q) ||
        insp.batch_lot_number?.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [inspections, activeTab, searchQuery]);

  const openInspectionDesk = (insp) => {
    setSelectedInspection(insp);
    setAcceptedQty(Number(insp.received_qty || 0));
    setRejectedQty(0);
    setInspectorNotes(insp.inspector_notes || '');
    if (insp.checklist_results && insp.checklist_results.length > 0) {
      setChecklist(insp.checklist_results);
    } else {
      setChecklist([
        { parameter: 'Physical Dimension / Thickness', nominal: '12.0 mm', measured: '12.0 mm', tolerance: '±0.1 mm', pass: true },
        { parameter: 'Surface Finish & Visual Defects', nominal: 'Clean surface', measured: 'Inspected', tolerance: 'Visual Spec', pass: true },
        { parameter: 'Hardness / Material Chemistry', nominal: 'Standard Spec', measured: 'Compliant', tolerance: 'Test Spec', pass: true },
        { parameter: 'Packaging & Barcode Integrity', nominal: 'Scan OK', measured: 'Passed', tolerance: 'Scan Match', pass: true },
      ]);
    }
    setIsInspectModalOpen(true);
  };

  const handleUpdateChecklist = (index, field, value) => {
    const updated = [...checklist];
    updated[index][field] = value;
    setChecklist(updated);
  };

  const handleCompleteDisposition = async (dispositionStatus) => {
    if (!selectedInspection) return;
    try {
      setSubmitting(true);
      await completeQualityInspection(selectedInspection.id, {
        status: dispositionStatus,
        accepted_qty: Number(acceptedQty),
        rejected_qty: Number(rejectedQty),
        checklist_results: checklist,
        inspector_notes: inspectorNotes,
      });
      setIsInspectModalOpen(false);
      await loadInspections();
    } catch (err) {
      alert(err.message || 'Error completing inspection');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNewInspection = async (e) => {
    e.preventDefault();
    if (!newItemId) {
      alert('Please select an item.');
      return;
    }
    try {
      setSubmitting(true);
      await createQualityInspection({
        itemId: newItemId,
        batch_lot_number: newBatchNumber,
        received_qty: Number(newReceivedQty),
        sample_size: Number(newSampleSize),
      });
      setIsNewModalOpen(false);
      setNewBatchNumber('');
      await loadInspections();
    } catch (err) {
      alert(err.message || 'Failed to create inspection lot.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} /> Passed & Released
          </span>
        );
      case 'rework':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <RotateCcw size={12} /> Under Rework
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <XCircle size={12} /> Rejected / Debit Claim
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock size={12} /> Pending Inspection
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Quality Control (QC) Inspection Desk"
          subtitle="Dock intake verification, dimensional tolerance validation, and 3-way disposition routing."
          guide={qcGuide}
        />
        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus size={16} /> New Inspection Lot
        </button>
      </div>

      {/* KPI Stat Cards * /}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending Inspection Lots"
          value={`${metrics.pending} Lots`}
          icon={Clock}
          highlight={metrics.pending > 0}
          subtext="Awaiting dock sign-off"
        />
        <StatCard
          label="First-Time Pass Rate"
          value={`${metrics.passRate}%`}
          icon={ShieldCheck}
          trend={{ positive: metrics.passRate >= 90, text: `${metrics.passed} passed lots` }}
          subtext="Quality standard benchmark"
        />
        <StatCard
          label="Lots in Rework"
          value={`${metrics.rework} Quarantined`}
          icon={RotateCcw}
          subtext="Floor rectification active"
        />
        <StatCard
          label="Total Rejected Units"
          value={`${metrics.totalRejectedUnits} Units`}
          icon={XCircle}
          trend={{ positive: metrics.rejected === 0, text: `${metrics.rejected} rejected lots` }}
          subtext="Supplier debit note flagged"
        />
      </div>

      {/* Filter and Tab Bar * /}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'all', label: 'All Lots', count: metrics.total },
              { id: 'pending', label: 'Pending Inspection', count: metrics.pending },
              { id: 'passed', label: 'Passed & Released', count: metrics.passed },
              { id: 'rework', label: 'Under Rework', count: metrics.rework },
              { id: 'rejected', label: 'Rejected', count: metrics.rejected },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTab === tab.id ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lot, SKU, item..."
                className="w-full h-8.5 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Inspections Table * /}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Inspection #</th>
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-4">Batch / Lot</th>
                <th className="py-3 px-4">Received</th>
                <th className="py-3 px-4">Sample</th>
                <th className="py-3 px-4">Accepted / Rejected</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Inspector</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading quality inspections...
                  </td>
                </tr>
              ) : filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <ClipboardCheck size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No inspection lots found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery ? 'Try adjusting your search criteria' : 'Create an inspection lot to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {insp.inspection_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{insp.itemName || 'Raw Material'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{insp.itemSku || 'SKU-001'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {insp.batch_lot_number || 'LOT-AUTO'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {Number(insp.received_qty)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {Number(insp.sample_size)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-700 font-semibold">{Number(insp.accepted_qty)}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-red-700 font-semibold">{Number(insp.rejected_qty)}</span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(insp.status)}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {insp.inspectorName || 'Pending'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {insp.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => openInspectionDesk(insp)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <ClipboardCheck size={14} /> Inspect
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openInspectionDesk(insp)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                        >
                          <FileText size={13} /> View Sheet
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Inspection Desk Modal / Sheet * /}
      {isInspectModalOpen && selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    QC Inspection Sheet: {selectedInspection.inspection_number}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Item: <span className="font-semibold text-slate-800">{selectedInspection.itemName}</span> | Lot: <span className="font-mono">{selectedInspection.batch_lot_number || 'LOT-AUTO'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Lot Overview * /}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Received</span>
                  <span className="font-bold text-slate-900 text-sm">{Number(selectedInspection.received_qty)} units</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sample Tested</span>
                  <span className="font-bold text-slate-900 text-sm">{Number(selectedInspection.sample_size)} units</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedInspection.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">GRN Ref</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedInspection.grnNumber || 'Intake Lot'}</span>
                </div>
              </div>

              {/* Parameter Checklist Table * /}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Dimensional & Chemical Parameter Verification
                  </h3>
                  <span className="text-[11px] text-slate-400">Click pass/fail to toggle</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                        <th className="py-2.5 px-3">Inspection Parameter</th>
                        <th className="py-2.5 px-3">Nominal Standard</th>
                        <th className="py-2.5 px-3">Tolerance</th>
                        <th className="py-2.5 px-3">Measured Sample</th>
                        <th className="py-2.5 px-3 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {checklist.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-slate-900">{item.parameter}</td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono">{item.nominal}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono">{item.tolerance}</td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={item.measured}
                              onChange={(e) => handleUpdateChecklist(index, 'measured', e.target.value)}
                              className="h-7 w-28 px-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleUpdateChecklist(index, 'pass', !item.pass)}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition-colors ${
                                item.pass
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-red-100 text-red-800 border border-red-300'
                              }`}
                            >
                              {item.pass ? <Check size={11} /> : <X size={11} />}
                              {item.pass ? 'PASS' : 'FAIL'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quantity Release Distribution * /}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Accepted Quantity to Release
                  </label>
                  <input
                    type="number"
                    value={acceptedQty}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAcceptedQty(val);
                      setRejectedQty(Math.max(0, Number(selectedInspection.received_qty) - val));
                    }}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Transfers automatically to Primary Stock Bin
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rejected / Quarantined Quantity
                  </label>
                  <input
                    type="number"
                    value={rejectedQty}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRejectedQty(val);
                      setAcceptedQty(Math.max(0, Number(selectedInspection.received_qty) - val));
                    }}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Routes to Rework Quarantine or Supplier Debit Return
                  </span>
                </div>
              </div>

              {/* Inspector Sign-off Notes * /}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Inspector Sign-Off Notes & Certificate Observations
                </label>
                <textarea
                  rows={2}
                  value={inspectorNotes}
                  onChange={(e) => setInspectorNotes(e.target.value)}
                  placeholder="Record deviations, surface observations, or laboratory heat numbers..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 3-Way Final Disposition Action Buttons * /}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Commit 3-Way Final Disposition:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleCompleteDisposition('passed')}
                    className="p-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all flex flex-col items-center justify-center gap-1 shadow-xs"
                  >
                    <CheckCircle2 size={16} />
                    <span>1. Accept & Release Stock</span>
                    <span className="text-[10px] font-normal opacity-85">Passes to active inventory</span>
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleCompleteDisposition('rework')}
                    className="p-3 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-all flex flex-col items-center justify-center gap-1 shadow-xs"
                  >
                    <RotateCcw size={16} />
                    <span>2. Quarantine for Floor Rework</span>
                    <span className="text-[10px] font-normal opacity-85">Creates ReworkOrder</span>
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleCompleteDisposition('rejected')}
                    className="p-3 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-all flex flex-col items-center justify-center gap-1 shadow-xs"
                  >
                    <XCircle size={16} />
                    <span>3. Reject Lot & Claim Debit</span>
                    <span className="text-[10px] font-normal opacity-85">Flags supplier debit note</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Inspection Intake Modal * /}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={18} className="text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Initiate QC Inspection Lot</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewInspection} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item / Part <span className="text-red-500">*</span>
                </label>
                <select
                  value={newItemId}
                  onChange={(e) => setNewItemId(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Item...</option>
                  {(items || []).map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.sku || it.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batch / Lot / Heat Number
                </label>
                <input
                  type="text"
                  value={newBatchNumber}
                  onChange={(e) => setNewBatchNumber(e.target.value)}
                  placeholder="e.g. BATCH-2026-X01"
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Received Quantity
                  </label>
                  <input
                    type="number"
                    value={newReceivedQty}
                    onChange={(e) => setNewReceivedQty(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sample Size (AQL)
                  </label>
                  <input
                    type="number"
                    value={newSampleSize}
                    onChange={(e) => setNewSampleSize(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Inspection Lot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  );
}
*/

export function QualityControlPage() {
  return null;
}

export default QualityControlPage;

