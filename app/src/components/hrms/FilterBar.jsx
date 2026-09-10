import { Search, X } from "lucide-react";

export function FilterBar({ search, onSearch, selects = [], onClear, placeholder = "Search...", children }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-3.5 flex flex-wrap items-center gap-2.5 shadow-2xs">
      {/* Search Input */}
      {onSearch !== undefined && (
        <div className="relative flex-1 min-w-[200px] max-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search || ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full h-9 pl-9 pr-8 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition"
          />
          {search && (
            <button
              onClick={() => onSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-slate-200 grid place-items-center text-slate-400"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* Select Dropdowns */}
      {selects.map((s) => (
        <select
          key={s.label || s.value}
          value={s.value}
          onChange={(e) => s.onChange(e.target.value)}
          className="h-9 pl-3.5 pr-8 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[right_10px_center] bg-no-repeat cursor-pointer focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition"
        >
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}

      {/* Clear Filters Button */}
      {onClear && (
        <button
          onClick={onClear}
          className="h-9 px-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-medium text-slate-700 hover:bg-[#f8fafc] transition shadow-2xs"
        >
          Clear Filters
        </button>
      )}

      {children}
    </div>
  );
}
