/**
 * hrmsSync — the HRMS half of the API contract (api.md §11).
 *
 * HRMS is the widest module: people, leave, attendance, payroll, recruitment,
 * performance, training, policies and assets, spread over nine stores that each
 * used to seed themselves from `data/hrms/mocks/`. They all want the same four
 * verbs against different paths, so the registry below is the whole mapping and
 * `createSync` supplies the transport.
 *
 * Fields come off the wire in the shape the screens read, so most readers only
 * convert dates (`YYYY-MM-DD` on the wire, `DD/MM/YYYY` on screen) and add the
 * one or two aliases a table column expects.
 */
import { createSync, compact, asText, isBackendEnabled, isServerId, describeError } from './resourceSync';
import { api } from './api';
import { formatDateDDMMYYYY, toISODate } from '../utils/dateUtils';

export { isBackendEnabled, isServerId, describeError };

function isoOut(value) {
  if (!value) return undefined;
  return toISODate(value) || undefined;
}

function displayIn(value) {
  return value ? formatDateDDMMYYYY(value) : value;
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Pass the row through, marking it as the server's. */
const plain = (path, extra = {}) => ({
  path,
  toApi: (row) => compact({ ...row, id: undefined, _synced: undefined, _pending: undefined }),
  fromApi: (row) => ({ ...row, _synced: true }),
  ...extra,
});

/** A row whose `date`-ish fields need reformatting for the tables. */
const dated = (path, fields, extra = {}) => ({
  path,
  toApi: (row) => {
    const payload = { ...row, id: undefined, _synced: undefined, _pending: undefined };
    fields.forEach((f) => { if (payload[f] !== undefined) payload[f] = isoOut(payload[f]); });
    return compact(payload);
  },
  fromApi: (row) => {
    const out = { ...row, _synced: true };
    fields.forEach((f) => { if (out[f]) out[f] = displayIn(out[f]); });
    return out;
  },
  ...extra,
});

export const HRMS_RESOURCES = {
  // ── people ────────────────────────────────────────────────────────────────
  employees: {
    path: '/hrms/employees/',
    // Also the PATCH body, so a key is sent only when the caller set it: a
    // status change must not reset the joining date or re-offer a login.
    // (The server defaults the joining date to today on create.)
    toApi: (e) => {
      const joinIso = isoOut(e.joining || e.joiningDate || e.doj);
      return compact({
        name: e.name,
        email: e.email || undefined,
        phone: e.phone || undefined,
        employeeCode: e.employeeCode || e.empId || undefined,
        departmentId: e.departmentId || undefined,
        department: e.department || undefined,
        designationId: e.designationId || undefined,
        designation: e.designation || e.role || undefined,
        // null clears the reporting manager; absent leaves it alone.
        managerId: e.managerId !== undefined ? (e.managerId || null) : (e.reportingManagerId || undefined),
        locationId: e.locationId || undefined,
        location: e.location || undefined,
        joining: joinIso,
        joiningDate: joinIso,
        dateOfBirth: isoOut(e.dateOfBirth || e.dob),
        gender: e.gender || undefined,
        employmentType: e.employmentType || undefined,
        status: e.status || undefined,
        avatar: e.avatar || undefined,
        createUserAccount: e.createUserAccount,
        password: e.password || undefined,
        userPassword: e.userPassword || e.password || undefined,
        roleId: e.roleId || undefined,
      });
    },
    fromApi: (row) => {
      const joinDisplay = displayIn(row.joining || row.joiningDate);
      return {
        ...asText(row, [
          'name', 'email', 'phone', 'department', 'designation',
          'employmentType', 'gender', 'location', 'status',
        ]),
        // Tables read `empId` and `role`; the API calls them `employeeCode` and
        // `designation`.
        empId: row.employeeCode || row.empId || '',
        employeeCode: row.employeeCode || row.empId || '',
        role: row.designation || row.role || '',
        joining: joinDisplay,
        doj: joinDisplay,
        joiningDate: joinDisplay,
        _synced: true,
      };
    },
  },

  // ── organization ──────────────────────────────────────────────────────────
  // The Organization section's units. Each body carries only the keys the
  // caller set (so it doubles as a partial PATCH); counts, head name and
  // department name are read-only and never sent.
  departments: {
    path: '/hrms/departments/',
    toApi: (d) => compact({
      name: d.name?.trim() || undefined,
      code: d.code ?? undefined,
      headEmployeeId: d.headEmployeeId !== undefined ? (d.headEmployeeId || null) : undefined,
      parentId: d.parentId !== undefined ? (d.parentId || null) : undefined,
      budget: d.budget !== undefined ? (d.budget === '' || d.budget === null ? null : num(d.budget)) : undefined,
      status: d.status || undefined,
      description: d.description ?? undefined,
    }),
    fromApi: (row) => ({
      ...row,
      name: row.name || '',
      head: row.head || '',
      employees: row.employees ?? 0,
      teams: row.teams ?? 0,
      openRoles: row.openRoles ?? 0,
      _synced: true,
    }),
  },
  // The screens say "title" and "L4"; the API stores `name` and 4.
  designations: {
    path: '/hrms/designations/',
    toApi: (d) => {
      const level = d.level === undefined ? undefined : Number(String(d.level).replace(/^L/i, ''));
      return compact({
        name: (d.name ?? d.title)?.trim() || undefined,
        level: level === undefined ? undefined : (Number.isFinite(level) ? level : null),
        departmentId: d.departmentId !== undefined ? (d.departmentId || null) : undefined,
      });
    },
    fromApi: (row) => ({
      ...row,
      title: row.name || '',
      level: row.level ? `L${row.level}` : '',
      department: row.department || '',
      employees: row.employees ?? 0,
      _synced: true,
    }),
  },
  locations: {
    path: '/hrms/locations/',
    toApi: (l) => compact({
      name: l.name?.trim() || undefined,
      type: l.type || undefined,
      address: l.address ?? undefined,
      timezone: l.timezone ?? undefined,
    }),
    fromApi: (row) => ({
      ...row,
      name: row.name || '',
      address: row.address || '',
      employees: row.employees ?? 0,
      _synced: true,
    }),
  },
  teams: plain('/hrms/teams/'),
  holidays: dated('/hrms/holidays/', ['date']),

  // ── leave ─────────────────────────────────────────────────────────────────
  leaves: {
    path: '/hrms/leave/',
    toApi: (l) => compact({
      employeeId: l.employeeId || undefined,
      leaveTypeId: l.leaveTypeId || undefined,
      fromDate: isoOut(l.fromDate || l.from),
      toDate: isoOut(l.toDate || l.to),
      days: l.days !== undefined ? num(l.days) : undefined,
      reason: l.reason || undefined,
      status: l.status || undefined,
      delegateId: l.delegateId || undefined,
    }),
    fromApi: (row) => ({
      ...asText(row, ['reason', 'status', 'type', 'employeeName', 'delegate']),
      from: displayIn(row.fromDate),
      to: displayIn(row.toDate),
      fromDate: displayIn(row.fromDate),
      toDate: displayIn(row.toDate),
      employee: row.employeeName || row.employee || '',
      _synced: true,
    }),
  },
  leaveTypes: plain('/hrms/leave/types/'),
  leaveEncashments: dated('/hrms/leave/encashments/', ['requestDate']),
  compOffs: dated('/hrms/comp-offs/', ['workedDate', 'expiryDate']),

  // ── attendance ────────────────────────────────────────────────────────────
  attendance: {
    path: '/hrms/attendance/',
    toApi: (a) => compact({
      employeeId: a.employeeId || undefined,
      date: isoOut(a.date),
      checkIn: a.checkIn || undefined,
      checkOut: a.checkOut || undefined,
      status: a.status || undefined,
      workLocation: a.workLocation || undefined,
      notes: a.notes || undefined,
    }),
    fromApi: (row) => ({
      ...asText(row, ['status', 'workLocation', 'notes', 'checkIn', 'checkOut', 'employeeName']),
      id: row.id,
      date: displayIn(row.date),
      rawDate: row.date,
      name: row.name || row.employeeName || row.employee || '',
      employee: row.employeeName || row.name || row.employee || '',
      employeeName: row.employeeName || row.name || row.employee || '',
      employeeId: row.employeeId || row.empId || row.employeeCode || row.id,
      employeeCode: row.employeeCode || row.empId || '',
      empId: row.employeeCode || row.empId || '',
      dept: row.dept || row.department || '',
      department: row.department || row.dept || '',
      shift: row.shift || 'General',
      firstPunch: row.firstPunch || row.checkIn,
      lastPunch: row.lastPunch || (row.status !== 'Absent' ? row.checkOut : null),
      workingHours: row.workingHours !== undefined && row.workingHours !== null ? Number(row.workingHours) : (Number(row.hours) || 0),
      hours: row.workingHours !== undefined && row.workingHours !== null ? Number(row.workingHours) : (Number(row.hours) || 0),
      lateMinutes: Number(row.lateMinutes) || 0,
      overtimeHours: Number(row.overtimeHours) || 0,
      formattedWorkingHours: row.formattedWorkingHours,
      lateDisplay: row.lateDisplay,
      overtimeDisplay: row.overtimeDisplay,
      punches: row.punches || [],
      _synced: true,
    }),
  },
  attendanceRegularizations: {
    path: '/hrms/attendance/regularizations/',
    toApi: (r) => compact({
      employeeId: r.employeeId || undefined,
      date: isoOut(r.date || r.work_date),
      requestedCheckIn: r.requestedCheckIn || r.reqIn || r.curIn || undefined,
      requestedCheckOut: r.requestedCheckOut || r.reqOut || r.curOut || undefined,
      requestedStatus: r.requestedStatus || undefined,
      reason: r.reason || undefined,
    }),
    fromApi: (row) => {
      const reasonStr = String(row.reason || '');
      let inferredType = 'Regularization';
      if (reasonStr.toLowerCase().includes('[half day') || reasonStr.toLowerCase().includes('half day')) {
        inferredType = 'Half Day';
      } else if (reasonStr.toLowerCase().includes('early') || reasonStr.toLowerCase().includes('clock-out')) {
        inferredType = 'Early Clock-Out';
      } else if (reasonStr.toLowerCase().includes('[work from home') || reasonStr.toLowerCase().includes('wfh')) {
        inferredType = 'Work From Home (WFH)';
      } else if (reasonStr.toLowerCase().includes('[requirement:') || reasonStr.toLowerCase().includes('general request')) {
        inferredType = 'General Request';
      }

      const formatTime = (dtStr) => {
        if (!dtStr) return null;
        try {
          const d = new Date(dtStr);
          if (isNaN(d.getTime())) {
            const match = String(dtStr).match(/\d{2}:\d{2}/);
            return match ? match[0] : null;
          }
          return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch {
          return null;
        }
      };

      const reqInTime = formatTime(row.requestedCheckIn) || row.reqIn || '09:00';
      const reqOutTime = formatTime(row.requestedCheckOut) || row.reqOut || '18:30';

      return {
        id: row.id,
        employee: row.employeeName || row.employee || 'Employee',
        employeeId: row.employeeId || row.employee,
        type: row.type || inferredType,
        date: displayIn(row.date || row.work_date),
        rawDate: row.date || row.work_date,
        currentIn: row.currentIn || row.curIn || '09:00',
        currentOut: row.currentOut || row.curOut || '18:30',
        requestedIn: reqInTime,
        requestedOut: reqOutTime,
        reason: row.reason || 'Attendance request',
        requestedBy: row.employeeName || row.requestedBy || row.employee || 'Employee',
        submitted: row.submitted || 'Recent',
        status: row.status || 'Pending',
        remark: row.remark || '',
        _synced: true,
      };
    },
  },

  // ── payroll ───────────────────────────────────────────────────────────────
  payroll: {
    path: '/hrms/payroll/',
    toApi: (p) => compact({
      employeeId: p.employeeId || undefined,
      month: p.month || undefined,
      year: p.year !== undefined ? num(p.year) : undefined,
      status: p.status || undefined,
    }),
    fromApi: (row) => ({ ...row, _synced: true }),
    // Payslips are generated, not created by hand.
    omitOnUpdate: ['employeeId', 'month', 'year'],
  },
  salaryStructures: plain('/hrms/payroll/salary-structures/'),
  advances: dated('/hrms/payroll/advances/', ['requestDate', 'date']),

  // ── recruitment ───────────────────────────────────────────────────────────
  jobs: dated('/hrms/jobs/', ['postedDate', 'closingDate']),
  candidates: dated('/hrms/candidates/', ['appliedDate']),
  applications: dated('/hrms/applications/', ['appliedDate']),
  interviews: dated('/hrms/interviews/', ['scheduledDate', 'date']),
  offers: dated('/hrms/offers/', ['offerDate', 'joiningDate']),
  onboarding: dated('/hrms/onboarding/', ['startDate']),
  // recruitmentQuestions: plain('/hrms/recruitment/questions/'),  // Hidden: Screening Questions out of scope; backend route commented out

  // ── performance ───────────────────────────────────────────────────────────
  appraisals: dated('/hrms/performance/appraisals/', ['dueDate', 'completedDate']),
  cycles: dated('/hrms/performance/cycles/', ['startDate', 'endDate']),
  goals: dated('/hrms/performance/goals/', ['dueDate']),
  indicators: plain('/hrms/performance/indicators/'),
  kpis: plain('/hrms/performance/kpis/'),

  // ── training ──────────────────────────────────────────────────────────────
  trainings: dated('/hrms/trainings/', ['startDate', 'endDate']),
  trainers: plain('/hrms/trainers/'),

  // ── policies ──────────────────────────────────────────────────────────────
  policies: dated('/hrms/policies/', ['effectiveDate', 'publishedDate']),
  policyCategories: plain('/hrms/policy-categories/'),

  assets: {
    path: '/hrms/assets/',
    toApi: (a) => compact({
      name: a.name,
      categoryId: a.categoryId || undefined,
      employeeId: a.employeeId || undefined,
      serialNumber: a.serialNumber || undefined,
      condition: a.condition || undefined,
      status: a.status || undefined,
      location: a.location || undefined,
      notes: a.notes || undefined,
      purchaseDate: isoOut(a.purchaseDate),
      warrantyExpiry: isoOut(a.warrantyExpiry),
      purchaseCost: (a.purchaseCost != null && a.purchaseCost !== '—' && !isNaN(Number(String(a.purchaseCost).replace(/[^0-9.-]+/g, ''))))
        ? Number(String(a.purchaseCost).replace(/[^0-9.-]+/g, ''))
        : null,
    }),
    fromApi: (row) => ({
      ...row,
      purchaseDate: displayIn(row.purchaseDate),
      warrantyExpiry: displayIn(row.warrantyExpiry),
      _synced: true,
    }),
  },
  assetCategories: plain('/hrms/asset-categories/'),
  assetRequests: {
    path: '/hrms/asset-requests/',
    toApi: (r) => compact({
      employeeId: r.employeeId || undefined,
      categoryId: r.categoryId || undefined,
      justification: r.justification || r.reason || (r.assetName ? `${r.assetName}${r.reason ? ` - ${r.reason}` : ''}` : undefined),
      status: r.status || undefined,
    }),
    fromApi: (row) => ({
      ...row,
      id: row.id,
      category: row.categoryName || row.category || 'Hardware',
      reason: row.justification || '',
      assetName: row.justification ? (row.justification.split(' - ')[0] || row.justification) : 'Requested Item',
      requestedDate: row.created_at ? row.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      _synced: true,
    }),
  },

  // ── employee lifecycle ────────────────────────────────────────────────────
  resignations: dated('/hrms/resignations/', ['resignationDate', 'lastWorkingDay']),
  terminations: dated('/hrms/terminations/', ['terminationDate']),
  complaints: dated('/hrms/complaints/', ['raisedDate']),
  documents: dated('/hrms/documents/', ['uploadedDate', 'expiryDate']),
  approvalChains: plain('/hrms/approval-chains/'),
  calendarEvents: dated('/hrms/calendar/events/', ['startDate', 'endDate', 'date']),
};

export const hrmsSync = createSync(HRMS_RESOURCES, { label: 'hrmsSync' });

/** What the HRMS shell loads on sign-in. The rest load per screen. */
export const HRMS_CORE_KEYS = [
  'employees', 'departments', 'designations', 'locations', 'teams', 'holidays',
  'leaves', 'leaveTypes', 'attendance', 'payroll',
];

/** The wider set, for screens that need their own collection. */
export const HRMS_EXTRA_KEYS = Object.keys(HRMS_RESOURCES)
  .filter((key) => !HRMS_CORE_KEYS.includes(key));

// ── singletons and aggregates ───────────────────────────────────────────────

async function read(path, query, label) {
  if (!isBackendEnabled()) return null;
  try {
    return await api.get(path, query ? { query } : undefined);
  } catch (err) {
    console.warn(`[hrmsSync] ${label} failed:`, err?.message || err);
    return null;
  }
}

export const pullHrmsSettings = () => read('/hrms/settings/', null, 'settings');
export const pullWorkingDays = () => read('/hrms/working-days/', null, 'working days');
export const pullFlexibility = () => read('/hrms/attendance/flexibility/', null, 'flexibility');
export const pullAttendanceSummary = (query) => read('/hrms/attendance/summary/', query, 'attendance summary');
export const pullAttendanceAudit = (query) => read('/hrms/attendance/audit/', query, 'attendance audit');
export const pullLeaveBalances = (query) => read('/hrms/leave/balances/', query, 'leave balances');
export const pullOrgChart = () => read('/hrms/org-chart/', null, 'org chart');
export const pullHrmsDashboard = (query) => read('/hrms/dashboard/', query, 'dashboard');
export const pullPayrollSummary = (query) => read('/hrms/payroll/summary/', query, 'payroll summary');
export const pullRecruitmentDashboard = () => read('/hrms/recruitment/dashboard/', null, 'recruitment dashboard');
export const pullRecruitmentFunnel = () => read('/hrms/recruitment/funnel/', null, 'recruitment funnel');
export const pullTrainingDashboard = () => read('/hrms/trainings/dashboard/', null, 'training dashboard');
export const pullTrainingFunnel = () => read('/hrms/trainings/funnel/', null, 'training funnel');
export const pullPerformanceDashboard = () => read('/hrms/performance/dashboard/', null, 'performance dashboard');
export const pullIndividualAttendance = (employeeId, query) =>
  read(`/hrms/attendance/individual/${employeeId}/`, query, 'individual attendance');

export async function pushHrmsSettings(settings) {
  if (!isBackendEnabled()) return null;
  return api.put('/hrms/settings/', settings);
}

export async function pushWorkingDays(config) {
  if (!isBackendEnabled()) return null;
  return api.put('/hrms/working-days/', config);
}

export async function pushFlexibility(config) {
  if (!isBackendEnabled()) return null;
  return api.put('/hrms/attendance/flexibility/', config);
}

export async function bulkAttendance(rows) {
  if (!isBackendEnabled()) return null;
  return api.post('/hrms/attendance/bulk/', { records: rows });
}

// ── record actions ──────────────────────────────────────────────────────────

export const approvePayroll = (id) => hrmsSync.act('payroll', id, 'approve', {});
export const markPayrollPaid = (id, payload = {}) => hrmsSync.act('payroll', id, 'mark-paid', payload);
export const cancelLeave = (id, payload = {}) => hrmsSync.act('leaves', id, 'cancel', payload);
export const publishJob = (id) => hrmsSync.act('jobs', id, 'publish', {});
export const assignAsset = (id, payload) => hrmsSync.act('assets', id, 'assign', payload);
export const returnAsset = (id, payload = {}) => hrmsSync.act('assets', id, 'return', payload);
export const acknowledgePolicy = (id, payload = {}) => hrmsSync.act('policies', id, 'acknowledge', payload);
export const approvePolicy = (id, payload = {}) => hrmsSync.act('policies', id, 'approve', payload);
export const archivePolicy = (id, payload = {}) => hrmsSync.act('policies', id, 'archive', payload);
export const submitPolicyForApproval = (id, payload = {}) =>
  hrmsSync.act('policies', id, 'submit-for-approval', payload);
export const terminateEmployee = (id, payload) => hrmsSync.act('employees', id, 'terminate', payload);
export const assignTrainer = (id, payload) => hrmsSync.act('trainings', id, 'assign-trainer', payload);
export const evaluateTraining = (id, payload) => hrmsSync.act('trainings', id, 'evaluate', payload);
export const addTrainingParticipants = (id, payload) => hrmsSync.act('trainings', id, 'participants', payload);

/**
 * The last rows the server gave us, per collection.
 *
 * `writeThrough` diffs against this rather than asking its caller for the
 * previous array, which is what lets the stores keep their existing actions:
 * they hand over the collection as they now want it and this works out which
 * rows are new, changed or gone.
 */
const snapshots = new Map();

/** Load a collection and remember it as the baseline for later writes. */
export async function pullTracked(key, query) {
  const rows = await hrmsSync.pull(key, query);
  if (rows) snapshots.set(key, rows);
  return rows;
}

/**
 * Write a whole collection back after a store mutated it locally.
 *
 * The HRMS stores each kept their rows in `localStorage` and saved the array
 * wholesale. Rather than rewrite every one of their actions, they now hand the
 * new array here: rows the server has not seen are created, rows that changed
 * are patched, rows that disappeared are deleted, and the fresh collection
 * becomes the next baseline.
 */
export function writeThrough(key, next = []) {
  if (!isBackendEnabled()) return Promise.resolve(next);

  const previous = snapshots.get(key) || [];
  const before = new Map(previous.map((row) => [String(row?.id), row]));
  const after = new Set(next.map((row) => String(row?.id)));
  const work = [];

  next.forEach((row) => {
    if (!row) return;
    const existing = before.get(String(row.id));
    if (!existing) {
      work.push(hrmsSync.create(key, row));
    } else if (isServerId(row.id) && JSON.stringify(existing) !== JSON.stringify(row)) {
      work.push(hrmsSync.update(key, row.id, row));
    }
  });

  previous.forEach((row) => {
    if (row && !after.has(String(row.id)) && isServerId(row.id)) {
      work.push(hrmsSync.remove(key, row.id));
    }
  });

  if (work.length === 0) {
    snapshots.set(key, next);
    return Promise.resolve(next);
  }

  return Promise.all(work)
    .then(() => pullTracked(key))
    .then((rows) => rows || next)
    .catch((err) => {
      console.warn(`[hrmsSync] ${key} not saved:`, describeError(err));
      return next;
    });
}

/** One employee's payslip history, for the "My Salary" tab. */
export async function pullPayrollFor(employeeId) {
  if (!employeeId) return null;
  return hrmsSync.pull('payroll', { employeeId });
}

export async function processPayroll(payload) {
  if (!isBackendEnabled()) return null;
  return api.post('/hrms/payroll/process/', payload);
}

/** Get current user / employee punch state today. */
export async function pullTodayPunch(employeeId = null) {
  if (!isBackendEnabled()) return null;
  const params = employeeId ? { employeeId } : {};
  return api.get('/hrms/attendance/today/', params);
}

/** Record a Punch In or Punch Out event. */
export async function recordPunch({
  punchType,
  remark,
  notes,
  employeeId,
  source = 'web',
  earlyReason,
  requestRegularization,
}) {
  if (!isBackendEnabled()) return null;
  return api.post('/hrms/attendance/punch/', {
    punchType,
    remark: remark || notes,
    source,
    employeeId: employeeId || undefined,
    earlyReason: earlyReason || undefined,
    requestRegularization: Boolean(requestRegularization),
  });
}

/** Get punch timeline for a given employee and date. */
export async function pullPunchTimeline(employeeId, date) {
  if (!isBackendEnabled()) return [];
  return api.get('/hrms/attendance/punch-timeline/', {
    employeeId,
    date: isoOut(date) || date,
  });
}

/** HR / Admin punch correction. */
export async function submitPunchCorrection(payload) {
  if (!isBackendEnabled()) return null;
  return api.post('/hrms/attendance/correct-punch/', payload);
}

export default hrmsSync;
