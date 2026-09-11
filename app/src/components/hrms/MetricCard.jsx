export function MetricCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">{label}</span>
        {Icon && (
          <span className="w-8 h-8 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center text-slate-400">
            <Icon size={15} />
          </span>
        )}
      </div>
      <div className="text-[20px] font-bold text-slate-800 mt-2.5">{value}</div>
      <div className="text-[11.5px] font-medium text-slate-400 mt-0.5">{sub}</div>
    </div>
  );
}
