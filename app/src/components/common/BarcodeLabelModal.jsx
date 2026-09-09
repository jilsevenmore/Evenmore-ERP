import React from 'react';
import { X, Printer, Tag } from 'lucide-react';
export const BarcodeLabelModal = ({ item, onClose }) => {
    if (!item)
        return null;
    return (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl text-xs flex flex-col overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600"/>
            <div>
              <h3 className="font-bold text-base text-[#1F2E4A]">Warehouse Shelf Tag & Barcode</h3>
              <p className="text-[11px] text-slate-500">Ready-to-print standard bin label</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={18}/>
          </button>
        </div>

        {/* Printable Label Card */}
        <div className="py-6 flex justify-center">
          <div className="border-2 border-dashed border-slate-400 rounded-xl p-4 bg-white shadow-sm w-72 space-y-3 print:border-black text-center">
            <div className="border-b border-slate-200 pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Horizon Warehouse Asset</span>
              <h4 className="font-bold text-sm text-slate-900 truncate">{item.name}</h4>
              <p className="text-[11px] text-slate-500">Category: {item.category || 'General Hardware'}</p>
            </div>

            {/* Barcode Graphic */}
            <div className="py-1 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-0.5 h-12 w-48 bg-white px-2">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1].map((w, i) => (<div key={i} className="bg-slate-900 h-full" style={{ width: `${w * 1.5}px` }}/>))}
              </div>
              <span className="font-mono font-bold text-xs tracking-widest text-slate-800 mt-1">
                *{item.sku}*
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-left bg-slate-50 p-2 rounded-lg">
              <div>
                <span className="text-[9px] text-slate-400 font-semibold block uppercase">Bin Location</span>
                <strong className="font-mono text-[11px] text-blue-900">
                  {item.category === 'Electronics' ? 'BIN-E04-R2' : 'BIN-A12-R1'}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 font-semibold block uppercase">Selling Price</span>
                <strong className="font-mono text-[11px] text-emerald-800">
                  ${item.sellingPrice.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <span className="text-[11px] text-slate-500">
            Current Stock: <strong>{item.stock || 0} {item.unit || 'pcs'}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="px-3.5 py-1.5 bg-[#1F2E4A] hover:bg-[#152033] text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs">
              <Printer size={13}/> Print Shelf Tag
            </button>
            <button onClick={onClose} className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-medium cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>);
};
