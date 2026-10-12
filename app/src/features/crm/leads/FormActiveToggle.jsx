/** Lead Create Form's Active / Inactive switch (and the badge beside it). */
export function FormStatusBadge({ active }) {
  return active ? (
    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">ACTIVE</span>
  ) : (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">INACTIVE</span>
  );
}

export default function FormActiveToggle({ active, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label || (active ? 'Deactivate form' : 'Activate form')}
      title={active ? 'Active: used when creating a lead. Click to deactivate.' : 'Inactive: not used for new leads. Click to activate.'}
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}
