import React, { useState } from 'react';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Package, AlertCircle, DollarSign, ArrowLeftRight, Send, Wrench, ArrowRight, Plus, Clock, ExternalLink, } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useERP } from '../../context/ERPContext';
import { PageHeader } from '../../components/common/PageHeader';
import { LineItemEditor } from '../../components/common/LineItemEditor';
const dashboardGuide = {
    title: 'Enterprise Operations Dashboard',
    subtitle: 'Central command for inventory health, transaction flows, and operational KPIs.',
    purpose: 'The Horizon Executive Dashboard aggregates real-time data across inventory stock levels, order pipeline volumes, accounts receivable, warehouse transfers, and low-stock replenishment needs.',
    keyTerms: [
        { term: 'Reactive Stock Ledger', definition: 'Live inventory balance reflecting physical on-hand units, incoming purchase orders, and committed sales reservations.' },
        { term: 'Safety Buffer Shortages', definition: 'High-priority alert identifying SKUs that have depleted below safe reorder levels.' },
        { term: 'Transfer Consignments', definition: 'Physical stock movements transitioning between facility nodes and warehouse bins.' },
    ],
    tips: [
        'Press Ctrl + K anytime to open the global command palette and jump to any document, customer, or SKU.',
        'Use "+ Quick Sales Order" to rapidly draft high-priority client agreements in 2 clicks.',
    ],
    workflow: ['Stock Monitored', 'Low Stock Requisitioned (PO)', 'Orders Booked (SO)', 'Goods Dispatched (DC)', 'Invoiced & Settled'],
};
export const DashboardPage = () => {
    const navigate = useNavigate();
    const { items, transfers, zoneRequests, faultyParts, salesOrders, customers, addSalesOrder, calculateItemStock, } = useERP();
    const [showQuickOrderModal, setShowQuickOrderModal] = useState(false);
    const [quickCustomerId, setQuickCustomerId] = useState(customers[0]?.id || '');
    const [quickLineItems, setQuickLineItems] = useState([]);
    // Computed metrics with dynamic stock calculation
    const totalSkus = items.length;
    const enrichedItems = items.map((itm) => {
        const calc = calculateItemStock(itm.id);
        let status = itm.status;
        if (calc.available <= itm.reorderLevel / 2) {
            status = 'Critical';
        }
        else if (calc.available <= itm.reorderLevel) {
            status = 'Low Stock';
        }
        else {
            status = 'Optimal';
        }
        return {
            ...itm,
            availableQty: calc.available,
            onHandQty: calc.onHand,
            status,
        };
    });
    const lowStockItems = enrichedItems.filter((itm) => itm.status === 'Low Stock' || itm.status === 'Critical');
    const totalStockValue = enrichedItems.reduce((acc, itm) => acc + (itm.costPrice ?? itm.unitCost ?? 0) * (itm.onHandQty || 0), 0);
    const pendingTransfers = transfers.filter((t) => t.status !== 'Received').length;
    const pendingZoneReqs = zoneRequests.filter((r) => r.status === 'Requested').length;
    const openFaulty = faultyParts.filter((f) => f.status === 'Reported' || f.status === 'Sent for Replacement').length;
    const handleCreateQuickOrder = (e) => {
        e.preventDefault();
        const cust = customers.find((c) => c.id === quickCustomerId) || customers[0];
        const computedTotal = quickLineItems.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0);
        addSalesOrder({
            customerId: cust?.id,
            customer: cust?.name || 'Acme Corp',
            amount: computedTotal > 0 ? computedTotal : 5000,
            deliveryDate: 'In 7 business days',
            items: quickLineItems,
        });
        setShowQuickOrderModal(false);
        setQuickLineItems([]);
        navigate('/sales/orders');
    };
    return (<div className="space-y-6">
      {/* Title & Quick Actions */}
      <PageHeader title="Inventory & Operations Dashboard" subtitle="Real-time overview of reactive stock ledger, pending requisitions, and end-to-end transaction lifecycles." guide={dashboardGuide} actions={<div className="flex items-center gap-2.5">
            <Link to="/inventory/stock" className="px-3 py-2 bg-white border border-[#CED4DA] rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs">
              Live Stock Position
            </Link>
            <button onClick={() => setShowQuickOrderModal(true)} className="px-3.5 py-2 bg-[#1F2E4A] hover:bg-[#152033] text-white rounded-md text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer">
              <Plus size={14}/>
              + Quick Sales Order
            </button>
          </div>}/>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total SKUs" value={totalSkus.toLocaleString()} icon={Package}/>
        <StatCard label="Low Stock" value={lowStockItems.length} trend={{ positive: false, text: 'Requires Order' }} icon={AlertCircle}/>
        <StatCard label="Stock Value" value={`$${Math.round(totalStockValue).toLocaleString()}`} icon={DollarSign}/>
        <StatCard label="Transfers" value={transfers.length} subtext={`${pendingTransfers} In Transit`} icon={ArrowLeftRight}/>
        <StatCard label="Zone Requests" value={pendingZoneReqs} subtext="Pending review" icon={Send}/>
        <StatCard label="Faulty Open" value={openFaulty} subtext="Under assessment" icon={Wrench}/>
      </div>

      {/* Main Grid: Low Stock Alerts & Recent Transfers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Table */}
        <div className="lg:col-span-2 bg-white border border-[#CED4DA] rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Low-Stock Alerts</h3>
              <p className="text-[11px] text-slate-500">
                Items at or below designated minimum safety buffer
              </p>
            </div>
            <Link to="/inventory/stock" className="text-xs font-semibold text-[#1F2E4A] hover:underline flex items-center gap-1">
              View All <ArrowRight size={13}/>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-center">Available Qty</th>
                  <th className="py-2.5 px-3 text-center">Reorder Level</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockItems.map((item) => (<tr key={item.sku} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-600">
                      {item.sku}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-rose-600 font-mono">
                      {item.availableQty}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-mono">
                      {item.reorderLevel}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link to="/purchase-orders" className="inline-flex items-center px-2.5 py-1 bg-[#1F2E4A] text-white rounded text-[11px] font-semibold hover:bg-[#152033] transition">
                        Order
                      </Link>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transfers Panel */}
        <div className="bg-white border border-[#CED4DA] rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Recent Transfers</h3>
                <p className="text-[11px] text-slate-500">Warehouse inventory flows</p>
              </div>
              <Link to="/transfers" className="text-xs font-semibold text-[#1F2E4A] hover:underline flex items-center gap-1">
                View All <ArrowRight size={13}/>
              </Link>
            </div>
            <div className="space-y-3">
              {transfers.slice(0, 4).map((transfer) => (<div key={transfer.id} className="p-3 rounded-md border border-slate-200 bg-[#F8F9FA] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-slate-800">
                      {transfer.transferNumber}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {transfer.sourceLocation} → {transfer.destLocation}
                    </p>
                  </div>
                  <StatusBadge status={transfer.status}/>
                </div>))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={13}/> {pendingTransfers} Pending intake
            </span>
            <Link to="/locations" className="text-[#1F2E4A] font-semibold hover:underline flex items-center gap-1">
              Facility Map <ExternalLink size={11}/>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Order Modal */}
      {showQuickOrderModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-[#1F2E4A]">
                  Quick Draft Sales Order
                </h3>
                <p className="text-xs text-slate-500">
                  Pick real line items to calculate and draft a confirmed order directly from dashboard.
                </p>
              </div>
              <button onClick={() => setShowQuickOrderModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuickOrder} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer Account *
                </label>
                <select value={quickCustomerId} onChange={(e) => setQuickCustomerId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium">
                  {customers.map((c) => (<option key={c.id} value={c.id}>
                      {c.name} ({c.code}) - Balance: ${c.balance.toFixed(2)}
                    </option>))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-2">Order Line Items</label>
                <LineItemEditor items={quickLineItems} onChange={setQuickLineItems} type="sales"/>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={() => setShowQuickOrderModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Draft & Book Order</Button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
};
