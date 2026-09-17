const STORAGE_KEY = 'crm-task-allocation-v1';

export const DEPARTMENTS = ['Sales and Marketing', 'HR Department'];
export const EMPLOYEES = [
  { name: 'test', department: 'Sales and Marketing' },
  { name: 'Jayesh Nair', department: 'HR Department' },
  { name: 'Anuska', department: 'Sales and Marketing' },
  { name: 'Jenil Khachariya', department: 'Sales and Marketing' },
  { name: 'Vruti Lakhani', department: 'HR Department' },
  { name: 'Hemanshi Ramani', department: 'HR Department' },
  { name: 'company', department: 'HR Department' },
];
export const PRIORITIES = ['Low', 'Medium', 'High'];
export const STATUSES = ['Pending', 'In Progress', 'Completed'];

function seedTasks() {
  return [
    {
      id: 'ta-1',
      title: 'gffvgh',
      department: 'Sales and Marketing',
      assignee: 'test',
      assignedBy: 'test',
      priority: 'Medium',
      deadline: null,
      status: 'In Progress',
      description: '',
      fileName: '',
      audit: [
        { text: 'test changed status to In Progress', at: '2026-09-07T10:49:00' },
        { text: 'test assigned this to test', at: '2026-08-26T11:35:00' },
      ],
    },
    {
      id: 'ta-2',
      title: 'xyz',
      department: 'Sales and Marketing',
      assignee: 'test',
      assignedBy: 'test',
      priority: 'Medium',
      deadline: '2026-08-25T15:49:00',
      status: 'Completed',
      description: '',
      fileName: '',
      audit: [{ text: 'test assigned this to test', at: '2026-08-25T15:00:00' }],
    },
    {
      id: 'ta-3',
      title: 'demo unit coll',
      department: 'HR Department',
      assignee: 'Jayesh Nair',
      assignedBy: 'company',
      priority: 'High',
      deadline: '2026-08-25T14:55:00',
      status: 'Pending',
      description: '',
      fileName: '',
      audit: [{ text: 'company assigned this to Jayesh Nair', at: '2026-08-25T14:00:00' }],
    },
    {
      id: 'ta-4',
      title: 'Prepare Purchase Orders',
      department: 'HR Department',
      assignee: 'Jayesh Nair',
      assignedBy: 'Vruti Lakhani',
      priority: 'High',
      deadline: '2026-08-19T18:00:00',
      status: 'Completed',
      description: '',
      fileName: '',
      audit: [{ text: 'Vruti Lakhani assigned this to Jayesh Nair', at: '2026-08-19T17:00:00' }],
    },
    {
      id: 'ta-5',
      title: 'KINDLLY DO THESE MANY CALLS',
      department: 'Sales and Marketing',
      assignee: 'Anuska',
      assignedBy: 'Hemanshi Ramani',
      priority: 'High',
      deadline: '2026-08-19T14:36:00',
      status: 'Completed',
      description: '',
      fileName: '',
      audit: [{ text: 'Hemanshi Ramani assigned this to Anuska', at: '2026-08-19T13:00:00' }],
    },
    {
      id: 'ta-6',
      title: 'SEND ME THE SALARY SLIP',
      department: 'HR Department',
      assignee: 'Jayesh Nair',
      assignedBy: 'Hemanshi Ramani',
      priority: 'High',
      deadline: '2026-08-19T13:34:00',
      status: 'Pending',
      description: '',
      fileName: '',
      audit: [{ text: 'Hemanshi Ramani assigned this to Jayesh Nair', at: '2026-08-19T13:00:00' }],
    },
  ];
}

export function loadAllocationTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedTasks();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return seedTasks();
    return parsed;
  } catch {
    return seedTasks();
  }
}

export function saveAllocationTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new Event('crm:data-updated'));
  } catch {
    return;
  }
}

export function formatDeadline(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hh}:${mm}`;
}

export function formatAuditDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hh}:${mm}`;
}
