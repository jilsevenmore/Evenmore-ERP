import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Package, ShoppingCart, Boxes, AlertTriangle, Search, X, Layers, ChevronDown } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Button } from '../ui/Button';

const createEmptyLine = () => ({
  id: `li-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  itemId: '',
  sku: '',
  itemSku: '',
  name: '',
  description: '',
  qty: 1,
  rate: 0,
  discount: 0,
  tax: 18,
  amount: 0,
  isUserModified: false,
});

export const LineItemEditor = ({ items = [], onChange, type = 'sales', readOnly = false, onRequestPO }) => {
    const {
      items: masterItems = [],
      categories = [],
      categoryParts = [],
      itemParts = [],
      calculateItemStock
    } = useERP();

    const [isStockPickerOpen, setIsStockPickerOpen] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');
    const [pickerCategory, setPickerCategory] = useState('All');
    const [collapsedMachines, setCollapsedMachines] = useState({});

    const toggleCollapse = (machineLineId) => {
      setCollapsedMachines((prev) => ({
        ...prev,
        [machineLineId]: !prev[machineLineId],
      }));
    };

    // Ensure there is at least one default empty line item for editable forms
    useEffect(() => {
      if (!readOnly && items.length === 0 && onChange) {
        onChange([createEmptyLine()]);
      }
    }, [items.length, readOnly, onChange]);

    // Create a new line item (empty by default or populated if selected from stock picker)
    const handleAddItem = (defaultItem = null) => {
        if (!defaultItem) {
            onChange([...items, createEmptyLine()]);
            return;
        }

        const unitRate = type === 'sales'
            ? (defaultItem.sellingPrice || 0)
            : (defaultItem.costPrice || 0);

        const lineId = `li-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const newItem = {
            id: lineId,
            itemId: defaultItem.id || '',
            sku: defaultItem.sku || '',
            itemSku: defaultItem.sku || '',
            name: defaultItem.name || '',
            description: defaultItem.name || '',
            qty: 1,
            rate: unitRate,
            discount: 0,
            tax: 18,
            amount: Math.round(unitRate * 1.18 * 100) / 100,
            isUserModified: false,
        };

        // If the added item is a Machine, expand its BOM
        const machineBom = itemParts.filter(ip => ip.parentItemId === defaultItem.id);
        if (machineBom.length > 0) {
            const childLines = machineBom.map((bp) => {
                const childItem = masterItems.find((mi) => mi.id === bp.partItemId);
                const childRate = childItem
                  ? (type === 'sales' ? (childItem.sellingPrice || 0) : (childItem.costPrice || 0))
                  : 0;
                const childQty = (bp.requiredQty || 1) * 1;
                const childGross = childQty * childRate;
                const childAmount = Math.round(childGross * 1.18 * 100) / 100;

                return {
                    id: `li-bom-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
                    itemId: childItem ? childItem.id : bp.partItemId,
                    sku: childItem ? childItem.sku : '',
                    itemSku: childItem ? childItem.sku : '',
                    name: childItem ? childItem.name : `Component for ${defaultItem.name}`,
                    description: childItem
                      ? `${childItem.name} (BOM Part for ${defaultItem.sku})`
                      : `BOM Part for ${defaultItem.sku}`,
                    qty: childQty,
                    rate: childRate,
                    discount: 0,
                    tax: 18,
                    amount: childAmount,
                    isBomGenerated: true,
                    isBomPart: true,
                    isUserModified: false,
                    parentLineId: lineId,
                    bomSourceItemId: defaultItem.id,
                    parentSku: defaultItem.sku,
                };
            });
            onChange([...items, newItem, ...childLines]);
        } else {
            onChange([...items, newItem]);
        }
    };

    const handleItemSelect = (index, itemId) => {
        const current = items[index] || {};

        if (!itemId) {
            // Cleared back to blank -> also remove any previous BOM children
            const filteredItems = items.filter((it, i) => i === index || it.parentLineId !== current.id);
            const currentPos = filteredItems.findIndex((it) => it.id === current.id || it === current);
            const updated = [...filteredItems];
            updated[currentPos >= 0 ? currentPos : index] = {
                ...createEmptyLine(),
                id: current.id || `li-${Date.now()}`,
            };
            onChange(updated);
            return;
        }

        const selected = masterItems.find((i) => i.id === itemId);
        if (!selected) return;

        const unitRate = type === 'sales' ? (selected.sellingPrice || 0) : (selected.costPrice || 0);
        const lineId = current.id || `li-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const qty = current.qty || 1;
        const discount = current.discount || 0;
        const tax = current.tax ?? 18;
        const gross = qty * unitRate;
        const afterDisc = gross * (1 - discount / 100);
        const amount = Math.round(afterDisc * (1 + tax / 100) * 100) / 100;

        const updatedMain = {
            ...current,
            id: lineId,
            itemId: selected.id,
            sku: selected.sku,
            itemSku: selected.sku,
            name: selected.name,
            description: selected.name,
            rate: unitRate,
            amount,
            isUserModified: false,
        };

        // 1. Check machine-specific BOM from itemParts (authoritative source)
        let bomPartsToExpand = itemParts.filter((ip) => ip.parentItemId === selected.id);

        // 2. Fallback to category BOM if itemParts is empty
        if (bomPartsToExpand.length === 0) {
            const itemCategory = categories.find(
              (c) => c.id === selected.categoryId || c.name?.toLowerCase() === selected.category?.toLowerCase()
            );
            if (itemCategory) {
                const catParts = categoryParts.filter((cp) => cp.categoryId === itemCategory.id);
                bomPartsToExpand = catParts.map((cp) => ({
                    partItemId: cp.itemId,
                    requiredQty: cp.defaultQty || 1,
                }));
            }
        }

        // Filter out existing children of this specific line if any
        const filteredItems = items.filter((it, i) => i === index || it.parentLineId !== current.id);
        const currentPos = filteredItems.findIndex((it) => it.id === current.id || it === current);

        if (bomPartsToExpand.length > 0) {
            // Build sub-part line items
            const childLineItems = bomPartsToExpand.map((bp) => {
                const childItem = masterItems.find((mi) => mi.id === bp.partItemId);
                const childRate = childItem
                  ? (type === 'sales' ? (childItem.sellingPrice || 0) : (childItem.costPrice || 0))
                  : 0;
                const childQty = (bp.requiredQty || 1) * qty;
                const childGross = childQty * childRate;
                const childAmount = Math.round(childGross * (1 + tax / 100) * 100) / 100;

                return {
                    id: `li-bom-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
                    itemId: childItem ? childItem.id : bp.partItemId,
                    sku: childItem ? childItem.sku : '',
                    itemSku: childItem ? childItem.sku : '',
                    name: childItem ? childItem.name : `Component for ${selected.name}`,
                    description: childItem
                      ? `${childItem.name} (BOM Part for ${selected.sku})`
                      : `BOM Part for ${selected.sku}`,
                    qty: childQty,
                    rate: childRate,
                    discount: 0,
                    tax: 18,
                    amount: childAmount,
                    isBomGenerated: true,
                    isBomPart: true,
                    isUserModified: false,
                    parentLineId: lineId,
                    bomSourceItemId: selected.id,
                    parentSku: selected.sku,
                };
            });

            const newItemsList = [...filteredItems];
            newItemsList[currentPos >= 0 ? currentPos : index] = updatedMain;
            // Insert child lines right after this item
            newItemsList.splice((currentPos >= 0 ? currentPos : index) + 1, 0, ...childLineItems);
            onChange(newItemsList);
        } else {
            const updated = [...filteredItems];
            updated[currentPos >= 0 ? currentPos : index] = updatedMain;
            onChange(updated);
        }
    };

    const handleFieldChange = (index, field, value) => {
        const updated = [...items];
        const current = { ...updated[index] };
        
        const prevQty = current.qty || 1;
        current[field] = value;

        // If user changed rate/discount/tax/qty directly on a BOM part, mark as user modified
        if (current.isBomGenerated && (field === 'qty' || field === 'rate' || field === 'discount' || field === 'tax')) {
            current.isUserModified = true;
        }

        const qty = Number(current.qty) || 0;
        const rate = Number(current.rate) || 0;
        const discount = Number(current.discount) || 0;
        const tax = Number(current.tax) || 0;
        const gross = qty * rate;
        const afterDisc = gross * (1 - discount / 100);
        const amount = Math.round(afterDisc * (1 + tax / 100) * 100) / 100;
        current.amount = amount;
        updated[index] = current;

        // Rule: If machine quantity changed, scale untouched generated BOM lines
        if (field === 'qty' && qty > 0) {
            const parentLineId = current.id;
            // Find untouched children linked to this machine
            updated.forEach((line, lineIdx) => {
                if (line.parentLineId === parentLineId && !line.isUserModified) {
                    const baseItemPart = itemParts.find(
                      (ip) => ip.parentItemId === current.itemId && ip.partItemId === line.itemId
                    );
                    const ratio = baseItemPart?.requiredQty || (prevQty > 0 ? (line.qty / prevQty) : 1);
                    const newChildQty = Math.round(qty * ratio);

                    const cRate = Number(line.rate) || 0;
                    const cDisc = Number(line.discount) || 0;
                    const cTax = Number(line.tax) || 0;
                    const cGross = newChildQty * cRate;
                    const cAfterDisc = cGross * (1 - cDisc / 100);
                    const cAmount = Math.round(cAfterDisc * (1 + cTax / 100) * 100) / 100;

                    updated[lineIdx] = {
                        ...line,
                        qty: newChildQty,
                        amount: cAmount,
                    };
                }
            });
        }

        onChange(updated);
    };

    const handleRemove = (index) => {
        const itemToRemove = items[index];
        if (!itemToRemove) return;

        let updated;
        // If removing a parent machine, remove BOTH the parent AND all its child BOM parts!
        if (itemToRemove.id) {
            updated = items.filter((it, i) => i !== index && it.parentLineId !== itemToRemove.id);
        } else {
            updated = items.filter((_, i) => i !== index);
        }

        if (updated.length === 0) {
            // Keep at least one ready-to-select line item
            onChange([createEmptyLine()]);
        } else {
            onChange(updated);
        }
    };

    const filteredStockPickerItems = useMemo(() => {
        return masterItems.filter((it) => {
            if (pickerCategory !== 'All' && it.category !== pickerCategory) return false;
            if (pickerSearch.trim()) {
                const q = pickerSearch.toLowerCase().trim();
                return it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q);
            }
            return true;
        });
    }, [masterItems, pickerCategory, pickerSearch]);

    const displayItems = (!readOnly && items.length === 0) ? [createEmptyLine()] : items;

    const subtotal = displayItems.reduce((acc, it) => acc + ((Number(it.qty) || 0) * (Number(it.rate) || 0)), 0);
    const totalDiscount = displayItems.reduce((acc, it) => acc + ((Number(it.qty) || 0) * (Number(it.rate) || 0) * ((Number(it.discount) || 0) / 100)), 0);
    const totalTax = displayItems.reduce((acc, it) => {
        const grossAfterDisc = ((Number(it.qty) || 0) * (Number(it.rate) || 0)) * (1 - ((Number(it.discount) || 0) / 100));
        return acc + (grossAfterDisc * (((it.tax !== undefined ? Number(it.tax) : 18)) / 100));
    }, 0);
    const grandTotal = Math.round((subtotal - totalDiscount + totalTax) * 100) / 100;

    return (
    <div className="space-y-4 font-sans text-xs">
      <div className="border border-border rounded-xl bg-card shadow-xs overflow-hidden">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-table-head border-b border-border text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              <th className="text-left px-3.5 py-3 w-[36%]">Item / Description</th>
              <th className="text-center px-3 py-3 w-[12%]">Available Stock</th>
              <th className="text-center px-3 py-3 w-[9%]">Qty</th>
              <th className="text-right px-3 py-3 w-[12%]">Unit Rate (₹)</th>
              <th className="text-center px-3 py-3 w-[8%]">Disc (%)</th>
              <th className="text-center px-3 py-3 w-[8%]">GST (%)</th>
              <th className="text-right px-3.5 py-3 w-[11%]">Amount (₹)</th>
              {!readOnly && <th className="w-10 px-2 py-3 text-center"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {displayItems.length === 0 && readOnly ? (
              <tr>
                <td colSpan={7} className="py-10 px-4 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center mb-3">
                      <Package className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-text">No line items recorded</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayItems.map((item, index) => {
                const masterObj = item.itemId
                  ? masterItems.find(mi => mi.id === item.itemId || mi.sku === item.sku)
                  : null;
                const isMachine = masterObj?.itemKind === 'Machine';
                const childPartsCount = item.id ? displayItems.filter(it => it.parentLineId === item.id).length : 0;
                const isParentCollapsed = item.parentLineId && collapsedMachines[item.parentLineId];

                // If this is a child component of a collapsed machine, hide row
                if (item.isBomPart && isParentCollapsed) {
                  return null;
                }

                const availableStock = masterObj ? (masterObj.availableQty ?? masterObj.stock ?? 0) : 0;
                const deficit = masterObj ? Math.max(0, (item.qty || 1) - availableStock) : 0;
                const isShortage = masterObj ? deficit > 0 : false;

                return (
                  <tr
                    key={item.id || index}
                    className={`hover:bg-card-hover transition-colors ${
                      item.isBomPart
                        ? 'bg-purple-500/[0.04] dark:bg-purple-950/20'
                        : isMachine
                        ? 'bg-blue-500/[0.03] dark:bg-blue-950/20 font-medium'
                        : isShortage
                        ? 'bg-amber-500/5'
                        : ''
                    }`}
                  >
                    <td className="px-3.5 py-2.5 align-top">
                      {!readOnly ? (
                        item.isBomPart ? (
                          /* Indented Child Component Display */
                          <div className="pl-6 relative">
                            {/* Branch connector line */}
                            <div className="absolute left-1.5 top-0 bottom-4 w-3.5 border-l-2 border-b-2 border-purple-400/50 dark:border-purple-600/60 rounded-bl-lg pointer-events-none" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-700 px-2 py-0.5 rounded-full shrink-0"
                                  title={`Included part for ${item.parentSku || 'Machine'}`}
                                >
                                  <Boxes size={10} /> Component
                                </span>
                                <span className="font-bold text-text text-xs">
                                  {item.name || item.description}
                                </span>
                                {item.itemSku && (
                                  <span className="font-mono text-[10px] text-muted">
                                    [{item.itemSku}]
                                  </span>
                                )}
                              </div>
                              <input
                                type="text"
                                placeholder="Component serial / notes..."
                                value={item.description || ''}
                                onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                                className="w-full text-[11px] px-2.5 py-1 mt-1.5 rounded-md border border-border/70 bg-card text-text placeholder:text-muted focus:outline-none focus:border-primary transition"
                              />
                            </div>
                          </div>
                        ) : (
                          /* Top-Level Item / Machine Selector */
                          <div>
                            <div className="flex items-center gap-2">
                              <select
                                value={item.itemId || ''}
                                onChange={(e) => handleItemSelect(index, e.target.value)}
                                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border bg-card text-text focus:outline-none focus:border-primary transition cursor-pointer"
                              >
                                <option value="">-- Select Master Item --</option>
                                {masterItems.map((mi) => (
                                  <option key={mi.id} value={mi.id}>
                                    [{mi.sku}] {mi.name} {mi.itemKind === 'Machine' ? '(Machine & BOM)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {isMachine && childPartsCount > 0 && (
                              <div className="flex items-center gap-2 mt-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleCollapse(item.id)}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-md text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-900/60 border border-purple-300 dark:border-purple-700 transition cursor-pointer shadow-2xs"
                                >
                                  <ChevronDown
                                    size={12}
                                    className={`transition-transform duration-200 ${collapsedMachines[item.id] ? '-rotate-90' : 'rotate-0'}`}
                                  />
                                  <Layers size={11} />
                                  <span>
                                    {collapsedMachines[item.id]
                                      ? `Show ${childPartsCount} Components`
                                      : `${childPartsCount} Components Included`}
                                  </span>
                                </button>
                              </div>
                            )}
                            <input
                              type="text"
                              placeholder="Custom line description / serial notes..."
                              value={item.description || ''}
                              onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                              className="w-full text-[11px] px-2.5 py-1 mt-1.5 rounded-md border border-border/70 bg-card text-text placeholder:text-muted focus:outline-none focus:border-primary transition"
                            />
                          </div>
                        )
                      ) : (
                        <div>
                          {item.isBomPart ? (
                            <div className="pl-5 relative flex items-center gap-1.5">
                              <div className="absolute left-1.5 top-0 bottom-2 w-2.5 border-l-2 border-b-2 border-purple-400/50 dark:border-purple-600/60 rounded-bl pointer-events-none" />
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded-full">
                                <Boxes size={10} /> Component
                              </span>
                              <span className="font-semibold text-text">{item.name || item.description}</span>
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold text-text">{item.name || item.description || '—'}</p>
                              {item.itemSku && (
                                <span className="text-[10px] text-muted font-mono block mt-0.5">
                                  SKU: {item.itemSku}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-center align-top">
                      <div className="flex flex-col items-center gap-1">
                        {!item.itemId ? (
                          <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border border-border text-muted bg-soft">
                            —
                          </span>
                        ) : (
                          <>
                            <span
                              className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                availableStock <= 0
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                                  : isShortage
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              {availableStock} Avail
                            </span>
                            {isShortage && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                <AlertTriangle size={10} /> Short: {deficit}
                              </span>
                            )}
                            {isShortage && onRequestPO && !readOnly && (
                              <button
                                type="button"
                                onClick={() => onRequestPO(item, deficit)}
                                className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition cursor-pointer shadow-2xs"
                                title={`Shortage of ${deficit} units. Click to raise an Auto PO to supplier.`}
                              >
                                <ShoppingCart size={10}/> +PO ({deficit})
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-center align-top">
                      {!readOnly ? (() => {
                        const unit = (masterObj?.salesUnit || masterObj?.uom || masterObj?.unit || 'Nos').toLowerCase();
                        const allowsDecimal = ['kg', 'mtr', 'meter', 'ltr', 'liter', 'ton'].includes(unit);
                        return (
                          <input
                            type="number"
                            min={allowsDecimal ? "0.01" : "1"}
                            step={allowsDecimal ? "0.01" : "1"}
                            value={item.qty ?? 1}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (isNaN(val) || val <= 0) {
                                handleFieldChange(index, 'qty', allowsDecimal ? 0.01 : 1);
                              } else {
                                handleFieldChange(index, 'qty', allowsDecimal ? val : Math.floor(val));
                              }
                            }}
                            className="w-16 text-center text-xs font-semibold px-2 py-1.5 rounded-lg border border-border bg-card text-text focus:outline-none focus:border-primary transition"
                          />
                        );
                      })() : (
                        <span className="font-bold text-text">{item.qty}</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-right align-top">
                      {!readOnly ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate ?? 0}
                          onChange={(e) => handleFieldChange(index, 'rate', Math.max(0, Number(e.target.value)))}
                          className="w-24 text-right font-mono text-xs font-semibold px-2 py-1.5 rounded-lg border border-border bg-card text-text focus:outline-none focus:border-primary transition ml-auto"
                        />
                      ) : (
                        <span className="font-mono font-semibold text-text">₹{Number(item.rate || 0).toFixed(2)}</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-center align-top">
                      {!readOnly ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount || 0}
                          onChange={(e) => handleFieldChange(index, 'discount', Number(e.target.value))}
                          className="w-14 text-center text-xs font-semibold px-2 py-1.5 rounded-lg border border-border bg-card text-text focus:outline-none focus:border-primary transition"
                        />
                      ) : (
                        <span className="text-text">{item.discount || 0}%</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-center align-top">
                      {!readOnly ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.tax ?? 18}
                          onChange={(e) => handleFieldChange(index, 'tax', Number(e.target.value))}
                          className="w-14 text-center text-xs font-semibold px-2 py-1.5 rounded-lg border border-border bg-card text-text focus:outline-none focus:border-primary transition"
                        />
                      ) : (
                        <span className="text-text">{item.tax ?? 18}%</span>
                      )}
                    </td>

                    <td className="px-3.5 py-2.5 text-right align-top font-mono font-bold text-text tabular-nums">
                      ₹{(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {!readOnly && (
                      <td className="px-2 py-2.5 text-center align-top">
                        <button
                          type="button"
                          onClick={() => handleRemove(index)}
                          className="p-1.5 text-muted hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title={isMachine ? "Remove machine and all associated parts" : "Remove item"}
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Action Footer & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-1">
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddItem()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-primary bg-primary-subtle border border-primary/20 hover:bg-primary hover:text-white transition cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5"/>
              Add Line Item
            </button>
            <button
              type="button"
              onClick={() => setIsStockPickerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-400/30 hover:bg-purple-600 hover:text-white transition cursor-pointer shadow-2xs"
            >
              <Boxes className="w-3.5 h-3.5"/>
              Stock Picker
            </button>
          </div>
        )}

        <div className="w-full sm:w-72 sm:ml-auto p-4 rounded-xl border border-border bg-card-alt shadow-xs space-y-2 text-xs">
          <div className="flex items-center justify-between text-text-secondary">
            <span>Subtotal:</span>
            <strong className="font-mono text-text">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
          {totalDiscount > 0 && (
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
              <span>Total Discount:</span>
              <strong className="font-mono">-₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
          )}
          <div className="flex items-center justify-between text-text-secondary">
            <span>Estimated GST / Tax:</span>
            <strong className="font-mono text-text">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between font-bold text-sm text-text">
            <span>Grand Total:</span>
            <strong className="font-mono text-primary">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </div>

      {/* Stock Item Picker Modal for adding any standalone stock component */}
      {isStockPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col text-text">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-text flex items-center gap-2">
                  <Package className="text-purple-600" size={18} /> Add Stock Item to Transaction
                </h3>
                <p className="text-xs text-muted">Search and insert any product or component from active inventory.</p>
              </div>
              <button
                onClick={() => setIsStockPickerOpen(false)}
                className="text-muted hover:text-text cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search by part name or SKU..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-border rounded-xl bg-soft text-text text-xs focus:bg-card focus:outline-none focus:border-primary transition"
                />
              </div>
              <div>
                <select
                  value={pickerCategory}
                  onChange={(e) => setPickerCategory(e.target.value)}
                  className="w-full py-2 px-3 border border-border rounded-xl bg-soft text-text text-xs focus:bg-card focus:outline-none focus:border-primary transition font-medium"
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List of items */}
            <div className="max-h-64 overflow-y-auto border border-border rounded-xl divide-y divide-border bg-card">
              {filteredStockPickerItems.length === 0 ? (
                <div className="py-8 px-4 text-center text-muted text-xs">
                  No inventory items match your search.
                </div>
              ) : (
                filteredStockPickerItems.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => {
                      handleAddItem(it);
                      setIsStockPickerOpen(false);
                      setPickerSearch('');
                    }}
                    className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-soft transition cursor-pointer text-text"
                  >
                    <div>
                      <div className="font-bold text-text flex items-center gap-2">
                        {it.name}
                        {it.itemKind === 'Machine' && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded font-semibold">
                            Machine
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{it.sku}</span>
                        <span>•</span>
                        <span>{it.category}</span>
                        <span>•</span>
                        <span>Rate: ₹{type === 'sales' ? it.sellingPrice : it.costPrice}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-text">
                        {it.availableQty ?? it.stock ?? 0} {it.salesUnit || it.uom || 'Unit'}
                      </span>
                      <div className="text-[10px] text-muted">In Stock</div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsStockPickerOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>);
};
