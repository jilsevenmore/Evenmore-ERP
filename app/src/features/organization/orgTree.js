/**
 * orgTree — the Org Chart's hierarchy, from `GET /hrms/org-chart/`.
 *
 *   Organization -> Department -> Department head -> reporting lines
 *
 * The server decides where everyone sits (apps/hrms/org_structure.py): each
 * active employee appears once, in the department they head or belong to,
 * under their reporting manager or the department head. This module only
 * turns that answer into items the chart renders, and filters it for search.
 */

export const ORG_KEY = 'org';

function employeeItem(node, dept) {
  const children = (node.reports || []).map((child) => employeeItem(child, dept));
  return {
    kind: 'emp',
    key: `emp:${node.id}`,
    id: node.id,
    code: node.employeeCode || '',
    name: node.name || '—',
    designation: node.designation || '',
    department: node.department || '',
    chartDepartment: dept.name,
    location: node.location || '',
    email: node.email || '',
    phone: node.phone || '',
    status: node.status || 'Active',
    avatar: node.avatar || '',
    manager: node.manager || '',
    managerId: node.managerId || '',
    relation: node.relation,
    reportCount: children.length,
    children,
  };
}

/** The whole chart as one item tree rooted at the organisation. */
export function buildTree(body) {
  const departments = (body?.departments || []).map((dept) => {
    const children = (dept.nodes || []).map((node) => employeeItem(node, dept));
    return {
      kind: 'dept',
      key: `dept:${dept.id}`,
      id: dept.id,
      name: dept.name,
      code: dept.code || '',
      head: dept.head,
      headStatus: dept.headStatus,
      headElsewhere: Boolean(dept.headElsewhere),
      employeeCount: dept.employeeCount ?? 0,
      teamCount: dept.teamCount ?? 0,
      unassigned: dept.id === 'unassigned',
      reportCount: children.length,
      children,
    };
  });
  return {
    kind: 'org',
    key: ORG_KEY,
    name: 'Organization',
    employeeCount: body?.organization?.employeeCount ?? 0,
    departmentCount: body?.organization?.departmentCount ?? 0,
    reportCount: departments.length,
    children: departments,
  };
}

function walk(item, visit) {
  visit(item);
  item.children.forEach((child) => walk(child, visit));
}

/** Every item, by key — the profile reads a person's full list of reports. */
export function indexTree(root) {
  const byKey = new Map();
  walk(root, (item) => byKey.set(item.key, item));
  return byKey;
}

/** Keys of every item that has children (for "Expand all"). */
export function branchKeys(root) {
  const keys = new Set();
  walk(root, (item) => { if (item.children.length) keys.add(item.key); });
  return keys;
}

/** A head with more direct reports than this opens collapsed. */
const OPEN_HEAD_UP_TO = 6;

/**
 * The opening view: every department open with its head (or top people)
 * showing, and a head's own team when it is small. Deeper reporting lines
 * start closed, so a large company opens compact rather than very wide.
 */
export function defaultExpanded(root) {
  const keys = new Set([ORG_KEY]);
  root.children.forEach((dept) => {
    keys.add(dept.key);
    dept.children.forEach((top) => {
      if (top.relation === 'head' && top.reportCount <= OPEN_HEAD_UP_TO) keys.add(top.key);
    });
  });
  return keys;
}

function includes(value, term) {
  return String(value || '').toLowerCase().includes(term);
}

/** Name, employee ID, designation or department (own or on the chart). */
export function employeeMatches(item, term) {
  return (
    includes(item.name, term) ||
    includes(item.code, term) ||
    includes(item.designation, term) ||
    includes(item.department, term) ||
    includes(item.chartDepartment, term)
  );
}

/**
 * The chart cut down to what matches `term`, with the path to each match.
 * A department whose name matches keeps all its people. Returns the filtered
 * root, the keys to open so every match is visible, and the matched keys.
 */
export function searchTree(root, rawTerm) {
  const term = rawTerm.trim().toLowerCase();
  const expand = new Set([ORG_KEY]);
  const matched = new Set();
  if (!term) return { root, expand: null, matched };

  function keepAll(item) {
    if (item.kind === 'emp' && employeeMatches(item, term)) matched.add(item.key);
    if (item.children.length) expand.add(item.key);
    return { ...item, children: item.children.map(keepAll) };
  }

  function filter(item) {
    if (item.kind === 'dept' && includes(item.name, term)) {
      matched.add(item.key);
      return keepAll(item);
    }
    const kids = item.children.map(filter).filter(Boolean);
    const self = item.kind === 'emp' && employeeMatches(item, term);
    if (self) matched.add(item.key);
    if (!self && !kids.length) return null;
    if (kids.length) expand.add(item.key);
    return { ...item, children: kids };
  }

  const filtered = { ...root, children: root.children.map(filter).filter(Boolean) };
  return { root: filtered, expand, matched };
}

/** Rows for the CSV export, in chart order. */
export function exportRows(root) {
  const rows = [['Employee ID', 'Name', 'Designation', 'Department', 'Location', 'Reports To', 'Email', 'Status']];
  walk(root, (item) => {
    if (item.kind !== 'emp') return;
    rows.push([
      item.code, item.name, item.designation, item.chartDepartment,
      item.location, item.manager || '', item.email, item.status,
    ]);
  });
  return rows;
}
