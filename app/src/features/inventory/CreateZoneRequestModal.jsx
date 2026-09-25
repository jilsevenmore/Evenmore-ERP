import React, { useState } from 'react';
import { X, Check, GitPullRequest } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAppStore } from '../../stores/appStore';
export const CreateZoneRequestModal = ({ isOpen, onClose, onSubmit, }) => {
    const { items = [], calculateItemStock } = useERP();
    const currentUser = useAppStore((s) => s.currentUser);
    const [requestedBy, setRequestedBy] = useState(currentUser?.name || '');
    const [zone, setZone] = useState('Zone A');
    const [product, setProduct] = useState('');
    const [sku, setSku] = useState('');
    const [qty, setQty] = useState(1);
    const [notes, setNotes] = useState('');
    if (!isOpen)
        return null;
    const productOptions = items
        .filter((i) => i.name)
        .map((i) => ({ id: i.id, name: i.name, sku: i.sku || '' }));
    const selectedProduct = productOptions.find((p) => p.name === product) || productOptions[0] || null;
    const handleProductChange = (prodName) => {
        setProduct(prodName);
        const found = productOptions.find((p) => p.name === prodName);
        setSku(found?.sku || '');
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedProduct) {
            alert('Add inventory items before raising a zone stock request.');
            return;
        }
        const requester = (requestedBy || currentUser?.name || '').trim();
        const initials = requester
            .split(' ')
            .filter(Boolean)
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        }) + `, ${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
        const reqNum = `#REQ-${Date.now().toString().slice(-5)}`;
        let warehouseStock = 0;
        try {
            warehouseStock = Number(calculateItemStock?.(selectedProduct.id)?.available) || 0;
        }
        catch {
            warehouseStock = 0;
        }
        onSubmit({
            requestNumber: reqNum,
            requestedBy: requester,
            avatarInitials: initials,
            product: selectedProduct.name,
            sku: sku || selectedProduct.sku,
            qty: Number(qty) || 1,
            zone,
            targetSector: zone,
            date: formattedDate,
            submittedAt: `Submitted ${formattedDate}`,
            status: 'Requested',
            notes: notes.trim(),
            warehouseStock,
            managerSignoffNeeded: zone === 'Zone A' || zone === 'Zone D',
        });
        onClose();
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-white rounded-lg border border-[#CED4DA] shadow-xl w-full max-w-lg max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="px-4 sm:px-6 py-4 border-b border-[#CED4DA] flex items-center justify-between gap-2 lg:gap-0 bg-[#F8F9FA]">
          <div className="flex items-center gap-2.5 min-w-0 lg:min-w-auto">
            <div className="w-8 h-8 rounded bg-[#0CB1AC]/10 text-[#0CB1AC] flex items-center justify-center">
              <GitPullRequest className="w-4 h-4"/>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1F2E4A]">New Zone Stock Request</h3>
              <p className="text-xs text-[#5a6062]">Transfer inventory from main warehouse to zone</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#767c7e] hover:text-[#1F2E4A] p-1 rounded-md transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-sm text-[#2d3335]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F2E4A] uppercase tracking-wider mb-1">
                Requested By
              </label>
              <input type="text" required value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} placeholder="Requester name" className="w-full border border-[#CED4DA] rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0CB1AC] bg-white"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F2E4A] uppercase tracking-wider mb-1">
                Destination Zone
              </label>
              <select value={zone} onChange={(e) => setZone(e.target.value)} className="w-full border border-[#CED4DA] rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0CB1AC] bg-white">
                <option value="Zone A">Zone A (Power / Generators)</option>
                <option value="Zone B">Zone B (Machining / Lathe)</option>
                <option value="Zone C">Zone C (Robotics Assembly)</option>
                <option value="Zone D">Zone D (Cleanroom ISO 5)</option>
                <option value="Zone F">Zone F (Sorting Conveyor)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1F2E4A] uppercase tracking-wider mb-1">
                Product
              </label>
              <select value={selectedProduct?.name || ''} onChange={(e) => handleProductChange(e.target.value)} disabled={productOptions.length === 0} className="w-full border border-[#CED4DA] rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0CB1AC] bg-white">
                {productOptions.length === 0 && <option value="">No inventory items yet</option>}
                {productOptions.map((p) => (<option key={p.id || p.name} value={p.name}>
                    {p.name}{p.sku ? ` (${p.sku})` : ''}
                  </option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F2E4A] uppercase tracking-wider mb-1">
                Quantity
              </label>
              <input type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-full border border-[#CED4DA] rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0CB1AC]"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2E4A] uppercase tracking-wider mb-1">
              Operational Justification / Notes
            </label>
            <textarea rows={3} placeholder="e.g. Urgent replacement needed for primary backup generators in Zone A..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-[#CED4DA] rounded p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#0CB1AC]"/>
          </div>

          <div className="pt-3 border-t border-[#CED4DA] flex flex-wrap lg:flex-nowrap items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#CED4DA] text-[#343A40] rounded text-xs font-medium hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-[#0CB1AC] hover:bg-[#0aa09c] text-white rounded text-xs font-medium flex items-center gap-1.5 shadow-sm">
              <Check className="w-3.5 h-3.5"/>
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>);
};
