import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Package, ShoppingCart, Boxes, AlertTriangle, Search, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Button } from '../ui/Button';

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

    // Create a new blank line item
    const handleAddItem = (defaultItem = null) => {
        const itemToUse = defaultItem || masterItems.find(i => i.itemKind !== 'Machine') || masterItems[0];
        const unitRate = itemToUse
            ? type === 'sales'
                ? itemToUse.sellingPrice
                : itemToUse.costPrice
            : 100;

        const lineId = `li-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const newItem = {
            id: lineId,
            itemId: itemToUse?.id || '',
            sku: itemToUse?.sku || '',
            itemSku: itemToUse?.sku || '',
            name: itemToUse?.name || 'New Line Item',
            description: itemToUse?.name || 'New Line Item',
            qty: 1,
            rate: unitRate,
            discount: 0,
            tax: 18,
            amount: Math.round(unitRate * 1.18 * 100) / 100,
            isUserModified: false,
        };

        // If the added item is a Machine, expand its BOM
        const machineBom = itemParts.filter(ip => ip.parentItemId === itemToUse?.id);
        if (machineBom.length > 0) {
            const childLines = machineBom.map((bp) => {
                const childItem = masterItems.find((mi) => mi.id === bp.partItemId);
                const childRate = childItem
                  ? (type === 'sales' ? childItem.sellingPrice : childItem.costPrice)
                  : 0;
                const childQty = (bp.requiredQty || 1) * 1;
                const childGross = childQty * childRate;
                const childAmount = Math.round(childGross * 1.18 * 100) / 100;

                return {
                    id: `li-bom-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
                    itemId: childItem ? childItem.id : bp.partItemId,
                    sku: childItem ? childItem.sku : '',
                    itemSku: childItem ? childItem.sku : '',
                    name: childItem ? childItem.name : `Component for ${itemToUse.name}`,
                    description: childItem
                      ? `${childItem.name} (BOM Part for ${itemToUse.sku})`
                      : `BOM Part for ${itemToUse.sku}`,
                    qty: childQty,
                    rate: childRate,
                    discount: 0,
                    tax: 18,
                    amount: childAmount,
                    isBomGenerated: true,
                    isBomPart: true,
                    isUserModified: false,
                    parentLineId: lineId,
                    bomSourceItemId: itemToUse.id,
                    parentSku: itemToUse.sku,
                };
            });
            onChange([...items, newItem, ...childLines]);
        } else {
            onChange([...items, newItem]);
        }
    };

    const handleItemSelect = (index, itemId) => {
        const selected = masterItems.find((i) => i.id === itemId);
        if (!selected) return;

        const unitRate = type === 'sales' ? selected.sellingPrice : selected.costPrice;
        const current = items[index];
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
            // If it had children previously, clear old relations
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
                  ? (type === 'sales' ? childItem.sellingPrice : childItem.costPrice)
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

        // Rule E3 & E8: If machine quantity changed, scale untouched generated BOM lines
        if (field === 'qty' && qty > 0) {
            const parentLineId = current.id;
            // Find untouched children linked to this machine
            updated.forEach((line, lineIdx) => {
                if (line.parentLineId === parentLineId && !line.isUserModified) {
                    // Compute required ratio per machine
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
        // Rule E5: Deleting a line (whether machine or individual BOM part) removes only that line
        const updated = items.filter((_, i) => i !== index);
        onChange(updated);
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

    const subtotal = items.reduce((acc, it) => acc + (it.qty * it.rate), 0);
    const totalDiscount = items.reduce((acc, it) => acc + (it.qty * it.rate * ((it.discount || 0) / 100)), 0);
    const totalTax = items.reduce((acc, it) => {
        const grossAfterDisc = (it.qty * it.rate) * (1 - (it.discount || 0) / 100);
        return acc + (grossAfterDisc * ((it.tax || 0) / 100));
    }, 0);
    const grandTotal = Math.round((subtotal - totalDiscount + totalTax) * 100) / 100;

    return (<div className="erp-lines">
      <div className="erp-lines-table">
        <table>
          <thead>
            <tr>
              <th>Item / Description</th>
              <th className="ctr">Available Stock</th>
              <th className="ctr">Qty</th>
              <th className="num">Unit Rate (₹)</th>
              <th className="ctr">Disc (%)</th>
              <th className="ctr">GST (%)</th>
              <th className="num">Amount (₹)</th>
              {!readOnly && <th className="ctr"></th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (<tr>
                <td colSpan={readOnly ? 7 : 8} className="erp-lines-empty">
                  <Package className="w-8 h-8 mx-auto mb-2" size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  No line items added yet. Click &quot;Add Line Item&quot; or &quot;Add Stock Item&quot; below.
                </td>
              </tr>) : (items.map((item, index) => {
            const masterObj = masterItems.find(mi => mi.id === item.itemId || mi.sku === item.sku);
            const availableStock = masterObj ? (masterObj.availableQty ?? masterObj.stock ?? 0) : 0;
            const deficit = Math.max(0, (item.qty || 1) - availableStock);
            const isShortage = deficit > 0;

            return (<tr key={item.id || index} className={`${item.isBomPart ? 'is-bom' : isShortage ? 'is-short' : ''}`}>
                    <td>
                      {!readOnly ? (<>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {item.isBomPart && (
                              <span
                                className="erp-bom-tag"
                                title={`Auto-generated from Machine BOM (${item.parentSku || 'Machine'})`}
                              >
                                <Boxes size={11} /> BOM Part
                              </span>
                            )}
                            <select
                              value={item.itemId || ''}
                              onChange={(e) => handleItemSelect(index, e.target.value)}
                              className="erp-line-select"
                            >
                              <option value="">-- Select Master Item --</option>
                              {masterItems.map((mi) => (
                                <option key={mi.id} value={mi.id}>
                                  [{mi.sku}] {mi.name} {mi.itemKind === 'Machine' ? '(Machine)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          <input
                            type="text"
                            placeholder="Custom line description / serial notes..."
                            value={item.description || ''}
                            onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                            className="erp-line-desc"
                          />
                        </>) : (<div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {item.isBomPart && (
                              <span className="erp-bom-tag">
                                <Boxes size={11} /> BOM Part
                              </span>
                            )}
                            <p className="font-bold text-slate-800">{item.name || item.description}</p>
                          </div>
                          {item.itemSku && (<span className="text-[10px] text-slate-400 font-mono">
                              SKU: {item.itemSku}
                            </span>)}
                        </div>)}
                    </td>
                    <td className="ctr">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <span className={`erp-stock-pill ${
                          availableStock <= 0
                            ? 'out'
                            : isShortage
                            ? 'low'
                            : 'ok'
                        }`}>
                          {availableStock} Avail
                        </span>
                        {isShortage && (
                          <span className="erp-short-flag">
                            <AlertTriangle size={10} /> Short: {deficit}
                          </span>
                        )}
                        {isShortage && onRequestPO && !readOnly && (
                          <button
                            type="button"
                            onClick={() => onRequestPO(item, deficit)}
                            className="erp-po-btn"
                            title={`Shortage of ${deficit} units. Click to raise an Auto PO to supplier.`}
                          >
                            <ShoppingCart size={10}/> +PO ({deficit})
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="ctr">
                      {!readOnly ? (() => {
                        const unit = (masterObj?.salesUnit || masterObj?.uom || masterObj?.unit || 'Nos').toLowerCase();
                        const allowsDecimal = ['kg', 'mtr', 'meter', 'ltr', 'liter', 'ton'].includes(unit);
                        return (
                          <input
                            type="number"
                            min={allowsDecimal ? "0.01" : "1"}
                            step={allowsDecimal ? "0.01" : "1"}
                            value={item.qty}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (isNaN(val) || val <= 0) {
                                handleFieldChange(index, 'qty', allowsDecimal ? 0.01 : 1);
                              } else {
                                handleFieldChange(index, 'qty', allowsDecimal ? val : Math.floor(val));
                              }
                            }}
                            className="erp-line-input ctr"
                          />
                        );
                      })() : (
                        <span className="font-bold">{item.qty}</span>
                      )}
                    </td>
                    <td className="num">
                      {!readOnly ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleFieldChange(index, 'rate', Math.max(0, Number(e.target.value)))}
                          className="erp-line-input num"
                        />
                      ) : (
                        <span className="font-mono font-semibold">₹{Number(item.rate || 0).toFixed(2)}</span>
                      )}
                    </td>
                    <td className="ctr">
                      {!readOnly ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount || 0}
                          onChange={(e) => handleFieldChange(index, 'discount', Number(e.target.value))}
                          className="erp-line-input ctr"
                        />
                      ) : (
                        <span>{item.discount || 0}%</span>
                      )}
                    </td>
                    <td className="ctr">
                      {!readOnly ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.tax ?? 18}
                          onChange={(e) => handleFieldChange(index, 'tax', Number(e.target.value))}
                          className="erp-line-input ctr"
                        />
                      ) : (
                        <span>{item.tax ?? 18}%</span>
                      )}
                    </td>
                    <td className="num" style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      ₹{(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {!readOnly && (
                      <td className="ctr">
                        <button
                          type="button"
                          onClick={() => handleRemove(index)}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </td>
                    )}
                  </tr>);
        }))}
          </tbody>
        </table>
      </div>

      {/* Action Footer & Summary */}
      <div className="erp-lines-footer">
        {!readOnly && (
          <div className="erp-lines-actions">
            <button
              type="button"
              onClick={() => handleAddItem()}
              className="erp-lines-btn primary"
            >
              <Plus className="w-4 h-4"/>
              Add Line Item
            </button>
            <button
              type="button"
              onClick={() => setIsStockPickerOpen(true)}
              className="erp-lines-btn plum"
            >
              <Boxes className="w-4 h-4"/>
              + Add Stock Item
            </button>
          </div>
        )}

        <div className="erp-lines-total">
          <div className="row">
            <span>Subtotal:</span>
            <strong>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
          {totalDiscount > 0 && (
            <div className="row" style={{ color: '#b45309' }}>
              <span>Total Discount:</span>
              <strong>-₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
          )}
          <div className="row">
            <span>Estimated GST / Tax:</span>
            <strong>₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
          <div className="grand">
            <span>Grand Total:</span>
            <strong>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </div>

      {/* Stock Item Picker Modal for adding any standalone stock component */}
      {isStockPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[#CED4DA] shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#1F2E4A] flex items-center gap-2">
                  <Package className="text-purple-600" size={18} /> Add Stock Item to Transaction
                </h3>
                <p className="text-xs text-slate-500">Search and insert any product or component from active inventory.</p>
              </div>
              <button
                onClick={() => setIsStockPickerOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by part name or SKU..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <select
                  value={pickerCategory}
                  onChange={(e) => setPickerCategory(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg bg-slate-50 text-xs focus:bg-white focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List of items */}
            <div className="erp-picker-list">
              {filteredStockPickerItems.length === 0 ? (
                <div className="erp-lines-empty">
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
                    className="erp-picker-row"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {it.name}
                        {it.itemKind === 'Machine' && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-semibold">
                            Machine
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{it.sku}</span>
                        <span>•</span>
                        <span>{it.category}</span>
                        <span>•</span>
                        <span>Rate: ₹{type === 'sales' ? it.sellingPrice : it.costPrice}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-slate-800">
                        {it.availableQty ?? it.stock ?? 0} {it.salesUnit || it.uom || 'Unit'}
                      </span>
                      <div className="text-[10px] text-slate-400">In Stock</div>
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
