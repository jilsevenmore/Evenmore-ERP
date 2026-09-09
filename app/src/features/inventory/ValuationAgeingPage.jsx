import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { DollarSign } from 'lucide-react';
export const ValuationAgeingPage = () => {
    const { items } = useERP();
    const [selectedBucket, setSelectedBucket] = useState('All');
    // Derive aging data based on items
    const agingData = [
        {
            id: 'ag-1',
            sku: 'SRV-DL380-G10',
            name: 'HPE ProLiant DL380 Gen10 Server 2U Rack',
            category: 'Enterprise Hardware',
            qty: 12,
            unitCost: 2850,
            totalValuation: 34200,
            ageDays: 24,
            agingBucket: '0-30 Days',
            depreciationReserve: 0,
        },
        {
            id: 'ag-2',
            sku: 'SW-CAT9300-48P',
            name: 'Cisco Catalyst 9300 48-Port PoE+ Switch',
            category: 'Networking',
            qty: 28,
            unitCost: 1950,
            totalValuation: 54600,
            ageDays: 45,
            agingBucket: '31-60 Days',
            depreciationReserve: 546,
        },
        {
            id: 'ag-3',
            sku: 'FBR-SFP-10G-SR',
            name: '10GBASE-SR SFP+ Transceiver Module',
            category: 'Fiber Optics',
            qty: 240,
            unitCost: 45,
            totalValuation: 10800,
            ageDays: 14,
            agingBucket: '0-30 Days',
            depreciationReserve: 0,
        },
        {
            id: 'ag-4',
            sku: 'CAB-CAT6A-1000',
            name: 'Cat6A Shielded Plenum Cable Spool 1000ft',
            category: 'Cabling & Infrastructure',
            qty: 65,
            unitCost: 120,
            totalValuation: 7800,
            ageDays: 78,
            agingBucket: '61-90 Days',
            depreciationReserve: 780,
        },
        {
            id: 'ag-5',
            sku: 'UPS-SMT3000RM2U',
            name: 'APC Smart-UPS 3000VA LCD RM 2U 120V',
            category: 'Power Systems',
            qty: 8,
            unitCost: 1450,
            totalValuation: 11600,
            ageDays: 112,
            agingBucket: '90+ Days (Stale)',
            depreciationReserve: 2320,
        },
        {
            id: 'ag-6',
            sku: 'RCK-42U-ENCL',
            name: '42U Server Rack Enclosure Cabinet',
            category: 'Enclosures',
            qty: 15,
            unitCost: 890,
            totalValuation: 13350,
            ageDays: 32,
            agingBucket: '31-60 Days',
            depreciationReserve: 267,
        },
    ];
    const totalValuation = agingData.reduce((acc, i) => acc + i.totalValuation, 0);
    const totalDepreciation = agingData.reduce((acc, i) => acc + i.depreciationReserve, 0);
    const staleValuation = agingData
        .filter((i) => i.agingBucket === '90+ Days (Stale)')
        .reduce((acc, i) => acc + i.totalValuation, 0);
    const filteredData = agingData.filter((i) => {
        if (selectedBucket === 'All')
            return true;
        return i.agingBucket === selectedBucket;
    });
    const columns = [
        {
            key: 'sku',
            header: 'SKU Code',
            render: (r) => <span className="font-mono font-bold text-slate-800">{r.sku}</span>,
        },
        {
            key: 'name',
            header: 'Item Description',
            render: (r) => (<div>
          <p className="font-bold text-[#1F2E4A]">{r.name}</p>
          <span className="text-[10px] text-slate-500">{r.category}</span>
        </div>),
        },
        {
            key: 'qty',
            header: 'Holding Qty',
            align: 'center',
            render: (r) => <span className="font-mono font-semibold text-slate-900">{r.qty}</span>,
        },
        {
            key: 'unitCost',
            header: 'Unit Cost',
            align: 'right',
            render: (r) => (<span className="font-mono text-slate-700">${r.unitCost.toLocaleString()}</span>),
        },
        {
            key: 'totalValuation',
            header: 'Gross Carrying Value',
            align: 'right',
            render: (r) => (<span className="font-mono font-bold text-slate-900">
          ${r.totalValuation.toLocaleString()}
        </span>),
        },
        {
            key: 'ageDays',
            header: 'Holding Shelf Age',
            align: 'center',
            render: (r) => (<span className="font-mono text-slate-800 text-xs">
          {r.ageDays} days
        </span>),
        },
        {
            key: 'agingBucket',
            header: 'Aging Bracket',
            align: 'center',
            render: (r) => {
                let color = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                if (r.agingBucket === '31-60 Days')
                    color = 'bg-blue-50 text-blue-800 border-blue-200';
                else if (r.agingBucket === '61-90 Days')
                    color = 'bg-amber-50 text-amber-800 border-amber-200';
                else if (r.agingBucket === '90+ Days (Stale)')
                    color = 'bg-rose-50 text-rose-800 border-rose-200';
                return (<span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${color}`}>
            {r.agingBucket}
          </span>);
            },
        },
        {
            key: 'depreciationReserve',
            header: 'Obsolescence Reserve',
            align: 'right',
            render: (r) => (<span className="font-mono text-rose-700 font-semibold">
          {r.depreciationReserve > 0
                    ? `-$${r.depreciationReserve.toLocaleString()}`
                    : '$0.00'}
        </span>),
        },
    ];
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2E4A] tracking-tight">
            Valuation & Inventory Aging
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            FIFO/Weighted Average carrying cost analysis, holding duration buckets, and slow-moving obsolescence reserves.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Inventory Assets" value={`$${totalValuation.toLocaleString()}`} icon={DollarSign}/>
        <StatCard label="Current Stock (0-30 Days)" value="$45,000" trend={{ positive: true, text: 'High velocity turnover' }}/>
        <StatCard label="Stale Stock (90+ Days)" value={`$${staleValuation.toLocaleString()}`} trend={{ positive: false, text: 'Review for clearance' }}/>
        <StatCard label="Obsolescence Provision" value={`$${totalDepreciation.toLocaleString()}`} trend={{ positive: true, text: 'Fully reserved on balance sheet' }}/>
      </div>

      {/* Bucket Filter */}
      <div className="flex items-center gap-2 border-b border-[#CED4DA] pb-2 text-xs">
        <span className="text-slate-500 font-semibold">Aging Bracket:</span>
        {['All', '0-30 Days', '31-60 Days', '61-90 Days', '90+ Days (Stale)'].map((b) => (<button key={b} onClick={() => setSelectedBucket(b)} className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${selectedBucket === b
                ? 'bg-[#1F2E4A] text-white'
                : 'text-slate-600 hover:bg-slate-200'}`}>
            {b}
          </button>))}
      </div>

      <DataTable title="Inventory Aging Valuation Ledger" columns={columns} data={filteredData} keyExtractor={(r) => r.id} searchPlaceholder="Filter SKU, description, or bucket..." searchFilter={(r, term) => r.sku.toLowerCase().includes(term) ||
            r.name.toLowerCase().includes(term) ||
            r.agingBucket.toLowerCase().includes(term)}/>
    </div>);
};
