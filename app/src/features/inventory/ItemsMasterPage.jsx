import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Plus, MapPin, AlertTriangle, Layers, Tag, Zap, CheckCircle2, Upload, DollarSign, Boxes, Package, Cpu, QrCode } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { BarcodeLabelModal } from '../../components/common/BarcodeLabelModal';
import { ImportModal } from '../../components/common/ImportModal';

export const ItemsMasterPage = () => {
    const { items, itemParts = [], addInventoryItem, vendors, addPurchaseOrder } = useERP();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine if we are in Machine Master (/items/machines) or Stock (/items/stock) mode
    const isMachineView = location.pathname.includes('/machines');
    const isStockView = location.pathname.includes('/stock');
    
    const displayItems = useMemo(() => {
        if (isMachineView) {
            return items.filter((i) => i.itemKind === 'Machine');
        }
        if (isStockView) {
            return items.filter((i) => i.itemKind !== 'Machine');
        }
        return items;
    }, [items, isMachineView, isStockView]);

    const [selectedBarcodeItem, setSelectedBarcodeItem] = useState(null);
    const [restockSuccess, setRestockSuccess] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    const handleImportCsv = (rows) => {
        rows.forEach((r, idx) => {
            addInventoryItem({
                sku: r['SKU'] || r['Sku'] || r['Part Number'] || `SKU-IMP-${Date.now().toString().slice(-4)}-${idx + 1}`,
                name: r['NAME'] || r['Name'] || r['Product Name'] || `Imported Item ${idx + 1}`,
                category: r['CATEGORY'] || r['Category'] || 'Passive Components',
                itemKind: isMachineView ? 'Machine' : (r['KIND'] || 'Part'),
                uom: r['UOM'] || r['Unit'] || 'Pcs',
                unitCost: parseFloat(r['COST'] || r['Cost Price'] || r['costPrice'] || '25') || 25,
                costPrice: parseFloat(r['COST'] || r['Cost Price'] || r['costPrice'] || '25') || 25,
                sellingPrice: parseFloat(r['PRICE'] || r['Selling Price'] || r['sellingPrice'] || '45') || 45,
                availableQty: parseInt(r['QTY'] || r['Stock'] || r['stock'] || '50', 10) || 50,
                reorderLevel: parseInt(r['REORDER'] || r['Reorder Level'] || '10', 10) || 10,
                location: r['LOCATION'] || r['Location'] || 'Main Central Warehouse',
            });
        });
    };

    // Detect depleted items in current view
    const lowStockItems = displayItems.filter((i) => (i.availableQty ?? i.stock ?? 0) <= (i.reorderLevel || 5));

    const handleBulkSmartRestock = () => {
        if (lowStockItems.length === 0) return;
        const defaultVendor = vendors[0];
        
        const restockItems = lowStockItems.map((it) => {
            const deficit = Math.max(10, (it.reorderLevel || 10) * 2 - (it.availableQty ?? it.stock ?? 0));
            const unitRate = it.costPrice ?? it.unitCost ?? 50;
            return {
                id: `li-restock-${Date.now()}-${it.id}`,
                itemId: it.id,
                itemSku: it.sku,
                description: it.name,
                qty: deficit,
                rate: unitRate,
                discount: 0,
                tax: 18,
                amount: Math.round(deficit * unitRate * 1.18 * 100) / 100,
            };
        });

        const totalAmt = restockItems.reduce((acc, it) => acc + it.amount, 0);
        addPurchaseOrder({
            poNumber: `PO-AUTO-${Date.now().toString().slice(-4)}`,
            vendorId: defaultVendor?.id,
            vendor: defaultVendor?.name || 'Cisco Systems Direct',
            date: new Date().toISOString().split('T')[0],
            expectedDate: 'In 5 days (Auto-Restock)',
            amount: totalAmt,
            total: totalAmt,
            status: 'Draft',
            lineItems: restockItems,
            items: restockItems,
        });
        setRestockSuccess(true);
        setTimeout(() => setRestockSuccess(false), 5000);
    };

    const columns = [
        {
            key: 'sku',
            header: 'SKU / Part No.',
            render: (i) => (
              <div>
                <span className="font-mono font-bold text-slate-800 text-xs">{i.sku}</span>
                {i.trackingMode === 'Serial' && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded font-semibold">
                    <QrCode size={10} /> Serial
                  </span>
                )}
              </div>
            ),
        },
        {
            key: 'name',
            header: isMachineView ? 'Machine Title & Specs' : 'Product / Component Description',
            render: (i) => {
              const partsCount = itemParts.filter((ip) => ip.parentItemId === i.id).length;
              return (
                <div>
                  <p className="font-bold text-[#1F2E4A] text-xs">{i.name}</p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{i.category}</span>
                    {i.itemKind === 'Machine' && (
                      <>
                        <span>•</span>
                        <span className="text-purple-700 font-semibold flex items-center gap-1">
                          <Boxes size={11} /> {partsCount} BOM Part{partsCount === 1 ? '' : 's'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            },
        },
        {
            key: 'kind',
            header: 'Kind',
            align: 'center',
            render: (i) => {
              const kind = i.itemKind || 'Standalone';
              const colorClass =
                kind === 'Machine'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : kind === 'Part'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200';

              return (
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${colorClass}`}>
                  {kind}
                </span>
              );
            },
        },
        {
            key: 'location',
            header: 'Location / Bin',
            render: (i) => (<span className="text-slate-600 flex items-center gap-1 text-[11px]">
          <MapPin size={11} className="text-slate-400"/> {i.location || 'Main Warehouse'}
        </span>),
        },
        {
            key: 'availableQty',
            header: 'Stock On Hand',
            align: 'center',
            render: (i) => (<div className="font-mono">
          <span className={`font-bold ${i.status === 'Critical' || (i.availableQty ?? i.stock ?? 0) <= 2
                    ? 'text-rose-600'
                    : (i.availableQty ?? i.stock ?? 0) <= (i.reorderLevel || 5)
                        ? 'text-amber-600'
                        : 'text-slate-900'}`}>
            {i.availableQty ?? i.stock ?? 0}
          </span>
          <span className="text-[10px] text-slate-400 ml-1">{i.salesUnit || i.uom || 'Unit'}</span>
        </div>),
        },
        {
            key: 'costPrice',
            header: 'Unit Cost / Selling',
            align: 'right',
            render: (i) => {
                const cost = i.costPrice ?? i.unitCost ?? 0;
                const selling = i.sellingPrice ?? 0;
                return (<div className="font-mono text-[11px]">
            <span className="text-slate-500">₹{cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className="text-slate-300 mx-1">/</span>
            <span className="font-semibold text-emerald-700">₹{selling.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>);
            },
        },
        {
            key: 'status',
            header: 'Health Status',
            align: 'center',
            render: (i) => <StatusBadge status={i.status}/>,
        },
        {
            key: 'id',
            header: 'Actions',
            align: 'right',
            render: (i) => (<div className="flex items-center justify-end gap-1.5">
          <button onClick={() => setSelectedBarcodeItem(i)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors" title="Print SKU Barcode Shelf Tag">
            <Tag size={14}/>
          </button>
          <Link to={`/items/edit/${i.id}`} className="text-xs font-semibold text-[#1F2E4A] hover:underline px-2 py-1 rounded hover:bg-slate-100">
            Edit
          </Link>
        </div>),
        },
    ];

    const totalCatalogValue = displayItems.reduce((sum, it) => sum + ((it.availableQty ?? it.stock ?? 0) * (it.costPrice ?? it.unitCost ?? 0)), 0);
    const uniqueCategoriesCount = new Set(displayItems.map(i => i.category)).size;

    const pageTitle = isMachineView
      ? 'Machine Master'
      : isStockView
      ? 'Stock Inventory'
      : 'Items Master Catalog';

    const pageSubtitle = isMachineView
      ? 'Capital hardware machines, equipment consoles, and assembled systems with configurable BOM parts.'
      : isStockView
      ? 'Stock inventory parts, subassemblies, consumables, cables, and raw components.'
      : 'Complete product catalog, valuation, unit metrics, safety buffers, and bin allocation.';

    const guideConfig = {
      title: pageTitle,
      subtitle: pageSubtitle,
      purpose: isMachineView
        ? 'The Machine Master manages complex equipment units and their underlying required component parts (BOMs). When added to invoices, machine BOMs auto-expand into editable lines.'
        : 'The Stock Master manages consumable components, spare parts, and standalone items for warehouse fulfillment and machine assembly.',
      workflow: isMachineView
        ? ['Create Machine SKU', 'Configure Machine BOM / Required Parts', 'Set Serial Barcodes', 'Add to Quotations/Invoices']
        : ['Create Stock Part SKU', 'Purchase & Inward Goods', 'Link to Machine BOMs', 'Issue on Sales or Service Orders'],
      keyTerms: [
        { term: isMachineView ? 'Machine BOM' : 'Component SKU', definition: isMachineView ? 'The bill of materials defining required component parts per unit of machine.' : 'An individual stock-keeping unit with live tracked quantity and bin coordinates.' },
        { term: 'Tracking Mode', definition: 'Quantity-only batch tracking vs. individual serial number tracking.' },
      ],
      tips: [
        'Each machine item can have its own customized Bill of Materials referencing live stock items.',
        'Invoice modifications never overwrite the machine stored BOM.',
      ],
    };

    const newItemKind = isMachineView ? 'Machine' : 'Part';

    return (<div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        guide={guideConfig}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={Upload} onClick={() => setIsImportOpen(true)}>
              Import CSV
            </Button>
            <Link to={isMachineView ? '/categories/machine' : '/categories/stock'}>
              <Button variant="outline" icon={Layers}>
                {isMachineView ? 'Machine Categories' : 'Stock Categories'}
              </Button>
            </Link>
            <Link to={`/items/new?kind=${newItemKind}`}>
              <Button icon={Plus}>
                {isMachineView ? 'Add New Machine' : 'Add New Stock Part'}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Item Master KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label={isMachineView ? 'Total Machines' : 'Total Stock SKUs'} value={`${displayItems.length} SKUs`} icon={isMachineView ? Cpu : Package} />
        <StatCard label="Total Asset Valuation" value={`₹${Math.round(totalCatalogValue).toLocaleString('en-IN')}`} icon={DollarSign} />
        <StatCard label="Low Stock Alerts" value={`${lowStockItems.length} SKUs`} icon={AlertTriangle} trend={{ positive: lowStockItems.length === 0, text: lowStockItems.length > 0 ? 'Requires Reorder' : 'Healthy Buffers' }} highlight={lowStockItems.length > 0} />
        <StatCard label="Categories Represented" value={`${uniqueCategoriesCount} Categories`} icon={Layers} subtext="Taxonomic Hierarchy" />
      </div>

      {/* 1-Click Smart Restock Banner */}
      {lowStockItems.length > 0 && (<div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0"/>
            <div>
              <p className="font-bold">
                {lowStockItems.length} Items Below Minimum Safety Stock Level
              </p>
              <p className="text-[11px] text-amber-700">
                Automatic replenishment order will calculate required deficit quantities and create draft POs instantly.
              </p>
            </div>
          </div>
          <button onClick={handleBulkSmartRestock} className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors shrink-0">
            <Zap size={14}/> ⚡ Smart Restock All ({lowStockItems.length})
          </button>
        </div>)}

      {restockSuccess && (<div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle2 size={16} className="text-emerald-600"/>
            Restock Purchase Order generated successfully! View in Purchase Orders.
          </span>
          <button onClick={() => navigate('/purchase/orders')} className="font-bold underline text-emerald-900 hover:text-emerald-700">
            View PO →
          </button>
        </div>)}

      <DataTable
        title={isMachineView ? 'Machine Equipment Registry' : 'Stock Inventory & Spare Parts'}
        columns={columns}
        data={displayItems}
        keyExtractor={(i) => i.id}
        searchPlaceholder="Search by SKU, product name, or storage rack..."
        searchFilter={(i, term) =>
          i.sku.toLowerCase().includes(term) ||
          i.name.toLowerCase().includes(term) ||
          (i.category && i.category.toLowerCase().includes(term)) ||
          (i.location && i.location.toLowerCase().includes(term))
        }
      />

      {/* Barcode Tag Modal */}
      <BarcodeLabelModal item={selectedBarcodeItem} onClose={() => setSelectedBarcodeItem(null)}/>

      {/* CSV Data Import Modal */}
      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Inventory Items" templateHeaders={['SKU', 'Name', 'Category', 'UOM', 'Cost Price', 'Selling Price', 'Stock', 'Reorder Level', 'Location']} sampleRow={['SKU-CAT6-100', 'Cat6 Shielded Cable (100m)', 'Network Hardware', 'Roll', 45.0, 79.99, 120, 25, 'Bay B-04']} onImport={handleImportCsv}/>
    </div>);
};
