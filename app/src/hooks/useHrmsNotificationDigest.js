import { useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { useAttendanceStore } from '../stores/attendanceStore';
import { useRecruitmentStore } from '../stores/recruitmentStore';
import { usePayrollStore } from '../stores/payrollStore';

const PENDING_LEAVE_STATUSES = new Set(['Pending Review', 'Delegate Confirmed']);

/** "09 Sep 2026" / "2024-10-11" / "Oct 20, 2024" to Date, or null. */
function parseHrmsDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(String(value).trim());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function daysBetween(target, now) {
  const a = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

/**
 * People alerts for the topbar bell — leave and attendance approvals waiting on
 * HR, interviews landing this week, offers about to lapse and an unclosed
 * payroll run. Same { items, counts } contract as the CRM and PMS digests.
 */
function buildHrmsDigest({
  leaves,
  attendanceRequests,
  attendanceRecords,
  interviews,
  offers,
  payrollStep,
  payrollPeriod,
  now,
}) {
  const items = [];

  const pendingLeaves = (leaves || []).filter((l) => PENDING_LEAVE_STATUSES.has(String(l.status || '')));
  if (pendingLeaves.length > 0) {
    const first = pendingLeaves[0];
    const days = Number(first.days) || 1;
    items.push({
      id: 'hrms-pending-leaves',
      title: `${pendingLeaves.length} leave request${pendingLeaves.length > 1 ? 's' : ''} awaiting approval`,
      subtitle: first.employee || 'Employee',
      desc: `${first.type || 'Leave'} • ${days} day${days > 1 ? 's' : ''} from ${first.from || 'TBD'}`,
      time: 'Approval',
      tone: 'today',
      unread: true,
      path: '/hrms/leave',
    });
  }

  const pendingRequests = (attendanceRequests || []).filter((r) => String(r.status || '') === 'Pending');
  if (pendingRequests.length > 0) {
    const first = pendingRequests[0];
    items.push({
      id: 'hrms-attendance-requests',
      title: `${pendingRequests.length} attendance request${pendingRequests.length > 1 ? 's' : ''} pending`,
      subtitle: first.employee || 'Employee',
      desc: `${first.type || 'Regularization'} • ${first.reason || 'Awaiting HR review'}`,
      time: 'Pending',
      tone: 'today',
      unread: true,
      path: '/hrms/attendance/requests',
    });
  }

  // Roster gaps on the most recent logged day. Anchoring to the latest date in
  // the register rather than to "today" keeps the alert meaningful on days
  // attendance has not been marked yet.
  const datedRecords = (attendanceRecords || [])
    .map((r) => ({ record: r, date: parseHrmsDate(r.date) }))
    .filter((row) => row.date);
  const latestDate = datedRecords.reduce(
    (latest, row) => (!latest || row.date.getTime() > latest.getTime() ? row.date : latest),
    null
  );
  if (latestDate) {
    const dayRecords = datedRecords.filter((row) => sameDay(row.date, latestDate));
    const absentees = dayRecords.filter((row) => String(row.record.status || '') === 'Absent');
    const latecomers = dayRecords.filter((row) => String(row.record.status || '') === 'Late');
    if (absentees.length > 0 || latecomers.length > 0) {
      const isToday = sameDay(latestDate, now);
      const label = isToday ? 'today' : String(dayRecords[0].record.date);
      items.push({
        id: 'hrms-attendance-exceptions',
        title: `${absentees.length} absent, ${latecomers.length} late on ${label}`,
        subtitle: 'Daily attendance',
        desc: 'Unapproved absences and late check-ins on the latest biometric log.',
        time: isToday ? 'Today' : 'Last log',
        tone: isToday && absentees.length > 0 ? 'overdue' : isToday ? 'today' : 'upcoming',
        unread: isToday,
        path: '/hrms/attendance',
      });
    }
  }

  const upcomingInterviews = (interviews || [])
    .filter((i) => String(i.status || '') === 'Scheduled')
    .map((i) => ({ interview: i, date: parseHrmsDate(i.date) }))
    .filter((row) => row.date && daysBetween(row.date, now) >= 0 && daysBetween(row.date, now) <= 7)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  if (upcomingInterviews.length > 0) {
    const { interview, date } = upcomingInterviews[0];
    const days = daysBetween(date, now);
    items.push({
      id: 'hrms-upcoming-interviews',
      title: `${upcomingInterviews.length} interview${upcomingInterviews.length > 1 ? 's' : ''} scheduled this week`,
      subtitle: interview.candidateName || 'Candidate',
      desc: `${interview.type || 'Interview'} with ${interview.interviewer || 'panel'} at ${interview.start || 'TBD'}`,
      time: days === 0 ? 'Today' : `${days}d`,
      tone: days === 0 ? 'today' : 'upcoming',
      unread: days <= 1,
      path: '/hrms/recruitment/interviews',
    });
  }

  const pendingOffers = (offers || []).filter((o) => String(o.status || '') === 'Pending');
  if (pendingOffers.length > 0) {
    const expiring = pendingOffers
      .map((o) => ({ offer: o, expiry: parseHrmsDate(o.expiry) }))
      .filter((row) => row.expiry)
      .sort((a, b) => a.expiry.getTime() - b.expiry.getTime())[0];
    const expiryDays = expiring ? daysBetween(expiring.expiry, now) : null;
    const lapsed = expiryDays != null && expiryDays < 0;
    items.push({
      id: 'hrms-pending-offers',
      title: `${pendingOffers.length} offer${pendingOffers.length > 1 ? 's' : ''} awaiting candidate response`,
      subtitle: expiring?.offer?.candidateName || pendingOffers[0].candidateName || 'Candidate',
      desc: lapsed
        ? `Offer validity lapsed ${Math.abs(expiryDays)}d ago — re-issue or close it out.`
        : `${expiring?.offer?.position || 'Role'} • expires ${expiring?.offer?.expiry || 'soon'}`,
      time: lapsed ? 'Expired' : 'Offer',
      tone: lapsed ? 'overdue' : 'upcoming',
      unread: true,
      path: '/hrms/recruitment/offers',
    });
  }

  if (payrollStep && payrollStep !== 'Paid') {
    items.push({
      id: 'hrms-payroll-open',
      title: `Payroll ${payrollPeriod || 'run'} not disbursed`,
      subtitle: 'Payroll workflow',
      desc: `Current stage: ${payrollStep}. Complete the run to release salaries.`,
      time: payrollStep,
      tone: 'upcoming',
      unread: payrollStep === 'Approved',
      path: '/hrms/payroll',
    });
  }

  const overdue = items.filter((i) => i.tone === 'overdue').length;
  const today = items.filter((i) => i.tone === 'today').length;

  return {
    items,
    counts: {
      unread: items.filter((i) => i.unread).length,
      urgent: overdue + today,
      overdue,
      today,
      total: items.length,
    },
  };
}

export function useHrmsNotificationDigest() {
  const leaves = useAppStore((s) => s.leaves);
  const attendanceRequests = useAttendanceStore((s) => s.requests);
  const attendanceRecords = useAttendanceStore((s) => s.records);
  const interviews = useRecruitmentStore((s) => s.interviews);
  const offers = useRecruitmentStore((s) => s.offers);
  const payrollStep = usePayrollStore((s) => s.workflowStep);
  const payrollPeriod = usePayrollStore((s) => s.currentPeriod);

  return useMemo(
    () => buildHrmsDigest({
      leaves,
      attendanceRequests,
      attendanceRecords,
      interviews,
      offers,
      payrollStep,
      payrollPeriod,
      now: new Date(),
    }),
    [leaves, attendanceRequests, attendanceRecords, interviews, offers, payrollStep, payrollPeriod]
  );
}
