import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckSquare,
  MoreHorizontal,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  UserRoundPlus,
} from "lucide-react";
import { dashboardData } from '../../../data/crm/dashboardData';

const ICONS = {
  users: Users,
  building: Building2,
  "check-square": CheckSquare,
  bars: BarChart3,
};

const ACTIVITY_ICONS = {
  lead: UserPlus,
  deal: BriefcaseBusiness,
  task: CheckSquare,
  team: UserRoundPlus,
};

const CARD_STYLES = {
  blue: { bg: "linear-gradient(180deg, #f0f6ff 0%, #e7f0ff 100%)", fg: "#1f6bff" },
  green: { bg: "linear-gradient(180deg, #ebfbf5 0%, #def8ed 100%)", fg: "#1bb878" },
  pink: { bg: "linear-gradient(180deg, #fff0f7 0%, #ffe6f1 100%)", fg: "#ff4f8f" },
  amber: { bg: "linear-gradient(180deg, #fff7e8 0%, #ffefcf 100%)", fg: "#ef9b06" },
  purple: { bg: "linear-gradient(180deg, #f5ebff 0%, #ecdafe 100%)", fg: "#9b51e0" },
};

function buildChart(values, width, height, padding) {
  const max = Math.max(...values);
  const min = 0;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = values.map((value, index) => {
    const x = padding + (index * innerWidth) / (values.length - 1);
    const normalized = (value - min) / (max - min || 1);
    const y = height - padding - normalized * innerHeight;
    return { x, y, value };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points.at(-1)?.x ?? width - padding} ${height - padding} L ${points[0]?.x ?? padding} ${height - padding} Z`;

  return { points, linePath, areaPath, max };
}

function polarToCartesian(cx, cy, radius, angle) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export default function DashboardView() {
  const overview = dashboardData.leadsOverview;
  const chart = buildChart(
    overview.series.map((item) => item.value),
    620,
    280,
    28,
  );

  const totalTasks = dashboardData.taskStatus.reduce((sum, item) => sum + item.value, 0);
  const completedTasks = dashboardData.taskStatus.find((item) => item.key === "done")?.value ?? 0;
  const completedPct = Math.round((completedTasks / totalTasks) * 100);

  let currentAngle = 0;
  const donutSegments = dashboardData.taskStatus.map((item) => {
    const angle = (item.value / totalTasks) * 360;
    const segment = {
      ...item,
      path: describeArc(110, 110, 72, currentAngle, currentAngle + angle),
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <section className="dashboard-view">
      <div className="dashboard-stats">
        {dashboardData.stats.map((stat) => {
          const Icon = ICONS[stat.icon] ?? Users;
          const style = CARD_STYLES[stat.tone] ?? CARD_STYLES.blue;
          const TrendIcon = stat.trendDirection === "down" ? TrendingDown : TrendingUp;
          const trendClass = stat.trendDirection === "down" ? " down" : "";

          return (
            <article key={stat.label} className="dashboard-stat">
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-icon" style={{ background: style.bg, color: style.fg }}>
                  <Icon size={24} />
                </span>
                <div className="dashboard-stat-copy">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              </div>
              <small className={`dashboard-stat-trend${trendClass}`}>
                <TrendIcon size={14} />
                <b>{stat.trend}</b>
                <em>{stat.note}</em>
              </small>
            </article>
          );
        })}
      </div>

      <div className="dashboard-main-grid">
        <section className="dashboard-panel dashboard-chart-card">
          <div className="panel-head panel-head-spread">
            <div>
              <h3>Leads Overview</h3>
              <p>{overview.headline}</p>
            </div>
            <button type="button" className="dashboard-filter-btn">
              {overview.period}
            </button>
          </div>

          <div className="chart-wrap">
            <svg viewBox="0 0 620 280" className="chart-svg" aria-label="Leads overview chart">
              <defs>
                <linearGradient id="chartArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2b7cff" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#2b7cff" stopOpacity="0.04" />
                </linearGradient>
              </defs>

              {[0, 1, 2, 3].map((line) => {
                const y = 28 + line * 56;
                return <line key={line} x1="28" y1={y} x2="592" y2={y} className="chart-grid-line" />;
              })}

              <path d={chart.areaPath} fill="url(#chartArea)" />
              <path d={chart.linePath} className="chart-line-path" />

              {chart.points.map((point) => (
                <g key={`${point.x}-${point.y}`}>
                  <circle cx={point.x} cy={point.y} r="6" fill="#1f6bff" />
                  <circle cx={point.x} cy={point.y} r="3" fill="#ffffff" />
                </g>
              ))}

              {overview.series.map((item, index) => (
                <text
                  key={item.month}
                  x={chart.points[index]?.x}
                  y="268"
                  textAnchor="middle"
                  className="chart-axis-label"
                >
                  {item.month}
                </text>
              ))}
            </svg>
          </div>

          <p className="chart-note">{overview.summary}</p>
        </section>

        <section className="dashboard-panel dashboard-donut-card">
          <div className="panel-head panel-head-spread">
            <div>
              <h3>Task Status</h3>
              <p>How current work is distributed across the team.</p>
            </div>
            <button type="button" className="icon-ghost" aria-label="More task status options">
              <MoreHorizontal size={18} />
            </button>
          </div>

          <div className="donut-layout">
            <div className="donut-chart">
              <svg viewBox="0 0 220 220" aria-label="Task status donut chart">
                <circle cx="110" cy="110" r="72" className="donut-track" />
                {donutSegments.map((item) => (
                  <path
                    key={item.key}
                    d={item.path}
                    stroke={item.color}
                    strokeWidth="22"
                    strokeLinecap="round"
                    fill="none"
                  />
                ))}
              </svg>
              <div className="donut-center">
                <strong>{completedPct}%</strong>
                <span>Completed</span>
              </div>
            </div>

            <div className="donut-legend">
              {dashboardData.taskStatus.map((item) => (
                <div key={item.key} className="legend-row">
                  <div className="legend-meta">
                    <span className="legend-dot" style={{ backgroundColor: item.color }} />
                    <span>{item.label}</span>
                  </div>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-panel dashboard-activity-card">
          <div className="panel-head panel-head-spread">
            <div>
              <h3>Recent Activity</h3>
              <p>Latest movements across leads, deals, and tasks.</p>
            </div>
            <button type="button" className="view-all-link">View All</button>
          </div>

          <div className="activity-list">
            {dashboardData.recentActivity.map((item) => {
              const Icon = ACTIVITY_ICONS[item.icon] ?? UserPlus;
              const style = CARD_STYLES[item.tone] ?? CARD_STYLES.blue;

              return (
                <div key={`${item.title}-${item.person}`} className="activity-item">
                  <span className="activity-badge" style={{ background: style.bg, color: style.fg }}>
                    <Icon size={18} />
                  </span>
                  <div className="activity-copy">
                    <strong>{item.title}</strong>
                    <p>{item.person}</p>
                  </div>
                  <time>{item.time}</time>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
