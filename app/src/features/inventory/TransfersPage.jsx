import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Plus, ArrowLeftRight, CheckCircle2, User, X, Truck, MapPin, Clock } from 'lucide-react';
import { LineItemEditor } from '../../components/common/LineItemEditor';
import { PageHeader } from '../../components/common/PageHeader';

const transfersGuide = {
    title: 'Inter-Warehouse Stock Transfers',
    subtitle: 'Track physical inventory shifts between distribution centers, bays, and retail zones.',
    purpose: 'Stock Transfers allow you to relocate inventory between facilities without creating sales or purchases. It updates source and destination stock balances upon dispatch and receipt verification.',
    keyTerms: [
        { term: 'In-Transit Status', definition: 'Stock has left the origin warehouse but has not yet been checked in at the destination.' },
        { term: 'Intake Confirmation', definition: 'Physical verification by the receiving dock manager to increase target warehouse on-hand levels.' },
    ],
    tips: [
        'Click "Confirm Intake" once physical merchandise arrives at the destination dock to restock local bins.',
    ],
    workflow: ['Transfer Order Created', 'Dispatched (In Transit)', 'Dock Intake Verified', 'Inventory Relocated'],
};

export const TransfersPage = () => {
    const { transfers, locations, addTransfer, updateTransferStatus } = useERP();
    const [showAddModal, setShowAddModal] = useState(false);
    const [sourceLocId, setSourceLocId] = useState(locations[0]?.id || '');
    const [destLocId, setDestLocId] = useState(locations[1]?.id || '');
    const [shippedBy, setShippedBy] = useState('Forklift Operator');
    const [lineItems, setLineItems] = useState([]);
    const handleCreate = (e) => {
        e.preventDefault();
        const src = locations.find((l) => l.id === sourceLocId) || locations[0];
        const dst = locations.find((l) => l.id === destLocId) || locations[1];
        addTransfer({
            sourceLocationId: src?.id,
            sourceLocation: src?.name || 'Main Central Warehouse',
            destLocationId: dst?.id,
            destLocation: dst?.name || 'Assembly Bay Zone A',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            itemsCount: lineItems.length > 0 ? lineItems.length : 1,
            status: 'In Transit',
            shippedBy: shippedBy || 'Logistics Clerk',
            items: lineItems,
        });
        setShowAddModal(false);
        setLineItems([]);
    };
    const markReceived = (id) => {
        updateTransferStatus(id, 'Received');
    };
    const columns = [
        {
            key: 'transferNumber',
            header: 'Transfer Ref #',
            render: (t) => (<span className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
          <ArrowLeftRight size={13} className="text-[#1F2E4A]"/> {t.transferNumber}
        </span>),
        },
        {
            key: 'sourceLocation',
            header: 'Origin Facility',
            render: (t) => <span className="font-semibold text-slate-700">{t.sourceLocation}</span>,
        },
        {
            key: 'destLocation',
            header: 'Destination Facility',
            render: (t) => <span className="font-bold text-[#1F2E4A]">{t.destLocation}</span>,
        },
        {
            key: 'date',
            header: 'Movement Date',
            render: (t) => <span className="text-slate-600">{t.date}</span>,
        },
        {
            key: 'itemsCount',
            header: 'Line Items Moved',
            align: 'center',
            render: (t) => (<span className="font-mono font-bold text-slate-800">
          {t.items?.length || t.itemsCount || 1} SKUs
        </span>),
        },
        {
            key: 'shippedBy',
            header: 'Dispatched By',
            render: (t) => (<span className="text-slate-600 text-xs flex items-center gap-1">
          <User size={12} className="text-slate-400"/> {t.shippedBy}
        </span>),
        },
        {
            key: 'status',
            header: 'Transfer Status',
            align: 'center',
            render: (t) => <StatusBadge status={t.status}/>,
        },
        {
            key: 'actions',
            header: 'Intake Confirmation',
            align: 'right',
            render: (t) => t.status !== 'Received' ? (<button onClick={() => markReceived(t.id)} className="px-2.5 py-1 bg-[#1F2E4A] text-white rounded text-[11px] font-semibold hover:bg-[#152033] cursor-pointer flex items-center gap-1 ml-auto shadow-sm">
            <CheckCircle2 size={11}/> Confirm Intake
          </button>) : (<span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1 justify-end">
            <CheckCircle2 size={12}/> Stock Restocked
          </span>),
        },
    ];

    const inTransitCount = transfers.filter(t => t.status === 'In Transit').length;
    const receivedCount = transfers.filter(t => t.status === 'Received').length;

    return (<div className="space-y-6">
      <PageHeader title="Stock Transfers & Relocation" subtitle="Inter-warehouse and inter-zone inventory shifts, internal transport manifests, and intake verification." guide={transfersGuide} actions={<Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Initiate Stock Transfer
          </Button>}/>

      {/* Transfers KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Transfer Manifests" value={`${transfers.length} Moves`} icon={ArrowLeftRight} />
        <StatCard label="In-Transit Active" value={`${inTransitCount} En Route`} icon={Truck} trend={{ positive: inTransitCount === 0, text: inTransitCount > 0 ? 'Awaiting intake' : 'All delivered' }} highlight={inTransitCount > 0} />
        <StatCard label="Completed Intakes" value={`${receivedCount} Restocked`} icon={CheckCircle2} trend={{ positive: true, text: 'Inventory updated' }} />
        <StatCard label="Active Facilities" value={`${locations.length} Warehouses`} icon={MapPin} subtext="Main, Bay A, Bay B" />
      </div>

      <DataTable title="Inter-Facility Stock Transfer Log" columns={columns} data={transfers} keyExtractor={(t) => t.id} searchPlaceholder="Search transfer #, source, or destination..." searchFilter={(t, term) => t.transferNumber.toLowerCase().includes(term) ||
            t.sourceLocation.toLowerCase().includes(term) ||
            t.destLocation.toLowerCase().includes(term)}/>

      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">
                Create Stock Transfer Manifest
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Origin Source Facility *</label>
                  <select value={sourceLocId} onChange={(e) => setSourceLocId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium">
                    {locations.map((loc) => (<option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Target Facility *</label>
                  <select value={destLocId} onChange={(e) => setDestLocId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium">
                    {locations.map((loc) => (<option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dispatched Operator</label>
                  <input type="text" value={shippedBy} onChange={(e) => setShippedBy(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"/>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-2">Relocated Inventory Line Items</label>
                <LineItemEditor items={lineItems} onChange={setLineItems}/>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#1F2E4A] hover:bg-[#152033] text-white rounded-lg font-bold shadow-sm">
                  Post Transfer & Dispatch Stock
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
};
