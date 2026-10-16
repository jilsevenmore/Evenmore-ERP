import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Plus, MapPin, AlertTriangle, Layers, Tag, Zap, CheckCircle2, Upload, DollarSign, Boxes, Package, Cpu, QrCode, Eye } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { BarcodeLabelModal } from '../../components/common/BarcodeLabelModal';
import { ImportModal } from '../../components/common/ImportModal';
import { ItemStockDetailModal } from '../../components/common/ItemStockDetailModal';

export const ItemsMasterPage = () => {
    const { items, categories = [], itemTypes = [], materialGrades = [], addInventoryItem, vendors, addPurchaseOrder, formatCurrency, calculateItemStock } = useERP();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine optional sub-route filter (/items/machines or /items/stock) for backward compatibility
    const isMachineView = location.pathname.includes('/machines');
    const isStockView = location.pathname.includes('/stock');

    const [filterKind, setFilterKind] = useState('ALL');
    const [filterItemType, setFilterItemType] = useState('ALL');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [filterGrade, setFilterGrade] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterLifecycle, setFilterLifecycle] = useState('ALL');

    const [selectedBarcodeItem, setSelectedBarcodeItem] = useState(null);
    const [selectedDetailItem, setSelectedDetailItem] = useState(null);
    const [restockSuccess, setRestockSuccess] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    
    const displayItems = useMemo(() => {
        let list = items.map((i) => {
            const stockCalc = calculateItemStock ? calculateItemStock(i.id) : null;
            const availableQty = stockCalc ? stockCalc.available : (i.availableQty ?? i.stock ?? 0);
            const onHandQty = stockCalc ? stockCalc.onHand : (i.onHandQty ?? i.stock ?? 0);
            const reservedQty = stockCalc ? stockCalc.reserved : (i.reservedQty ?? 0);
            let computedStatus = i.status || 'Optimal';
            if (availableQty <= 0) {
                computedStatus = 'Critical';
            } else if (availableQty <= (i.reorderLevel || 5)) {
                computedStatus = 'Low Stock';
            } else {
                computedStatus = 'Optimal';
            }
            return {
                ...i,
                liveAvailable: availableQty,
                liveOnHand: onHandQty,
                liveReserved: reservedQty,
                computedStatus,
            };
        });

        if (isMachineView) {
            list = list.filter((i) => i.itemKind === 'Machine');
        } else if (isStockView) {
            list = list.filter((i) => i.itemKind !== 'Machine');
        }

        if (filterKind !== 'ALL') {
            if (filterKind === 'Finished') {
                list = list.filter((i) => i.itemKind === 'Standalone' || i.itemKind === 'Machine' || i.itemKind === 'Finished Product');
            } else if (filterKind === 'Raw') {
                list = list.filter((i) => i.itemKind === 'Raw Material');
            } else if (filterKind === 'Component') {
                list = list.filter((i) => i.itemKind === 'Part' || i.itemKind === 'Component');
            } else if (filterKind === 'Consumable') {
                list = list.filter((i) => i.itemKind === 'Consumable');
            } else if (filterKind === 'Service') {
                list = list.filter((i) => i.itemKind === 'Service');
            }
        }

        if (filterItemType !== 'ALL') {
            list = list.filter((i) => i.itemTypeId === filterItemType || i.itemType === filterItemType);
        }
        if (filterCategory !== 'ALL') {
            list = list.filter((i) => i.category === filterCategory || i.categoryId === filterCategory);
        }
        if (filterGrade !== 'ALL') {
            list = list.filter((i) => i.gradeId === filterGrade || i.metalGrade === filterGrade || i.gradeName === filterGrade);
        }
        if (filterStatus !== 'ALL') {
            if (filterStatus === 'Out of Stock') {
                list = list.filter((i) => i.liveAvailable <= 0);
            } else {
                list = list.filter((i) => i.computedStatus === filterStatus || i.status === filterStatus);
            }
        }
        if (filterLifecycle !== 'ALL') {
            list = list.filter((i) => (i.lifecycleStatus || 'Active') === filterLifecycle);
        }
        return list;
    }, [items, isMachineView, isStockView, filterKind, filterItemType, filterCategory, filterGrade, filterStatus, filterLifecycle, calculateItemStock]);

    const handleImportCsv = (rows) => {
        rows.forEach((r, idx) => {
            addInventoryItem({
                sku: r['SKU'] || r['Sku'] || r['Part Number'] || `SKU-IMP-${Date.now().toString().slice(-4)}-${idx + 1}`,
                name: r['NAME'] || r['Name'] || r['Product Name'] || `Imported Item ${idx + 1}`,
                category: r['CATEGORY'] || r['Category'] || '',
                itemKind: r['KIND'] || 'Standalone',
                uom: r['UOM'] || r['Unit'] || 'Pcs',
                unitCost: parseFloat(r['COST'] || r['Cost Price'] || r['costPrice'] || '0') || 0,
                costPrice: parseFloat(r['COST'] || r['Cost Price'] || r['costPrice'] || '0') || 0,
                sellingPrice: parseFloat(r['PRICE'] || r['Selling Price'] || r['sellingPrice'] || '0') || 0,
                availableQty: parseInt(r['QTY'] || r['Stock'] || r['stock'] || '0', 10) || 0,
                reorderLevel: parseInt(r['REORDER'] || r['Reorder Level'] || '10', 10) || 10,
                location: r['LOCATION'] || r['Location'] || '',
            });
        });
    };

    // Detect depleted items in current view
    const lowStockItems = displayItems.filter((i) => (i.liveAvailable ?? i.availableQty ?? i.stock ?? 0) <= (i.reorderLevel || 5));

    const handleBulkSmartRestock = () => {
        if (lowStockItems.length === 0) return;
        const defaultVendor = vendors[0];
        if (!defaultVendor) {
            alert('Add a vendor before generating a restock purchase order.');
            return;
        }
        
        const restockItems = lowStockItems.map((it) => {
            const currentStock = it.liveAvailable ?? it.availableQty ?? it.stock ?? 0;
            const deficit = Math.max(10, (it.reorderLevel || 10) * 2 - currentStock);
            const unitRate = Number(it.costPrice ?? it.unitCost) || 0;
            return {
                id: `li-restock-${Date.now()}-${it.id}`,
                itemId: it.id,
                itemSku: it.sku,
                itemName: it.name,
                name: it.name,
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
            vendor: defaultVendor?.name || '',
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
            header: 'SKU / Model #',
            width: '14%',
            render: (i) => (
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <Link to={`/inventory/items/edit/${i.id}`} className="font-mono font-bold text-primary hover:underline">
                  {i.sku}
                </Link>
                {i.itemKind === 'Machine' && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-500/30">
                    <Cpu size={10} /> Machine
                  </span>
                )}
              </div>
            ),
        },
        {
            key: 'name',
            header: 'Description & Taxonomy',
            width: '26%',
            render: (i) => (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                    {(i.imageUrl || i.image) ? (
                      <img
                        src={i.imageUrl || i.image}
                        alt={i.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center text-slate-400 ${(i.imageUrl || i.image) ? 'hidden' : ''}`}>
                      <Package size={18} />
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/inventory/items/edit/${i.id}`} className="font-bold text-text hover:text-primary hover:underline">
                        {i.name}
                      </Link>
                      {i.itemType && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                          {i.itemType}
                        </span>
                      )}
                      {(i.gradeName || i.metalGrade) && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                          {i.gradeName || i.metalGrade}
                        </span>
                      )}
                      {i.finishCoating && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {i.finishCoating}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted flex-wrap">
                      <span className="font-medium text-text-secondary">{i.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin size={10} className="text-muted"/> {i.location || '—'}
                      </span>

                      {/* Metal Dimensions Specs */}
                      {(i.diameter || i.legA || i.hasTubeSpec || i.sheetThickness || i.specification || i.dimensions) && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-sky-800 dark:text-sky-300 text-[10px] bg-sky-50 dark:bg-sky-500/15 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-500/30">
                            {i.specification || i.dimensions || (
                              <>
                                {i.diameter ? `Ø${i.diameter}mm` : ''}
                                {i.legA && i.legB && !i.webThickness ? `L ${i.legA}×${i.legB}×${i.sheetThickness || i.wallThickness || ''}mm` : ''}
                                {i.legA && i.legB && i.webThickness ? `${i.legA}×${i.legB}mm (Web:${i.webThickness}mm, Flg:${i.flangeThickness}mm)` : ''}
                                {i.hasTubeSpec ? `${i.tubeProfile || 'Round'} OD:${i.outerDiameter || `${i.outerWidth}×${i.outerHeight}`}×${i.wallThickness}mm` : ''}
                                {!i.hasTubeSpec && !i.diameter && !i.legA && i.sheetThickness ? `${i.sheetThickness}mm (${i.sheetLength || ''}×${i.sheetWidth || ''}mm)` : ''}
                              </>
                            )}
                            {(i.weightPerPiece || i.theoreticalWeight) ? ` [${Number(i.weightPerPiece || i.theoreticalWeight).toFixed(2)} kg]` : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
            ),
        },
        {
            key: 'itemKind',
            header: 'Classification',
            align: 'center',
            width: '12%',
            render: (i) => {
              const isMach = i.itemKind === 'Machine';
              const isServ = i.itemKind === 'Service';
              const isRaw = i.itemKind === 'Raw Material';
              const isComp = i.itemKind === 'Part' || i.itemKind === 'Component';
              return (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isMach
                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30'
                    : isServ
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30'
                    : isRaw
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400'
                    : isComp
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400'
                    : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}>
                  {isMach ? <Cpu size={11} /> : isServ ? <Zap size={11} /> : isRaw ? <Layers size={11} /> : <Package size={11} />}
                  {i.itemKind || 'Standard Item'}
                </span>
              );
            },
        },
        {
            key: 'trackingMode',
            header: 'Tracking',
            align: 'center',
            width: '9%',
            render: (i) => {
              const mode = i.trackingMode || (i.serialNumbers?.length ? 'Serial' : i.batchNumber ? 'Batch' : 'Quantity');
              if (mode === 'Serial') {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30">
                    <QrCode size={10} /> Serial ({i.serialNumbers?.length || 0})
                  </span>
                );
              }
              if (mode === 'Batch') {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
                    <Layers size={10} /> Batch
                  </span>
                );
              }
              return (
                <span className="text-[11px] text-muted font-medium">
                  Quantity
                </span>
              );
            },
        },
        {
            key: 'stock',
            header: 'Available Stock',
            align: 'center',
            width: '12%',
            render: (i) => {
              if (i.itemKind === 'Service') {
                return <span className="text-[11px] text-muted italic">N/A (Service)</span>;
              }
              const displayQty = i.liveAvailable ?? i.availableQty ?? i.stock ?? 0;
              const displayStatus = i.computedStatus || i.status;
              return (
                <button
                  type="button"
                  onClick={() => setSelectedDetailItem(i)}
                  className="inline-flex items-center justify-center gap-1 font-mono hover:underline cursor-pointer"
                  title="Click to view stock ledger"
                >
                  <span className={`font-bold text-xs ${displayStatus === 'Critical'
                      ? 'text-rose-600 dark:text-rose-400'
                      : displayStatus === 'Low Stock'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-700 dark:text-emerald-400'}`}>
                    {Number(displayQty).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted">{i.salesUnit || i.uom || 'Unit'}</span>
                </button>
              );
            },
        },
        {
            key: 'costPrice',
            header: 'Cost / Selling',
            align: 'right',
            width: '15%',
            render: (i) => {
                const cost = i.costPrice ?? i.unitCost ?? 0;
                const selling = i.sellingPrice ?? 0;
                return (
                  <div className="font-mono text-[11px] text-right whitespace-nowrap">
                    <span className="text-muted" title="Cost Price">{formatCurrency(cost)}</span>
                    <span className="text-muted/40 mx-1">/</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400" title="Selling Price">{formatCurrency(selling)}</span>
                  </div>
                );
            },
        },
        {
            key: 'status',
            header: 'Health Status',
            align: 'center',
            width: '9%',
            render: (i) => <StatusBadge status={i.computedStatus || i.status}/>,
        },
        {
            key: 'id',
            header: 'Actions',
            align: 'right',
            width: '11%',
            render: (i) => (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedDetailItem(i)}
                  className="w-7 h-7 rounded-lg bg-card border border-border hover:bg-soft text-muted hover:text-primary flex items-center justify-center transition cursor-pointer shadow-2xs"
                  title="View Stock Ledger & Movements"
                >
                  <Eye size={13}/>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBarcodeItem(i)}
                  className="w-7 h-7 rounded-lg bg-card border border-border hover:bg-soft text-muted hover:text-primary flex items-center justify-center transition cursor-pointer shadow-2xs"
                  title="Print SKU Barcode Shelf Tag"
                >
                  <Tag size={13}/>
                </button>
                <Link
                  to={`/inventory/items/edit/${i.id}`}
                  className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 text-xs font-semibold transition inline-flex items-center shadow-2xs"
                >
                  Edit
                </Link>
              </div>
            ),
        },
    ];

    const totalCatalogValue = displayItems.reduce((sum, it) => sum + ((it.liveAvailable ?? it.availableQty ?? it.stock ?? 0) * (it.costPrice ?? it.unitCost ?? 0)), 0);
    const uniqueCategoriesCount = new Set(displayItems.map(i => i.category)).size;

    const guideConfig = {
      title: 'Item Master Catalog',
      subtitle: 'Complete inventory product catalog, metal specifications, serial tracking, valuation, and stock buffers.',
      purpose: 'The Item Master manages catalog inventory items, fabrication raw materials, components, consumables, and finished products.',
      workflow: [
        'Create Inventory Item',
        'Configure Metal Technical Specifications & Theoretical Weight',
        'Set Units of Measure & Conversion Factors',
        'Define Reorder Thresholds & Storage Bin',
        'Issue on Sales & Purchase Workflows',
      ],
      keyTerms: [
        { term: 'Item Classification', definition: 'Differentiates Raw Material, Component Part, Finished Good, Consumable, and Service items.' },
        { term: 'Tracking Mode', definition: 'Quantity-only tracking, Batch/Lot number tracking, or individual Serial number barcodes.' },
        { term: 'Theoretical Weight', definition: 'Calculated kilograms per unit based on shape dimensions and metal alloy density.' },
      ],
      tips: [
        'Configuring precise metal dimensions allows live theoretical weight calculation to streamline weight-based receiving.',
        'Use the Stock Ledger eye icon on any row to audit chronological physical transactions.',
      ],
    };

    return (
      <div className="space-y-6">
        <PageHeader
          title="Item Master Catalog"
          subtitle="Unified product catalog for raw materials, metal profiles, component parts, finished goods, and services."
          guide={guideConfig}
          actions={
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
              <Button variant="outline" icon={Upload} onClick={() => setIsImportOpen(true)}>
                Import CSV
              </Button>
              <Button
                variant="outline"
                icon={Layers}
                onClick={() => navigate('/inventory/categories')}
              >
                Category Master
              </Button>
              <Button
                icon={Plus}
                onClick={() => navigate('/inventory/items/new')}
              >
                Add New Item
              </Button>
            </div>
          }
        />

        {/* View Segmented Tabs by Classification */}
        <div className="flex flex-nowrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-fit max-w-full lg:max-w-none overflow-x-auto whitespace-nowrap scrollbar-none text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterKind('ALL')}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              filterKind === 'ALL'
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes size={15} /> All Items ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterKind('Raw')}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              filterKind === 'Raw'
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={15} /> Raw Materials ({items.filter((i) => i.itemKind === 'Raw Material').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterKind('Component')}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              filterKind === 'Component'
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package size={15} /> Component Parts ({items.filter((i) => i.itemKind === 'Part' || i.itemKind === 'Component').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterKind('Finished')}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              filterKind === 'Finished'
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu size={15} /> Finished Goods ({items.filter((i) => i.itemKind === 'Standalone' || i.itemKind === 'Machine' || i.itemKind === 'Finished Product').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterKind('Consumable')}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              filterKind === 'Consumable'
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧪 Consumables ({items.filter((i) => i.itemKind === 'Consumable').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterKind('Service')}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              filterKind === 'Service'
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚡ Services ({items.filter((i) => i.itemKind === 'Service').length})
          </button>
        </div>

        {/* Item Master KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Catalog Items" value={`${displayItems.length} SKUs`} icon={Package} />
          <StatCard label="Total Asset Valuation" value={formatCurrency(Math.round(totalCatalogValue), { noDecimals: true })} icon={DollarSign} />
          <StatCard label="Low Stock Alerts" value={`${lowStockItems.length} SKUs`} icon={AlertTriangle} trend={{ positive: lowStockItems.length === 0, text: lowStockItems.length > 0 ? 'Requires Reorder' : 'Healthy Buffers' }} highlight={lowStockItems.length > 0} />
          <StatCard label="Categories Represented" value={`${uniqueCategoriesCount} Categories`} icon={Layers} subtext="Taxonomic Hierarchy" />
        </div>

        {/* 1-Click Smart Restock Banner */}
        {lowStockItems.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-150">
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
          </div>
        )}

        {restockSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0 text-xs text-emerald-800">
            <span className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={16} className="text-emerald-600"/>
              Restock Purchase Order generated successfully! View in Purchase Orders.
            </span>
            <button onClick={() => navigate('/purchase/orders')} className="font-bold underline text-emerald-900 hover:text-emerald-700">
              View PO →
            </button>
          </div>
        )}

        {/* Taxonomy & Dimension Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-card border border-border rounded-xl text-xs">
          <span className="font-bold text-text-secondary flex items-center gap-1.5">
            <Layers size={13} className="text-primary" /> Filter Catalog:
          </span>

          {/* Item Type filter */}
          <select
            value={filterItemType}
            onChange={(e) => setFilterItemType(e.target.value)}
            className="h-8 border border-border rounded-lg px-2.5 bg-background text-text text-xs focus:outline-none focus:border-primary font-medium"
          >
            <option value="ALL">All Item Types ({itemTypes.length})</option>
            {itemTypes.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-8 border border-border rounded-lg px-2.5 bg-background text-text text-xs focus:outline-none focus:border-primary font-medium"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Material Grade filter */}
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="h-8 border border-border rounded-lg px-2.5 bg-background text-text text-xs focus:outline-none focus:border-primary font-medium"
          >
            <option value="ALL">All Material Grades</option>
            {materialGrades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.code})
              </option>
            ))}
          </select>

          {/* Stock Health filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 border border-border rounded-lg px-2.5 bg-background text-text text-xs focus:outline-none focus:border-primary font-medium"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="Optimal">Optimal / Healthy</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Critical">Critical</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          {/* Lifecycle filter */}
          <select
            value={filterLifecycle}
            onChange={(e) => setFilterLifecycle(e.target.value)}
            className="h-8 border border-border rounded-lg px-2.5 bg-background text-text text-xs focus:outline-none focus:border-primary font-medium"
          >
            <option value="ALL">All Status (Active & Inactive)</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive</option>
          </select>

          {(filterKind !== 'ALL' || filterItemType !== 'ALL' || filterCategory !== 'ALL' || filterGrade !== 'ALL' || filterStatus !== 'ALL' || filterLifecycle !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setFilterKind('ALL');
                setFilterItemType('ALL');
                setFilterCategory('ALL');
                setFilterGrade('ALL');
                setFilterStatus('ALL');
                setFilterLifecycle('ALL');
              }}
              className="text-[11px] text-rose-600 hover:underline font-semibold ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <DataTable
          title="Items Master Inventory Catalog"
          columns={columns}
          data={displayItems}
          keyExtractor={(i) => i.id}
          searchPlaceholder="Search by SKU, product name, grade, type, or storage rack..."
          searchFilter={(i, term) =>
            String(i.sku ?? '').toLowerCase().includes(term) ||
            String(i.name ?? '').toLowerCase().includes(term) ||
            (i.category && String(i.category ?? '').toLowerCase().includes(term)) ||
            (i.location && String(i.location ?? '').toLowerCase().includes(term)) ||
            (i.itemType && String(i.itemType ?? '').toLowerCase().includes(term)) ||
            (i.gradeName && String(i.gradeName ?? '').toLowerCase().includes(term)) ||
            (i.metalGrade && String(i.metalGrade ?? '').toLowerCase().includes(term)) ||
            (i.specification && String(i.specification ?? '').toLowerCase().includes(term)) ||
            (i.dimensions && String(i.dimensions ?? '').toLowerCase().includes(term)) ||
            (i.finishCoating && String(i.finishCoating ?? '').toLowerCase().includes(term))
          }
        />

        {/* Barcode Tag Modal */}
        <BarcodeLabelModal item={selectedBarcodeItem} onClose={() => setSelectedBarcodeItem(null)}/>

        {/* Item Stock Detail & Movement Ledger Modal */}
        <ItemStockDetailModal
          item={selectedDetailItem}
          isOpen={Boolean(selectedDetailItem)}
          onClose={() => setSelectedDetailItem(null)}
        />

        {/* CSV Data Import Modal */}
        <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Inventory Items" templateHeaders={['SKU', 'Name', 'Category', 'UOM', 'Cost Price', 'Selling Price', 'Stock', 'Reorder Level', 'Location']} sampleRow={['SKU-CAT6-100', 'Cat6 Shielded Cable (100m)', 'Network Hardware', 'Roll', 45.0, 79.99, 120, 25, 'Bay B-04']} onImport={handleImportCsv}/>
      </div>
    );
};
