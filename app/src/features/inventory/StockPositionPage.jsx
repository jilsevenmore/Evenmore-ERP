import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Boxes, MapPin, Eye, ArrowLeftRight, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ItemStockDetailModal } from '../../components/common/ItemStockDetailModal';
export const StockPositionPage = () => {
    const { items, calculateItemStock, formatCurrency } = useERP();
    const navigate = useNavigate();
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
          <button onClick={() => setSelectedItem(i)} className="font-bold text-[#1F2E4A] hover:underline text-left">
            {i.name}
          </button>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-500">{i.category}</span>
            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
              <MapPin size={9}/> {i.location}
            </span>
          </div>
        </div>),
        },
        {
            key: 'calculatedOnHand',
            header: 'Total Physical On-Hand',
            align: 'center',
            render: (i) => (<span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
          {i.calculatedOnHand} {i.unit}
        </span>),
        },
        {
            key: 'calculatedAvailable',
            header: 'Available to Promise',
            align: 'center',
            render: (i) => (<span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {i.calculatedAvailable} {i.unit}
        </span>),
        },
        {
            key: 'calculatedReserved',
            header: 'Sales Reserved',
            align: 'center',
            render: (i) => (<span className="font-mono text-slate-600">
          {i.calculatedReserved || 0} {i.unit}
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
            {formatCurrency(itemVal)}
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
          <Button
            variant="outline"
            icon={ArrowLeftRight}
            onClick={() => navigate('/inventory/transfers')}
          >
            Stock Transfers
          </Button>
          <Button
            icon={ShoppingCart}
            onClick={() => navigate('/purchase/orders')}
          >
            Procure Replenishment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Tracked SKUs" value={items.length} icon={Boxes}/>
        <StatCard label="Total Inventory Value" value={formatCurrency(Math.round(totalValue), { noDecimals: true })}/>
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
