import { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';

export default function InfoBanner({ storageKey, title, text }) {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(storageKey) !== '0';
    } catch {
      return true;
    }
  });

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(storageKey, '0');
    } catch { }
  }

  return (
    <div className="flex items-start gap-3 bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3 mb-4">
      <span className="w-8 h-8 rounded-full bg-blue-100/70 text-blue-500 grid place-items-center shrink-0">
        <Lightbulb size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{text}</p>
      </div>
      <button type="button" onClick={dismiss} className="text-slate-400 hover:text-slate-600 p-1 shrink-0" aria-label="Dismiss">
        <X size={15} />
      </button>
    </div>
  );
}
