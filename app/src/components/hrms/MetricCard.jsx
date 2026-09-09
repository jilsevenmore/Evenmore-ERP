export function MetricCard({ label, value, sub, icon: Icon }) {
  return <div className="bg-white border border-bdr rounded-xl p-4 shadow-sm hover:shadow-subtle transition">
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-muted">{label}</span>
        <span className="w-8 h-8 rounded-lg bg-off border border-bdr grid place-items-center text-muted"><Icon size={14} /></span>
      </div>
      <div className="text-[22px] font-bold text-slate mt-2">{value}</div>
      <div className="text-[11px] text-muted mt-1">{sub}</div>
    </div>;
}
