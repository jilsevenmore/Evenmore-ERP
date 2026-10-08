import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Package,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Send,
  Building2,
  Calendar,
  Layers,
  Search,
  ExternalLink,
  Plus,
  X,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  fetchVendorOrders,
  acknowledgeVendorOrder,
  submitVendorMilestone,
  submitVendorASN,
  fetchVendorLedger,
} from '../../services/upgradeService';

export function VendorPortalDashboard() {
  const navigate = useNavigate();

  const [vendorToken, setVendorToken] = useState(() => localStorage.getItem('vendor_portal_token') || '');
  const [vendorParty, setVendorParty] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vendor_portal_party') || '{}');
    } catch {
      return {};
    }
  });

  const [orders, setOrders] = useState([]);
  const [ledger, setLedger] = useState({ bills: [], advances: [], payments: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'asns' | 'ledger'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isAsnModalOpen, setIsAsnModalOpen] = useState(false);
  const [activePo, setActivePo] = useState(null);

  // Milestone Form
  const [stageName, setStageName] = useState('Raw Material Procurement');
  const [progressPct, setProgressPct] = useState(25);
  const [milestoneNotes, setMilestoneNotes] = useState('');

  // ASN Form
  const [carrierName, setCarrierName] = useState('BlueDart Express');
  const [trackingLrNumber, setTrackingLrNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [dispatchWeightKg, setDispatchWeightKg] = useState(120);
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [estimatedArrival, setEstimatedArrival] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [vendorNotes, setVendorNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, ledgerRes] = await Promise.all([
        fetchVendorOrders(vendorToken),
        fetchVendorLedger(vendorToken),
      ]);
      setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes?.results || []);
      setLedger(ledgerRes || { bills: [], advances: [], payments: [] });
    } catch (err) {
      console.error('Failed to load vendor portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [vendorToken]);

  const handleLogout = () => {
    localStorage.removeItem('vendor_portal_token');
    localStorage.removeItem('vendor_portal_user');
    localStorage.removeItem('vendor_portal_party');
    navigate('/vendor/login');
  };

  // Compile all ASNs from orders
  const allAsns = useMemo(() => {
    const list = [];
    orders.forEach((po) => {
      if (Array.isArray(po.asns)) {
        po.asns.forEach((asn) => {
          list.push({ ...asn, poNumber: po.po_number || po.id });
        });
      }
    });
    return list;
  }, [orders]);

  // Compute metrics
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const inProduction = orders.filter((po) => po.status === 'Confirmed' || po.status === 'In Production').length;
    const totalAsns = allAsns.length;
    const totalBills = ledger?.bills?.length || 0;
    return { totalOrders, inProduction, totalAsns, totalBills };
  }, [orders, allAsns, ledger]);

  const handleAcknowledge = async (po) => {
    try {
      setSubmitting(true);
      await acknowledgeVendorOrder(po.id, vendorToken);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to acknowledge order.');
    } finally {
      setSubmitting(false);
    }
  };

  const openMilestoneModal = (po) => {
    setActivePo(po);
    setStageName('CNC Precision Machining');
    setProgressPct(50);
    setMilestoneNotes('');
    setIsMilestoneModalOpen(true);
  };

  const handleSubmitMilestone = async (e) => {
    e.preventDefault();
    if (!activePo) return;
    try {
      setSubmitting(true);
      await submitVendorMilestone(
        activePo.id,
        { stage: stageName, progress_pct: progressPct, notes: milestoneNotes },
        vendorToken
      );
      setIsMilestoneModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to record milestone.');
    } finally {
      setSubmitting(false);
    }
  };

  const openAsnModal = (po) => {
    setActivePo(po);
    setCarrierName('VRL Logistics');
    setTrackingLrNumber(`LR-${Math.floor(100000 + Math.random() * 900000)}`);
    setVehicleNumber('MH-12-AB-3456');
    setDispatchWeightKg(150);
    setIsAsnModalOpen(true);
  };

  const handleSubmitAsn = async (e) => {
    e.preventDefault();
    if (!activePo) return;
    try {
      setSubmitting(true);
      await submitVendorASN(
        {
          purchase_order_id: activePo.id,
          carrier_name: carrierName,
          tracking_lr_number: trackingLrNumber,
          vehicle_number: vehicleNumber,
          dispatch_weight_kg: Number(dispatchWeightKg),
          dispatch_date: dispatchDate,
          estimated_arrival: estimatedArrival,
          vendor_notes: vendorNotes,
          items_dispatched: (activePo.lines || []).map((l) => ({
            itemId: l.itemId,
            itemName: l.itemName,
            quantity: l.quantity,
          })),
        },
        vendorToken
      );
      setIsAsnModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to submit ASN.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((po) => {
      const q = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        po.po_number?.toLowerCase().includes(q) ||
        po.notes?.toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Supplier Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
              <Truck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-white">SEWEN</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Supplier Workspace
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {vendorParty?.name || 'Authorized Vendor Partner'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-slate-200">
                {vendorParty?.email || 'vendor@portal.com'}
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 justify-end">
                <ShieldCheck size={12} /> Verified Supplier
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6 w-full">
        {/* Metric Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Package size={22} />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Purchase Orders</span>
              <span className="text-lg font-bold text-slate-900">{stats.totalOrders} Active</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock size={22} />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">In Production</span>
              <span className="text-lg font-bold text-slate-900">{stats.inProduction} Orders</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Truck size={22} />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Dispatched ASNs</span>
              <span className="text-lg font-bold text-slate-900">{stats.totalAsns} Shipments</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <CreditCard size={22} />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Invoices & Bills</span>
              <span className="text-lg font-bold text-slate-900">{stats.totalBills} Recorded</span>
            </div>
          </div>
        </div>

        {/* Tab & Search Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'orders', label: 'Purchase Orders', count: stats.totalOrders },
                { id: 'asns', label: 'Advance Shipping Notices (ASN)', count: stats.totalAsns },
                { id: 'ledger', label: 'Payment & Billing Ledger', count: stats.totalBills },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      activeTab === tab.id ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {activeTab === 'orders' && (
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search PO number..."
                  className="w-full h-8.5 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* TAB 1: PURCHASE ORDERS */}
          {activeTab === 'orders' && (
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading purchase orders...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-12 text-center">
                  <Package size={36} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No purchase orders found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    New purchase orders issued by SEWEN procurement will appear here automatically.
                  </p>
                </div>
              ) : (
                filteredOrders.map((po) => (
                  <div key={po.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-bold text-sm text-blue-600">
                            {po.po_number || `PO-${po.id}`}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Status: {po.status}
                          </span>
                          {po.asns && po.asns.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <Truck size={10} /> {po.asns.length} ASN Issued
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-slate-500 flex items-center gap-4 flex-wrap">
                          <span>
                            Order Date: <strong className="text-slate-700">{po.order_date || po.created_at?.slice(0, 10)}</strong>
                          </span>
                          <span>
                            Expected Delivery: <strong className="text-slate-700">{po.delivery_date || 'Standard TAT'}</strong>
                          </span>
                          <span>
                            Total Value: <strong className="text-slate-900 font-semibold font-mono">₹{Number(po.total_amount || 0).toLocaleString()}</strong>
                          </span>
                        </div>

                        {po.notes && (
                          <div className="mt-2 text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded-lg border border-slate-200/60 max-w-xl whitespace-pre-line">
                            {po.notes}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
                        {po.status === 'Draft' || po.status === 'Issued' ? (
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleAcknowledge(po)}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle2 size={14} /> 1-Click Acknowledge
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => openMilestoneModal(po)}
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <TrendingUp size={14} /> Update Milestone
                        </button>

                        <button
                          type="button"
                          onClick={() => openAsnModal(po)}
                          className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <Truck size={14} /> Dispatch ASN
                        </button>
                      </div>
                    </div>

                    {/* Order Lines preview */}
                    {Array.isArray(po.lines) && po.lines.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Line Items Ordered:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {po.lines.map((line, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                              <span className="font-semibold text-slate-800 block truncate">{line.itemName || 'Ordered Item'}</span>
                              <div className="text-[11px] text-slate-500 flex justify-between mt-0.5">
                                <span>Qty: {Number(line.quantity)} {line.unitName || 'units'}</span>
                                <span className="font-mono">Rate: ₹{Number(line.rate || 0)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: ADVANCE SHIPPING NOTICES */}
          {activeTab === 'asns' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">ASN Number</th>
                    <th className="py-3 px-4">PO Reference</th>
                    <th className="py-3 px-4">Carrier / Transporter</th>
                    <th className="py-3 px-4">Tracking LR #</th>
                    <th className="py-3 px-4">Vehicle #</th>
                    <th className="py-3 px-4">Net Weight</th>
                    <th className="py-3 px-4">Dispatch Date</th>
                    <th className="py-3 px-4">Estimated Arrival</th>
                    <th className="py-3 px-4">Dock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allAsns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No Advance Shipping Notices issued yet. Click "Dispatch ASN" on any purchase order.
                      </td>
                    </tr>
                  ) : (
                    allAsns.map((asn, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{asn.asn_number}</td>
                        <td className="py-3 px-4 font-mono text-slate-700">{asn.poNumber}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{asn.carrier_name}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{asn.tracking_lr_number}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{asn.vehicle_number || '-'}</td>
                        <td className="py-3 px-4 font-mono">{Number(asn.dispatch_weight_kg)} kg</td>
                        <td className="py-3 px-4 text-slate-600">{asn.dispatch_date}</td>
                        <td className="py-3 px-4 text-slate-600">{asn.estimated_arrival}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                            {asn.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: FINANCIAL LEDGER */}
          {activeTab === 'ledger' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Vendor Advance Payments Disbursed
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                        <th className="py-2.5 px-3">Advance Ref</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Mode</th>
                        <th className="py-2.5 px-3">Total Amount</th>
                        <th className="py-2.5 px-3">Reconciled</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(ledger?.advances || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">No advance records found.</td>
                        </tr>
                      ) : (
                        ledger.advances.map((adv) => (
                          <tr key={adv.id}>
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{adv.advance_number}</td>
                            <td className="py-2.5 px-3 text-slate-600">{adv.advance_date}</td>
                            <td className="py-2.5 px-3 text-slate-600">{adv.mode}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">₹{Number(adv.amount).toLocaleString()}</td>
                            <td className="py-2.5 px-3 font-mono text-emerald-700">₹{Number(adv.reconciled_amount || 0).toLocaleString()}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">{adv.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Settled Purchase Bills & Invoices
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                        <th className="py-2.5 px-3">Bill Number</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3">Total Bill Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(ledger?.bills || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">No purchase bills found.</td>
                        </tr>
                      ) : (
                        ledger.bills.map((bill) => (
                          <tr key={bill.id}>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{bill.bill_number}</td>
                            <td className="py-2.5 px-3 text-slate-600">{bill.bill_date}</td>
                            <td className="py-2.5 px-3 text-slate-600">{bill.due_date || '-'}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">₹{Number(bill.total_amount).toLocaleString()}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">{bill.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Milestone Update Modal */}
      {isMilestoneModalOpen && activePo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Update Milestone: {activePo.po_number || activePo.id}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMilestoneModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitMilestone} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manufacturing Stage
                </label>
                <select
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Raw Material Procured & Ingested">Raw Material Procured & Ingested</option>
                  <option value="Casting & Forging Complete">Casting & Forging Complete</option>
                  <option value="CNC Precision Machining">CNC Precision Machining</option>
                  <option value="Surface Coating & Heat Treatment">Surface Coating & Heat Treatment</option>
                  <option value="Final Quality Inspection & Packing">Final Quality Inspection & Packing</option>
                  <option value="Ready for Dispatch">Ready for Dispatch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Completion Percentage ({progressPct}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressPct}
                  onChange={(e) => setProgressPct(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Progress Notes / Heat Logs
                </label>
                <textarea
                  rows={3}
                  value={milestoneNotes}
                  onChange={(e) => setMilestoneNotes(e.target.value)}
                  placeholder="e.g. 50 units finished coating, awaiting dimensional calibration..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMilestoneModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Save Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Advance Shipping Notice (ASN) Modal */}
      {isAsnModalOpen && activePo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Issue Advance Shipping Notice (ASN)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAsnModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitAsn} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Submitting this notice alerts the SEWEN dock intake team in Goods Receipt to prepare unloading bay allocation for PO <span className="font-mono font-bold text-blue-600">{activePo.po_number || activePo.id}</span>.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Carrier / Logistics Provider <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="e.g. VRL Logistics / Delhivery"
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lorry Receipt (LR) / Consignment # <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={trackingLrNumber}
                    onChange={(e) => setTrackingLrNumber(e.target.value)}
                    placeholder="e.g. LR-987654"
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g. KA-01-AB-1234"
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dispatch Net Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={dispatchWeightKg}
                    onChange={(e) => setDispatchWeightKg(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dispatch Date
                  </label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimated Dock Arrival (ETA)
                  </label>
                  <input
                    type="date"
                    value={estimatedArrival}
                    onChange={(e) => setEstimatedArrival(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driver Contact / Special Bay Handling Notes
                </label>
                <textarea
                  rows={2}
                  value={vendorNotes}
                  onChange={(e) => setVendorNotes(e.target.value)}
                  placeholder="Driver phone number, pallet packaging instructions, etc."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAsnModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Transmitting...' : 'Issue ASN & Notify Dock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorPortalDashboard;
