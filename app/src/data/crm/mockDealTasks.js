import { loadDeals } from '../../services/dealService.js';

// Legacy export kept for compatibility — deals now live in the CRM store
// (`/crm/deals/`) instead of a localStorage blob.
export const INITIAL_DEALS = [];

const SEED_KEY = 'evenmore-crm-demo-deal-tasks-v1';
const TASKS_KEY = 'evenmore-crm-tasks-v1';
const templates = [
  { title: 'Follow-up call', status: 'Open', priority: 'High', days: 1 },
  { title: 'Send quotation', status: 'Completed', priority: 'High', days: -1 },
  { title: 'Product demo', status: 'In Progress', priority: 'Medium', days: 2 },
  { title: 'Final meeting', status: 'Open', priority: 'Medium', days: 4 },
  { title: 'Prepare contract', status: 'Waiting', priority: 'Low', days: 6 },
];

export function seedDemoDealTasks(existing, storage, now = new Date()) {
  const seeded = JSON.parse((storage || {}).getItem?.(SEED_KEY) || '[]');
  if (!Array.isArray(seeded)) return existing;
  let allDeals = [];
  try {
    allDeals = loadDeals() || [];
  } catch {
    return existing;
  }
  const demoIds = new Set(INITIAL_DEALS.map((deal) => deal.id));
  const deals = allDeals.filter((deal) => demoIds.has(deal.id) && !seeded.includes(deal.id));
  if (!deals.length) return existing;
  const ids = new Set(existing.map((task) => task.id));
  const createdAt = now.toISOString();
  const samples = deals.flatMap((deal) => templates.map((template, index) => {
    const due = new Date(now);
    due.setDate(due.getDate() + template.days);
    const dueDate = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;
    const task = {
      id: `demo-${deal.id}-task-${index + 1}`,
      title: template.title,
      dealId: deal.id,
      owner: deal.assignedUser || 'Unassigned',
      dueDate,
      priority: template.priority,
      status: template.status,
      source: 'Deal',
      isDemo: true,
      createdAt,
    };
    if (template.status === 'Completed') {
      task.completedAt = due.toISOString();
      task.completedBy = task.owner;
    }
    return task;
  })).filter((task) => !ids.has(task.id));
  const updated = [...existing, ...samples];
  if (!storage?.getItem || !storage?.setItem) return updated;
  const previous = storage.getItem(TASKS_KEY);
  storage.setItem(TASKS_KEY, JSON.stringify(updated));
  try {
    storage.setItem(SEED_KEY, JSON.stringify([...seeded, ...deals.map((deal) => deal.id)]));
  } catch (error) {
    if (previous === null) storage.removeItem(TASKS_KEY);
    else storage.setItem(TASKS_KEY, previous);
    throw error;
  }
  return updated;
}
