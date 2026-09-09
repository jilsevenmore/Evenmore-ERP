import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Boxes, MapPin, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ItemStockDetailModal } from '../../components/common/ItemStockDetailModal';
export const StockPositionPage = () => {
    const { items, calculateItemStock } = useERP();
    const [filterState, setFilterState] = useState('All');
    const [selectedItem, setSelectedItem] = useState(null);
    const enrichedItems = items.map((i) => {
        const calc = calculateItemStock(i.id);
        let status = i.status;
        if (calc.available <= i.reorderLevel / 2) {
            status = 'Critical';
        }
        else if (calc.available <= i.reorderLevel) {
            status = 'Low Stock';
        }
        else {
            status = 'Optimal';
        }
        return {
            ...i,
            calculatedOnHand: calc.onHand,
            calculatedAvailable: calc.available,
            calculatedReserved: calc.reserved,
            calculatedDamaged: calc.damaged,
            status,
        };
    });
    const filteredItems = enrichedItems.filter((i) => {
        if (filterState === 'All')
            return true;
        if (filterState === 'Low Stock')
            return i.status === 'Low Stock';
        if (filterState === 'Critical')
            return i.status === 'Critical';
        if (filterState === 'Optimal')
            return i.status === 'Optimal';
        return true;
    });
    const totalValue = enrichedItems.reduce((acc, i) => acc + (i.costPrice ?? i.unitCost ?? 0) * (i.calculatedOnHand || 0), 0);
    const criticalCount = enrichedItems.filter((i) => i.status === 'Critical').length;
    const lowCount = enrichedItems.filter((i) => i.status === 'Low Stock').length;
    const columns = [
        {
            key: 'sku',
            header: 'SKU Code',
            render: (i) => (<button onClick={() => setSelectedItem(i)} className="font-mono font-bold text-blue-600 hover:underline text-left">
          {i.sku}
        </button>),
        },
        {
            key: 'name',
            header: 'Item Description',
            render: (i) => (<div>
          <p className="font-bold text-[#1F2E4A]">{i.name}</p>
          <span className="text-[10px] text-slate-500">{i.category}</span>
        </div>),
        },
        {
            key: 'location',
            header: 'Storage Bin / Facility',
            render: (i) => (<span className="text-slate-600 flex items-center gap-1 text-[11px]">
          <MapPin size={11} className="text-slate-400"/> {i.location}
        </span>),
        },
        {
            key: 'calculatedOnHand',
            header: 'Physical On-Hand',
            align: 'center',
            render: (i) => (<span className="font-mono font-bold text-slate-800">
          {i.calculatedOnHand} {i.uom}
        </span>),
        },
        {
            key: 'calculatedAvailable',
            header: 'Available to Sell',
            align: 'center',
            render: (i) => (<span className={`font-mono font-bold ${i.status === 'Critical'
                    ? 'text-rose-600'
                    : i.status === 'Low Stock'
                        ? 'text-amber-600'
                        : 'text-emerald-700'}`}>
          {i.calculatedAvailable} {i.uom}
        </span>),
        },
        {
            key: 'calculatedReserved',
            header: 'Committed / Reserved',
            align: 'center',
            render: (i) => (<span className="font-mono text-slate-500">
          {i.calculatedReserved || 0} {i.uom}
        </span>),
        },
        {
            key: 'reorderLevel',
            header: 'Safety Reorder',
            align: 'center',
            render: (i) => <span className="font-mono text-slate-600">{i.reorderLevel}</span>,
        },
        {
            key: 'totalValue',
            header: 'Aggregate Asset Value',
            align: 'right',
            render: (i) => {
                const itemVal = (i.costPrice ?? i.unitCost ?? 0) * (i.calculatedOnHand || 0);
                return (<span className="font-mono font-semibold text-slate-800">
            ${itemVal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                    })}
          </span>);
            },
        },
        {
            key: 'status',
            header: 'Status',
            align: 'center',
            render: (i) => <StatusBadge status={i.status}/>,
        },
        {
            key: 'actions',
            header: '',
            align: 'center',
            render: (i) => (<button onClick={() => setSelectedItem(i)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors inline-flex items-center gap-1 text-xs" title="View Stock Ledger">
          <Eye className="w-3.5 h-3.5"/>
          <span className="text-[11px] font-medium">Ledger</span>
        </button>),
        },
    ];
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2E4A] tracking-tight">
            Stock Position & Movement Engine
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic inventory balance computed from verified physical movements, sales reservations, and RMA deductions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/transfers">
            <Button variant="outline">Stock Transfers</Button>
          </Link>
          <Link to="/purchase-orders">
            <Button>Procure Replenishment</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Tracked SKUs" value={items.length} icon={Boxes}/>
        <StatCard label="Total Inventory Value" value={`$${Math.round(totalValue).toLocaleString()}`}/>
        <StatCard label="Critical Depletions" value={criticalCount} trend={{ positive: false, text: 'Requires PO' }}/>
        <StatCard label="Low Stock Warnings" value={lowCount} trend={{ positive: false, text: 'Nearing Reorder' }}/>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-[#CED4DA] pb-2 text-xs">
        {['All', 'Optimal', 'Low Stock', 'Critical'].map((tab) => (<button key={tab} onClick={() => setFilterState(tab)} className={`px-3 py-1.5 rounded-t font-semibold transition-colors ${filterState === tab
                ? 'bg-white border-t-2 border-[#1F2E4A] text-[#1F2E4A] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'}`}>
            {tab}
          </button>))}
      </div>

      <DataTable title="Physical Inventory & Stock Ledgers" columns={columns} data={filteredItems} keyExtractor={(i) => i.id} searchPlaceholder="Search SKU, item title or bin location..."/>

      {/* Item Stock Detail & Movement Modal */}
      {selectedItem && (<ItemStockDetailModal item={selectedItem} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)}/>)}
    </div>);
};
