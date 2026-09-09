import { Search, X } from "lucide-react";
export function FilterBar({ search, onSearch, selects, onClear, children }) {
  return <div className="bg-white border border-bdr rounded-xl p-4 flex flex-wrap gap-2 items-center shadow-sm">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search..." className="h-9 pl-8 pr-8 bg-off border border-bdr rounded-xl text-[13px] placeholder:text-muted focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 min-w-[180px]" />
        {search && <button onClick={() => onSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-white grid place-items-center"><X size={12} /></button>}
      </div>
      {selects.map((s) => <select key={s.label} value={s.value} onChange={(e) => s.onChange(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px] focus:outline-none focus:border-navy">
          {s.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>)}
      <button onClick={onClear} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px] font-medium hover:bg-off">Clear Filters</button>
      {children}
    </div>;
}
