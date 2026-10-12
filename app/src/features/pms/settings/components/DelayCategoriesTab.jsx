import React, { useState } from 'react';
import { AlertCircle, Plus, Trash2, RotateCcw, Tag, HelpCircle, Check } from 'lucide-react';
import { DEFAULT_DELAY_CATEGORIES } from '../../../../stores/pmsStore';
import { Button } from '../../../../components/ui/Button';

export function DelayCategoriesTab({ draft, onChange }) {
  const categories =
    Array.isArray(draft.delayCategories) && draft.delayCategories.length > 0
      ? draft.delayCategories
      : DEFAULT_DELAY_CATEGORIES;

  const [newCat, setNewCat] = useState('');
  const [error, setError] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setError('Category already exists.');
      return;
    }
    onChange({ delayCategories: [...categories, trimmed] });
    setNewCat('');
    setError('');
  };

  const handleRemove = (catToRemove) => {
    if (categories.length <= 1) {
      setError('At least one root-cause delay category is required.');
      return;
    }
    onChange({ delayCategories: categories.filter((c) => c !== catToRemove) });
    setError('');
  };

  const handleReset = () => {
    onChange({ delayCategories: DEFAULT_DELAY_CATEGORIES });
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Intro info card */}
      <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Tag size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Delay Root-Cause Categories</h3>
              <p className="text-xs text-slate-500">
                Categorization options presented in the Delay Center when logging delayed or overdue stages.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw size={13} />
            Restore Standard Categories
          </button>
        </div>
      </section>

      {/* Main Categories Management Card */}
      <section className="rounded-xl border border-[#dce5f4] bg-white p-6 shadow-2xs space-y-6">
        <div>
          <h4 className="text-xs font-bold text-slate-800 mb-2">Configured Categories ({categories.length})</h4>
          <p className="text-xs text-slate-500 mb-4">
            These root-cause reasons populate the Pareto Chart in PMS Reports and attribute delay accountability.
          </p>

          <div className="flex flex-wrap gap-2.5">
            {categories.map((cat) => (
              <div
                key={cat}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium group hover:border-slate-300 transition-all"
              >
                <span>{cat}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(cat)}
                  title={`Remove ${cat}`}
                  className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Category Form */}
        <div className="pt-4 border-t border-slate-100">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="text"
                value={newCat}
                onChange={(e) => {
                  setNewCat(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter new root cause category (e.g. Subcontractor Delay)..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#dce5f4] bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
              {error && <p className="text-[11px] text-rose-500 font-semibold mt-1">{error}</p>}
            </div>
            <Button icon={Plus} size="sm" type="submit" className="w-full sm:w-auto">
              Add Category
            </Button>
          </form>
        </div>

        {/* Preview of dropdown */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-600 space-y-2">
          <span className="font-bold text-slate-700 block">Preview in Delay Resolution Modal:</span>
          <div className="w-full max-w-sm">
            <select
              disabled
              className="w-full px-3 py-2 rounded-lg border border-[#dce5f4] bg-white text-slate-700 font-medium"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-400">
            Selected categories are stored with the stage's immutable delay log.
          </p>
        </div>
      </section>
    </div>
  );
}

export default DelayCategoriesTab;
