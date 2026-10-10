import React, { useState, useMemo, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Plus, Layers, Clock, Sliders, Trash2, X, Boxes, Wrench, CheckCircle2, Cpu } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useLocation, Link, useNavigate } from 'react-router-dom';

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
    const {
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        toggleCategoryActive,
        itemTypes = [],
        addItemType,
        updateItemType,
        toggleItemTypeActive,
        units = [],
        items,
        categoryParts = [],
        addCategoryPart,
        removeCategoryPart,
    } = useERP();
    const location = useLocation();
    const navigate = useNavigate();

    const isMachineView = location.pathname.includes('/machine');
    const isStockView = location.pathname.includes('/stock');

    // Filter states
    const [selectedItemTypeFilter, setSelectedItemTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

    // Modal & Drawer states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showItemTypesDrawer, setShowItemTypesDrawer] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteWarningCategory, setDeleteWarningCategory] = useState(null);
    const [managingCategory, setManagingCategory] = useState(null);
    const [managingBomCategory, setManagingBomCategory] = useState(null);

    // Add / Edit Category Form State
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [selectedItemTypeId, setSelectedItemTypeId] = useState('');
    const [selectedDefaultUnitId, setSelectedDefaultUnitId] = useState('');
    const [leadTime, setLeadTime] = useState('7');
    const [hasSubParts, setHasSubParts] = useState(isMachineView);
    const [isActive, setIsActive] = useState(true);
    const [formError, setFormError] = useState('');

    // Item Type Drawer State
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeCode, setNewTypeCode] = useState('');
    const [newTypeShape, setNewTypeShape] = useState('Flat');
    const [newTypeDesc, setNewTypeDesc] = useState('');

    useEffect(() => {
        setHasSubParts(isMachineView);
    }, [isMachineView, showAddModal]);

    const displayCategories = useMemo(() => {
        let list = categories;
        if (isMachineView) {
            list = list.filter((c) => c.hasSubParts);
        } else if (isStockView) {
            list = list.filter((c) => !c.hasSubParts);
        }
        if (selectedItemTypeFilter !== 'ALL') {
            list = list.filter(
                (c) => c.itemTypeId === selectedItemTypeFilter || c.itemType === selectedItemTypeFilter
            );
        }
        if (statusFilter === 'ACTIVE') {
            list = list.filter((c) => c.isActive !== false);
        } else if (statusFilter === 'INACTIVE') {
            list = list.filter((c) => c.isActive === false);
        }
        return list;
    }, [categories, isMachineView, isStockView, selectedItemTypeFilter, statusFilter]);

    // Open Add Modal
    const handleOpenAdd = () => {
        setEditingCategory(null);
        setName('');
        setCode('');
        setDescription('');
        setSelectedItemTypeId(selectedItemTypeFilter !== 'ALL' ? selectedItemTypeFilter : (itemTypes[0]?.id || ''));
        setSelectedDefaultUnitId(units[0]?.id || '');
        setLeadTime('7');
        setHasSubParts(isMachineView);
        setIsActive(true);
        setFormError('');
        setShowAddModal(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (c) => {
        setEditingCategory(c);
        setName(c.name || '');
        setCode(c.code || '');
        setDescription(c.description || '');
        setSelectedItemTypeId(c.itemTypeId || '');
        setSelectedDefaultUnitId(c.defaultUnitId || '');
        setLeadTime(String(c.leadTimeDays ?? 7));
        setHasSubParts(Boolean(c.hasSubParts));
        setIsActive(c.isActive !== false);
        setFormError('');
        setShowAddModal(true);
    };

    const handleSaveCategory = (e) => {
        e.preventDefault();
        setFormError('');
        if (!name.trim()) return;

        // Requirement 8: Check duplicate category name within same item type
        const targetItemType = itemTypes.find((it) => it.id === selectedItemTypeId);
        const dup = categories.find((c) => {
            if (editingCategory && c.id === editingCategory.id) return false;
            const sameType = (c.itemTypeId || '') === (selectedItemTypeId || '');
            return sameType && String(c.name || '').trim().toLowerCase() === name.trim().toLowerCase();
        });
        if (dup) {
            setFormError(`A category named "${name.trim()}" already exists under ${targetItemType?.name || 'this item type'}.`);
            return;
        }

        const targetUnit = units.find((u) => u.id === selectedDefaultUnitId);

        if (editingCategory) {
            updateCategory(editingCategory.id, {
                name: name.trim(),
                code: (code || editingCategory.code || 'GEN').toUpperCase(),
                description: description.trim(),
                itemTypeId: selectedItemTypeId || undefined,
                itemType: targetItemType?.name || undefined,
                defaultUnitId: selectedDefaultUnitId || undefined,
                defaultUnit: targetUnit?.code || undefined,
                defaultUom: targetUnit?.code || undefined,
                leadTimeDays: parseInt(leadTime, 10) || 7,
                hasSubParts: Boolean(hasSubParts),
                isActive: Boolean(isActive),
            });
        } else {
            addCategory({
                name: name.trim(),
                code: (code || 'GEN').toUpperCase(),
                description: description.trim(),
                itemTypeId: selectedItemTypeId || undefined,
                itemType: targetItemType?.name || undefined,
                defaultUnitId: selectedDefaultUnitId || undefined,
                defaultUnit: targetUnit?.code || undefined,
                defaultUom: targetUnit?.code || undefined,
                leadTimeDays: parseInt(leadTime, 10) || 7,
                hasSubParts: Boolean(hasSubParts),
                isActive: Boolean(isActive),
                customFields: [],
            });
        }
        setShowAddModal(false);
    };

    const handleConfirmDeleteOrDeactivate = (c) => {
        const itemCount = items.filter(
            (i) => i.category?.toLowerCase() === c.name?.toLowerCase() || i.categoryId === c.id
        ).length;
        const partsCount = categoryParts.filter((cp) => cp.categoryId === c.id).length;

        if (itemCount > 0 || partsCount > 0) {
            // Requirement 10: Prevent deletion of categories in use; enforce deactivation
            setDeleteWarningCategory({
                category: c,
                itemCount,
                partsCount,
            });
        } else {
            if (window.confirm(`Are you sure you want to delete category "${c.name}"?`)) {
                deleteCategory(c.id).catch((err) => {
                    alert(err?.message || 'Could not delete category.');
                });
            }
        }
    };

    const handleAddTypeFromDrawer = (e) => {
        e.preventDefault();
        if (!newTypeName.trim()) return;
        addItemType({
            name: newTypeName.trim(),
            code: (newTypeCode || 'TYPE').toUpperCase(),
            shapeProfile: newTypeShape,
            description: newTypeDesc.trim(),
            isActive: true,
        });
        setNewTypeName('');
        setNewTypeCode('');
        setNewTypeDesc('');
    };

    // State for managing custom fields
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState('text');
    const [newFieldOptions, setNewFieldOptions] = useState('');

    // State for adding BOM sub-part
    const [selectedBomItemId, setSelectedBomItemId] = useState('');
    const [bomDefaultQty, setBomDefaultQty] = useState(1);

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
            width: '10%',
            render: (c) => <span className="font-mono font-bold text-text-secondary">{c.code}</span>,
        },
        {
            key: 'name',
            header: 'Category Hierarchy Name',
            width: '24%',
            render: (c) => (
              <div>
                <span className="font-bold text-text flex items-center gap-1.5">
                  <Layers size={13} className="text-muted"/> {c.name}
                </span>
                {c.description && (
                  <p className="text-[11px] text-muted truncate max-w-sm mt-0.5" title={c.description}>
                    {c.description}
                  </p>
                )}
                {c.hasSubParts && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded mt-0.5 border border-purple-200 dark:border-purple-800">
                    <Boxes size={10} /> Composite / BOM Enabled
                  </span>
                )}
              </div>
            ),
        },
        {
            key: 'itemType',
            header: 'Item Type',
            width: '14%',
            render: (c) => {
                const typeObj = itemTypes.find((t) => t.id === c.itemTypeId) || (c.itemType ? { name: c.itemType } : null);
                if (!typeObj) return <span className="text-muted text-xs">—</span>;
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {typeObj.name}
                    </span>
                );
            },
        },
        {
            key: 'status',
            header: 'Status',
            align: 'center',
            width: '8%',
            render: (c) => {
                const active = c.isActive !== false;
                return (
                    <button
                        type="button"
                        onClick={() => toggleCategoryActive(c.id, active)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer transition ${
                            active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200'
                        }`}
                        title="Click to toggle status"
                    >
                        {active ? 'Active' : 'Inactive'}
                    </button>
                );
            },
        },
        {
            key: 'itemCount',
            header: 'Active SKUs',
            align: 'center',
            width: '8%',
            render: (c) => {
                const count = items.filter(i => i.category?.toLowerCase() === c.name?.toLowerCase() || i.categoryId === c.id).length;
                return <span className="font-mono font-semibold text-text">{count}</span>;
            },
        },
        {
            key: 'bomParts',
            header: 'Linked BOM Parts',
            align: 'center',
            width: '10%',
            render: (c) => {
                if (!c.hasSubParts) return <span className="text-muted text-xs">—</span>;
                const partsCount = categoryParts.filter(cp => cp.categoryId === c.id).length;
                return (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                    {partsCount} Sub-Part{partsCount === 1 ? '' : 's'}
                  </span>
                );
            },
        },
        {
            key: 'totalValuation',
            header: 'Assigned Asset Value',
            align: 'right',
            width: '12%',
            render: (c) => {
                const valuation = items
                    .filter(i => i.category?.toLowerCase() === c.name?.toLowerCase() || i.categoryId === c.id)
                    .reduce((sum, i) => sum + ((i.availableQty ?? i.stock ?? 0) * (i.costPrice ?? i.unitCost ?? 0)), 0);
                return (
                    <span className="font-mono font-bold text-text">
                        ₹{valuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            width: '16%',
            render: (c) => (
                <div className="flex items-center justify-end gap-1.5">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(c)}
                        className="text-xs py-1 px-2"
                        title="Edit Category"
                    >
                        Edit
                    </Button>
                    {c.hasSubParts && (
                      <Button
                          size="sm"
                          variant="secondary"
                          icon={Boxes}
                          onClick={() => setManagingBomCategory(c)}
                          className="text-xs py-1 px-2 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-100 border border-purple-200 dark:border-purple-800"
                      >
                          BOM
                      </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        icon={Sliders}
                        onClick={() => setManagingCategory(c)}
                        className="text-xs py-1 px-2"
                    >
                        Fields
                    </Button>
                    <button
                        type="button"
                        onClick={() => handleConfirmDeleteOrDeactivate(c)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer transition"
                        title="Delete or Deactivate"
                    >
                        <Trash2 size={13} />
                    </button>
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
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
            <Button
              variant="outline"
              icon={Layers}
              onClick={() => setShowItemTypesDrawer(true)}
            >
              Item Types ({itemTypes.length})
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(isMachineView ? '/inventory/items/machines' : '/inventory/items/stock')}
            >
              {isMachineView ? 'View Machines' : 'View Stock Items'}
            </Button>
            <Button icon={Plus} onClick={handleOpenAdd}>
              {isMachineView ? 'Create Machine Category' : 'Create Category'}
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar: Segmented Tabs + Item Type Filter + Status Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-nowrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-fit max-w-full overflow-x-auto whitespace-nowrap text-xs font-semibold">
          <Link
            to="/inventory/categories"
            className={`shrink-0 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              !isMachineView && !isStockView
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={15} /> All Categories ({categories.length})
          </Link>
          <Link
            to="/inventory/categories/machines"
            className={`shrink-0 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              isMachineView
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu size={15} /> Machine Categories ({categories.filter((c) => c.hasSubParts).length})
          </Link>
          <Link
            to="/inventory/categories/stock"
            className={`shrink-0 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              isStockView
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes size={15} /> Stock Categories ({categories.filter((c) => !c.hasSubParts).length})
          </Link>
        </div>

        {/* Dropdown Filters (Req 6) */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <span className="text-slate-500 font-medium">Item Type:</span>
            <select
              value={selectedItemTypeFilter}
              onChange={(e) => setSelectedItemTypeFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              {itemTypes.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        title={isMachineView ? 'Machine Equipment Categories' : isStockView ? 'Stock & Component Categories' : 'Inventory Taxonomic Categories'}
        columns={columns}
        data={displayCategories}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Filter category name, code, description, or type..."
        searchFilter={(c, term) =>
          String(c.name ?? '').toLowerCase().includes(term) ||
          String(c.code ?? '').toLowerCase().includes(term) ||
          String(c.description ?? '').toLowerCase().includes(term) ||
          String(c.itemType ?? '').toLowerCase().includes(term)
        }
      />

      {/* Add / Edit Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-2 sm:p-4">
          <div className="bg-white rounded-lg border border-[#CED4DA] shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#1F2E4A]">
                {editingCategory ? 'Edit Inventory Category' : 'Add Inventory Category'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 mb-3 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Item Type (Classification)
                </label>
                <select
                  value={selectedItemTypeId}
                  onChange={(e) => setSelectedItemTypeId(e.target.value)}
                  className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA] focus:bg-white"
                >
                  <option value="">-- No Item Type Linked --</option>
                  {itemTypes.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Associates this category with a metal form or item type.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Title / Material</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA] focus:bg-white"
                  placeholder="e.g. Mild Steel, Stainless Steel, CRCA Sheet"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA] focus:bg-white resize-none"
                  placeholder="e.g. Structural steel components, plates, and cold-formed sections."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Short Code</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA] font-mono uppercase focus:bg-white"
                    placeholder="MS-SHT (auto if blank)"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Unit</label>
                  <select
                    value={selectedDefaultUnitId}
                    onChange={(e) => setSelectedDefaultUnitId(e.target.value)}
                    className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA] focus:bg-white"
                  >
                    <option value="">-- Optional Unit --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label || u.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Avg Lead Time (Days)</label>
                  <input
                    type="number"
                    value={leadTime}
                    onChange={(e) => setLeadTime(e.target.value)}
                    className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA] font-mono focus:bg-white"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Active Status
                  </label>
                </div>
              </div>

              {/* Has Sub-Parts (BOM) Toggle */}
              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg flex items-start gap-3">
                <input
                  type="checkbox"
                  id="hasSubParts"
                  checked={hasSubParts}
                  onChange={(e) => setHasSubParts(e.target.checked)}
                  className="mt-0.5 rounded text-brand-primary focus:ring-brand-primary h-4 w-4 cursor-pointer"
                />
                <label htmlFor="hasSubParts" className="cursor-pointer">
                  <span className="font-bold text-slate-800 block text-xs">Composite / BOM Enabled</span>
                  <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                    When enabled, products under this category represent assembled multi-component systems.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-border bg-card hover:bg-card-hover text-text rounded-xl font-semibold text-xs cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold text-xs shadow-2xs cursor-pointer transition active:scale-[0.99]"
                >
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Warning / Deactivation Modal (Req 10) */}
      {deleteWarningCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-2 sm:p-4">
          <div className="bg-white rounded-xl border border-rose-200 shadow-2xl max-w-md w-full p-5 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
              <Trash2 size={20} className="text-rose-600" />
              Cannot Delete Category in Use
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Category <strong>&quot;{deleteWarningCategory.category.name}&quot;</strong> is currently referenced by{' '}
              <strong className="text-slate-900">{deleteWarningCategory.itemCount} inventory item(s)</strong>
              {deleteWarningCategory.partsCount > 0 && ` and ${deleteWarningCategory.partsCount} BOM part(s)`}.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
              To preserve historic ledger and movement integrity, categories in active use cannot be deleted.
              You can deactivate this category instead, which prevents it from being chosen for new items.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteWarningCategory(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => {
                  toggleCategoryActive(deleteWarningCategory.category.id, true);
                  setDeleteWarningCategory(null);
                }}
              >
                Deactivate Category
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Item Types Drawer / Modal */}
      {showItemTypesDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-2 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <Layers size={18} className="text-blue-600" />
                  Item Type Master
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-level metal classifications (Metal Sheet, Rod, Angle, Tube, Pipe, Channel, Beam, Flat, Bar).
                </p>
              </div>
              <button
                onClick={() => setShowItemTypesDrawer(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Existing Item Types Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5">Item Type Name</th>
                    <th className="p-2.5">Shape Profile</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemTypes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                        No item types registered yet.
                      </td>
                    </tr>
                  ) : (
                    itemTypes.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-mono font-bold text-slate-700">{it.code}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{it.name}</td>
                        <td className="p-2.5 text-slate-600">{it.shapeProfile || '—'}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => toggleItemTypeActive(it.id, it.isActive !== false)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer ${
                              it.isActive !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-300'
                            }`}
                          >
                            {it.isActive !== false ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddTypeFromDrawer} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <span className="font-bold text-slate-800 block">Add New Item Type</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Name</label>
                  <input
                    required
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="e.g. Hex Bar"
                    className="w-full border border-slate-200 rounded p-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Code</label>
                  <input
                    value={newTypeCode}
                    onChange={(e) => setNewTypeCode(e.target.value.toUpperCase())}
                    placeholder="HEX-BAR"
                    className="w-full border border-slate-200 rounded p-1.5 bg-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Shape Profile</label>
                  <select
                    value={newTypeShape}
                    onChange={(e) => setNewTypeShape(e.target.value)}
                    className="w-full border border-slate-200 rounded p-1.5 bg-white"
                  >
                    <option value="Flat">Flat / Sheet</option>
                    <option value="Round">Round / Cylindrical</option>
                    <option value="Square">Square</option>
                    <option value="Rectangular">Rectangular</option>
                    <option value="L-Shape">L-Shape (Angle)</option>
                    <option value="C-Shape">C-Shape (Channel)</option>
                    <option value="I-Shape">I-Shape (Beam)</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button type="submit" size="sm" icon={Plus}>
                  Register Item Type
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Custom Fields Modal */}
      {managingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-2 sm:p-4">
          <div className="bg-white rounded-xl border border-[#CED4DA] shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 lg:gap-0 border-b border-slate-200 pb-3">
              <div className="min-w-0 lg:min-w-auto">
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
                      className="flex items-center justify-between gap-2 lg:gap-0 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <div className="min-w-0 lg:min-w-auto">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[#CED4DA] shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 lg:gap-0 border-b border-slate-200 pb-3">
              <div className="min-w-0 lg:min-w-auto">
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
                        className="flex items-center justify-between gap-2 lg:gap-0 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 lg:min-w-auto">
                          <div className="w-6 h-6 shrink-0 lg:shrink rounded bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                            {part.defaultQty}x
                          </div>
                          <div>
                            <span className="font-bold text-slate-800">
                              {item ? item.name : `Item #${part.itemId}`}
                            </span>
                            <div className="text-[11px] text-slate-500 flex flex-wrap lg:flex-nowrap items-center gap-x-2">
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
                <Button type="submit" size="sm" icon={Plus}>
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
