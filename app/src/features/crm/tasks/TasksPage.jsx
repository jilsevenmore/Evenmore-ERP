import { useState, useMemo } from 'react';
import { Plus, CheckCircle, Clock, AlertCircle, Calendar, User, Search, Filter } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import StatCard from '../../../components/ui/StatCard';
import Modal from '../../../components/ui/Modal';
import TaskForm from './TaskForm';

const INITIAL_TASKS = [
  { id: 'TSK-001', title: 'Follow up on Enterprise Quote', lead: 'Sarah Jenkins (Acme Corp)', owner: 'Alex Rivera', dueDate: '2026-09-12', priority: 'High', status: 'In Progress' },
  { id: 'TSK-002', title: 'Schedule product demo call', lead: 'Michael Chang (TechFlow)', owner: 'Elena Rostova', dueDate: '2026-09-10', priority: 'Urgent', status: 'Open' },
  { id: 'TSK-003', title: 'Send revised contract terms', lead: 'David Ross (Global Logistics)', owner: 'Alex Rivera', dueDate: '2026-09-15', priority: 'Medium', status: 'Waiting' },
  { id: 'TSK-004', title: 'Prepare onboarding requirements', lead: 'Amanda Lee (Apex Innovations)', owner: 'Sarah Chen', dueDate: '2026-09-08', priority: 'High', status: 'Completed' },
  { id: 'TSK-005', title: 'Review custom billing setup', lead: 'Robert Miller (Vanguard Systems)', owner: 'Elena Rostova', dueDate: '2026-09-18', priority: 'Low', status: 'Open' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState('All');
  const [search, setSearch] = useState('');

  const stats = [
    { label: 'Total Tasks', value: tasks.length.toString(), icon: 'file', tone: 'blue' },
    { label: 'Pending', value: tasks.filter(t => t.status !== 'Completed').length.toString(), icon: 'clock', tone: 'amber' },
    { label: 'Urgent/High', value: tasks.filter(t => t.priority === 'High' || t.priority === 'Urgent').length.toString(), icon: 'filter', tone: 'pink' },
    { label: 'Completed', value: tasks.filter(t => t.status === 'Completed').length.toString(), icon: 'chart', tone: 'green' },
  ];

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesStatus = activeStatus === 'All' || t.status === activeStatus;
      const matchesSearch = !search.trim() || t.title.toLowerCase().includes(search.toLowerCase()) || t.lead.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [tasks, activeStatus, search]);

  const columns = [
    { key: 'title', label: 'Task Title', render: (val, row) => (
      <div>
        <strong style={{ display: 'block', color: '#0f172a' }}>{val}</strong>
        <span style={{ fontSize: 12, color: '#64748b' }}>{row.lead}</span>
      </div>
    )},
    { key: 'owner', label: 'Assigned To', render: (val) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <User size={14} color="#64748b" /> {val}
      </span>
    )},
    { key: 'dueDate', label: 'Due Date', render: (val) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
        <Calendar size={13} /> {val}
      </span>
    )},
    { key: 'priority', label: 'Priority', render: (val) => {
      const color = val === 'Urgent' ? 'badge-red' : val === 'High' ? 'badge-orange' : val === 'Medium' ? 'badge-blue' : 'badge-gray';
      return <span className={`badge ${color}`}>{val}</span>;
    }},
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="feature-page" style={{ padding: '24px 32px' }}>
      <PageHeader
        title="CRM Tasks"
        subtitle="Track follow-ups, scheduled calls, demos, and sales milestones."
        breadcrumb={[{ label: 'CRM', to: '/crm/leads' }, { label: 'Tasks' }]}
        actions={
          <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Create Task
          </button>
        }
      />

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, margin: '20px 0 24px' }}>
        {stats.map(s => <StatCard key={s.label} stat={s} />)}
      </div>

      <div className="card" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['All', 'Open', 'In Progress', 'Waiting', 'Completed'].map(status => (
              <button
                key={status}
                type="button"
                className={`tab-btn ${activeStatus === status ? 'active' : ''}`}
                onClick={() => setActiveStatus(status)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: activeStatus === status ? '#1f6bff' : '#e2e8f0',
                  background: activeStatus === status ? '#f0f6ff' : '#ffffff',
                  color: activeStatus === status ? '#1f6bff' : '#64748b',
                  cursor: 'pointer',
                }}
              >
                {status}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: 260 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search tasks or leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
              }}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredTasks}
          rowKey="id"
          emptyMessage="No tasks found matching your filters."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Task"
        size="lg"
      >
        <TaskForm
          onBack={() => setIsModalOpen(false)}
          onAddNote={() => {}}
        />
      </Modal>
    </div>
  );
}
