import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Calendar,
  Clock,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Clock3,
  XCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  LogIn,
  LogOut,
  Loader2,
  FileText,
  Briefcase,
  ChevronRight,
  Eye,
  Plane,
  ShieldCheck,
  Building2,
  Sparkles,
  Tag,
  CalendarDays,
  Layers,
  Info,
  Home,
  Sun,
  Sunset,
  AlertTriangle,
  HelpCircle,
  Send,
  ClipboardList,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { useAssetStore } from '../../stores/assetStore';
import { api } from '../../services/api';
import { hrmsSync } from '../../services/hrmsSync';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/hrms/Badge';
import { EarlyPunchOutModal } from '../hrms/attendance/components/EarlyPunchOutModal';
import { usePunchActions } from '../hrms/attendance/usePunchActions';

const todayISO = () => new Date().toISOString().slice(0, 10);

function formatDate(isoStr) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return isoStr;
  }
}

export default function EmployeePortal() {
  const currentUser = useAppStore((s) => s.currentUser);
  const showToast = useAppStore((s) => s.showToast || s.setToast);
  const leaves = useAppStore((s) => s.leaves || []);
  const addLeave = useAppStore((s) => s.addLeave);
  const employees = useAppStore((s) => s.employees || []);

  const {
    todayPunch,
    fetchTodayPunch,
    tickPunch,
    submitting: submittingPunch,
    error: punchError,
    doPunchIn,
    doPunchOut,
    executePunchOut,
    earlyModalOpen,
    setEarlyModalOpen,
  } = usePunchActions();

  // Asset Store
  const assetRequests = useAssetStore((s) => s.requests || []);
  const addAssetRequest = useAssetStore((s) => s.addRequest);
  const hydrateAssets = useAssetStore((s) => s.hydrate);

  // Attendance Store
  const attendanceRequests = useAttendanceStore((s) => s.requests || []);
  const addAttendanceRequest = useAttendanceStore((s) => s.addRequest);

  // Local state
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'LEAVE' | 'HALFDAY' | 'EARLY' | 'REGULARIZATION' | 'WFH' | 'ASSET'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Pending' | 'Approved' | 'Rejected'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals for each request type
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isHalfDayModalOpen, setIsHalfDayModalOpen] = useState(false);
  const [isEarlyLeaveModalOpen, setIsEarlyLeaveModalOpen] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isWfhModalOpen, setIsWfhModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  const [viewRequestModal, setViewRequestModal] = useState(null);

  // Form states
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveForm, setLeaveForm] = useState({
    leaveTypeId: '',
    leaveTypeName: 'Casual Leave',
    fromDate: todayISO(),
    toDate: todayISO(),
    reason: '',
    delegateId: '',
  });

  const [halfDayForm, setHalfDayForm] = useState({
    date: todayISO(),
    session: 'First Half (09:00 – 13:30)',
    leaveTypeId: '',
    leaveTypeName: 'Casual Leave',
    reason: '',
    delegateId: '',
  });

  const [earlyLeaveForm, setEarlyLeaveForm] = useState({
    date: todayISO(),
    departureTime: '15:00',
    category: 'Doctor / Medical Appointment',
    reason: '',
  });

  const [wfhForm, setWfhForm] = useState({
    date: todayISO(),
    tasks: '',
    reason: '',
  });

  const [generalForm, setGeneralForm] = useState({
    title: '',
    category: 'Workplace Requirement / Facilities',
    urgency: 'Medium',
    date: todayISO(),
    description: '',
  });

  const [assetCategories, setAssetCategories] = useState([]);
  const [assetForm, setAssetForm] = useState({
    categoryId: '',
    categoryName: 'Laptop',
    assetName: '',
    priority: 'Medium',
    justification: '',
  });

  const [regForm, setRegForm] = useState({
    date: todayISO(),
    type: 'Missed Punch In',
    requestedCheckIn: '09:00',
    requestedCheckOut: '18:30',
    requestedStatus: 'Present',
    reason: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Leave Types & Asset Categories
  useEffect(() => {
    fetchTodayPunch();
    hydrateAssets?.();

    // Pull leave types
    hrmsSync.pull('leaveTypes').then((rows) => {
      if (rows && rows.length > 0) {
        setLeaveTypes(rows);
        setLeaveForm((prev) => ({ ...prev, leaveTypeId: rows[0].id, leaveTypeName: rows[0].name }));
        setHalfDayForm((prev) => ({ ...prev, leaveTypeId: rows[0].id, leaveTypeName: rows[0].name }));
      }
    }).catch(() => {});

    // Pull asset categories
    api.get('/hrms/asset-categories/').then((res) => {
      const cats = Array.isArray(res) ? res : res?.results || [];
      if (cats.length > 0) {
        setAssetCategories(cats);
        setAssetForm((prev) => ({ ...prev, categoryId: cats[0].id, categoryName: cats[0].name }));
      }
    }).catch(() => {});
  }, [fetchTodayPunch, hydrateAssets]);

  // Live timer for active punch
  useEffect(() => {
    if (!todayPunch?.isPunchedIn) return;
    const timer = setInterval(() => tickPunch?.(), 1000);
    return () => clearInterval(timer);
  }, [todayPunch?.isPunchedIn, tickPunch]);

  // Current employee information
  const employeeName = currentUser?.name || currentUser?.fullName || 'Employee';
  const employeeEmail = currentUser?.email || '';
  const currentEmployee = useMemo(() => {
    return employees.find((e) =>
      (currentUser?.employeeId && (e.id === currentUser.employeeId || e.employeeCode === currentUser.employeeId)) ||
      (employeeEmail && e.email?.toLowerCase() === employeeEmail.toLowerCase()) ||
      (employeeName && e.name?.toLowerCase() === employeeName.toLowerCase())
    );
  }, [employees, currentUser, employeeEmail, employeeName]);

  const department = currentEmployee?.department || currentEmployee?.dept || currentUser?.department || 'General';
  const designation = currentEmployee?.designation || currentEmployee?.role || currentUser?.role?.name || 'Staff Member';
  const employeeCode = currentEmployee?.employeeCode || currentEmployee?.empId || currentUser?.employeeCode || 'EMP-SELF';

  // Colleagues for handover
  const colleagues = useMemo(() => {
    return employees.filter((e) => e.id !== currentEmployee?.id);
  }, [employees, currentEmployee]);

  // Combine all requests into a unified list
  const unifiedRequests = useMemo(() => {
    const list = [];

    // 1. Leave & Half Day Requests
    leaves.forEach((l) => {
      const isMine = !currentEmployee || l.employeeId === currentEmployee.id || l.employee === currentEmployee.name || l.employeeName === employeeName;
      if (isMine || leaves.length <= 10) {
        const isHalf = Number(l.days) === 0.5 || String(l.type || '').toLowerCase().includes('half day') || String(l.reason || '').toLowerCase().includes('half day');
        list.push({
          id: l.id,
          rawId: l.id,
          requestType: isHalf ? 'HALFDAY' : 'LEAVE',
          typeName: l.type || (isHalf ? 'Half Day Leave' : 'Leave Request'),
          date: l.fromDate || l.from || l.date || l.createdAt,
          dateDisplay: l.fromDate && l.toDate && l.fromDate !== l.toDate ? `${formatDate(l.fromDate)} → ${formatDate(l.toDate)}` : formatDate(l.fromDate || l.date),
          days: l.days || (isHalf ? 0.5 : 1),
          reason: l.reason || 'Leave requested',
          status: l.status || 'Pending Review',
          remark: l.remark || '',
          approver: l.approverName || l.approver || 'HR Manager / Reporting Head',
          created_at: l.created_at || l.createdAt || l.fromDate || todayISO(),
          verificationModule: 'HRMS › Leave Approvals (/hrms/leave)',
          raw: l,
        });
      }
    });

    // 2. Asset Requests
    assetRequests.forEach((a) => {
      const isMine = !currentEmployee || a.employeeId === currentEmployee.id || a.employeeName === employeeName;
      if (isMine || assetRequests.length <= 10) {
        list.push({
          id: a.id,
          rawId: a.id,
          requestType: 'ASSET',
          typeName: a.category ? `Asset: ${a.category}` : 'Hardware / Asset',
          itemTitle: a.assetName || a.justification || 'Asset Request',
          date: a.requestedDate || a.created_at,
          dateDisplay: formatDate(a.requestedDate || a.created_at),
          reason: a.reason || a.justification || 'Asset allocation requested',
          status: a.status || 'Pending Review',
          priority: a.priority || 'Medium',
          remark: a.remark || '',
          approver: a.approver || 'IT & Admin Dept',
          created_at: a.created_at || a.requestedDate || todayISO(),
          verificationModule: 'HRMS › Asset Setup (/hrms/assets)',
          raw: a,
        });
      }
    });

    // 3. Attendance Regularizations, Early Leave, Half Day Attendance, WFH
    attendanceRequests.forEach((r) => {
      const isMine = !currentEmployee || r.employeeId === currentEmployee.id || r.employee === employeeName;
      if (isMine || attendanceRequests.length <= 10) {
        const typeStr = String(r.type || '').toLowerCase();
        const reqType =
          typeStr.includes('general') || typeStr.includes('requirement') || typeStr.includes('other') ? 'GENERAL' :
          typeStr.includes('early') ? 'EARLY' :
          typeStr.includes('half') ? 'HALFDAY' :
          typeStr.includes('wfh') || typeStr.includes('home') ? 'WFH' :
          'REGULARIZATION';

        list.push({
          id: r.id,
          rawId: r.id,
          requestType: reqType,
          typeName: r.type || 'Attendance Regularization',
          date: r.date || r.work_date,
          dateDisplay: formatDate(r.date || r.work_date),
          timeDetails: `${r.curIn || r.reqIn || '09:00'} → ${r.curOut || r.reqOut || '18:30'}`,
          reason: r.reason || 'Attendance regularized',
          status: r.status || 'Pending Review',
          remark: r.remark || '',
          approver: r.approver || 'HR Manager / Supervisor',
          created_at: r.created_at || r.submitted || todayISO(),
          verificationModule: 'HRMS › Attendance Requests (/hrms/attendance/requests)',
          raw: r,
        });
      }
    });

    // Sort descending by creation date or date
    return list.sort((a, b) => String(b.created_at || b.date).localeCompare(String(a.created_at || a.date)));
  }, [leaves, assetRequests, attendanceRequests, currentEmployee, employeeName]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return unifiedRequests.filter((r) => {
      // Tab filter
      if (activeTab !== 'ALL' && r.requestType !== activeTab) return false;

      // Status filter
      if (statusFilter !== 'ALL') {
        const normStatus = String(r.status || '').toLowerCase();
        const normFilter = statusFilter.toLowerCase();
        if (normFilter === 'pending' && !normStatus.includes('pending')) return false;
        if (normFilter === 'approved' && !normStatus.includes('approved')) return false;
        if (normFilter === 'rejected' && !normStatus.includes('reject')) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.typeName?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q) ||
          r.itemTitle?.toLowerCase().includes(q) ||
          r.dateDisplay?.toLowerCase().includes(q) ||
          r.status?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [unifiedRequests, activeTab, statusFilter, searchQuery]);

  // Request stats
  const stats = useMemo(() => {
    const total = unifiedRequests.length;
    const pending = unifiedRequests.filter((r) => String(r.status || '').toLowerCase().includes('pending')).length;
    const approved = unifiedRequests.filter((r) => String(r.status || '').toLowerCase().includes('approved')).length;
    const rejected = unifiedRequests.filter((r) => String(r.status || '').toLowerCase().includes('reject')).length;
    return { total, pending, approved, rejected };
  }, [unifiedRequests]);

  // ── SUBMIT HANDLERS ──

  // 1. Submit Full Day Leave
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.fromDate || !leaveForm.toDate) {
      showToast?.('Please specify both from and to dates.', 'error');
      return;
    }
    if (!leaveForm.reason.trim()) {
      showToast?.('Please specify a reason for your leave request.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        employeeId: currentEmployee?.id || undefined,
        leaveTypeId: leaveForm.leaveTypeId || undefined,
        type: leaveForm.leaveTypeName,
        fromDate: leaveForm.fromDate,
        toDate: leaveForm.toDate,
        reason: leaveForm.reason.trim(),
        delegateId: leaveForm.delegateId || undefined,
        status: 'Pending Review',
      };

      await addLeave(payload);
      showToast?.('Leave application submitted for HR verification!');
      setIsLeaveModalOpen(false);
      setLeaveForm({
        leaveTypeId: leaveTypes[0]?.id || '',
        leaveTypeName: leaveTypes[0]?.name || 'Casual Leave',
        fromDate: todayISO(),
        toDate: todayISO(),
        reason: '',
        delegateId: '',
      });
    } catch (err) {
      const msg = err?.payload?.message || err?.message || 'Failed to submit leave request';
      showToast?.(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Half Day Request
  const handleSubmitHalfDay = async (e) => {
    e.preventDefault();
    if (!halfDayForm.date) {
      showToast?.('Please select the date for your half-day request.', 'error');
      return;
    }
    if (!halfDayForm.reason.trim()) {
      showToast?.('Please specify a reason for taking a half day.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const sessionLabel = halfDayForm.session.includes('First') ? 'First Half' : 'Second Half';
      const formattedReason = `[Half Day — ${sessionLabel}] ${halfDayForm.reason.trim()}`;

      // Submit to Leave store & API (0.5 day deducted upon HR approval)
      await addLeave({
        employeeId: currentEmployee?.id || undefined,
        leaveTypeId: halfDayForm.leaveTypeId || undefined,
        type: `${halfDayForm.leaveTypeName} (Half Day)`,
        fromDate: halfDayForm.date,
        toDate: halfDayForm.date,
        days: 0.5,
        reason: formattedReason,
        delegateId: halfDayForm.delegateId || undefined,
        status: 'Pending Review',
      });

      // Also register in Attendance Requests queue for HR Attendance verification
      addAttendanceRequest({
        employee: employeeName,
        dept: department,
        date: halfDayForm.date,
        type: 'Half Day',
        curIn: sessionLabel === 'First Half' ? '09:00' : '13:30',
        curOut: sessionLabel === 'First Half' ? '13:30' : '18:30',
        reqIn: sessionLabel === 'First Half' ? '09:00' : '13:30',
        reqOut: sessionLabel === 'First Half' ? '13:30' : '18:30',
        reason: formattedReason,
      });

      showToast?.('Half day request submitted for HR verification!');
      setIsHalfDayModalOpen(false);
      setHalfDayForm({
        date: todayISO(),
        session: 'First Half (09:00 – 13:30)',
        leaveTypeId: leaveTypes[0]?.id || '',
        leaveTypeName: leaveTypes[0]?.name || 'Casual Leave',
        reason: '',
        delegateId: '',
      });
    } catch (err) {
      const msg = err?.payload?.message || err?.message || 'Failed to submit half day request';
      showToast?.(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit Early Leave / Clock-Out Request
  const handleSubmitEarlyLeave = async (e) => {
    e.preventDefault();
    if (!earlyLeaveForm.date) {
      showToast?.('Please specify the date for early departure.', 'error');
      return;
    }
    if (!earlyLeaveForm.reason.trim()) {
      showToast?.('Please specify why you need to leave early.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const earlyReason = `[Early Leave: ${earlyLeaveForm.category}] Leaving at ${earlyLeaveForm.departureTime}. Reason: ${earlyLeaveForm.reason.trim()}`;

      // 1. Submit to Backend Attendance Regularization API
      await api.post('/hrms/attendance/regularizations/', {
        employeeId: currentEmployee?.id || undefined,
        date: earlyLeaveForm.date,
        requestedCheckIn: '09:00',
        requestedCheckOut: earlyLeaveForm.departureTime,
        requestedStatus: 'Present',
        reason: earlyReason,
      }).catch((err) => {
        console.warn('Backend early leave sync warning:', err);
      });

      // 2. Add to Attendance store so HR verifies it in /hrms/attendance/requests
      addAttendanceRequest({
        employee: employeeName,
        dept: department,
        date: earlyLeaveForm.date,
        type: 'Early Leave',
        curIn: '09:00',
        curOut: '18:30',
        reqIn: '09:00',
        reqOut: earlyLeaveForm.departureTime,
        reason: earlyReason,
      });

      showToast?.('Early leave request submitted for HR verification!');
      setIsEarlyLeaveModalOpen(false);
      setEarlyLeaveForm({
        date: todayISO(),
        departureTime: '15:00',
        category: 'Doctor / Medical Appointment',
        reason: '',
      });
    } catch (err) {
      const msg = err?.payload?.message || err?.message || 'Failed to submit early leave request';
      showToast?.(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Submit Attendance Regularization
  const handleSubmitReg = async (e) => {
    e.preventDefault();
    if (!regForm.date) {
      showToast?.('Please choose the attendance date to regularize.', 'error');
      return;
    }
    if (!regForm.reason.trim()) {
      showToast?.('Please state the reason for attendance regularization.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const fullReason = `[Regularization — ${regForm.type}] ${regForm.reason.trim()}`;

      // 1. Submit to Backend API
      await api.post('/hrms/attendance/regularizations/', {
        employeeId: currentEmployee?.id || undefined,
        date: regForm.date,
        requestedCheckIn: regForm.requestedCheckIn,
        requestedCheckOut: regForm.requestedCheckOut,
        requestedStatus: regForm.requestedStatus,
        reason: fullReason,
      }).catch((apiErr) => {
        console.warn('Backend regularization sync warning:', apiErr);
      });

      // 2. Add to Attendance store for HR review
      addAttendanceRequest({
        employee: employeeName,
        dept: department,
        date: regForm.date,
        type: 'Regularization',
        curIn: regForm.requestedCheckIn,
        curOut: regForm.requestedCheckOut,
        reqIn: regForm.requestedCheckIn,
        reqOut: regForm.requestedCheckOut,
        reason: fullReason,
      });

      showToast?.('Attendance regularization submitted for HR verification!');
      setIsRegModalOpen(false);
      setRegForm({
        date: todayISO(),
        type: 'Missed Punch In',
        requestedCheckIn: '09:00',
        requestedCheckOut: '18:30',
        requestedStatus: 'Present',
        reason: '',
      });
    } catch (err) {
      const msg = err?.payload?.message || err?.message || 'Failed to submit regularization';
      showToast?.(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Submit Work From Home (WFH)
  const handleSubmitWfh = async (e) => {
    e.preventDefault();
    if (!wfhForm.date) {
      showToast?.('Please choose the WFH date.', 'error');
      return;
    }
    if (!wfhForm.tasks.trim()) {
      showToast?.('Please specify tasks to be delivered from home.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const wfhReason = `[Work From Home] Tasks: ${wfhForm.tasks.trim()}${wfhForm.reason ? ` — Note: ${wfhForm.reason.trim()}` : ''}`;

      await api.post('/hrms/attendance/regularizations/', {
        employeeId: currentEmployee?.id || undefined,
        date: wfhForm.date,
        requestedCheckIn: '09:00',
        requestedCheckOut: '18:30',
        requestedStatus: 'WFH',
        reason: wfhReason,
      }).catch(() => {});

      addAttendanceRequest({
        employee: employeeName,
        dept: department,
        date: wfhForm.date,
        type: 'Work From Home (WFH)',
        curIn: '09:00',
        curOut: '18:30',
        reqIn: '09:00',
        reqOut: '18:30',
        reason: wfhReason,
      });

      showToast?.('Work From Home request submitted for HR verification!');
      setIsWfhModalOpen(false);
      setWfhForm({
        date: todayISO(),
        tasks: '',
        reason: '',
      });
    } catch (err) {
      const msg = err?.payload?.message || err?.message || 'Failed to submit WFH request';
      showToast?.(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Submit Asset Request
  const handleSubmitAsset = async (e) => {
    e.preventDefault();
    const itemName = assetForm.assetName.trim();
    const justification = assetForm.justification.trim();

    if (!itemName && !justification) {
      showToast?.('Please specify the asset description or justification.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const fullJustification = itemName
        ? `${itemName}${justification ? ` — ${justification}` : ''}`
        : justification;

      await api.post('/hrms/asset-requests/', {
        employeeId: currentEmployee?.id || undefined,
        categoryId: assetForm.categoryId || undefined,
        justification: fullJustification,
      }).catch((apiErr) => {
        console.warn('Backend asset request sync warning:', apiErr);
      });

      addAssetRequest({
        employeeName,
        employeeId: currentEmployee?.id || '',
        dept: department,
        category: assetForm.categoryName,
        assetName: itemName || `${assetForm.categoryName} Hardware`,
        reason: fullJustification,
        priority: assetForm.priority,
        requestedDate: todayISO(),
        source: 'Employee Portal',
        notes: `Priority: ${assetForm.priority}`,
      });

      showToast?.('Asset request submitted for HR / IT verification!');
      setIsAssetModalOpen(false);
      setAssetForm({
        categoryId: assetCategories[0]?.id || '',
        categoryName: assetCategories[0]?.name || 'Laptop',
        assetName: '',
        priority: 'Medium',
        justification: '',
      });
    } catch (err) {
      const msg = err?.payload?.message || err?.message || 'Failed to submit asset request';
      showToast?.(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Submit General Request / Other Reasons & Requirements
  const handleSubmitGeneral = async (e) => {
    e.preventDefault();
    if (!generalForm.title.trim()) {
      showToast?.('Please specify a title or requirement summary.', 'error');
      return;
    }
    if (!generalForm.description.trim()) {
      showToast?.('Please describe your request details or reason.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const formattedReason = `[Requirement: ${generalForm.category}] (${generalForm.urgency} Urgency) ${generalForm.title.trim()} — ${generalForm.description.trim()}`;

      // Sync to attendance/regularizations backend endpoint so HR can query & verify
      await api.post('/hrms/attendance/regularizations/', {
        employeeId: currentEmployee?.id || undefined,
        date: generalForm.date,
        requestedCheckIn: '09:00',
        requestedCheckOut: '18:30',
        requestedStatus: 'Present',
        reason: formattedReason,
      }).catch((apiErr) => {
        console.warn('Backend general request sync warning:', apiErr);
      });

      // Add to store so HR Requests queue and Employee Portal update live
      addAttendanceRequest({
        employee: employeeName,
        dept: department,
        date: generalForm.date,
        type: 'General Request',
        curIn: '09:00',
        curOut: '18:30',
        reqIn: '09:00',
        reqOut: '18:30',
        reason: formattedReason,
      });

      showToast?.('Request & Requirement submitted for HR verification!');
      setIsGeneralModalOpen(false);
      setGeneralForm({
        title: '',
        category: 'Workplace Requirement / Facilities',
        urgency: 'Medium',
        date: todayISO(),
        description: '',
      });
    } catch (err) {
      const msg = err?.payload?.message || err?.message || 'Failed to submit request';
      showToast?.(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('approved')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} /> Approved by HR
        </span>
      );
    }
    if (s.includes('reject')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={12} /> Rejected by HR
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock3 size={12} /> Pending HR Review
      </span>
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'LEAVE':
        return <Plane size={15} className="text-indigo-600" />;
      case 'HALFDAY':
        return <Sun size={15} className="text-amber-600" />;
      case 'EARLY':
        return <Sunset size={15} className="text-purple-600" />;
      case 'REGULARIZATION':
        return <Clock size={15} className="text-blue-600" />;
      case 'WFH':
        return <Home size={15} className="text-sky-600" />;
      case 'ASSET':
        return <Laptop size={15} className="text-cyan-600" />;
      case 'GENERAL':
        return <ClipboardList size={15} className="text-emerald-600" />;
      default:
        return <FileText size={15} className="text-slate-600" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-full pb-10">
      {/* Top Welcome & Punch Banner */}
      <div className="bg-white border border-bdr rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/5 via-primary/0 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* User Info */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 text-white font-black text-2xl flex items-center justify-center shadow-sm shrink-0">
              {employeeName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Welcome, {employeeName}!
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-primary border border-blue-200">
                  Self-Service Portal
                </span>
              </div>
              <p className="text-[13px] text-muted mt-1 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Briefcase size={13} className="text-slate-400" /> {designation}
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Building2 size={13} className="text-slate-400" /> {department}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                  {employeeCode}
                </span>
              </p>
            </div>
          </div>

          {/* Punch Widget */}
          <div className="bg-slate-50 border border-bdr/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  todayPunch?.isPunchedIn
                    ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Clock size={20} />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-muted">
                  Shift: {todayPunch?.shiftStart || '09:00'} – {todayPunch?.shiftEnd || '18:30'}
                </div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                  <span>{todayPunch?.isPunchedIn ? 'Currently Active' : 'Off Clock'}</span>
                  {todayPunch?.isPunchedIn && (
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {todayPunch?.formattedWorkingTime || '00h 00m'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              {todayPunch?.isPunchedIn ? (
                <button
                  type="button"
                  onClick={doPunchOut}
                  disabled={submittingPunch}
                  className="w-full sm:w-auto h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                >
                  {submittingPunch ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                  Punch Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={doPunchIn}
                  disabled={submittingPunch}
                  className="w-full sm:w-auto h-10 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                >
                  {submittingPunch ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                  {todayPunch?.dayCompleted ? 'Punch In Again' : 'Punch In'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Request Hub — ALL 6 REQUEST TYPES */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Make an Employee Request</h2>
            <p className="text-xs text-muted">
              Submit requests directly for verification and approval by HR & Department Supervisors.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Request Full Day Leave */}
          <div className="bg-white border border-bdr rounded-2xl p-5 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all group flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Plane size={20} />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-[14.5px]">Leave Application</h3>
                <span className="text-[10.5px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">Full Day</span>
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Apply for Casual, Sick, Paid / Earned, or Unpaid leaves with colleague handover.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(true)}
              className="mt-4 w-full h-9 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} /> Apply for Leave
            </button>
          </div>

          {/* 2. Half Day Request */}
          <div className="bg-white border border-bdr rounded-2xl p-5 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all group flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Sun size={20} />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-[14.5px]">Half Day Request</h3>
                <span className="text-[10.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">0.5 Day</span>
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Request First Half (Morning) or Second Half (Afternoon) leave verified by HR.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsHalfDayModalOpen(true)}
              className="mt-4 w-full h-9 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} /> Request Half Day
            </button>
          </div>

          {/* 3. Early Leave Request */}
          <div className="bg-white border border-bdr rounded-2xl p-5 shadow-xs hover:border-purple-300 hover:shadow-sm transition-all group flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Sunset size={20} />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-[14.5px]">Early Leave / Clock-Out</h3>
                <span className="text-[10.5px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">Early Exit</span>
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Permission to leave before regular shift completion for doctor visit or emergencies.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEarlyLeaveModalOpen(true)}
              className="mt-4 w-full h-9 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} /> Request Early Leave
            </button>
          </div>

          {/* 4. Attendance Regularization */}
          <div className="bg-white border border-bdr rounded-2xl p-5 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Clock size={20} />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-[14.5px]">Attendance Regularization</h3>
                <span className="text-[10.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">Correction</span>
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Fix missed biometric punches, machine offline issues, or late arrival timestamps.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsRegModalOpen(true)}
              className="mt-4 w-full h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} /> Regularize Attendance
            </button>
          </div>

          {/* 5. Work From Home (WFH) */}
          <div className="bg-white border border-bdr rounded-2xl p-5 shadow-xs hover:border-sky-300 hover:shadow-sm transition-all group flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Home size={20} />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-[14.5px]">Work From Home (WFH)</h3>
                <span className="text-[10.5px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">Remote</span>
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Request remote working authorization with day's key task deliverables.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsWfhModalOpen(true)}
              className="mt-4 w-full h-9 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} /> Request WFH
            </button>
          </div>

          {/* 6. Request Asset & Hardware */}
          <div className="bg-white border border-bdr rounded-2xl p-5 shadow-xs hover:border-cyan-300 hover:shadow-sm transition-all group flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Laptop size={20} />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-[14.5px]">Asset & Equipment Request</h3>
                <span className="text-[10.5px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md">IT / Tools</span>
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Request laptops, monitors, fabrication tools, mobiles, or software licenses.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAssetModalOpen(true)}
              className="mt-4 w-full h-9 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} /> Request Asset
            </button>
          </div>

          {/* 7. Other Reasons & General Requirements */}
          <div className="bg-white border border-bdr rounded-2xl p-5 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all group flex flex-col justify-between md:col-span-2 lg:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-[15px]">Other Reason / Requirement Request</h3>
                    <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                      HR Verification
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">
                    Need special equipment, stationary, HR documents, schedule adjustments, or have any other workplace requirement? Submit it here directly for HR review and approval.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGeneralModalOpen(true)}
                className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                <Plus size={15} /> Make Other Request / Requirement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-bdr rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Total Requests</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</div>
          <p className="text-[11.5px] text-muted mt-1">Submitted requests</p>
        </div>

        <div className="bg-white border border-bdr rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pending HR Review</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{stats.pending}</div>
          <p className="text-[11.5px] text-amber-600 font-medium mt-1">Awaiting verification</p>
        </div>

        <div className="bg-white border border-bdr rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Approved by HR</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{stats.approved}</div>
          <p className="text-[11.5px] text-emerald-600 font-medium mt-1">Approved & credited</p>
        </div>

        <div className="bg-white border border-bdr rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Leave Balance</div>
          <div className="text-2xl font-extrabold text-indigo-700 mt-1">
            {currentEmployee?.leaveBalance || '12'} Days
          </div>
          <p className="text-[11.5px] text-indigo-600 font-medium mt-1">Available balance</p>
        </div>
      </div>

      {/* Central Requests History Register */}
      <div className="bg-white border border-bdr rounded-2xl shadow-xs overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-5 border-b border-bdr flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Requests & HR Verification Status</h2>
            <p className="text-xs text-muted mt-0.5">
              Live status of your submitted requests. Every request is verified by HR / Reporting Supervisors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary w-48 sm:w-56"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="ALL">All HR Statuses</option>
              <option value="Pending">Pending HR Review</option>
              <option value="Approved">Approved by HR</option>
              <option value="Rejected">Rejected by HR</option>
            </select>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-bdr bg-slate-50/50 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Requests', count: unifiedRequests.length },
            { id: 'LEAVE', label: 'Leaves', count: unifiedRequests.filter((r) => r.requestType === 'LEAVE').length },
            { id: 'HALFDAY', label: 'Half Day', count: unifiedRequests.filter((r) => r.requestType === 'HALFDAY').length },
            { id: 'EARLY', label: 'Early Leave', count: unifiedRequests.filter((r) => r.requestType === 'EARLY').length },
            { id: 'REGULARIZATION', label: 'Regularization', count: unifiedRequests.filter((r) => r.requestType === 'REGULARIZATION').length },
            { id: 'WFH', label: 'Work From Home', count: unifiedRequests.filter((r) => r.requestType === 'WFH').length },
            { id: 'ASSET', label: 'Assets & IT', count: unifiedRequests.filter((r) => r.requestType === 'ASSET').length },
            { id: 'GENERAL', label: 'Other Requirements', count: unifiedRequests.filter((r) => r.requestType === 'GENERAL').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 px-3.5 rounded-t-xl font-bold text-xs flex items-center gap-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          {filteredRequests.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FileText size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No requests found</h3>
              <p className="text-xs text-muted mt-1">
                {searchQuery || statusFilter !== 'ALL' || activeTab !== 'ALL'
                  ? 'Try clearing your search or status filter.'
                  : 'Submit a new request above to see it recorded here for HR review.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-bdr text-[11px] uppercase tracking-wider text-muted font-bold">
                  <th className="py-3 px-5">Type</th>
                  <th className="py-3 px-4">Subject & Details</th>
                  <th className="py-3 px-4">Date / Timing</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">HR Verification</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bdr/60">
                {filteredRequests.map((req) => (
                  <tr key={`${req.requestType}-${req.id}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          {getTypeIcon(req.requestType)}
                        </span>
                        <span>{req.typeName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{req.itemTitle || req.typeName}</div>
                      {req.timeDetails && <div className="text-[11px] text-muted mt-0.5">{req.timeDetails}</div>}
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {req.dateDisplay}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-muted truncate text-[11.5px]" title={req.reason}>
                        {req.reason}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(req.status)}
                    </td>

                    <td className="py-3 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => setViewRequestModal(req)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye size={12} /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── MODAL 1: Request Leave (Full Day) ── */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Apply for Leave"
        subtitle="Submit a full day leave application for HR verification."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(false)}
              className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitLeave}
              disabled={isSubmitting}
              className="btn-primary h-9 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plane size={14} />}
              Submit Leave Application
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmitLeave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Leave Type</label>
            <select
              value={leaveForm.leaveTypeId}
              onChange={(e) => {
                const selected = leaveTypes.find((lt) => lt.id === e.target.value);
                setLeaveForm({
                  ...leaveForm,
                  leaveTypeId: e.target.value,
                  leaveTypeName: selected?.name || 'Casual Leave',
                });
              }}
              className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
            >
              {leaveTypes.length > 0 ? (
                leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name} (Max {lt.annual_entitlement || lt.annualEntitlement || 12} days/yr)
                  </option>
                ))
              ) : (
                <>
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="earned">Earned / Privilege Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">From Date</label>
              <input
                type="date"
                value={leaveForm.fromDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">To Date</label>
              <input
                type="date"
                value={leaveForm.toDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Handover Colleague (Optional)</label>
            <select
              value={leaveForm.delegateId}
              onChange={(e) => setLeaveForm({ ...leaveForm, delegateId: e.target.value })}
              className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
            >
              <option value="">Select a colleague covering your tasks</option>
              {colleagues.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.department || col.dept || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for Leave *</label>
            <textarea
              rows={3}
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              placeholder="e.g. Attending a family function, medical treatment, or personal travel..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary resize-none"
              required
            />
          </div>
        </form>
      </Modal>

      {/* ── MODAL 2: Request Half Day ── */}
      <Modal
        isOpen={isHalfDayModalOpen}
        onClose={() => setIsHalfDayModalOpen(false)}
        title="Request Half Day"
        subtitle="Apply for a 0.5 day leave session verified by HR."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsHalfDayModalOpen(false)}
              className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitHalfDay}
              disabled={isSubmitting}
              className="btn-primary h-9 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Sun size={14} />}
              Submit Half Day Request
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmitHalfDay} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Half Day Date</label>
              <input
                type="date"
                value={halfDayForm.date}
                onChange={(e) => setHalfDayForm({ ...halfDayForm, date: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Session Timing</label>
              <select
                value={halfDayForm.session}
                onChange={(e) => setHalfDayForm({ ...halfDayForm, session: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
              >
                <option value="First Half (09:00 – 13:30)">First Half (Morning 09:00 – 13:30)</option>
                <option value="Second Half (13:30 – 18:30)">Second Half (Afternoon 13:30 – 18:30)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Leave Category</label>
            <select
              value={halfDayForm.leaveTypeId}
              onChange={(e) => {
                const selected = leaveTypes.find((lt) => lt.id === e.target.value);
                setHalfDayForm({
                  ...halfDayForm,
                  leaveTypeId: e.target.value,
                  leaveTypeName: selected?.name || 'Casual Leave',
                });
              }}
              className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
            >
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} (0.5 Day deduction)
                </option>
              ))}
              {leaveTypes.length === 0 && <option value="casual">Casual Leave (0.5 Day)</option>}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Work Handover Colleague (Optional)</label>
            <select
              value={halfDayForm.delegateId}
              onChange={(e) => setHalfDayForm({ ...halfDayForm, delegateId: e.target.value })}
              className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
            >
              <option value="">Select a colleague</option>
              {colleagues.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.department || col.dept || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for Half Day *</label>
            <textarea
              rows={3}
              value={halfDayForm.reason}
              onChange={(e) => setHalfDayForm({ ...halfDayForm, reason: e.target.value })}
              placeholder="e.g. Doctor appointment in morning, or urgent personal work in afternoon..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary resize-none"
              required
            />
          </div>
        </form>
      </Modal>

      {/* ── MODAL 3: Request Early Leave / Clock-Out ── */}
      <Modal
        isOpen={isEarlyLeaveModalOpen}
        onClose={() => setIsEarlyLeaveModalOpen(false)}
        title="Request Early Leave / Clock-Out"
        subtitle="Obtain HR permission to leave work before normal shift completion."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsEarlyLeaveModalOpen(false)}
              className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitEarlyLeave}
              disabled={isSubmitting}
              className="btn-primary h-9 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Sunset size={14} />}
              Submit Early Leave Request
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmitEarlyLeave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={earlyLeaveForm.date}
                onChange={(e) => setEarlyLeaveForm({ ...earlyLeaveForm, date: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Requested Departure Time</label>
              <input
                type="time"
                value={earlyLeaveForm.departureTime}
                onChange={(e) => setEarlyLeaveForm({ ...earlyLeaveForm, departureTime: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Early Departure Reason Category</label>
            <select
              value={earlyLeaveForm.category}
              onChange={(e) => setEarlyLeaveForm({ ...earlyLeaveForm, category: e.target.value })}
              className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
            >
              <option value="Doctor / Medical Appointment">Doctor / Medical Appointment</option>
              <option value="Personal Emergency">Personal Emergency / Health issue</option>
              <option value="Family Obligation">Family Obligation / Event</option>
              <option value="Official Client Site Visit">Official Client Site Visit</option>
              <option value="Government / Bank Work">Official Government / Bank Work</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Detailed Reason *</label>
            <textarea
              rows={3}
              value={earlyLeaveForm.reason}
              onChange={(e) => setEarlyLeaveForm({ ...earlyLeaveForm, reason: e.target.value })}
              placeholder="Provide context for HR verification (e.g. Doctor appointment scheduled at 3:30 PM)..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary resize-none"
              required
            />
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-[11px] text-purple-800 leading-normal">
            <strong>HR Policy Notice:</strong> Once HR approves your early departure, attendance is processed without penalty deductions in monthly payroll.
          </div>
        </form>
      </Modal>

      {/* ── MODAL 4: Attendance Regularization ── */}
      <Modal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        title="Attendance Regularization"
        subtitle="Correct missed punches or scanner issues so full attendance is credited."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsRegModalOpen(false)}
              className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitReg}
              disabled={isSubmitting}
              className="btn-primary h-9 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
              Submit Regularization
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmitReg} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Date of Attendance</label>
              <input
                type="date"
                value={regForm.date}
                onChange={(e) => setRegForm({ ...regForm, date: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Correction Type</label>
              <select
                value={regForm.type}
                onChange={(e) => setRegForm({ ...regForm, type: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
              >
                <option value="Missed Punch In">Missed Punch In (Check-in time)</option>
                <option value="Missed Punch Out">Missed Punch Out (Check-out time)</option>
                <option value="Biometric Scanner Glitch">Biometric Device Glitch / Offline</option>
                <option value="Late Clock-In Correction">Late Clock-In Regularization</option>
                <option value="Client Site Visit">Client Site Visit / Field Work</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Correct Check-In Time</label>
              <input
                type="time"
                value={regForm.requestedCheckIn}
                onChange={(e) => setRegForm({ ...regForm, requestedCheckIn: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Correct Check-Out Time</label>
              <input
                type="time"
                value={regForm.requestedCheckOut}
                onChange={(e) => setRegForm({ ...regForm, requestedCheckOut: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for Regularization *</label>
            <textarea
              rows={3}
              value={regForm.reason}
              onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
              placeholder="e.g. Biometric scanner failed to recognize fingerprint, arrived at 09:00 AM..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary resize-none"
              required
            />
          </div>
        </form>
      </Modal>

      {/* ── MODAL 5: Work From Home (WFH) ── */}
      <Modal
        isOpen={isWfhModalOpen}
        onClose={() => setIsWfhModalOpen(false)}
        title="Request Work From Home (WFH)"
        subtitle="Submit remote working authorization for HR review."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsWfhModalOpen(false)}
              className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitWfh}
              disabled={isSubmitting}
              className="btn-primary h-9 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Home size={14} />}
              Submit WFH Request
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmitWfh} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">WFH Date</label>
            <input
              type="date"
              value={wfhForm.date}
              onChange={(e) => setWfhForm({ ...wfhForm, date: e.target.value })}
              className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Planned Deliverables / Tasks *</label>
            <textarea
              rows={2}
              value={wfhForm.tasks}
              onChange={(e) => setWfhForm({ ...wfhForm, tasks: e.target.value })}
              placeholder="List specific tasks you plan to complete remotely today..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary resize-none"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason (Optional)</label>
            <input
              type="text"
              value={wfhForm.reason}
              onChange={(e) => setWfhForm({ ...wfhForm, reason: e.target.value })}
              placeholder="e.g. Mild illness, severe commute traffic, home maintenance..."
              className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
            />
          </div>
        </form>
      </Modal>

      {/* ── MODAL 6: Request Asset & Equipment ── */}
      <Modal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        title="Request Asset & Equipment"
        subtitle="Submit hardware, tools, or software requirement for IT & HR fulfillment."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsAssetModalOpen(false)}
              className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitAsset}
              disabled={isSubmitting}
              className="btn-primary h-9 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Laptop size={14} />}
              Submit Asset Request
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmitAsset} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Asset Category</label>
            <select
              value={assetForm.categoryId}
              onChange={(e) => {
                const selected = assetCategories.find((ac) => ac.id === e.target.value);
                setAssetForm({
                  ...assetForm,
                  categoryId: e.target.value,
                  categoryName: selected?.name || 'Laptop',
                });
              }}
              className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
            >
              {assetCategories.length > 0 ? (
                assetCategories.map((ac) => (
                  <option key={ac.id} value={ac.id}>
                    {ac.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="Laptop">Laptop / Workstation</option>
                  <option value="Monitor">External Monitor & Cables</option>
                  <option value="Mobile">Mobile Device</option>
                  <option value="Tools">Shopfloor Tools & Safety Equipment</option>
                  <option value="Software">Software License / Tool Access</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Specific Item Description</label>
            <input
              type="text"
              placeholder="e.g. Dell Latitude 16GB RAM or Welding Helmet"
              value={assetForm.assetName}
              onChange={(e) => setAssetForm({ ...assetForm, assetName: e.target.value })}
              className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Priority / Urgency</label>
            <select
              value={assetForm.priority}
              onChange={(e) => setAssetForm({ ...assetForm, priority: e.target.value })}
              className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
            >
              <option value="Low">Low — Next scheduled hardware allocation cycle</option>
              <option value="Medium">Medium — Standard work requirement</option>
              <option value="High">High — Client deliverable blocked without this</option>
              <option value="Urgent">Urgent — Immediate hardware replacement</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Business Justification *</label>
            <textarea
              rows={3}
              value={assetForm.justification}
              onChange={(e) => setAssetForm({ ...assetForm, justification: e.target.value })}
              placeholder="Explain why this equipment is needed for your project deliverables..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary resize-none"
              required
            />
          </div>
        </form>
      </Modal>

      {/* ── MODAL: Other Reason / Requirement Request (Received by HR) ── */}
      <Modal
        isOpen={isGeneralModalOpen}
        onClose={() => setIsGeneralModalOpen(false)}
        title="Other Request & Requirement"
        subtitle="Submit any special request, workplace requirement, or other need for HR review & verification."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsGeneralModalOpen(false)}
              className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitGeneral}
              disabled={isSubmitting}
              className="btn-primary h-9 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Submit to HR
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmitGeneral} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Request Category / Nature *</label>
            <select
              value={generalForm.category}
              onChange={(e) => setGeneralForm({ ...generalForm, category: e.target.value })}
              className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
            >
              <option value="Workplace Requirement / Facilities">Workplace Requirement / Facilities & Seating</option>
              <option value="Stationery & Office Supplies">Stationery & Office Consumables</option>
              <option value="HR Document / Experience / NOC">HR Document Request (Experience Letter / Bonafide / NOC)</option>
              <option value="Policy / Shift Flexibility Requirement">Special Timing / Shift Flexibility</option>
              <option value="Training & Upskilling Requirement">Training / Course Material Requirement</option>
              <option value="Health, Safety & Ergonomic Support">Health, Safety & Ergonomic Support</option>
              <option value="Other Workplace Reason">Other Specific Workplace Reason</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Subject / Requirement Summary *</label>
            <input
              type="text"
              placeholder="e.g. Ergonomic chair request or NOC letter for passport verification"
              value={generalForm.title}
              onChange={(e) => setGeneralForm({ ...generalForm, title: e.target.value })}
              className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Date</label>
              <input
                type="date"
                value={generalForm.date}
                onChange={(e) => setGeneralForm({ ...generalForm, date: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Priority / Urgency</label>
              <select
                value={generalForm.urgency}
                onChange={(e) => setGeneralForm({ ...generalForm, urgency: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
              >
                <option value="Low">Low — Can be fulfilled anytime</option>
                <option value="Medium">Medium — Standard priority</option>
                <option value="High">High — Needed soon</option>
                <option value="Urgent">Urgent — Immediate requirement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Detailed Explanation & Requirement Details *</label>
            <textarea
              rows={4}
              value={generalForm.description}
              onChange={(e) => setGeneralForm({ ...generalForm, description: e.target.value })}
              placeholder="Provide complete details, exact requirement specifications, or explanation so HR can verify and take prompt action..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-bdr text-xs font-medium text-slate-800 focus:outline-none focus:border-primary resize-none"
              required
            />
          </div>

          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 leading-normal flex items-start gap-2">
            <ClipboardList size={14} className="shrink-0 mt-0.5 text-emerald-600" />
            <div>
              <strong>HR Verification Workflow:</strong> This request is routed straight to the HR team. You can monitor verification status (Pending, Approved, or Rejected with remarks) directly in your portal tracker below.
            </div>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 7: View Detailed Request & HR Verification Remarks ── */}
      {viewRequestModal && (
        <Modal
          isOpen={Boolean(viewRequestModal)}
          onClose={() => setViewRequestModal(null)}
          title={`${viewRequestModal.typeName}`}
          subtitle={`Submitted on ${formatDate(viewRequestModal.created_at)}`}
          size="md"
          footer={
            <div className="flex justify-end w-full">
              <button
                type="button"
                onClick={() => setViewRequestModal(null)}
                className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-bdr">
              <span className="font-bold text-slate-700">HR Verification Status:</span>
              <span>{getStatusBadge(viewRequestModal.status)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-bdr space-y-2">
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px]">Date / Period:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{viewRequestModal.dateDisplay}</p>
              </div>
              {viewRequestModal.timeDetails && (
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Working Hours / Timing:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewRequestModal.timeDetails}</p>
                </div>
              )}
              {viewRequestModal.priority && (
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Priority:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewRequestModal.priority}</p>
                </div>
              )}
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px]">Verification Authority:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{viewRequestModal.approver}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px]">HR Review Queue:</span>
                <p className="font-mono text-slate-600 mt-0.5 text-[11px]">{viewRequestModal.verificationModule}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-bdr">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Reason & Justification:</span>
              <p className="font-medium text-slate-800 mt-1 leading-relaxed whitespace-pre-wrap">
                {viewRequestModal.reason}
              </p>
            </div>

            {viewRequestModal.remark && (
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="font-bold text-blue-800 uppercase text-[10px]">HR Reviewer Remarks:</span>
                <p className="font-medium text-blue-900 mt-0.5">{viewRequestModal.remark}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Early Punch Out Modal if triggered */}
      <EarlyPunchOutModal
        isOpen={earlyModalOpen}
        onClose={() => setEarlyModalOpen(false)}
        onConfirm={executePunchOut}
        todayPunch={todayPunch}
        isSubmitting={submittingPunch}
      />
    </div>
  );
}
