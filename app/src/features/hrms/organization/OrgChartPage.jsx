import { useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import { Users, ChevronDown, ChevronRight, Mail, Phone } from 'lucide-react';

const ORG_TREE = {
  name: 'Sarah Mitchell',
  role: 'Chief Executive Officer',
  department: 'Executive',
  avatar: 'https://i.pravatar.cc/100?img=12',
  email: 'sarah.mitchell@evenmore.com',
  reports: [
    {
      name: 'David Park',
      role: 'VP of Engineering & CRM',
      department: 'Engineering',
      avatar: 'https://i.pravatar.cc/100?img=11',
      email: 'david.park@evenmore.com',
      reports: [
        { name: 'Priya Patel', role: 'Staff Backend Architect', department: 'Engineering', avatar: 'https://i.pravatar.cc/100?img=15', email: 'priya.p@evenmore.com' },
        { name: 'Liam Cooper', role: 'DevOps & Cloud Lead', department: 'Engineering', avatar: 'https://i.pravatar.cc/100?img=20', email: 'liam.c@evenmore.com' },
      ],
    },
    {
      name: 'Ayesha Khan',
      role: 'Head of People & HRMS',
      department: 'HR',
      avatar: 'https://i.pravatar.cc/100?img=5',
      email: 'ayesha.k@evenmore.com',
      reports: [
        { name: 'Tariq Al-Mansoor', role: 'Talent Acquisition Manager', department: 'HR', avatar: 'https://i.pravatar.cc/100?img=17', email: 'tariq.m@evenmore.com' },
      ],
    },
    {
      name: 'James Wilson',
      role: 'Chief Financial Officer',
      department: 'Finance',
      avatar: 'https://i.pravatar.cc/100?img=12',
      email: 'james.w@evenmore.com',
      reports: [
        { name: 'Sofia Reyes', role: 'Senior Financial Analyst', department: 'Finance', avatar: 'https://i.pravatar.cc/100?img=26', email: 'sofia.r@evenmore.com' },
      ],
    },
  ],
};

function NodeCard({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const hasReports = node.reports && node.reports.length > 0;

  return (
    <div style={{ marginLeft: depth > 0 ? 28 : 0, marginTop: 12 }}>
      <div
        style={{
          background: depth === 0 ? 'linear-gradient(135deg, #1f6bff 0%, #1550c6 100%)' : '#ffffff',
          color: depth === 0 ? '#ffffff' : '#0f172a',
          border: depth === 0 ? 'none' : '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 580,
          boxShadow: depth === 0 ? '0 4px 12px rgba(31, 107, 255, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={node.avatar}
            alt={node.name}
            style={{ width: 42, height: 42, borderRadius: '50%', border: depth === 0 ? '2px solid #ffffff' : '1px solid #e2e8f0' }}
          />
          <div>
            <strong style={{ display: 'block', fontSize: 14 }}>{node.name}</strong>
            <span style={{ fontSize: 12, color: depth === 0 ? '#e0e7ff' : '#64748b' }}>
              {node.role} • {node.department}
            </span>
          </div>
        </div>

        {hasReports && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              background: depth === 0 ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
              border: 'none',
              borderRadius: 6,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: depth === 0 ? '#ffffff' : '#64748b',
            }}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
      </div>

      {hasReports && expanded && (
        <div style={{ borderLeft: '2px dashed #cbd5e1', marginLeft: 20 }}>
          {node.reports.map((child) => (
            <NodeCard key={child.name} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrgChartPage() {
  return (
    <div className="feature-page" style={{ padding: '24px 32px' }}>
      <PageHeader
        title="Organization Chart"
        subtitle="Visual representation of company leadership, reporting structures, and departments."
        breadcrumb={[{ label: 'HRMS', to: '/hrms/dashboard' }, { label: 'Organization' }, { label: 'Org Chart' }]}
      />

      <div className="card" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginTop: 20 }}>
        <NodeCard node={ORG_TREE} />
      </div>
    </div>
  );
}

export default OrgChartPage;
