export function MetricCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-bold tracking-widest uppercase text-muted">{label}</span>
        {Icon && (
          <span className="w-8 h-8 rounded-xl bg-soft border border-border flex items-center justify-center text-muted">
            <Icon size={15} />
          </span>
        )}
      </div>
      <div className="text-[20px] font-bold text-text mt-2.5">{value}</div>
      <div className="text-[11.5px] font-medium text-muted mt-0.5">{sub}</div>
    </div>
  );
}

