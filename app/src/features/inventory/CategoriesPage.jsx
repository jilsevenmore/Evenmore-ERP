import React, { useState, useMemo, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Plus, Layers, Clock, Sliders, Trash2, X, Boxes, Wrench, CheckCircle2, Cpu } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useLocation, Link } from 'react-router-dom';

const categoryGuide = {
    title: 'Category Hierarchy & Taxonomy',
    subtitle: 'Organize catalog items, manage lead times, and track asset group valuations',
    purpose: 'Use this page to classify items into structured product families. Categories establish baseline procurement lead times, SKU code prefixes, custom attribute definitions, BOM sub-part relationships, and aggregated stock valuation analytics.',
    workflow: ['Create Category', 'Assign Expected Lead Time', 'Define Custom Fields', 'Link SKUs to Category', 'Configure Category BOM / Sub-Parts', 'Monitor Group Asset Valuation'],
    keyTerms: [
        {
            term: 'Category Code',
            definition: 'A 3-letter prefix (e.g., HDW, CAB, ELEC) used to standardize SKU naming conventions.',
        },
        {
            term: 'Machine Category (hasSubParts)',
            definition: 'When enabled, product lines under this category represent assembled multi-component systems and composite equipment.',
        },
        {
            term: 'Supplier Lead Time',
            definition: 'Average number of days between placing a Purchase Order and receiving physical stock at the warehouse dock.',
        },
        {
            term: 'Active SKUs Count',
            definition: 'The count of active inventory catalog items grouped under this specific category classification.',
        },
        {
            term: 'Custom Fields Schema',
            definition: 'Dynamic attribute fields defined per category (e.g., Voltage, Warranty, Color, Form Factor) that appear automatically on item creation.',
        },
    ],
    tips: [
        'Configuring accurate lead times helps forecast restock reorder triggers and prevents stockouts during spikes in demand.',
        'Use "Manage BOM" to inspect template sub-part relationships for machine categories.',
    ],
};

export const CategoriesPage = () => {
    const { categories, addCategory, updateCategory, items, categoryParts = [], addCategoryPart, removeCategoryPart } = useERP();
    const location = useLocation();

    const isMachineView = location.pathname.includes('/machine');
    const isStockView = location.pathname.includes('/stock');

    const displayCategories = useMemo(() => {
        if (isMachineView) {
            return categories.filter((c) => c.hasSubParts);
        }
        if (isStockView) {
            return categories.filter((c) => !c.hasSubParts);
        }
        return categories;
    }, [categories, isMachineView, isStockView]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [managingCategory, setManagingCategory] = useState(null);
    const [managingBomCategory, setManagingBomCategory] = useState(null);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [leadTime, setLeadTime] = useState('7');
    const [hasSubParts, setHasSubParts] = useState(isMachineView);

    useEffect(() => {
        setHasSubParts(isMachineView);
    }, [isMachineView, showAddModal]);

    // State for managing custom fields
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState('text');
    const [newFieldOptions, setNewFieldOptions] = useState('');

    // State for adding BOM sub-part
    const [selectedBomItemId, setSelectedBomItemId] = useState('');
    const [bomDefaultQty, setBomDefaultQty] = useState(1);

    const handleAdd = (e) => {
        e.preventDefault();
        addCategory({
            name: name || 'Hardware Sub-Category',
            code: (code || 'GEN').toUpperCase(),
            leadTimeDays: parseInt(leadTime, 10) || 7,
            hasSubParts: Boolean(hasSubParts),
            customFields: [],
        });
        setShowAddModal(false);
        setName('');
        setCode('');
        setLeadTime('7');
        setHasSubParts(false);
    };

    const handleAddCustomField = (e) => {
        e.preventDefault();
        if (!managingCategory || !newFieldName.trim()) return;

        const currentFields = managingCategory.customFields || [];
        const fieldKey = newFieldName.trim().toLowerCase().replace(/\s+/g, '_');
        const optionsList = newFieldType === 'select'
            ? newFieldOptions.split(',').map(s => s.trim()).filter(Boolean)
            : undefined;

        const newField = {
            id: `cf-${Date.now()}`,
            name: newFieldName.trim(),
            key: fieldKey,
            type: newFieldType,
            ...(optionsList ? { options: optionsList } : {}),
        };

        const updatedFields = [...currentFields, newField];
        updateCategory(managingCategory.id, { customFields: updatedFields });
        setManagingCategory({ ...managingCategory, customFields: updatedFields });
        setNewFieldName('');
        setNewFieldType('text');
        setNewFieldOptions('');
    };

    const handleRemoveCustomField = (fieldId) => {
        if (!managingCategory) return;
        const currentFields = managingCategory.customFields || [];
        const updatedFields = currentFields.filter(f => f.id !== fieldId && f.name !== fieldId && f.key !== fieldId);
        updateCategory(managingCategory.id, { customFields: updatedFields });
        setManagingCategory({ ...managingCategory, customFields: updatedFields });
    };

    const handleAddBomPart = (e) => {
        e.preventDefault();
        if (!managingBomCategory || !selectedBomItemId) return;

        addCategoryPart({
            categoryId: managingBomCategory.id,
            itemId: selectedBomItemId,
            defaultQty: Number(bomDefaultQty) || 1,
        });

        setSelectedBomItemId('');
        setBomDefaultQty(1);
    };

    const columns = [
        {
            key: 'code',
            header: 'Category Code',
            render: (c) => <span className="font-mono font-bold text-slate-700">{c.code}</span>,
        },
        {
            key: 'name',
            header: 'Category Hierarchy Name',
            render: (c) => (
              <div>
                <span className="font-bold text-[#1F2E4A] flex items-center gap-1.5">
                  <Layers size={13} className="text-[#1F2E4A]/70"/> {c.name}
                </span>
                {c.hasSubParts && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded mt-0.5 border border-purple-200 dark:border-purple-800">
                    <Boxes size={10} /> Composite / BOM Enabled
                  </span>
                )}
              </div>
            ),
        },
        {
            key: 'itemCount',
            header: 'Active SKUs',
            align: 'center',
            render: (c) => {
                const count = items.filter(i => i.category?.toLowerCase() === c.name?.toLowerCase() || i.categoryId === c.id).length;
                return <span className="font-mono font-semibold text-slate-800">{count}</span>;
            },
        },
        {
            key: 'bomParts',
            header: 'Linked BOM Parts',
            align: 'center',
            render: (c) => {
                if (!c.hasSubParts) return <span className="text-slate-400 text-xs">—</span>;
                const partsCount = categoryParts.filter(cp => cp.categoryId === c.id).length;
                return (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {partsCount} Sub-Part{partsCount === 1 ? '' : 's'}
                  </span>
                );
            },
        },
        {
            key: 'totalValuation',
            header: 'Assigned Asset Value',
            align: 'right',
            render: (c) => {
                const valuation = items
                    .filter(i => i.category?.toLowerCase() === c.name?.toLowerCase() || i.categoryId === c.id)
                    .reduce((sum, i) => sum + ((i.availableQty ?? i.stock ?? 0) * (i.costPrice ?? i.unitCost ?? 0)), 0);
                return (
                    <span className="font-mono font-bold text-slate-900">
                        ₹{valuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                );
            },
        },
        {
            key: 'customFields',
            header: 'Custom Attributes',
            align: 'center',
            render: (c) => (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {(c.customFields || []).length} field(s)
                </span>
            ),
        },
        {
            key: 'leadTimeDays',
            header: 'Supplier Lead Time',
            align: 'center',
            render: (c) => (<span className="text-slate-600 flex items-center justify-center gap-1 text-xs">
          <Clock size={12} className="text-slate-400"/> {c.leadTimeDays ?? 7} days
        </span>),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (c) => (
                <div className="flex items-center justify-end gap-1.5">
                    {c.hasSubParts && (
                      <Button
                          size="sm"
                          variant="secondary"
                          icon={Boxes}
                          onClick={() => setManagingBomCategory(c)}
                          className="text-xs py-1 px-2.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                      >
                          Manage BOM
                      </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        icon={Sliders}
                        onClick={() => setManagingCategory(c)}
                        className="text-xs py-1 px-2.5"
                    >
                        Fields
                    </Button>
                </div>
            ),
        },
    ];

    const currentCategoryParts = managingBomCategory
      ? categoryParts.filter(cp => cp.categoryId === managingBomCategory.id)
      : [];

    const pageTitle = isMachineView
      ? 'Machine Categories'
      : isStockView
      ? 'Stock Categories'
      : 'Category Hierarchy';

    const pageSubtitle = isMachineView
      ? 'Taxonomic product families for multi-component machines and complex equipment.'
      : isStockView
      ? 'Product categories for stock parts, raw supplies, consumables, and standalone items.'
      : 'Group inventory SKUs, configure category-level custom fields, manage lead times, and monitor asset values.';

    return (<div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        guide={categoryGuide}
        actions={
          <div className="flex items-center gap-2">
            <Link to={isMachineView ? '/items/machines' : '/items/stock'}>
              <Button variant="outline">
                {isMachineView ? 'View Machines' : 'View Stock Items'}
              </Button>
            </Link>
            <Button icon={Plus} onClick={() => setShowAddModal(true)}>
              {isMachineView ? 'Create Machine Category' : 'Create Category'}
            </Button>
          </div>
        }
      />

      <DataTable
        title={isMachineView ? 'Machine Equipment Categories' : isStockView ? 'Stock & Component Categories' : 'Inventory Taxonomic Categories'}
        columns={columns}
        data={displayCategories}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Filter category name or code..."
        searchFilter={(c, term) => c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)}
      />

      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-lg border border-[#CED4DA] shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-base text-[#1F2E4A] mb-1">
              Add Inventory Category
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure product group taxonomy, default reorder lead expectations, and BOM assembly behavior.
            </p>

            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Title</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA]" placeholder="e.g. Endoscopy Machines"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Short Code</label>
                  <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA] font-mono uppercase" placeholder="ENDO"/>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Avg Lead Time (Days)</label>
                  <input type="number" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA] font-mono"/>
                </div>
              </div>

              {/* Has Sub-Parts (BOM) Toggle */}
              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg flex items-start gap-3">
                <input
                  type="checkbox"
                  id="hasSubParts"
                  checked={hasSubParts}
                  onChange={(e) => setHasSubParts(e.target.checked)}
                  className="mt-0.5 rounded text-brand-primary focus:ring-brand-primary h-4 w-4"
                />
                <label htmlFor="hasSubParts" className="cursor-pointer">
                  <span className="font-bold text-slate-800 block text-xs">This is a Machine Category (hasSubParts)</span>
                  <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                    When enabled, products under this category represent assembled multi-component equipment.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3.5 py-1.5 border border-[#CED4DA] rounded text-slate-600 hover:bg-slate-100 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#1F2E4A] hover:bg-[#152033] text-white rounded font-semibold cursor-pointer">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Manage Custom Fields Modal */}
      {managingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl border border-[#CED4DA] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#1F2E4A] flex items-center gap-2">
                  <Sliders size={18} className="text-[#1F2E4A]" />
                  Custom Fields for {managingCategory.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dynamic attribute fields that will appear for all items under this category.
                </p>
              </div>
              <button
                onClick={() => setManagingCategory(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Custom Fields List */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700 text-xs">Existing Custom Fields</label>
              {(managingCategory.customFields || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center">
                  No custom fields defined for this category yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(managingCategory.customFields || []).map((field) => (
                    <div
                      key={field.id || field.name}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{field.name}</span>
                        <span className="ml-2 font-mono text-[10px] text-slate-500 uppercase px-1.5 py-0.5 bg-white border border-slate-200 rounded">
                          {field.type}
                        </span>
                        {field.options && field.options.length > 0 && (
                          <span className="text-[11px] text-slate-500 ml-2">
                            ({field.options.join(', ')})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(field.id || field.name)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded cursor-pointer transition-colors"
                        title="Delete Field"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Custom Field Form */}
            <form onSubmit={handleAddCustomField} className="space-y-3 pt-3 border-t border-slate-200 text-xs">
              <span className="font-bold text-slate-800 block">Add New Custom Field</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Field Label</label>
                  <input
                    required
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA]"
                    placeholder="e.g. Operating Voltage, Warranty"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Field Type</label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA]"
                  >
                    <option value="text">Text (String)</option>
                    <option value="number">Number</option>
                    <option value="select">Dropdown Selection</option>
                  </select>
                </div>
              </div>

              {newFieldType === 'select' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Options (comma-separated)
                  </label>
                  <input
                    required
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA]"
                    placeholder="e.g. 1 Year, 3 Years, 5 Years"
                  />
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <Button type="submit" size="sm" icon={Plus}>
                  Add Field
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setManagingCategory(null)}
                >
                  Done
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Category BOM / Sub-Parts Modal */}
      {managingBomCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[#CED4DA] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#1F2E4A] flex items-center gap-2">
                  <Boxes size={18} className="text-purple-600" />
                  BOM Sub-Parts for {managingBomCategory.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sub-components automatically inserted when an item of this category is chosen in orders & invoices.
                </p>
              </div>
              <button
                onClick={() => setManagingBomCategory(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Sub-Parts List */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700 text-xs">
                Linked Sub-Parts ({currentCategoryParts.length})
              </label>
              {currentCategoryParts.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center">
                  No sub-parts linked to this category yet. Add components below.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {currentCategoryParts.map((part) => {
                    const item = items.find((i) => i.id === part.itemId);
                    return (
                      <div
                        key={part.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                            {part.defaultQty}x
                          </div>
                          <div>
                            <span className="font-bold text-slate-800">
                              {item ? item.name : `Item #${part.itemId}`}
                            </span>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span>SKU: {item?.sku || '—'}</span>
                              <span>•</span>
                              <span>Cost: ₹{item?.costPrice || 0}</span>
                              {item?.trackingMode === 'Serial' && (
                                <span className="text-[10px] px-1 bg-amber-100 text-amber-800 rounded font-medium">
                                  Serial Tracked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCategoryPart(part.id)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded cursor-pointer transition-colors"
                          title="Remove Sub-Part"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add New BOM Part Form */}
            <form onSubmit={handleAddBomPart} className="space-y-3 pt-3 border-t border-slate-200 text-xs">
              <span className="font-bold text-slate-800 block">Link New Component / Part</span>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Select Item SKU</label>
                  <select
                    required
                    value={selectedBomItemId}
                    onChange={(e) => setSelectedBomItemId(e.target.value)}
                    className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA]"
                  >
                    <option value="">-- Choose Inventory Item --</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name} ({it.sku || it.code}) - {it.category || 'General'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Default Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bomDefaultQty}
                    onChange={(e) => setBomDefaultQty(e.target.value)}
                    className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA] font-mono text-center"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button type="submit" size="sm" icon={Plus} className="bg-purple-700 hover:bg-purple-800 text-white">
                  Add Sub-Part
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setManagingBomCategory(null)}
                >
                  Done
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>);
};
