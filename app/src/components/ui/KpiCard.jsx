const tones = {
  blue: { bg: 'rgba(31, 107, 255, 0.12)', fg: '#1f6bff' },
  emerald: { bg: 'rgba(27, 184, 120, 0.12)', fg: '#1bb878' },
  green: { bg: 'rgba(27, 184, 120, 0.12)', fg: '#1bb878' },
  rose: { bg: 'rgba(255, 79, 143, 0.12)', fg: '#ff4f8f' },
  pink: { bg: 'rgba(255, 79, 143, 0.12)', fg: '#ff4f8f' },
  purple: { bg: 'rgba(155, 81, 224, 0.12)', fg: '#9b51e0' },
  amber: { bg: 'rgba(239, 155, 6, 0.12)', fg: '#ef9b06' },
  orange: { bg: 'rgba(239, 155, 6, 0.12)', fg: '#ef9b06' },
  sky: { bg: 'rgba(31, 107, 255, 0.12)', fg: '#1f6bff' },
  teal: { bg: 'rgba(12, 177, 172, 0.12)', fg: '#0cb1ac' },
};

export default function KpiCard({ label, value, icon: Icon, symbol, tone = 'blue', children }) {
  const toneStyle = tones[tone] || tones.blue;

  return (
    <article className="stat-card">
      <span className="stat-badge" style={{ background: toneStyle.bg, color: toneStyle.fg }}>
        {Icon ? <Icon size={20} strokeWidth={2} aria-hidden="true" /> : <span className="font-bold text-base">{symbol}</span>}
      </span>
      <div className="stat-body">
        <strong className="stat-num" title={String(value)}>{value}</strong>
        <span className="stat-label" title={label}>{label}</span>
        {children}
      </div>
    </article>
  );
}
