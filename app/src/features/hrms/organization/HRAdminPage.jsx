import { useState, useRef, useEffect, useMemo } from "react";
import {
  hrmsSync,
  isBackendEnabled,
  pullHrmsSettings,
  pushHrmsSettings,
  addTeamMember,
  removeTeamMember,
} from '../../../services/hrmsSync';
import { api } from '../../../services/api';
import { dispatchNotification } from '../../../services/crmEventNotifications';
import { Link, useSearchParams } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  Settings,
  Sliders,
  CheckCircle2,
  Clock,
  Building,
  KeyRound,
  FileCheck,
  Plus,
  Edit,
  Trash2,
  Mail,
  AlertCircle,
  ExternalLink,
  UserMinus,
  UserPlus,
  Loader2,
  UserX,
  MessageSquareWarning,
  Calendar,
  CalendarCheck,
  Receipt,
  RotateCcw,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileText,
  AlertTriangle,
  Printer,
  Sparkles,
  Briefcase,
  Award,
  FileCheck2,
  ChevronDown,
  ArrowRight,
  Shield,
  Building2,
  Layers,
  CheckCircle,
  HelpCircle,
  Megaphone,
  Plane,
  Sun,
  Moon,
  RotateCw,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Info,
  CalendarDays,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { sessionCan } from "../../../services/lazyModules";
import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useCalendarStore } from "../../../stores/calendarStore";
import {
  usePayrollStore,
  getDepartmentDays,
  getDepartmentHours,
  DEFAULT_DEPARTMENT_WORKING_DAYS,
  DEFAULT_DEPARTMENT_WORKING_HOURS,
} from "../../../stores/payrollStore";
import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  fetchTravelRequests,
  createTravelRequest,
  updateTravelRequest,
  deleteTravelRequest,
  approveTravelRequest,
  rejectTravelRequest,
  settleTravelRequest,
  addComplaintComment,
  resolveComplaint,
  waiveResignationNotice,
  shortenResignationNotice,
} from "../../../services/upgradeService";
import TerminationLetterModal from "./TerminationLetterModal";
import OfferLetterModal from "./OfferLetterModal";
import GenerateOfferModal from "./GenerateOfferModal";
import PageInfoButton from "../../../components/common/PageInfoButton";
import { hrmsGuides } from "../../../data/hrms/hrmsGuides";
import { useERP } from "../../../context/ERPContext";

const isoToday = () => new Date().toISOString().split("T")[0];
const isoInDays = (days) => new Date(Date.now() + days * 86400000).toISOString().split("T")[0];

const INITIAL_APPROVAL_CHAINS = [
  { id: "AC-01", module: "Leave Management", tier1: "Direct Line Manager", tier2: "HR Operations Lead", tier3: "HR Director", autoEscalateDays: 3, status: "Active" },
  { id: "AC-02", module: "Attendance Regularization", tier1: "Immediate Supervisor", tier2: "Department Head", tier3: "—", autoEscalateDays: 2, status: "Active" },
  { id: "AC-03", module: "Asset Allocation", tier1: "IT Stock Manager", tier2: "Operations Lead", tier3: "Finance Approver", autoEscalateDays: 4, status: "Active" },
  { id: "AC-04", module: "Payroll & Compensation Revisions", tier1: "HR Director", tier2: "Chief Financial Officer (CFO)", tier3: "Managing Director", autoEscalateDays: 5, status: "Active" },
  { id: "AC-05", module: "Expense Reimbursement", tier1: "Project Manager", tier2: "Finance Lead", tier3: "Managing Director", autoEscalateDays: 3, status: "Active" },
  { id: "AC-06", module: "Travel Requisitions", tier1: "Direct Line Manager", tier2: "Finance Lead", tier3: "Managing Director", autoEscalateDays: 3, status: "Active" },
  { id: "AC-07", module: "Grievances", tier1: "HR Operations Lead", tier2: "HR Director", tier3: "Managing Director", autoEscalateDays: 5, status: "Active" },
  { id: "AC-08", module: "Resignations", tier1: "Direct Line Manager", tier2: "Department Head", tier3: "HR Director", autoEscalateDays: 3, status: "Active" },
  { id: "AC-09", module: "Terminations", tier1: "Department Head", tier2: "HR Director", tier3: "Managing Director", autoEscalateDays: 3, status: "Active" },
];

export default function HRAdminPage({ defaultTab }) {
  const showToast = useAppStore((s) => s.showToast);
  const rawEmployees = useAppStore((s) => s.employees || []);
  const employees = useMemo(() => {
    const seen = new Set();
    return rawEmployees.filter((emp) => {
      const emailKey = (emp.email || "").toLowerCase().trim();
      const codeKey = (emp.employeeCode || emp.empId || emp.employee_code || "").toLowerCase().trim();
      const nameKey = (emp.name || "").toLowerCase().trim();
      const idKey = (emp.id || "").toLowerCase().trim();
      const dedupeKey = emailKey || codeKey || nameKey || idKey;
      if (!dedupeKey || seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
  }, [rawEmployees]);
  const currentUser = useAppStore((s) => s.currentUser);
  // Backend gates work-schedule + holiday writes on `edit_staff`
  // (WorkingDayView / HolidayViewSet permission_map); mirror that here so
  // read-only staff get disabled controls instead of silent failures.
  const canEditOrg = sessionCan("edit_staff");
  const { companyProfile, setCompanyProfile } = useERP();
  const { candidates, offers, addOffer, updateOffer, deleteOffer } = useRecruitmentStore();
  const updateEmployeeStatus = useAppStore((s) => s.updateEmployeeStatus);
  const addCalendarEvent = useCalendarStore((s) => s.addEvent);
  const deleteCalendarEvent = useCalendarStore((s) => s.deleteEvent);
  const calendarEvents = useCalendarStore((s) => s.events || []);

  // Leave Governance & Carry-Forward Policies
  const sandwichRuleEnabled = useAppStore((s) => s.sandwichRuleEnabled);
  const toggleSandwichRule = useAppStore((s) => s.toggleSandwichRule);
  const maxCarryForwardDays = useAppStore((s) => s.maxCarryForwardDays);
  const setMaxCarryForwardDays = useAppStore((s) => s.setMaxCarryForwardDays);
  const executeCarryForwardRollover = useAppStore((s) => s.executeCarryForwardRollover);
  const carriedForwardLeaves = useAppStore((s) => s.carriedForwardLeaves);

  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || defaultTab || "teams";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) setActiveTab(tabParam);
    else if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab, searchParams]);

  // Payroll Store Integration for Department Working Days & Hours
  const departmentWorkingDays = usePayrollStore((s) => s.departmentWorkingDays);
  const setDepartmentWorkingDays = usePayrollStore((s) => s.setDepartmentWorkingDays);
  const departmentWorkingHours = usePayrollStore((s) => s.departmentWorkingHours);
  const setDepartmentWorkingHours = usePayrollStore((s) => s.setDepartmentWorkingHours);
  const resetDepartmentWorkingDays = usePayrollStore((s) => s.resetDepartmentWorkingDays);
  const payrollEmployees = usePayrollStore((s) => s.employees || []);

  // Core Data Lists
  // Teams, approval chains and terminations are HRMS collections.
  const [departmentsConfig, setDepartmentsConfig] = useState([]);
  const [fetchedEmployees, setFetchedEmployees] = useState([]);
  const allEmployees = employees && employees.length > 0 ? employees : fetchedEmployees;
  const eligibleEmployees = (allEmployees || []).filter(
    (emp) => emp.status !== "Terminated" && emp.status !== "Resigned"
  );
  const hrDeptOptions = [...new Set([
    ...departmentsConfig.map((d) => d.name),
    ...allEmployees.map((e) => e.department),
  ].filter(Boolean))];
  const [teams, setTeams] = useState([]);
  const [approvalChains, setApprovalChains] = useState(INITIAL_APPROVAL_CHAINS);
  const [terminations, setTerminations] = useState([]);

  useEffect(() => {
    let cancelled = false;
    hrmsSync.pullMany(['teams', 'approvalChains', 'terminations', 'resignations', 'complaints', 'holidays', 'departments', 'employees', 'workSchedules', 'locations'])
      .then((rows) => {
        if (cancelled) return;
        if (rows.employees) setFetchedEmployees(rows.employees);
        if (rows.teams) setTeams(rows.teams);
        if (rows.approvalChains && rows.approvalChains.length > 0) {
          setApprovalChains(rows.approvalChains);
        } else if (isBackendEnabled()) {
          // If server currently has 0 approval chains, sync defaults to backend
          Promise.all(
            INITIAL_APPROVAL_CHAINS.map((c) => hrmsSync.create('approvalChains', c).catch(console.warn))
          ).then((savedList) => {
            if (cancelled) return;
            const valid = (savedList || []).filter(Boolean);
            if (valid.length > 0) setApprovalChains(valid);
          });
        }
        if (rows.terminations) setTerminations(rows.terminations);
        if (rows.resignations) setResignations(rows.resignations);
        if (rows.complaints) setComplaints(rows.complaints);
        if (rows.holidays) {
          const mappedHolidays = (rows.holidays || []).map((h) => {
            const parsedDate = h.date;
            let weekday = h.day;
            try {
              const candidate = new Date(parsedDate);
              if (!Number.isNaN(candidate.getTime())) {
                weekday = candidate.toLocaleDateString("en-US", { weekday: "long" });
              }
            } catch {}
            return {
              ...h,
              id: h.id,
              name: h.name || h.title || "",
              date: parsedDate,
              day: weekday || "",
              type: h.holidayType || h.type || (h.is_optional ? "Optional Holiday" : "National Gazetted"),
              appliesTo: h.appliesTo || (h.departmentName ? `${h.departmentName} Dept` : (h.locationName ? `${h.locationName} Hub` : "All Locations")),
              status: h.status || (
                new Date(parsedDate) >= new Date(new Date().toISOString().split("T")[0])
                  ? "Upcoming"
                  : "Past"
              ),
              departmentId: h.departmentId || "",
              locationId: h.locationId || "",
              description: h.description || "",
            };
          });
          setHolidays(mappedHolidays);
        }
        if (rows.workSchedules) {
          if (rows.workSchedules.length > 0) {
            setWorkSchedules(rows.workSchedules);
          } else if (isBackendEnabled()) {
            const defaultSched = {
              name: "Standard Enterprise Shift",
              code: "SCH-STD-01",
              shiftType: "Regular",
              shiftStart: "09:30",
              shiftEnd: "18:30",
              breakDuration: 60,
              workingHours: 8.0,
              workingDays: [0, 1, 2, 3, 4],
              weeklyOffs: [5, 6],
              isDefault: true,
              status: "Active",
              description: "Standard 8-hour working schedule with 1 hour break across Mon-Fri.",
            };
            hrmsSync.create('workSchedules', defaultSched).then((saved) => {
              if (saved && !cancelled) setWorkSchedules([saved]);
            }).catch(console.warn);
          }
        }
        if (rows.locations) setLocations(rows.locations);
        if (rows.departments) setDepartmentsConfig(rows.departments);
      });
    return () => { cancelled = true; };
  }, []);
  // Offers are owned by the persisted Recruitment offers resource.
  const [resignations, setResignations] = useState([]);
  const [noticeActionModal, setNoticeActionModal] = useState({
    open: false,
    type: 'waive',
    resignation: null,
    date: '',
    reason: '',
    loading: false,
  });
  const [complaints, setComplaints] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [workSchedules, setWorkSchedules] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isWorkScheduleModalOpen, setIsWorkScheduleModalOpen] = useState(false);
  const [editingWorkSchedule, setEditingWorkSchedule] = useState(null);
  const [workScheduleFilter, setWorkScheduleFilter] = useState("all");
  const [workScheduleForm, setWorkScheduleForm] = useState({
    name: "",
    code: "",
    shiftType: "Regular",
    shiftStart: "09:30",
    shiftEnd: "18:30",
    breakDuration: 60,
    workingHours: 8.0,
    workingDays: [0, 1, 2, 3, 4],
    weeklyOffs: [5, 6],
    scopeType: "default",
    departmentId: "",
    teamId: "",
    locationId: "",
    isDefault: true,
    effectiveFrom: "",
    effectiveTo: "",
    description: "",
  });
  const [holidayYearFilter, setHolidayYearFilter] = useState("all");
  const [holidayDeptFilter, setHolidayDeptFilter] = useState("all");

  // Upgradation Scope: Announcements & Travel Requisitions (§2.5.5)
  const [announcements, setAnnouncements] = useState([]);
  const [travelRequests, setTravelRequests] = useState([]);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [isTravelModalOpen, setIsTravelModalOpen] = useState(false);
  const [isSettleTravelModalOpen, setIsSettleTravelModalOpen] = useState(false);
  const [settleTravelData, setSettleTravelData] = useState({
    id: "",
    travel_number: "",
    employeeName: "",
    advance_requested: 0,
    advance_disbursed: 0,
    actual_expenses: 0,
    settlement_notes: "",
  });
  const [announcementPriorityFilter, setAnnouncementPriorityFilter] = useState("all");
  const [announcementStatusFilter, setAnnouncementStatusFilter] = useState("all");
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [travelStatusFilter, setTravelStatusFilter] = useState("all");
  const [travelSearch, setTravelSearch] = useState("");
  const [viewingComplaint, setViewingComplaint] = useState(null);
  const [complaintCommentText, setComplaintCommentText] = useState("");
  const [complaintResolutionText, setComplaintResolutionText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isResolvingComplaint, setIsResolvingComplaint] = useState(false);


  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    priority: "Medium",
    is_pinned: false,
    publish_date: isoToday(),
    expiry_date: isoInDays(30),
    author_name: currentUser?.name || "HR Department",
    targetDepartmentId: null,
  });

  const [newTravel, setNewTravel] = useState({
    employeeId: "",
    purpose: "",
    destination: "",
    start_date: isoToday(),
    end_date: isoInDays(3),
    advance_requested: 0,
    status: "Submitted",
  });

  const loadAnnouncementsAndTravel = () => {
    fetchAnnouncements()
      .then((res) => {
        const list = res?.data || res?.results || res || [];
        if (Array.isArray(list)) setAnnouncements(list);
      })
      .catch(() => {});
    fetchTravelRequests()
      .then((res) => {
        const list = res?.data || res?.results || res || [];
        if (Array.isArray(list)) setTravelRequests(list);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAnnouncementsAndTravel();
  }, []);

  const handleOpenAddAnnouncement = () => {
    setEditingAnnouncement(null);
    setNewAnnouncement({
      title: "",
      content: "",
      priority: "Medium",
      is_pinned: false,
      publish_date: isoToday(),
      expiry_date: isoInDays(30),
      author_name: currentUser?.name || "HR Department",
      targetDepartmentId: null,
    });
    setIsAnnouncementModalOpen(true);
  };

  const handleEditAnnouncement = (ann) => {
    setEditingAnnouncement(ann);
    setNewAnnouncement({
      title: ann.title || "",
      content: ann.content || "",
      priority: ann.priority || "Medium",
      is_pinned: Boolean(ann.is_pinned),
      publish_date: ann.publish_date || isoToday(),
      expiry_date: ann.expiry_date || isoInDays(30),
      author_name: ann.author_name || currentUser?.name || "HR Department",
      targetDepartmentId: ann.targetDepartmentId || null,
    });
    setIsAnnouncementModalOpen(true);
  };

  const handleCreateAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) {
      showToast("Title and content are required", "error");
      return;
    }
    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, newAnnouncement);
        showToast("Announcement updated successfully", "success");
      } else {
        const created = await createAnnouncement(newAnnouncement);
        showToast("Announcement published successfully", "success");
        try {
          dispatchNotification({
            id: `announcement-${created?.id || Date.now()}`,
            title: `New Announcement: ${newAnnouncement.title}`,
            message: newAnnouncement.content,
            category: "hrms",
            entityType: "ANNOUNCEMENT",
            createdAt: new Date().toISOString(),
            status: "unread",
            path: "/hrms/hr-admin?tab=announcements",
          });
        } catch {}
      }
      setIsAnnouncementModalOpen(false);
      setEditingAnnouncement(null);
      setNewAnnouncement({
        title: "",
        content: "",
        priority: "Medium",
        is_pinned: false,
        publish_date: isoToday(),
        expiry_date: isoInDays(30),
        author_name: currentUser?.name || "HR Department",
        targetDepartmentId: null,
      });
      loadAnnouncementsAndTravel();
    } catch (err) {
      showToast(err?.message || "Failed to save announcement", "error");
    }
  };

  const handleDeleteAnnouncement = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete announcement "${title}"?`)) {
      try {
        await deleteAnnouncement(id);
        showToast(`Announcement "${title}" removed`);
        loadAnnouncementsAndTravel();
      } catch (err) {
        showToast(err?.message || "Failed to delete announcement", "error");
      }
    }
  };

  const handleTogglePinAnnouncement = async (ann) => {
    try {
      await updateAnnouncement(ann.id, { is_pinned: !ann.is_pinned });
      showToast(ann.is_pinned ? "Announcement unpinned" : "Announcement pinned to top");
      loadAnnouncementsAndTravel();
    } catch (err) {
      showToast(err?.message || "Failed to update pin status", "error");
    }
  };

  const handlePublishAnnouncement = async (ann) => {
    try {
      await publishAnnouncement(ann.id);
      showToast(`Announcement "${ann.title}" published`, "success");
      try {
        dispatchNotification({
          id: `announcement-${ann.id || Date.now()}`,
          title: `Announcement: ${ann.title}`,
          message: ann.content,
          category: "hrms",
          entityType: "ANNOUNCEMENT",
          createdAt: new Date().toISOString(),
          status: "unread",
          path: "/hrms/hr-admin?tab=announcements",
        });
      } catch {}
      loadAnnouncementsAndTravel();
    } catch (err) {
      try {
        await updateAnnouncement(ann.id, { status: "Published" });
        showToast(`Announcement "${ann.title}" published`, "success");
        try {
          dispatchNotification({
            id: `announcement-${ann.id || Date.now()}`,
            title: `Announcement: ${ann.title}`,
            message: ann.content,
            category: "hrms",
            entityType: "ANNOUNCEMENT",
            createdAt: new Date().toISOString(),
            status: "unread",
            path: "/hrms/hr-admin?tab=announcements",
          });
        } catch {}
        loadAnnouncementsAndTravel();
      } catch (err2) {
        showToast(err?.message || err2?.message || "Failed to publish announcement", "error");
      }
    }
  };

  const handleArchiveAnnouncement = async (ann) => {
    try {
      await archiveAnnouncement(ann.id);
      showToast(`Announcement "${ann.title}" archived`);
      loadAnnouncementsAndTravel();
    } catch (err) {
      try {
        await updateAnnouncement(ann.id, { status: "Archived" });
        showToast(`Announcement "${ann.title}" archived`);
        loadAnnouncementsAndTravel();
      } catch (err2) {
        showToast(err?.message || err2?.message || "Failed to archive announcement", "error");
      }
    }
  };

  const handleCreateTravelSubmit = async (e) => {
    e.preventDefault();
    if (!newTravel.employeeId || !newTravel.destination) {
      showToast("Employee and destination are required", "error");
      return;
    }
    try {
      await createTravelRequest(newTravel);
      showToast("Travel requisition submitted successfully", "success");
      setIsTravelModalOpen(false);
      setNewTravel({
        employeeId: "",
        purpose: "",
        destination: "",
        start_date: isoToday(),
        end_date: isoInDays(3),
        advance_requested: 0,
        status: "Submitted",
      });
      loadAnnouncementsAndTravel();
    } catch (err) {
      showToast(err?.message || "Failed to submit travel request", "error");
    }
  };

  const handleApproveTravel = async (id) => {
    try {
      await approveTravelRequest(id);
      showToast("Travel requisition approved", "success");
      loadAnnouncementsAndTravel();
    } catch (err) {
      try {
        await updateTravelRequest(id, { status: "Approved" });
        showToast("Travel requisition approved", "success");
        loadAnnouncementsAndTravel();
      } catch (err2) {
        showToast(err?.message || err2?.message || "Failed to approve travel request", "error");
      }
    }
  };

  const handleRejectTravel = async (id) => {
    const reason = window.prompt("Reason for rejecting travel requisition (optional):", "Schedule/budget constraint") ?? "";
    try {
      await rejectTravelRequest(id, reason);
      showToast("Travel requisition rejected");
      loadAnnouncementsAndTravel();
    } catch (err) {
      try {
        await updateTravelRequest(id, { status: "Rejected" });
        showToast("Travel requisition rejected");
        loadAnnouncementsAndTravel();
      } catch (err2) {
        showToast(err?.message || err2?.message || "Failed to reject travel request", "error");
      }
    }
  };

  const handleOpenSettleTravel = (trv) => {
    setSettleTravelData({
      id: trv.id,
      travel_number: trv.travel_number || `TRV-${trv.id?.slice(0, 6)}`,
      employeeName: trv.employeeName || "Employee",
      advance_requested: trv.advance_requested || 0,
      advance_disbursed: trv.advance_disbursed || trv.advance_requested || 0,
      actual_expenses: trv.actual_expenses || trv.advance_requested || 0,
      settlement_notes: trv.settlement_notes || "",
    });
    setIsSettleTravelModalOpen(true);
  };

  const handleSettleTravelSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        advance_disbursed: Number(settleTravelData.advance_disbursed) || 0,
        actual_expenses: Number(settleTravelData.actual_expenses) || 0,
        settlement_notes: settleTravelData.settlement_notes || "",
      };
      try {
        await settleTravelRequest(settleTravelData.id, payload);
      } catch {
        await updateTravelRequest(settleTravelData.id, {
          status: "Settled",
          ...payload,
        });
      }
      showToast("Travel expense claim settled successfully", "success");
      setIsSettleTravelModalOpen(false);
      loadAnnouncementsAndTravel();
    } catch (err) {
      showToast(err?.message || "Failed to settle travel request", "error");
    }
  };

  const reloadComplaints = () => {
    hrmsSync.pull('complaints')
      .then((rows) => {
        if (Array.isArray(rows)) {
          setComplaints(rows);
          setViewingComplaint((prev) => {
            if (!prev) return null;
            return rows.find((r) => r.id === prev.id) || prev;
          });
        }
      })
      .catch(console.warn);
  };

  const handleAddComplaintComment = async (e) => {
    e.preventDefault();
    if (!complaintCommentText.trim() || !viewingComplaint) return;
    setIsSubmittingComment(true);
    try {
      const res = await addComplaintComment(viewingComplaint.id, complaintCommentText.trim());
      showToast("Investigation note recorded", "success");
      setComplaintCommentText("");
      if (res?.comments) {
        setViewingComplaint((prev) => ({ ...prev, comments: res.comments }));
        setComplaints((prev) =>
          prev.map((c) => (c.id === viewingComplaint.id ? { ...c, comments: res.comments } : c))
        );
      }
      reloadComplaints();
    } catch (err) {
      showToast(err?.message || "Failed to record comment", "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleResolveComplaint = async (e) => {
    e.preventDefault();
    if (!viewingComplaint) return;
    setIsResolvingComplaint(true);
    const resolution = complaintResolutionText.trim() || "Resolved following internal inquiry.";
    try {
      const res = await resolveComplaint(viewingComplaint.id, resolution);
      showToast(`Grievance ${viewingComplaint.id} resolved`, "success");
      setComplaintResolutionText("");
      if (res) {
        const updatedStatus = res.status || "Resolved";
        const updatedResolution = res.resolution || resolution;
        setViewingComplaint((prev) => ({
          ...prev,
          status: updatedStatus,
          resolution: updatedResolution,
        }));
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === viewingComplaint.id
              ? { ...c, status: updatedStatus, resolution: updatedResolution }
              : c
          )
        );
      }
      reloadComplaints();
    } catch (err) {
      showToast(err?.message || "Failed to resolve grievance", "error");
    } finally {
      setIsResolvingComplaint(false);
    }
  };


  const handleDeleteTravel = async (id, travelNumber) => {
    if (window.confirm(`Are you sure you want to remove travel requisition "${travelNumber || id}"?`)) {
      try {
        await deleteTravelRequest(id);
        showToast("Travel requisition removed");
        loadAnnouncementsAndTravel();
      } catch (err) {
        showToast(err?.message || "Failed to delete travel request", "error");
      }
    }
  };

  // Search & Filters for each tab
  const [search, setSearch] = useState("");
  const [teamDeptFilter, setTeamDeptFilter] = useState("all");
  const [teamViewMode, setTeamViewMode] = useState("table"); // 'table' | 'by-dept'
  const [showDeptStaffRoster, setShowDeptStaffRoster] = useState(true);
  const [chainStatusFilter, setChainStatusFilter] = useState("all");
  const [offerStatusFilter, setOfferStatusFilter] = useState("all");
  const [terminationFilter, setTerminationFilter] = useState("all");
  const [resignationFilter, setResignationFilter] = useState("all");
  const [complaintPriorityFilter, setComplaintPriorityFilter] = useState("all");
  const [holidayFilter, setHolidayFilter] = useState("all");

  // Quick Action Dropdown State
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const quickActionRef = useRef(null);
  const terminationEmpDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (quickActionRef.current && !quickActionRef.current.contains(e.target)) {
        setIsQuickActionOpen(false);
      }
      if (terminationEmpDropdownRef.current && !terminationEmpDropdownRef.current.contains(e.target)) {
        setIsTerminationEmpDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Letter & Offer Modals State
  const [activeTerminationLetter, setActiveTerminationLetter] = useState(null);
  const [isTerminationLetterModalOpen, setIsTerminationLetterModalOpen] = useState(false);
  const [terminationInitialEdit, setTerminationInitialEdit] = useState(false);
  const [terminationAutoPrint, setTerminationAutoPrint] = useState(false);
  const [terminationEmpSearch, setTerminationEmpSearch] = useState("");
  const [isTerminationEmpDropdownOpen, setIsTerminationEmpDropdownOpen] = useState(false);
  const [activeOfferLetter, setActiveOfferLetter] = useState(null);
  const [isOfferLetterModalOpen, setIsOfferLetterModalOpen] = useState(false);
  const [offerLetterInitialEdit, setOfferLetterInitialEdit] = useState(false);
  const [offerLetterAutoPrint, setOfferLetterAutoPrint] = useState(false);
  const [isGenerateOfferModalOpen, setIsGenerateOfferModalOpen] = useState(false);

  // Grievance Status Change State
  const [statusChangeComplaint, setStatusChangeComplaint] = useState(null);
  const [newComplaintStatus, setNewComplaintStatus] = useState("Under Review");
  const [statusChangeNote, setStatusChangeNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Modals (Add / Edit)
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [newTeam, setNewTeam] = useState({
    code: "",
    name: "",
    dept: "",
    departmentId: "",
    lead: "",
    leadId: "",
    approver: "",
    approverId: "",
    description: "",
    memberIds: [],
  });
  const [teamMemberSearch, setTeamMemberSearch] = useState("");
  const [isTeamDetailsModalOpen, setIsTeamDetailsModalOpen] = useState(false);
  const [activeTeamDetails, setActiveTeamDetails] = useState(null);
  const [selectedNewMemberId, setSelectedNewMemberId] = useState("");
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [teamFormError, setTeamFormError] = useState("");
  const [isRosterActionLoading, setIsRosterActionLoading] = useState(false);

  const [isChainModalOpen, setIsChainModalOpen] = useState(false);
  const [editingChain, setEditingChain] = useState(null);
  const [newChain, setNewChain] = useState({ module: "Leave Management", tier1: "", tier2: "", tier3: "—", autoEscalateDays: 3, status: "Active" });

  const [isTerminationModalOpen, setIsTerminationModalOpen] = useState(false);
  const [newTermination, setNewTermination] = useState({
    employee: "",
    employeeId: "",
    dept: "",
    role: "",
    terminationType: "Involuntary (Performance)",
    noticeDate: isoToday(),
    exitDate: isoInDays(30),
    severance: "1 Month Gross",
    reason: "",
  });

  const [isResignationModalOpen, setIsResignationModalOpen] = useState(false);
  const [newResignation, setNewResignation] = useState({
    employee: "",
    employeeId: "",
    dept: "",
    role: "",
    submittedDate: isoToday(),
    lastWorkingDay: isoInDays(60),
    noticePeriod: "60 Days",
    handoverTo: "",
    reason: "",
  });

  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    complainant: "",
    against: "",
    category: "Workplace Harassment / POSH",
    priority: "High",
    assignedInvestigator: "",
    summary: "",
  });

  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: isoToday(),
    day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
    type: "National Gazetted",
    appliesTo: "All Locations",
  });

  // Org Settings State
  const [orgSettings, setOrgSettings] = useState({
    companyName: companyProfile?.name || "",
    workWeek: "Monday - Friday (5 Days)",
    timezone: "IST (UTC +05:30) — Asia/Kolkata",
    fiscalYearStart: "April 01",
    probationPeriod: "90 Days (3 Months)",
    noticePeriod: "60 Days (2 Months)",
    allowEmployeeDelegation: true,
    requireTwoFactorForAdmin: true,
    sandwichRuleEnabled: true,
    gracePeriodEnabled: true,
    maxCarryForwardDays: 15,
  });

  const [ruleSearchQuery, setRuleSearchQuery] = useState("");
  const [ruleFilterStatus, setRuleFilterStatus] = useState("all");
  const [ruleFilterCategory, setRuleFilterCategory] = useState("all");

  const handleToggleGovernanceRule = (toggleKey, currentValue) => {
    const nextVal = !currentValue;
    setOrgSettings((prev) => ({ ...prev, [toggleKey]: nextVal }));
    if (toggleKey === "sandwichRuleEnabled" && typeof toggleSandwichRule === "function") {
      toggleSandwichRule(nextVal);
    }
    showToast(`Governance rule updated: ${nextVal ? "Running / Active" : "Paused / Inactive"}`);
  };

  const scrollToRuleField = (fieldName) => {
    const el = document.getElementById(`org-input-${fieldName}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
      el.classList.add("ring-2", "ring-navy");
      setTimeout(() => el.classList.remove("ring-2", "ring-navy"), 2000);
    }
  };

  const allGovernanceRules = useMemo(() => {
    return [
      {
        id: "sandwich-rule",
        name: "Sandwich Leave Deduction Rule",
        category: "Attendance & Leaves",
        description: "Treats weekends and public holidays falling between two approved leave dates as consumed paid leaves.",
        scope: "All Regular & Contract Staff",
        parameter: (orgSettings.sandwichRuleEnabled ?? true) ? "Enforced: Intervening holidays/weekends deducted as leave" : "Disabled: Only requested working days deducted",
        isActive: orgSettings.sandwichRuleEnabled ?? true,
        isToggleable: true,
        toggleKey: "sandwichRuleEnabled",
        icon: CalendarCheck,
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      {
        id: "2fa-rule",
        name: "Mandatory 2FA for Admin Accounts",
        category: "Security & Access",
        description: "Enforces Two-Factor Authentication (TOTP / OTP) for HR and Operations Admin accounts before granting access.",
        scope: "HR Admins & Operations Admins",
        parameter: (orgSettings.requireTwoFactorForAdmin ?? true) ? "Enforced: Multi-factor verification required on login" : "Optional: Standard single-factor password sign-in",
        isActive: orgSettings.requireTwoFactorForAdmin ?? true,
        isToggleable: true,
        toggleKey: "requireTwoFactorForAdmin",
        icon: ShieldCheck,
        badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        id: "peer-delegation",
        name: "Peer Handover & Leave Delegation",
        category: "Workflow & Delegation",
        description: "Allows employees submitting leave requests to nominate an active peer delegate within the department to handle responsibilities.",
        scope: "All Department Employees",
        parameter: (orgSettings.allowEmployeeDelegation ?? true) ? "Enabled: Peer handover required during leave requests" : "Disabled: Direct escalation to reporting manager only",
        isActive: orgSettings.allowEmployeeDelegation ?? true,
        isToggleable: true,
        toggleKey: "allowEmployeeDelegation",
        icon: Users,
        badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      },
      {
        id: "shift-grace-rule",
        name: "Shift Grace Period & Lateness Tolerance",
        category: "Attendance & Leaves",
        description: "Provides a 15-minute grace tolerance for employee punch-ins against designated shift start time before marking late entry.",
        scope: "All Shift-Assigned Staff",
        parameter: (orgSettings.gracePeriodEnabled ?? true) ? "Active: 15-min tolerance window before deduction" : "Strict: Zero-tolerance, punches past shift start marked late",
        isActive: orgSettings.gracePeriodEnabled ?? true,
        isToggleable: true,
        toggleKey: "gracePeriodEnabled",
        icon: Clock,
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      },
      {
        id: "carry-forward",
        name: "Annual Leave Carry-Forward Limit",
        category: "Attendance & Leaves",
        description: "Restricts the maximum number of unused earned leaves that roll over into the subsequent fiscal cycle.",
        scope: "Confirmed Employees",
        parameter: `Capped at ${orgSettings.maxCarryForwardDays ?? 15} Days / Year (excess lapsed or encashed)`,
        isActive: (orgSettings.maxCarryForwardDays ?? 15) > 0,
        isToggleable: false,
        configTarget: "maxCarryForwardDays",
        icon: RotateCw,
        badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
      },
      {
        id: "probation-period",
        name: "Standard Probation & Assessment Window",
        category: "Hiring & Onboarding",
        description: "Mandatory trial evaluation period for newly onboarded staff before formal employment confirmation.",
        scope: "New Joiners & Trainees",
        parameter: `${orgSettings.probationPeriod || "90 Days"} evaluation cycle before confirmation review`,
        isActive: Boolean(orgSettings.probationPeriod),
        isToggleable: false,
        configTarget: "probationPeriod",
        icon: Briefcase,
        badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
      },
      {
        id: "notice-period",
        name: "Standard Notice Period & Clearance",
        category: "Separations & Exits",
        description: "Enforces mandatory advance service notice period for resignation and standard exit clearance.",
        scope: "Confirmed Employees",
        parameter: `${orgSettings.noticePeriod || "60 Days"} formal notice window required`,
        isActive: Boolean(orgSettings.noticePeriod),
        isToggleable: false,
        configTarget: "noticePeriod",
        icon: UserMinus,
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
      },
      {
        id: "work-week",
        name: "Standard Work Week & Weekend Off Policy",
        category: "Operations & Schedule",
        description: "Defines enterprise regular operational days and weekly offs driving attendance schedules and overtime.",
        scope: "Organization-Wide",
        parameter: `${orgSettings.workWeek || "Monday - Friday (5 Days)"}`,
        isActive: Boolean(orgSettings.workWeek),
        isToggleable: false,
        configTarget: "workWeek",
        icon: Calendar,
        badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
      },
      {
        id: "dept-working-days",
        name: "Department Working Days & Payroll Rate Policy",
        category: "Operations & Schedule",
        description: "Custom monthly working days and daily operational hours configured per department, governing payroll rate calculation.",
        scope: `${departmentsConfig.length} Configured Departments`,
        parameter: `${departmentsConfig.length} Departments active with operational schedules`,
        isActive: departmentsConfig.length > 0,
        isToggleable: false,
        actionTab: "working-days",
        actionLabel: "View Schedule",
        icon: Building2,
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      {
        id: "approval-workflows",
        name: "Multi-Tier Approval Hierarchy & Escalations",
        category: "Workflow & Delegation",
        description: "Hierarchical approval workflows with multi-level reviewers for Leaves, Reimbursements, and Travel requests.",
        scope: `${approvalChains.length} Active Workflows`,
        parameter: `${approvalChains.length} Workflows running with automatic escalation rules`,
        isActive: approvalChains.length > 0,
        isToggleable: false,
        actionTab: "approvals",
        actionLabel: "View Workflows",
        icon: Shield,
        badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        id: "fiscal-year",
        name: "Fiscal Year Cycle & Financial Alignment",
        category: "Compliance & Payroll",
        description: "Standard financial calendar boundary for payroll tax computations and annual leave balance reset.",
        scope: "Statutory Compliance",
        parameter: `Cycle begins ${orgSettings.fiscalYearStart || "April 01"}`,
        isActive: Boolean(orgSettings.fiscalYearStart),
        isToggleable: false,
        configTarget: "fiscalYearStart",
        icon: Sliders,
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      },
      {
        id: "timezone-alignment",
        name: "Enterprise Timezone & Punch Synchronization",
        category: "Operations & Schedule",
        description: "Canonical timezone reference for attendance punch timestamps, shift windows, and audit records.",
        scope: "All System Logs & Punches",
        parameter: `${orgSettings.timezone || "IST (UTC +05:30) — Asia/Kolkata"}`,
        isActive: Boolean(orgSettings.timezone),
        isToggleable: false,
        configTarget: "timezone",
        icon: Clock,
        badgeBg: "bg-slate-100 text-slate-700 border-slate-300",
      },
    ];
  }, [orgSettings, departmentsConfig, approvalChains]);

  const activeRulesCount = allGovernanceRules.filter((r) => r.isActive).length;
  const totalRulesCount = allGovernanceRules.length;
  const inactiveRulesCount = totalRulesCount - activeRulesCount;

  const filteredGovernanceRules = useMemo(() => {
    return allGovernanceRules.filter((rule) => {
      if (ruleFilterStatus === "active" && !rule.isActive) return false;
      if (ruleFilterStatus === "inactive" && rule.isActive) return false;
      if (ruleFilterCategory !== "all" && rule.category !== ruleFilterCategory) return false;
      if (ruleSearchQuery.trim()) {
        const q = ruleSearchQuery.toLowerCase();
        const matchesName = rule.name.toLowerCase().includes(q);
        const matchesDesc = rule.description.toLowerCase().includes(q);
        const matchesScope = rule.scope.toLowerCase().includes(q);
        const matchesParam = rule.parameter.toLowerCase().includes(q);
        const matchesCat = rule.category.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesScope || matchesParam || matchesCat;
      }
      return true;
    });
  }, [allGovernanceRules, ruleFilterStatus, ruleFilterCategory, ruleSearchQuery]);

  useEffect(() => {
    if (!isBackendEnabled()) return;
    let cancelled = false;
    pullHrmsSettings()
      .then((res) => {
        if (cancelled) return;
        const data = res?.data ?? res?.value ?? res;
        if (data && typeof data === "object" && !Array.isArray(data)) {
          setOrgSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // ── Team Handlers ──────────────────────────────────────────
  const handleOpenAddTeam = (prefillDept) => {
    if (!canEditOrg) {
      showToast("You do not have permission to create teams (edit_staff required)", "error");
      return;
    }
    setEditingTeam(null);
    setTeamFormError("");
    setTeamMemberSearch("");
    const targetDept =
      (typeof prefillDept === "string" && prefillDept !== "all" && prefillDept) ||
      (teamDeptFilter !== "all" ? teamDeptFilter : (departmentsConfig[0]?.name || hrDeptOptions[0] || ""));
    const matchedDept = departmentsConfig.find(
      (d) => d.name === targetDept || d.id === targetDept
    );
    setNewTeam({
      code: "",
      name: "",
      dept: matchedDept?.name || targetDept || "",
      departmentId: matchedDept?.id || "",
      secondaryDept: "",
      lead: "",
      leadId: "",
      approver: "",
      approverId: "",
      description: "",
      memberIds: [],
    });
    setIsTeamModalOpen(true);
  };

  const handleOpenEditTeam = (team) => {
    if (!canEditOrg) {
      showToast("You do not have permission to edit teams (edit_staff required)", "error");
      return;
    }
    setEditingTeam(team);
    setTeamFormError("");
    setTeamMemberSearch("");
    const matchedDept = departmentsConfig.find(
      (d) => d.id === team.departmentId || String(d.name).toLowerCase() === String(team.dept || team.department || "").toLowerCase()
    );
    const existingMemberIds = Array.isArray(team.memberIds) && team.memberIds.length > 0
      ? team.memberIds
      : Array.isArray(team.membersDetail) && team.membersDetail.length > 0
        ? team.membersDetail.map((m) => m.id)
        : [];
    setNewTeam({
      code: team.code || team.teamCode || team.id || "",
      name: team.name || "",
      dept: team.dept || team.department || matchedDept?.name || "",
      departmentId: team.departmentId || matchedDept?.id || "",
      secondaryDept: team.secondaryDept || "",
      lead: team.lead || team.leadName || "",
      leadId: team.leadId || "",
      approver: team.approver || team.approverName || "",
      approverId: team.approverId || "",
      description: team.description || "",
      memberIds: existingMemberIds,
    });
    setIsTeamModalOpen(true);
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!canEditOrg) {
      showToast("You do not have permission to save teams (edit_staff required)", "error");
      return;
    }
    const trimmedName = (newTeam.name || "").trim();
    if (!trimmedName) {
      setTeamFormError("Team name is required.");
      return;
    }
    const trimmedCode = (newTeam.code || "").trim();
    if (trimmedCode) {
      const codeDuplicate = teams.find(
        (t) =>
          ((t.code && String(t.code).toLowerCase() === trimmedCode.toLowerCase()) ||
           (t.id && String(t.id).toLowerCase() === trimmedCode.toLowerCase())) &&
          (!editingTeam || t.id !== editingTeam.id)
      );
      if (codeDuplicate) {
        setTeamFormError(`Team ID/Code "${trimmedCode}" is already assigned to another team.`);
        return;
      }
    }

    setTeamFormError("");
    setIsSavingTeam(true);

    const matchedDept = departmentsConfig.find(
      (d) => (newTeam.departmentId && d.id === newTeam.departmentId) || String(d.name).toLowerCase() === String(newTeam.dept || "").toLowerCase()
    );
    const leadEmployee = eligibleEmployees.find(
      (emp) => (newTeam.leadId && emp.id === newTeam.leadId) || String(emp.name).toLowerCase() === String(newTeam.lead || "").toLowerCase()
    );
    const apprEmployee = eligibleEmployees.find(
      (emp) => (newTeam.approverId && emp.id === newTeam.approverId) || String(emp.name).toLowerCase() === String(newTeam.approver || "").toLowerCase()
    );

    const memberIds = Array.isArray(newTeam.memberIds) ? newTeam.memberIds : [];
    const teamDeptName = matchedDept?.name || newTeam.dept;
    const membersDetail = eligibleEmployees
      .filter((emp) => memberIds.includes(emp.id))
      .map((emp) => {
        const empDepts = new Set([
          emp.department,
          emp.dept,
          teamDeptName,
          newTeam.secondaryDept,
        ].filter(Boolean));
        return {
          id: emp.id,
          name: emp.name,
          employeeCode: emp.employeeCode || emp.empId || "",
          department: emp.department || teamDeptName || "",
          departments: Array.from(empDepts),
          isMultiDept: empDepts.size > 1,
          designation: emp.designation || emp.role || "",
          status: emp.status || "Active",
        };
      });

    const payload = {
      code: trimmedCode || undefined,
      name: trimmedName,
      dept: teamDeptName,
      department: teamDeptName,
      departmentId: matchedDept?.id || newTeam.departmentId || undefined,
      secondaryDept: (newTeam.secondaryDept || "").trim() || undefined,
      lead: leadEmployee?.name || newTeam.lead,
      leadId: leadEmployee?.id || newTeam.leadId || undefined,
      leadName: leadEmployee?.name || newTeam.lead,
      approver: apprEmployee?.name || newTeam.approver,
      approverId: apprEmployee?.id || newTeam.approverId || undefined,
      approverName: apprEmployee?.name || newTeam.approver,
      description: (newTeam.description || "").trim(),
      memberIds,
      members: memberIds.length,
      headcount: memberIds.length,
      memberCount: memberIds.length,
      membersDetail,
    };

    try {
      if (editingTeam) {
        setTeams((prev) =>
          prev.map((t) => (t.id === editingTeam.id ? { ...t, ...payload, id: editingTeam.id } : t))
        );
        if (isBackendEnabled()) {
          const saved = await hrmsSync.update("teams", editingTeam.id, payload);
          if (saved?.id) {
            setTeams((prev) =>
              prev.map((t) => (t.id === editingTeam.id ? { ...t, ...saved } : t))
            );
            if (activeTeamDetails?.id === editingTeam.id) {
              setActiveTeamDetails((prev) => ({ ...prev, ...saved }));
            }
          }
        }
        showToast(`Team "${trimmedName}" updated successfully`);
      } else {
        const tempId = trimmedCode || `T-0${teams.length + 1}`;
        const created = { id: tempId, ...payload };
        setTeams((prev) => [...prev, created]);
        if (isBackendEnabled()) {
          const saved = await hrmsSync.create("teams", payload);
          if (saved?.id) {
            setTeams((prev) =>
              prev.map((t) => (t.id === tempId ? { ...created, ...saved } : t))
            );
          }
        }
        showToast(`Team "${trimmedName}" created successfully`);
      }
      setIsTeamModalOpen(false);
      setEditingTeam(null);
    } catch (err) {
      console.warn("Failed to save team:", err);
      const msg = err?.message || err?.detail || "Failed to save team. Please check your inputs.";
      setTeamFormError(msg);
      showToast(msg, "error");
    } finally {
      setIsSavingTeam(false);
    }
  };

  const handleDeleteTeam = async (id, name) => {
    if (!canEditOrg) {
      showToast("You do not have permission to delete teams (edit_staff required)", "error");
      return;
    }
    const team = teams.find((t) => t.id === id);
    const count = Number(team?.memberCount ?? team?.headcount ?? (Array.isArray(team?.membersDetail) ? team.membersDetail.length : 0)) || 0;
    const warningMsg = count > 0
      ? `Team "${name}" currently has ${count} assigned staff member(s).\nRemoving this team will safely detach all member assignments without altering employee records.\n\nAre you sure you want to proceed?`
      : `Are you sure you want to remove team "${name}"?`;

    if (!window.confirm(warningMsg)) return;

    const prevTeams = [...teams];
    setTeams((prev) => prev.filter((t) => t.id !== id));
    if (activeTeamDetails?.id === id) {
      setIsTeamDetailsModalOpen(false);
      setActiveTeamDetails(null);
    }

    if (isBackendEnabled()) {
      try {
        await hrmsSync.remove("teams", id);
        showToast(`Team "${name}" removed`);
      } catch (err) {
        console.warn("Failed to delete team:", err);
        setTeams(prevTeams);
        showToast(err?.message || "Failed to delete team from server", "error");
      }
    } else {
      showToast(`Team "${name}" removed`);
    }
  };

  const handleOpenViewTeamDetails = (team) => {
    const fullTeam = teams.find((t) => t.id === team.id) || team;
    setActiveTeamDetails(fullTeam);
    setSelectedNewMemberId("");
    setIsTeamDetailsModalOpen(true);
  };

  const handleAddMemberToTeam = async (e) => {
    e?.preventDefault();
    if (!canEditOrg) {
      showToast("You do not have permission to modify team members (edit_staff required)", "error");
      return;
    }
    if (!activeTeamDetails || !selectedNewMemberId) return;

    const emp = eligibleEmployees.find((e) => e.id === selectedNewMemberId);
    if (!emp) return;

    setIsRosterActionLoading(true);
    try {
      if (isBackendEnabled()) {
        const updatedTeam = await addTeamMember(activeTeamDetails.id, emp.id);
        if (updatedTeam?.id) {
          const normalized = hrmsSync.adapters?.teams?.fromApi ? hrmsSync.adapters.teams.fromApi(updatedTeam) : updatedTeam;
          setActiveTeamDetails(normalized);
          setTeams((prev) => prev.map((t) => (t.id === activeTeamDetails.id ? { ...t, ...normalized } : t)));
        } else {
          const currentDetail = activeTeamDetails.membersDetail || [];
          const teamDept = activeTeamDetails.dept || activeTeamDetails.department;
          const empDepts = new Set([
            emp.department,
            emp.dept,
            teamDept,
            activeTeamDetails.secondaryDept,
          ].filter(Boolean));
          const newMember = {
            id: emp.id,
            name: emp.name,
            employeeCode: emp.employeeCode || emp.empId || "",
            department: emp.department || teamDept || "",
            departments: Array.from(empDepts),
            isMultiDept: empDepts.size > 1,
            designation: emp.designation || emp.role || "",
            status: emp.status || "Active",
          };
          const nextDetails = {
            ...activeTeamDetails,
            membersDetail: [...currentDetail, newMember],
            memberIds: [...(activeTeamDetails.memberIds || []), emp.id],
            headcount: (activeTeamDetails.headcount || 0) + 1,
            memberCount: (activeTeamDetails.memberCount || 0) + 1,
          };
          setActiveTeamDetails(nextDetails);
          setTeams((prev) => prev.map((t) => (t.id === activeTeamDetails.id ? nextDetails : t)));
        }
      } else {
        const currentDetail = activeTeamDetails.membersDetail || [];
        const teamDept = activeTeamDetails.dept || activeTeamDetails.department;
        const empDepts = new Set([
          emp.department,
          emp.dept,
          teamDept,
          activeTeamDetails.secondaryDept,
        ].filter(Boolean));
        const newMember = {
          id: emp.id,
          name: emp.name,
          employeeCode: emp.employeeCode || emp.empId || "",
          department: emp.department || teamDept || "",
          departments: Array.from(empDepts),
          isMultiDept: empDepts.size > 1,
          designation: emp.designation || emp.role || "",
          status: emp.status || "Active",
        };
        const nextDetails = {
          ...activeTeamDetails,
          membersDetail: [...currentDetail, newMember],
          memberIds: [...(activeTeamDetails.memberIds || []), emp.id],
          headcount: (activeTeamDetails.headcount || 0) + 1,
          memberCount: (activeTeamDetails.memberCount || 0) + 1,
        };
        setActiveTeamDetails(nextDetails);
        setTeams((prev) => prev.map((t) => (t.id === activeTeamDetails.id ? nextDetails : t)));
      }
      setSelectedNewMemberId("");
      showToast(`Added ${emp.name} to ${activeTeamDetails.name}`);
    } catch (err) {
      console.warn("Failed to add team member:", err);
      showToast(err?.message || "Failed to add team member", "error");
    } finally {
      setIsRosterActionLoading(false);
    }
  };

  const handleRemoveMemberFromTeam = async (employeeId, employeeName) => {
    if (!canEditOrg) {
      showToast("You do not have permission to modify team members (edit_staff required)", "error");
      return;
    }
    if (!activeTeamDetails) return;
    if (!window.confirm(`Remove ${employeeName || "member"} from squad "${activeTeamDetails.name}"?`)) return;

    setIsRosterActionLoading(true);
    try {
      if (isBackendEnabled()) {
        const updatedTeam = await removeTeamMember(activeTeamDetails.id, employeeId);
        if (updatedTeam?.id) {
          const normalized = hrmsSync.adapters?.teams?.fromApi ? hrmsSync.adapters.teams.fromApi(updatedTeam) : updatedTeam;
          setActiveTeamDetails(normalized);
          setTeams((prev) => prev.map((t) => (t.id === activeTeamDetails.id ? { ...t, ...normalized } : t)));
        } else {
          const nextDetails = {
            ...activeTeamDetails,
            membersDetail: (activeTeamDetails.membersDetail || []).filter((m) => m.id !== employeeId),
            memberIds: (activeTeamDetails.memberIds || []).filter((id) => id !== employeeId),
            headcount: Math.max(0, (activeTeamDetails.headcount || 1) - 1),
            memberCount: Math.max(0, (activeTeamDetails.memberCount || 1) - 1),
          };
          setActiveTeamDetails(nextDetails);
          setTeams((prev) => prev.map((t) => (t.id === activeTeamDetails.id ? nextDetails : t)));
        }
      } else {
        const nextDetails = {
          ...activeTeamDetails,
          membersDetail: (activeTeamDetails.membersDetail || []).filter((m) => m.id !== employeeId),
          memberIds: (activeTeamDetails.memberIds || []).filter((id) => id !== employeeId),
          headcount: Math.max(0, (activeTeamDetails.headcount || 1) - 1),
          memberCount: Math.max(0, (activeTeamDetails.memberCount || 1) - 1),
        };
        setActiveTeamDetails(nextDetails);
        setTeams((prev) => prev.map((t) => (t.id === activeTeamDetails.id ? nextDetails : t)));
      }
      showToast(`Removed ${employeeName || "member"} from squad`);
    } catch (err) {
      console.warn("Failed to remove team member:", err);
      showToast(err?.message || "Failed to remove team member", "error");
    } finally {
      setIsRosterActionLoading(false);
    }
  };

  // ── Approval Chain Handlers ─────────────────────────────────
  const handleOpenAddChain = () => {
    setEditingChain(null);
    setNewChain({ module: "Leave Management", tier1: "", tier2: "", tier3: "—", autoEscalateDays: 3, status: "Active" });
    setIsChainModalOpen(true);
  };

  const handleOpenEditChain = (chain) => {
    setEditingChain(chain);
    setNewChain({
      module: chain.module,
      tier1: chain.tier1,
      tier2: chain.tier2,
      tier3: chain.tier3,
      autoEscalateDays: chain.autoEscalateDays,
      status: chain.status,
    });
    setIsChainModalOpen(true);
  };

  const handleSaveChain = (e) => {
    e.preventDefault();
    if (!newChain.tier1) return;

    if (editingChain) {
      const updated = { ...editingChain, ...newChain };
      setApprovalChains((prev) =>
        prev.map((c) => (c.id === editingChain.id ? updated : c))
      );
      if (isBackendEnabled()) {
        hrmsSync.update('approvalChains', editingChain.id, updated)
          .then((saved) => {
            if (saved?.id) {
              setApprovalChains((prev) => prev.map((c) => (c.id === editingChain.id ? saved : c)));
            }
          })
          .catch(console.warn);
      }
      showToast(`Approval chain for "${newChain.module}" updated`);
    } else {
      const created = {
        id: `AC-${Date.now()}`,
        ...newChain,
        status: newChain.status || "Active",
      };
      setApprovalChains((prev) => [...prev, created]);
      if (isBackendEnabled()) {
        hrmsSync.create('approvalChains', created).then((saved) => {
          if (saved?.id) {
            setApprovalChains((prev) => prev.map((c) => (c.id === created.id ? saved : c)));
          }
        }).catch(console.warn);
      }
      showToast(`Approval chain for "${created.module}" configured`);
    }
    setIsChainModalOpen(false);
    setEditingChain(null);
  };

  const toggleChainStatus = (id) => {
    setApprovalChains((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = c.status === "Active" ? "Inactive" : "Active";
        if (isBackendEnabled()) {
          hrmsSync.update('approvalChains', id, { status: next }).catch(console.warn);
        }
        showToast(`Workflow status for ${c.module} set to ${next}`);
        return { ...c, status: next };
      })
    );
  };

  const handleDeleteChain = (id, module) => {
    if (window.confirm(`Remove approval workflow for "${module}"?`)) {
      setApprovalChains((prev) => prev.filter((c) => c.id !== id));
      if (isBackendEnabled()) {
        hrmsSync.remove('approvalChains', id).catch(console.warn);
      }
      showToast(`Approval chain for "${module}" removed`);
    }
  };

  // ── Termination Handlers ────────────────────────────────────
  const handleCreateTermination = (e) => {
    e.preventDefault();
    if (!newTermination.employee) return;
    const matchedEmployee = employees.find(
      (emp) =>
        String(emp?.name || "").toLowerCase() === String(newTermination.employee || "").toLowerCase() ||
        String(emp?.empId || "") === String(newTermination.employeeId || "") ||
        String(emp?.employeeCode || "") === String(newTermination.employeeId || "")
    );
    const created = {
      id: `TRM-${100 + terminations.length + 1}`,
      ...newTermination,
      status: "In Exit Clearance",
      createdAt: new Date().toISOString().split("T")[0],
    };
    const backendPayload = {
      employeeId: matchedEmployee?.id || newTermination.employeeId || undefined,
      reason: [newTermination.terminationType, newTermination.reason].filter(Boolean).join(" — ") || undefined,
      lastWorkingDay: newTermination.exitDate || newTermination.noticeDate || undefined,
      status: "Initiated",
    };
    setTerminations([created, ...terminations]);
    if (isBackendEnabled()) {
      hrmsSync.create('terminations', backendPayload).then((saved) => {
        if (saved?.id) {
          setTerminations((prev) =>
            prev.map((t) =>
              t.id === created.id ? { ...created, id: saved.id, status: saved.status || created.status, _synced: true } : t
            )
          );
        }
      }).catch(console.warn);
    }
    setIsTerminationModalOpen(false);
    setActiveTerminationLetter(created);
    setIsTerminationLetterModalOpen(true);

    const isFuture = created.exitDate && new Date(created.exitDate) > new Date();
    if (!isFuture) {
      updateEmployeeStatus?.(created.employee, "Terminated");
    } else {
      updateEmployeeStatus?.(created.employee, "Notice Period");
    }

    setNewTermination({
      employee: "",
      employeeId: "",
      dept: "",
      role: "",
      terminationType: "Involuntary (Performance)",
      noticeDate: new Date().toISOString().split("T")[0],
      exitDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      severance: "1 Month Gross",
      reason: "",
    });
    showToast(`Termination order logged & letter generated for ${created.employee}`);
  };

  const handleUpdateTermination = (updated) => {
    setTerminations((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    if (isBackendEnabled()) {
      const matchedEmployee = employees.find(
        (emp) =>
          String(emp?.name || "").toLowerCase() === String(updated.employee || "").toLowerCase() ||
          String(emp?.empId || "") === String(updated.employeeId || "")
      );
      const backendPayload = {
        employeeId: matchedEmployee?.id || updated.employeeId || undefined,
        employee: updated.employee || undefined,
        terminationType: updated.terminationType || undefined,
        noticeDate: updated.noticeDate || undefined,
        exitDate: updated.exitDate || updated.lastWorkingDay || undefined,
        lastWorkingDay: updated.lastWorkingDay || updated.exitDate || undefined,
        severance: updated.severance || undefined,
        reason: [updated.terminationType, updated.reason].filter(Boolean).join(" — ") || updated.reason || undefined,
        letterContent: updated.letterContent || undefined,
        status: updated.status || "In Exit Clearance",
      };
      hrmsSync.update('terminations', updated.id, backendPayload).catch(console.warn);
    }
    setActiveTerminationLetter(updated);
    showToast(`Termination letter & record updated`);
  };

  const handleEditTermination = (t) => {
    setActiveTerminationLetter(t);
    setTerminationInitialEdit(true);
    setTerminationAutoPrint(false);
    setIsTerminationLetterModalOpen(true);
  };

  const handlePrintTermination = (t) => {
    setActiveTerminationLetter(t);
    setTerminationInitialEdit(false);
    setTerminationAutoPrint(true);
    setIsTerminationLetterModalOpen(true);
  };

  const filteredTerminationEmployees = useMemo(() => {
    if (!terminationEmpSearch.trim()) return employees;
    const q = terminationEmpSearch.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(q) ||
        (emp.employeeCode || emp.empId || emp.employee_code || "").toLowerCase().includes(q) ||
        (emp.designation || "").toLowerCase().includes(q) ||
        (emp.department || "").toLowerCase().includes(q)
    );
  }, [employees, terminationEmpSearch]);

  const handleDeleteTermination = (id, name) => {
    if (window.confirm(`Are you sure you want to remove termination record for "${name}"?`)) {
      setTerminations((prev) => prev.filter((t) => t.id !== id));
      if (isBackendEnabled()) {
        hrmsSync.remove('terminations', id).catch(console.warn);
      }
      showToast(`Termination record for "${name}" removed`);
    }
  };

  const toggleTerminationStatus = (id) => {
    setTerminations((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextStatus = t.status === "Completed" ? "In Exit Clearance" : "Completed";
        if (isBackendEnabled()) {
          if (nextStatus === "Completed") {
            api.post(`/hrms/terminations/${id}/execute-offboarding/`, { force: true })
              .then(() => {
                updateEmployeeStatus?.(t.employee, "Terminated");
                showToast(`Employee offboarding executed for ${t.employee}`);
              })
              .catch(console.warn);
          } else {
            hrmsSync.update('terminations', id, { status: nextStatus }).catch(console.warn);
          }
        }
        showToast(`Termination status set to ${nextStatus}`);
        return { ...t, status: nextStatus };
      })
    );
  };

  // ── Offer Letters Handlers ──────────────────────────────────
  const handleCreateOffer = (newOffer) => {
    addOffer?.(newOffer);
    setActiveOfferLetter(newOffer);
    setIsOfferLetterModalOpen(true);
    showToast(`Offer letter generated for ${newOffer.candidateName}`);
  };

  const handleUpdateOffer = (updated) => {
    updateOffer?.(updated.id, updated);
    setActiveOfferLetter(updated);
    showToast(`Offer letter updated`);
  };

  const handleEditOfferLetter = (offer) => {
    setActiveOfferLetter(offer);
    setOfferLetterInitialEdit(true);
    setOfferLetterAutoPrint(false);
    setIsOfferLetterModalOpen(true);
  };

  const handlePrintOfferLetter = (offer) => {
    setActiveOfferLetter(offer);
    setOfferLetterInitialEdit(false);
    setOfferLetterAutoPrint(true);
    setIsOfferLetterModalOpen(true);
  };

  const handleDeleteOffer = (id, name) => {
    if (window.confirm(`Are you sure you want to remove the offer letter for "${name}"?`)) {
      deleteOffer?.(id);
      showToast(`Offer letter for "${name}" removed`);
    }
  };

  const toggleOfferStatus = (id, newStatus) => {
    updateOffer?.(id, { status: newStatus });
    showToast(`Offer status updated to ${newStatus}`);
  };

  // ── Resignation Handlers ───────────────────────────────────
  const handleCreateResignation = (e) => {
    e.preventDefault();
    if (!newResignation.employee) return;
    const matchedEmployee = employees.find(
      (emp) =>
        String(emp?.name || "").toLowerCase() === String(newResignation.employee || "").toLowerCase() ||
        String(emp?.empId || "") === String(newResignation.employeeId || "")
    );
    const noticePeriodDays = parseInt(String(newResignation.noticePeriod || "").replace(/[^0-9]/g, ""), 10) || 60;
    const created = {
      id: `RSG-${200 + resignations.length + 1}`,
      ...newResignation,
      status: "Pending Manager Review",
    };
    const backendPayload = {
      employeeId: matchedEmployee?.id || newResignation.employeeId || undefined,
      employee: newResignation.employee,
      submittedOn: newResignation.submittedDate || new Date().toISOString().split("T")[0],
      submittedDate: newResignation.submittedDate || new Date().toISOString().split("T")[0],
      noticePeriod: newResignation.noticePeriod,
      noticePeriodDays,
      lastWorkingDay: newResignation.lastWorkingDay || undefined,
      handoverTo: newResignation.handoverTo || undefined,
      reason: newResignation.reason || undefined,
      status: "Pending Manager Review",
    };
    setResignations([created, ...resignations]);
    if (isBackendEnabled()) {
      hrmsSync.create('resignations', backendPayload).then((saved) => {
        if (saved?.id) {
          setResignations((prev) =>
            prev.map((r) =>
              r.id === created.id ? { ...created, id: saved.id, status: "Pending Manager Review", _synced: true } : r
            )
          );
        }
      }).catch(console.warn);
    }
    setIsResignationModalOpen(false);

    updateEmployeeStatus?.(created.employee, "Notice Period");

    setNewResignation({
      employee: "",
      employeeId: "",
      dept: "",
      role: "",
      submittedDate: isoToday(),
      lastWorkingDay: isoInDays(60),
      noticePeriod: "60 Days",
      handoverTo: "",
      reason: "",
    });
    showToast(`Resignation recorded & status updated to Notice Period for ${created.employee}`);
  };

  const handleNoticeActionSubmit = async (e) => {
    e.preventDefault();
    if (!noticeActionModal.resignation) return;
    if (!noticeActionModal.reason.trim()) {
      showToast("Reason is required.", "error");
      return;
    }
    setNoticeActionModal((prev) => ({ ...prev, loading: true }));
    try {
      if (noticeActionModal.type === 'waive') {
        await waiveResignationNotice(noticeActionModal.resignation.id, {
          effective_last_day: noticeActionModal.date || undefined,
          reason: noticeActionModal.reason,
        });
        showToast("Notice period waived successfully.", "success");
      } else {
        await shortenResignationNotice(noticeActionModal.resignation.id, {
          revised_last_working_day: noticeActionModal.date,
          reason: noticeActionModal.reason,
        });
        showToast("Notice period shortened successfully.", "success");
      }
      setNoticeActionModal({ open: false, type: 'waive', resignation: null, date: '', reason: '', loading: false });
      const refreshed = await hrmsSync.pull('resignations');
      if (refreshed) setResignations(refreshed);
    } catch (err) {
      showToast(err?.message || "Failed to update notice period", "error");
      setNoticeActionModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteResignation = (id, name) => {
    if (window.confirm(`Are you sure you want to remove resignation record for "${name}"?`)) {
      setResignations((prev) => prev.filter((r) => r.id !== id));
      if (isBackendEnabled()) {
        hrmsSync.remove('resignations', id).catch(console.warn);
      }
      showToast(`Resignation record for "${name}" removed`);
    }
  };

  const toggleResignationStatus = (id) => {
    setResignations((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next =
          r.status === "Pending Manager Review"
            ? "Exit Interview Scheduled"
            : r.status === "Exit Interview Scheduled"
            ? "Clearance In Progress"
            : r.status === "Clearance In Progress"
            ? "Relieved & Completed"
            : "Pending Manager Review";
        if (isBackendEnabled()) {
          if (next === "Relieved & Completed") {
            api.post(`/hrms/resignations/${id}/execute-offboarding/`, { force: true })
              .then(() => {
                updateEmployeeStatus?.(r.employee, "Resigned");
                showToast(`Employee offboarding executed for ${r.employee}`);
              })
              .catch(console.warn);
          } else {
            hrmsSync.update('resignations', id, { status: next }).catch(console.warn);
          }
        }
        showToast(`Resignation status updated to ${next}`);
        return { ...r, status: next };
      })
    );
  };

  // ── Complaint / Grievance Handlers ─────────────────────────
  const handleCreateComplaint = (e) => {
    e.preventDefault();
    if (!newComplaint.complainant || !newComplaint.against) return;
    const raisedEmployee = employees.find(
      (emp) => String(emp?.name || "").toLowerCase() === String(newComplaint.complainant || "").toLowerCase()
    );
    const againstEmployee = employees.find(
      (emp) => String(emp?.name || "").toLowerCase() === String(newComplaint.against || "").toLowerCase()
    );
    const assignedUserId = /^[0-9a-f-]{36}$/i.test(String(newComplaint.assignedInvestigator || ""))
      ? newComplaint.assignedInvestigator
      : undefined;
    const created = {
      id: `GRV-${300 + complaints.length + 1}`,
      ...newComplaint,
      filedOn: isoToday(),
      status: "Open",
    };
    const backendPayload = {
      raisedByEmployeeId: raisedEmployee?.id,
      complainant: newComplaint.complainant,
      againstEmployeeId: againstEmployee?.id,
      against: newComplaint.against,
      category: newComplaint.category,
      priority: newComplaint.priority || "Medium",
      assignedInvestigator: newComplaint.assignedInvestigator || undefined,
      description: newComplaint.summary,
      summary: newComplaint.summary,
      filedOn: isoToday(),
      status: "Open",
      assigned_to: assignedUserId,
    };
    setComplaints([created, ...complaints]);
    if (isBackendEnabled()) {
      hrmsSync.create('complaints', backendPayload).then((saved) => {
        if (saved?.id) {
          setComplaints((prev) =>
            prev.map((c) =>
              c.id === created.id
                ? { ...created, id: saved.id, status: saved.status || created.status, _synced: true }
                : c
            )
          );
        }
      }).catch(console.warn);
    }
    setIsComplaintModalOpen(false);
    setNewComplaint({
      complainant: "",
      against: "",
      category: "Workplace Harassment / POSH",
      priority: "High",
      assignedInvestigator: "",
      summary: "",
    });
    showToast(`Grievance ticket ${created.id} registered`);
  };

  const handleDeleteComplaint = (id) => {
    if (window.confirm(`Are you sure you want to delete grievance ticket "${id}"?`)) {
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      if (isBackendEnabled()) {
        hrmsSync.remove('complaints', id).catch(console.warn);
      }
      showToast(`Grievance ticket "${id}" deleted`);
    }
  };

  const handleOpenStatusModal = (complaint) => {
    setStatusChangeComplaint(complaint);
    setNewComplaintStatus(
      complaint.status === "Open"
        ? "Under Review"
        : complaint.status === "Under Review"
        ? "Resolved"
        : "Open"
    );
    setStatusChangeNote(complaint.resolution || "");
  };

  const toggleComplaintStatus = (id) => {
    const c = complaints.find((x) => x.id === id);
    if (c) {
      handleOpenStatusModal(c);
    }
  };

  const handleSaveStatusChange = async (e) => {
    e?.preventDefault();
    if (!statusChangeComplaint) return;
    setIsUpdatingStatus(true);
    const id = statusChangeComplaint.id;
    const nextStatus = newComplaintStatus;
    const note = statusChangeNote.trim();

    try {
      if (nextStatus === "Resolved") {
        await resolveComplaint(id, note || "Resolved following internal review.").catch(() => {});
      } else if (isBackendEnabled()) {
        await hrmsSync.update('complaints', id, { status: nextStatus, resolution: note || undefined }).catch(console.warn);
      }
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const updatedComments = note
            ? [
                ...(c.comments || []),
                {
                  author_name: currentUser?.name || "HR Admin",
                  comment: `Status updated to ${nextStatus}: ${note}`,
                  created_at: new Date().toISOString(),
                },
              ]
            : c.comments;
          return {
            ...c,
            status: nextStatus,
            resolution: nextStatus === "Resolved" ? (note || c.resolution || "Resolved") : c.resolution,
            comments: updatedComments,
          };
        })
      );
      showToast(`Grievance ${id} marked as "${nextStatus}"`, "success");
      setStatusChangeComplaint(null);
      setStatusChangeNote("");
    } catch (err) {
      showToast(err?.message || "Failed to update grievance status", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ── Holiday Handlers ───────────────────────────────────────
  const handleOpenAddHoliday = () => {
    if (!canEditOrg) {
      showToast("You do not have permission to manage holidays (edit_staff required)", "error");
      return;
    }
    setEditingHoliday(null);
    setNewHoliday({
      name: "",
      date: isoToday(),
      day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
      type: "National Gazetted",
      appliesTo: "All Hubs & Remote",
      departmentId: "",
      locationId: "",
      status: "Published",
      description: "",
    });
    setIsHolidayModalOpen(true);
  };

  const handleOpenEditHoliday = (h) => {
    if (!canEditOrg) {
      showToast("You do not have permission to manage holidays (edit_staff required)", "error");
      return;
    }
    setEditingHoliday(h);
    setNewHoliday({
      name: h.name,
      date: h.date,
      day: h.day,
      type: h.type || (h.isOptional ? "Optional Holiday" : "National Gazetted"),
      appliesTo: h.appliesTo || "All Hubs & Remote",
      departmentId: h.departmentId || "",
      locationId: h.locationId || "",
      status: h.status || "Published",
      description: h.description || "",
    });
    setIsHolidayModalOpen(true);
  };

  const handleToggleHolidayStatus = async (h) => {
    if (!canEditOrg) {
      showToast("You do not have permission to manage holidays (edit_staff required)", "error");
      return;
    }
    const nextStatus = h.status === "Published" ? "Inactive" : "Published";
    setHolidays((prev) => prev.map((item) => (item.id === h.id ? { ...item, status: nextStatus } : item)));
    if (isBackendEnabled()) {
      try {
        const action = nextStatus === "Published" ? "publish" : "deactivate";
        await api.post(`/hrms/holidays/${h.id}/${action}/`);
        showToast(`Holiday "${h.name}" marked as ${nextStatus}`);
      } catch (err) {
        console.warn("Failed to toggle holiday status:", err);
        showToast("Failed to update holiday status", "error");
      }
    }
  };

  const handleSaveHoliday = (e) => {
    e.preventDefault();
    if (!newHoliday.name) return;
    if (!canEditOrg) {
      showToast("You do not have permission to manage holidays (edit_staff required)", "error");
      return;
    }

    const deptObj = departmentsConfig.find((d) => d.id === newHoliday.departmentId);
    const locObj = locations.find((l) => l.id === newHoliday.locationId);
    const appliesTo = deptObj ? `${deptObj.name} Dept` : (locObj ? `${locObj.name} Hub` : "All Hubs & Remote");

    const holidayBackendPayload = {
      name: newHoliday.name.trim(),
      date: newHoliday.date,
      holiday_type: newHoliday.type || "National Gazetted",
      is_optional: String(newHoliday.type || "").toLowerCase().includes("optional"),
      status: newHoliday.status || "Published",
      description: newHoliday.description || "",
      departmentId: newHoliday.departmentId || null,
      locationId: newHoliday.locationId || null,
    };

    if (editingHoliday) {
      const derivedDay = (() => {
        try {
          const d = new Date(newHoliday.date);
          return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { weekday: "long" });
        } catch { return ""; }
      })();
      setHolidays((prev) =>
        prev.map((h) => (h.id === editingHoliday.id ? { ...h, ...newHoliday, appliesTo, day: derivedDay } : h))
      );
      if (isBackendEnabled()) {
        hrmsSync.update("holidays", editingHoliday.id, holidayBackendPayload).catch((err) => {
          showToast(err?.message || "Failed to update holiday", "error");
        });
      }
      showToast(`Holiday "${newHoliday.name}" updated`);
    } else {
      const created = {
        id: `HOL-${Date.now().toString().slice(-4)}`,
        ...newHoliday,
        appliesTo,
        status: newHoliday.status || "Published",
      };
      setHolidays([...holidays, created]);
      if (isBackendEnabled()) {
        hrmsSync.create("holidays", holidayBackendPayload).then((saved) => {
          if (saved?.id) {
            setHolidays((prev) => prev.map((h) => (h.id === created.id ? { ...created, ...saved, _synced: true } : h)));
          }
        }).catch((err) => {
          showToast(err?.message || "Failed to create holiday", "error");
        });
      }

      addCalendarEvent?.({
        id: `EV-HOL-${Date.now()}`,
        title: created.name,
        date: created.date,
        startDate: created.date,
        endDate: created.date,
        type: "Holiday",
        category: "Company Holiday",
        time: "All Day",
        location: appliesTo,
        dept: deptObj ? deptObj.name : "All Staff",
        organizer: "HR Governance",
        description: `${created.type} holiday applying to ${appliesTo}.`,
      });

      showToast(`Holiday "${created.name}" added and synced to calendar`);
    }
    setIsHolidayModalOpen(false);
    setEditingHoliday(null);
  };

  const handleDeleteHoliday = (id, name) => {
    if (!canEditOrg) {
      showToast("You do not have permission to manage holidays (edit_staff required)", "error");
      return;
    }
    if (window.confirm(`Remove holiday "${name}"?`)) {
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      if (isBackendEnabled()) {
        hrmsSync.remove("holidays", id).catch(console.warn);
      }
      const matchedEv = calendarEvents.find(
        (ev) => (ev.type === "Holiday" || ev.category === "Company Holiday") && String(ev.title || "").toLowerCase() === String(name || "").toLowerCase()
      );
      if (matchedEv) {
        deleteCalendarEvent?.(matchedEv.id);
      }
      showToast(`Holiday "${name}" removed`);
    }
  };

  // ── Work Schedule Handlers (§11.8) ───────────────────────────
  const handleOpenAddSchedule = () => {
    if (!canEditOrg) {
      showToast("You do not have permission to manage work schedules (edit_staff required)", "error");
      return;
    }
    setEditingWorkSchedule(null);
    setWorkScheduleForm({
      name: "",
      code: `SCH-${(workSchedules.length + 1).toString().padStart(2, "0")}`,
      shiftType: "Regular",
      shiftStart: "09:30",
      shiftEnd: "18:30",
      breakDuration: 60,
      workingHours: 8.0,
      workingDays: [0, 1, 2, 3, 4],
      weeklyOffs: [5, 6],
      scopeType: "default",
      departmentId: "",
      teamId: "",
      locationId: "",
      isDefault: workSchedules.length === 0,
      effectiveFrom: isoToday(),
      effectiveTo: "",
      description: "",
    });
    setIsWorkScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = (sched) => {
    if (!canEditOrg) {
      showToast("You do not have permission to manage work schedules (edit_staff required)", "error");
      return;
    }
    setEditingWorkSchedule(sched);
    setWorkScheduleForm({
      name: sched.name || "",
      code: sched.code || "",
      shiftType: sched.shiftType || "Regular",
      shiftStart: sched.shiftStart || "09:30",
      shiftEnd: sched.shiftEnd || "18:30",
      breakDuration: sched.breakDuration ?? 60,
      workingHours: sched.workingHours ?? 8.0,
      workingDays: Array.isArray(sched.workingDays) ? sched.workingDays : [0, 1, 2, 3, 4],
      weeklyOffs: Array.isArray(sched.weeklyOffs) ? sched.weeklyOffs : [5, 6],
      scopeType: sched.teamId ? "team" : (sched.departmentId ? "department" : "default"),
      departmentId: sched.departmentId || "",
      teamId: sched.teamId || "",
      locationId: sched.locationId || "",
      isDefault: !!sched.isDefault,
      effectiveFrom: sched.effectiveFrom || "",
      effectiveTo: sched.effectiveTo || "",
      description: sched.description || "",
    });
    setIsWorkScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!canEditOrg) {
      showToast("You do not have permission to manage work schedules (edit_staff required)", "error");
      return;
    }
    if (!workScheduleForm.name.trim()) {
      showToast("Schedule name is required", "error");
      return;
    }
    if (workScheduleForm.shiftStart === workScheduleForm.shiftEnd && workScheduleForm.shiftType !== "Flexible") {
      showToast("Shift start and end times cannot be identical", "error");
      return;
    }
    const overlap = workScheduleForm.workingDays.filter((d) => workScheduleForm.weeklyOffs.includes(d));
    if (overlap.length > 0) {
      showToast("A day cannot be both a working day and a weekly off", "error");
      return;
    }

    const payload = {
      name: workScheduleForm.name.trim(),
      code: workScheduleForm.code.trim() || undefined,
      shift_type: workScheduleForm.shiftType,
      shift_start: workScheduleForm.shiftStart,
      shift_end: workScheduleForm.shiftEnd,
      break_duration_minutes: Number(workScheduleForm.breakDuration) || 60,
      working_hours: Number(workScheduleForm.workingHours) || 8.0,
      working_days: workScheduleForm.workingDays,
      weekly_offs: workScheduleForm.weeklyOffs,
      departmentId: workScheduleForm.scopeType === "department" ? (workScheduleForm.departmentId || null) : null,
      teamId: workScheduleForm.scopeType === "team" ? (workScheduleForm.teamId || null) : null,
      locationId: workScheduleForm.locationId || null,
      is_default: workScheduleForm.scopeType === "default" || !!workScheduleForm.isDefault,
      status: editingWorkSchedule ? editingWorkSchedule.status : "Active",
      effective_from: workScheduleForm.effectiveFrom || null,
      effective_to: workScheduleForm.effectiveTo || null,
      description: workScheduleForm.description || "",
    };

    try {
      if (editingWorkSchedule) {
        const updated = await hrmsSync.update("workSchedules", editingWorkSchedule.id, payload);
        const normalized = updated || { ...editingWorkSchedule, ...payload };
        setWorkSchedules((prev) => prev.map((s) => (s.id === editingWorkSchedule.id ? { ...s, ...normalized } : s)));
        showToast(`Work schedule "${workScheduleForm.name}" updated successfully`);
      } else {
        const created = await hrmsSync.create("workSchedules", payload);
        if (created) {
          setWorkSchedules((prev) => [created, ...prev]);
        }
        showToast(`Work schedule "${workScheduleForm.name}" created successfully`);
      }
      setIsWorkScheduleModalOpen(false);
      setEditingWorkSchedule(null);
    } catch (err) {
      console.error("Save work schedule error:", err);
      showToast(err?.message || "Failed to save work schedule", "error");
    }
  };

  const handleToggleScheduleStatus = async (sched) => {
    if (!canEditOrg) {
      showToast("You do not have permission to manage work schedules (edit_staff required)", "error");
      return;
    }
    const nextStatus = sched.status === "Active" ? "Inactive" : "Active";
    setWorkSchedules((prev) => prev.map((s) => (s.id === sched.id ? { ...s, status: nextStatus } : s)));
    if (isBackendEnabled()) {
      try {
        const action = nextStatus === "Active" ? "activate" : "deactivate";
        await api.post(`/hrms/work-schedules/${sched.id}/${action}/`);
        showToast(`Schedule "${sched.name}" marked as ${nextStatus}`);
      } catch (err) {
        console.error("Failed to toggle schedule status:", err);
        showToast("Failed to toggle schedule status", "error");
      }
    }
  };

  const handleDeleteSchedule = async (id, name) => {
    if (!canEditOrg) {
      showToast("You do not have permission to manage work schedules (edit_staff required)", "error");
      return;
    }
    if (window.confirm(`Delete work schedule "${name}"?`)) {
      setWorkSchedules((prev) => prev.filter((s) => s.id !== id));
      if (isBackendEnabled()) {
        try {
          await hrmsSync.remove("workSchedules", id);
          showToast(`Schedule "${name}" removed`);
        } catch (err) {
          console.error("Failed to delete schedule:", err);
          showToast(err?.message || "Failed to delete schedule", "error");
        }
      }
    }
  };

  // ── Org Settings ───────────────────────────────────────────
  const handleSaveOrgSettings = async (e) => {
    e.preventDefault();
    if (!String(orgSettings.companyName || "").trim()) {
      showToast("Company name is required", "error");
      return;
    }
    if (!isBackendEnabled()) {
      showToast("Backend is not enabled; organization settings were not saved", "error");
      return;
    }
    try {
      const saved = await pushHrmsSettings(orgSettings);
      const next = saved?.data ?? saved?.value ?? saved;
      if (next && typeof next === "object" && !Array.isArray(next)) {
        setOrgSettings((prev) => ({ ...prev, ...next }));
      }
      if (orgSettings.companyName) {
        setCompanyProfile?.((prev) => ({
          ...(prev || {}),
          name: orgSettings.companyName,
          legal_name: orgSettings.companyName,
          trade_name: orgSettings.companyName,
        }));
      }
      if (orgSettings.sandwichRuleEnabled !== undefined && typeof toggleSandwichRule === "function") {
        toggleSandwichRule(orgSettings.sandwichRuleEnabled);
      }
      if (orgSettings.maxCarryForwardDays !== undefined && typeof setMaxCarryForwardDays === "function") {
        setMaxCarryForwardDays(orgSettings.maxCarryForwardDays);
      }
      showToast("Organization configuration updated successfully", "success");
    } catch (err) {
      showToast(err?.message || "Failed to save organization configuration", "error");
    }
  };

  // Unique departments for filter and team assignment (merges configured depts, team depts, and employee depts)
  const departmentsList = useMemo(() => {
    const set = new Set();
    departmentsConfig.forEach((d) => d?.name && set.add(d.name));
    teams.forEach((t) => {
      if (t.dept) set.add(t.dept);
      if (t.department) set.add(t.department);
      if (t.secondaryDept) set.add(t.secondaryDept);
    });
    allEmployees.forEach((e) => {
      if (e.department) set.add(e.department);
      if (e.dept) set.add(e.dept);
      if (e.secondaryDepartment) set.add(e.secondaryDepartment);
    });
    return Array.from(set).filter(Boolean).sort();
  }, [departmentsConfig, teams, allEmployees]);

  // Map each employee ID to all departments they are active in (primary + assigned squads + cross-department)
  const employeeDepartmentMap = useMemo(() => {
    const map = new Map();
    eligibleEmployees.forEach((emp) => {
      const set = new Set();
      if (emp.department) set.add(emp.department);
      if (emp.dept) set.add(emp.dept);
      if (emp.secondaryDepartment) set.add(emp.secondaryDepartment);
      if (Array.isArray(emp.departments)) {
        emp.departments.forEach((d) => d && set.add(d));
      } else if (typeof emp.departments === "string" && emp.departments.includes(",")) {
        emp.departments.split(",").forEach((d) => d.trim() && set.add(d.trim()));
      }
      map.set(emp.id, set);
    });

    teams.forEach((t) => {
      const teamDepts = [t.dept, t.department, t.secondaryDept].filter(Boolean);
      if (teamDepts.length === 0) return;

      const memberIds = [
        ...(Array.isArray(t.memberIds) ? t.memberIds : []),
        ...(Array.isArray(t.membersDetail) ? t.membersDetail.map((m) => m.id) : []),
        t.leadId,
        t.approverId,
      ].filter(Boolean);

      memberIds.forEach((id) => {
        let set = map.get(id);
        if (!set) {
          set = new Set();
          map.set(id, set);
        }
        teamDepts.forEach((d) => set.add(d));
      });
    });

    const result = new Map();
    map.forEach((set, id) => {
      result.set(id, Array.from(set));
    });
    return result;
  }, [eligibleEmployees, teams]);

  // Dual-department staff list (employees who work in 2 or more departments)
  const multiDeptEmployees = useMemo(() => {
    return eligibleEmployees.filter((emp) => {
      const depts = employeeDepartmentMap.get(emp.id) || [];
      return depts.length > 1;
    });
  }, [eligibleEmployees, employeeDepartmentMap]);
  const totalTeamMembers = teams.reduce(
    (acc, t) =>
      acc +
      (Number(
        t.memberCount ??
          t.headcount ??
          (Array.isArray(t.membersDetail) ? t.membersDetail.length : t.members)
      ) || 0),
    0
  );

  // ── 9 Top KPI Button Cards Configuration ──
  const TOP_KPI_BUTTONS = [
    {
      id: "teams",
      label: "Teams",
      count: teams.length,
      subtext: `${totalTeamMembers} staff across ${departmentsList.length} depts`,
      icon: Users,
      iconColor: "text-blue-700",
      accentBg: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: "working-days",
      label: "Work Schedule",
      count: `${departmentsConfig.length} Depts`,
      subtext: "Days & daily hours",
      icon: CalendarCheck,
      iconColor: "text-emerald-700",
      accentBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      id: "approvals",
      label: "Workflows",
      count: approvalChains.length,
      subtext: "Multi-tier active",
      icon: ShieldCheck,
      iconColor: "text-emerald-700",
      accentBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      id: "offers",
      label: "Offer Letters",
      count: offers.length,
      subtext: "Hired & issued",
      icon: FileCheck2,
      iconColor: "text-teal-700",
      accentBg: "bg-teal-50 text-teal-700 border-teal-200",
    },
    {
      id: "terminations",
      label: "Terminations",
      count: terminations.length,
      subtext: "Exits recorded",
      icon: UserX,
      iconColor: "text-red-700",
      accentBg: "bg-red-50 text-red-700 border-red-200",
    },
    {
      id: "resignations",
      label: "Resignations",
      count: resignations.length,
      subtext: "Serving notice",
      icon: UserMinus,
      iconColor: "text-amber-700",
      accentBg: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "complaints",
      label: "Grievances",
      count: complaints.length,
      subtext: "Active tickets",
      icon: MessageSquareWarning,
      iconColor: "text-purple-700",
      accentBg: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      id: "holidays",
      label: `Holidays (${new Date().getFullYear()})`,
      count: holidays.length,
      subtext: "Gazetted & opt",
      icon: Calendar,
      iconColor: "text-indigo-700",
      accentBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      id: "announcements",
      label: "Announcements",
      count: announcements.length,
      subtext: "Circulars & notices",
      icon: Megaphone,
      iconColor: "text-amber-700",
      accentBg: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "travel",
      label: "Travel Requisitions",
      count: travelRequests.length,
      subtext: "Conveyance & tours",
      icon: Plane,
      iconColor: "text-sky-700",
      accentBg: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      id: "settings",
      label: "Org Settings",
      count: `${activeRulesCount} Active`,
      subtext: `${totalRulesCount} configured rules`,
      icon: Settings,
      iconColor: "text-slate-700",
      accentBg: "bg-slate-50 text-slate-700 border-slate-200",
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-bold text-slate-900">HR Admin Setup &amp; Governance</h1>
            <PageInfoButton guide={hrmsGuides.hrAdmin} />
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              Live Governance Hub
            </span>
          </div>
          <p className="text-[13px] text-muted mt-0.5">
            Configure organization settings, approval chains, offer letters, exits, grievances, and holiday calendars.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5">
          {/* Quick Action Dropdown */}
          <div className="relative" ref={quickActionRef}>
            <button
              type="button"
              onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-white border border-bdr rounded-xl text-xs font-semibold text-slate-800 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            >
              <Plus size={15} className="text-primary" />
              <span>Quick Action</span>
              <ChevronDown size={14} className="text-muted" />
            </button>

            {isQuickActionOpen && (
              <div className="absolute left-0 lg:left-auto lg:right-0 mt-2 w-56 bg-white border border-bdr rounded-2xl shadow-xl z-30 py-2 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-bold text-muted uppercase tracking-wider">
                  Create / Initiate
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenAddTeam();
                    setIsQuickActionOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <Users size={14} className="text-blue-700" /> New Team / Squad
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenAddChain();
                    setIsQuickActionOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck size={14} className="text-emerald-700" /> Approval Workflow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsGenerateOfferModalOpen(true);
                    setIsQuickActionOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <FileCheck2 size={14} className="text-teal-700" /> Generate Offer Letter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTerminationModalOpen(true);
                    setIsQuickActionOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <UserX size={14} className="text-red-700" /> Record Termination
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsResignationModalOpen(true);
                    setIsQuickActionOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <UserMinus size={14} className="text-amber-700" /> Log Resignation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsComplaintModalOpen(true);
                    setIsQuickActionOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquareWarning size={14} className="text-purple-700" /> Register Grievance
                </button>
                <button
                  type="button"
                  disabled={!canEditOrg}
                  title={canEditOrg ? "Add a holiday" : "Requires edit_staff permission"}
                  onClick={() => {
                    handleOpenAddHoliday();
                    setIsQuickActionOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <Calendar size={14} className="text-indigo-700" /> Add Holiday
                </button>
              </div>
            )}
          </div>

          {/* Contextual Primary Action Button */}
          {activeTab === "teams" && (
            <button
              type="button"
              onClick={() => handleOpenAddTeam(teamDeptFilter !== "all" ? teamDeptFilter : undefined)}
              className="inline-flex items-center gap-1.5 btn-primary h-9 px-4 rounded-xl text-xs font-semibold hover:bg-navy/90 transition shadow-xs cursor-pointer"
            >
              <Plus size={15} /> Create Team {teamDeptFilter !== "all" ? `(${teamDeptFilter})` : ""}
            </button>
          )}
          {activeTab === "working-days" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canEditOrg}
                title={canEditOrg ? "Reset all departments" : "Requires edit_staff permission"}
                onClick={() => {
                  if (!canEditOrg) {
                    showToast("You do not have permission to change the work schedule (edit_staff required)", "error");
                    return;
                  }
                  resetDepartmentWorkingDays();
                  showToast("Reset all departments to standard 24 working days");
                }}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-white border border-bdr text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition shadow-xs cursor-pointer"
              >
                <RotateCcw size={14} /> Reset (24 Days)
              </button>
              <Link
                to="/hrms/payroll"
                style={{ color: '#ffffff', backgroundColor: '#1F2E4A' }}
                className="inline-flex items-center gap-1.5 h-9 px-4 bg-navy text-white !text-white rounded-xl text-xs font-semibold hover:bg-navy/90 transition shadow-xs cursor-pointer"
              >
                <Receipt size={14} className="text-white" style={{ color: '#ffffff' }} />
                <span className="text-white font-semibold" style={{ color: '#ffffff' }}>View Live Payroll</span>
                <ArrowRight size={14} className="text-white" style={{ color: '#ffffff' }} />
              </Link>
            </div>
          )}
          {activeTab === "approvals" && (
            <button
              type="button"
              onClick={handleOpenAddChain}
              className="inline-flex items-center gap-1.5 btn-primary h-9 px-4 rounded-xl text-xs font-semibold hover:bg-navy/90 transition shadow-xs cursor-pointer"
            >
              <Plus size={15} /> New Approval Chain
            </button>
          )}
          {activeTab === "offers" && (
            <button
              type="button"
              onClick={() => setIsGenerateOfferModalOpen(true)}
              className="inline-flex items-center gap-1.5 btn-primary h-9 px-4 rounded-xl text-xs font-semibold hover:bg-navy/90 transition shadow-xs cursor-pointer"
            >
              <Plus size={15} /> Generate Offer Letter
            </button>
          )}
          {activeTab === "terminations" && (
            <button
              type="button"
              onClick={() => setIsTerminationModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-red-700 text-white rounded-xl text-xs font-semibold hover:bg-red-800 transition shadow-xs cursor-pointer"
            >
              <UserX size={15} /> Record Termination
            </button>
          )}
          {activeTab === "resignations" && (
            <button
              type="button"
              onClick={() => setIsResignationModalOpen(true)}
              className="inline-flex items-center gap-1.5 btn-primary h-9 px-4 rounded-xl text-xs font-semibold hover:bg-navy/90 transition shadow-xs cursor-pointer"
            >
              <UserMinus size={15} /> Submit Resignation
            </button>
          )}
          {activeTab === "complaints" && (
            <button
              type="button"
              onClick={() => setIsComplaintModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-amber-700 text-white rounded-xl text-xs font-semibold hover:bg-amber-800 transition shadow-xs cursor-pointer"
            >
              <MessageSquareWarning size={15} /> File Grievance / Complaint
            </button>
          )}
          {activeTab === "holidays" && (
            <button
              type="button"
              disabled={!canEditOrg}
              title={canEditOrg ? "Add a holiday" : "Requires edit_staff permission"}
              onClick={handleOpenAddHoliday}
              className="inline-flex items-center gap-1.5 btn-primary h-9 px-4 rounded-xl text-xs font-semibold hover:bg-navy/90 transition shadow-xs cursor-pointer"
            >
              <Calendar size={15} /> Add Holiday
            </button>
          )}
          {activeTab === "announcements" && (
            <button
              type="button"
              onClick={handleOpenAddAnnouncement}
              className="inline-flex items-center gap-1.5 btn-primary h-9 px-4 rounded-xl text-xs font-semibold hover:bg-navy/90 transition shadow-xs cursor-pointer"
            >
              <Megaphone size={15} /> Publish Announcement
            </button>
          )}
          {activeTab === "travel" && (
            <button
              type="button"
              onClick={() => setIsTravelModalOpen(true)}
              className="inline-flex items-center gap-1.5 btn-primary h-9 px-4 rounded-xl text-xs font-semibold hover:bg-navy/90 transition shadow-xs cursor-pointer"
            >
              <Plane size={15} /> Request Travel Approval
            </button>
          )}
          {activeTab === "settings" && (
            <button
              type="button"
              onClick={handleSaveOrgSettings}
              className="inline-flex items-center gap-1.5 btn-primary h-9 px-4 rounded-xl text-xs font-semibold hover:bg-navy/90 transition shadow-xs cursor-pointer"
            >
              <CheckCircle2 size={15} /> Save Configuration
            </button>
          )}
        </div>
      </div>

      {/* ── TOP BUTTONS: Interactive 11 KPI Buttons ── */}
      {/* Clicking any button immediately switches the view */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2.5 sm:gap-3">
        {TOP_KPI_BUTTONS.map((btn) => {
          const isActive = activeTab === btn.id;
          const Icon = btn.icon;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => {
                setActiveTab(btn.id);
                setSearch("");
              }}
              title={`Switch to ${btn.label} view`}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-[92px] ${
                isActive
                  ? "bg-white border-navy ring-2 ring-navy/20 shadow-xs"
                  : "bg-white border-bdr hover:border-slate-300 hover:shadow-xs hover:-translate-y-0.5"
              }`}
            >
              {isActive && <span className="absolute top-0 left-0 right-0 h-1 bg-navy" />}
              <div className="text-[11.5px] text-muted flex items-center justify-between font-medium">
                <span className={`truncate mr-1 ${isActive ? "font-bold text-slate-900" : ""}`}>{btn.label}</span>
                <Icon size={14} className={`shrink-0 ${btn.iconColor}`} />
              </div>
              <div className={`text-[19px] font-bold leading-tight ${isActive ? "text-navy" : "text-slate-900"}`}>
                {btn.count}
              </div>
              <div className="text-[10.5px] text-muted flex items-center justify-between truncate">
                <span className="truncate">{btn.subtext}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 shrink-0 ml-1 rounded-full bg-navy animate-pulse" title="Active View" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          VIEW 1: TEAMS & SQUADS DIRECTORY (THE TABLE)
          Separated dedicated container with search, department filters,
          and interactive management table
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === "teams" && (
        <div className="flex flex-col gap-4">
          {/* Dedicated View Header */}
          <div className="bg-white border border-bdr rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Teams &amp; Squads Directory</h2>
                <p className="text-[12px] text-muted">
                  Organizational squads, department structures, team leaders, and designated leave approvers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                {teams.length} Squads • {departmentsList.length} Departments • {totalTeamMembers} Assigned Staff ({eligibleEmployees.length} Active Total)
              </span>
            </div>
          </div>

          {/* Search & Department Filters Toolbar */}
          <div className="bg-white border border-bdr rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search squads, employees, department, leader..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 text-xs rounded-xl border border-bdr bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
            </div>

            {/* View Switcher: Table View vs Department-wise View */}
            <div className="flex items-center bg-off p-1 rounded-xl border border-bdr gap-1">
              <button
                type="button"
                onClick={() => setTeamViewMode("table")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  teamViewMode === "table"
                    ? "bg-white text-navy shadow-xs"
                    : "text-muted hover:text-slate-800"
                }`}
              >
                <Layers size={13} />
                <span>Squads Table</span>
              </button>
              <button
                type="button"
                onClick={() => setTeamViewMode("by-dept")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  teamViewMode === "by-dept"
                    ? "bg-white text-navy shadow-xs"
                    : "text-muted hover:text-slate-800"
                }`}
              >
                <Building2 size={13} />
                <span>Department-wise View</span>
              </button>
            </div>

            {/* Department Pills */}
            <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-bdr/50">
              <span className="text-[12px] text-muted font-medium mr-1">Dept:</span>
              <button
                type="button"
                onClick={() => setTeamDeptFilter("all")}
                className={`h-8 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  teamDeptFilter === "all" ? "bg-navy text-white font-semibold" : "bg-off text-muted hover:text-slate-800"
                }`}
              >
                All ({teams.length})
              </button>
              {departmentsList.map((d) => {
                const count = teams.filter((t) => (t.dept || t.department) === d || t.secondaryDept === d).length;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTeamDeptFilter(d)}
                    className={`h-8 px-3 rounded-xl text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 ${
                      teamDeptFilter === d ? "bg-navy text-white font-semibold" : "bg-off text-muted hover:text-slate-800"
                    }`}
                  >
                    <span>{d}</span>
                    <span className="opacity-70 text-[11px]">({count})</span>
                  </button>
                );
              })}
              {multiDeptEmployees.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTeamDeptFilter("dual-dept")}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 ${
                    teamDeptFilter === "dual-dept"
                      ? "bg-purple-700 text-white font-semibold"
                      : "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                  }`}
                  title="Filter to view employees active in multiple departments"
                >
                  <Users size={12} />
                  <span>Dual-Dept Staff ({multiDeptEmployees.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEW MODE 1: SQUADS TABLE */}
          {teamViewMode === "table" && (
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
                <div className="p-3.5 border-b border-bdr flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0 bg-off/50">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-bold text-slate-800">Departmental Squad List</span>
                    {teamDeptFilter !== "all" && teamDeptFilter !== "dual-dept" && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {teamDeptFilter}
                      </span>
                    )}
                    {teamDeptFilter === "dual-dept" && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        Cross-Department Units
                      </span>
                    )}
                  </div>
                  <span className="text-[11.5px] text-muted">
                    Showing{" "}
                    {
                      teams.filter((t) => {
                        const q = search.trim().toLowerCase();
                        const matchSearch =
                          !q ||
                          String(t.name ?? "").toLowerCase().includes(q) ||
                          String(t.code ?? "").toLowerCase().includes(q) ||
                          String(t.id ?? "").toLowerCase().includes(q) ||
                          String(t.lead ?? "").toLowerCase().includes(q) ||
                          String(t.leadName ?? "").toLowerCase().includes(q) ||
                          String(t.approver ?? "").toLowerCase().includes(q) ||
                          String(t.approverName ?? "").toLowerCase().includes(q) ||
                          String(t.dept ?? t.department ?? "").toLowerCase().includes(q) ||
                          String(t.secondaryDept ?? "").toLowerCase().includes(q);
                        const matchDept =
                          teamDeptFilter === "all"
                            ? true
                            : teamDeptFilter === "dual-dept"
                            ? ((t.memberIds || []).some((id) => (employeeDepartmentMap.get(id) || []).length > 1) || !!t.secondaryDept)
                            : (t.dept || t.department) === teamDeptFilter || t.secondaryDept === teamDeptFilter;
                        return matchSearch && matchDept;
                      }).length
                    }{" "}
                    of {teams.length} teams
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] lg:min-w-0 text-left text-[13px]">
                    <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
                      <tr>
                        <th className="py-3 px-5">Squad Name</th>
                        <th className="py-3 px-5">Team ID</th>
                        <th className="py-3 px-5">Department</th>
                        <th className="py-3 px-5">Team Leader</th>
                        <th className="py-3 px-5">Headcount</th>
                        <th className="py-3 px-5">Default Approver</th>
                        <th className="py-3 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-bdr/40">
                      {teams
                        .filter((t) => {
                          const q = search.trim().toLowerCase();
                          const matchSearch =
                            !q ||
                            String(t.name ?? "").toLowerCase().includes(q) ||
                            String(t.code ?? "").toLowerCase().includes(q) ||
                            String(t.id ?? "").toLowerCase().includes(q) ||
                            String(t.lead ?? "").toLowerCase().includes(q) ||
                            String(t.leadName ?? "").toLowerCase().includes(q) ||
                            String(t.approver ?? "").toLowerCase().includes(q) ||
                            String(t.approverName ?? "").toLowerCase().includes(q) ||
                            String(t.dept ?? t.department ?? "").toLowerCase().includes(q) ||
                            String(t.secondaryDept ?? "").toLowerCase().includes(q);
                          const matchDept =
                            teamDeptFilter === "all"
                              ? true
                              : teamDeptFilter === "dual-dept"
                              ? ((t.memberIds || []).some((id) => (employeeDepartmentMap.get(id) || []).length > 1) || !!t.secondaryDept)
                              : (t.dept || t.department) === teamDeptFilter || t.secondaryDept === teamDeptFilter;
                          return matchSearch && matchDept;
                        })
                        .map((t) => {
                          const squadId = t.code || t.teamCode || t.id;
                          const count = Number(t.memberCount ?? t.headcount ?? (Array.isArray(t.membersDetail) ? t.membersDetail.length : t.members)) || 0;
                          const hasMultiDeptMember = (t.memberIds || []).some((id) => (employeeDepartmentMap.get(id) || []).length > 1);
                          return (
                            <tr key={t.id} className="hover:bg-off/60 transition">
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center font-bold text-[12px] shrink-0">
                                    {(t.name || "SQ").substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{t.name}</div>
                                    <div className="text-[11px] text-muted">
                                      {t.description ? t.description.slice(0, 40) + (t.description.length > 40 ? "..." : "") : "Designated Operational Squad"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-5">
                                <span className="font-mono text-[12px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {squadId}
                                </span>
                              </td>
                              <td className="py-4 px-5">
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-full text-[11.5px] font-medium">
                                    {t.dept || t.department || "—"}
                                  </span>
                                  {t.secondaryDept && (
                                    <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-[10.5px] font-medium" title="Cross-department squad">
                                      + {t.secondaryDept}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-5 text-slate-800 font-medium">
                                {t.lead || t.leadName || <span className="text-muted font-normal">Unassigned</span>}
                              </td>
                              <td className="py-4 px-5 text-slate-700">
                                <button
                                  type="button"
                                  onClick={() => handleOpenViewTeamDetails(t)}
                                  className="inline-flex items-center gap-1.5 font-semibold text-slate-800 hover:text-navy cursor-pointer group"
                                  title="Click to view squad roster"
                                >
                                  <Users size={14} className="text-muted group-hover:text-navy" />
                                  <span className="underline decoration-dotted decoration-slate-300 underline-offset-2">
                                    {count} members
                                  </span>
                                  {hasMultiDeptMember && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                      Dual-Dept
                                    </span>
                                  )}
                                </button>
                              </td>
                              <td className="py-4 px-5 text-slate-700">
                                {t.approver || t.approverName ? (
                                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                    {t.approver || t.approverName}
                                  </span>
                                ) : (
                                  <span className="text-muted text-[12px]">Unassigned</span>
                                )}
                              </td>
                              <td className="py-4 px-5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenViewTeamDetails(t)}
                                    className="p-1.5 hover:bg-blue-50 rounded-xl text-muted hover:text-blue-700 transition cursor-pointer"
                                    title="View Squad Roster & Details"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!canEditOrg}
                                    onClick={() => handleOpenEditTeam(t)}
                                    className={`p-1.5 hover:bg-slate-100 rounded-xl text-muted hover:text-slate-900 transition cursor-pointer ${
                                      !canEditOrg ? "opacity-40 cursor-not-allowed" : ""
                                    }`}
                                    title={canEditOrg ? "Edit Team Details" : "Requires edit_staff permission"}
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!canEditOrg}
                                    onClick={() => handleDeleteTeam(t.id, t.name)}
                                    className={`p-1.5 hover:bg-red-50 rounded-xl text-muted hover:text-red-600 transition cursor-pointer ${
                                      !canEditOrg ? "opacity-40 cursor-not-allowed" : ""
                                    }`}
                                    title={canEditOrg ? "Remove Team" : "Requires edit_staff permission"}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>

                  {teams.filter((t) => {
                    const q = search.trim().toLowerCase();
                    const matchSearch =
                      !q ||
                      String(t.name ?? "").toLowerCase().includes(q) ||
                      String(t.code ?? "").toLowerCase().includes(q) ||
                      String(t.id ?? "").toLowerCase().includes(q) ||
                      String(t.lead ?? "").toLowerCase().includes(q) ||
                      String(t.leadName ?? "").toLowerCase().includes(q) ||
                      String(t.approver ?? "").toLowerCase().includes(q) ||
                      String(t.approverName ?? "").toLowerCase().includes(q) ||
                      String(t.dept ?? t.department ?? "").toLowerCase().includes(q) ||
                      String(t.secondaryDept ?? "").toLowerCase().includes(q);
                    const matchDept =
                      teamDeptFilter === "all"
                        ? true
                        : teamDeptFilter === "dual-dept"
                        ? ((t.memberIds || []).some((id) => (employeeDepartmentMap.get(id) || []).length > 1) || !!t.secondaryDept)
                        : (t.dept || t.department) === teamDeptFilter || t.secondaryDept === teamDeptFilter;
                    return matchSearch && matchDept;
                  }).length === 0 && (
                    <div className="py-12 text-center text-muted">
                      <Users size={32} className="mx-auto mb-2 opacity-40 text-navy" />
                      <p className="font-semibold text-slate-800 text-[14px]">
                        {teams.length === 0 ? "No squads created yet" : "No teams matching criteria"}
                      </p>
                      <p className="text-[12px] mt-0.5 text-muted">
                        {teams.length === 0
                          ? "Create operational teams to structure employees, department workflows, and leave approvers."
                          : "Try adjusting your search query or department filter"}
                      </p>
                      {teams.length === 0 ? (
                        <button
                          type="button"
                          disabled={!canEditOrg}
                          onClick={() => handleOpenAddTeam(teamDeptFilter !== "all" ? teamDeptFilter : undefined)}
                          className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-xs font-semibold rounded-xl hover:bg-navy/90 transition shadow-xs cursor-pointer"
                        >
                          <Plus size={14} /> Create First Squad
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            setTeamDeptFilter("all");
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Department Staff Roster: Shows active employees in the filtered department (including multi-dept employees) */}
              {teamDeptFilter !== "all" && teamDeptFilter !== "dual-dept" && (() => {
                const deptStaff = eligibleEmployees.filter((emp) => {
                  const depts = employeeDepartmentMap.get(emp.id) || [emp.department].filter(Boolean);
                  return depts.includes(teamDeptFilter);
                });
                return (
                  <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
                    <div className="p-3.5 border-b border-bdr flex flex-wrap items-center justify-between gap-2 bg-off/50">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-blue-700" />
                        <span className="text-[13px] font-bold text-slate-800">
                          Active Workforce in {teamDeptFilter} ({deptStaff.length} Staff)
                        </span>
                        <span className="text-[11px] text-muted">
                          (Staff assigned to {teamDeptFilter} squads or primary department appear here)
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={!canEditOrg}
                        onClick={() => handleOpenAddTeam(teamDeptFilter)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy text-white text-xs font-semibold rounded-lg hover:bg-navy/90 transition cursor-pointer shadow-xs"
                      >
                        <Plus size={13} /> Add Squad for {teamDeptFilter}
                      </button>
                    </div>
                    {deptStaff.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12.5px]">
                          <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
                            <tr>
                              <th className="py-2.5 px-4">Employee</th>
                              <th className="py-2.5 px-4">Code</th>
                              <th className="py-2.5 px-4">Designation</th>
                              <th className="py-2.5 px-4">All Active Departments</th>
                              <th className="py-2.5 px-4">Assigned Squad(s)</th>
                              <th className="py-2.5 px-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-bdr/40">
                            {deptStaff.map((emp) => {
                              const depts = employeeDepartmentMap.get(emp.id) || [emp.department].filter(Boolean);
                              const isDual = depts.length > 1;
                              const otherDepts = depts.filter((d) => d !== teamDeptFilter);
                              const empTeams = teams.filter(
                                (t) =>
                                  (t.memberIds || []).includes(emp.id) ||
                                  (t.membersDetail || []).some((m) => m.id === emp.id)
                              );
                              return (
                                <tr key={emp.id} className="hover:bg-off/50 transition">
                                  <td className="py-3 px-4 font-semibold text-slate-900">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">
                                        {(emp.name || "?").substring(0, 2).toUpperCase()}
                                      </div>
                                      <span>{emp.name}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-muted text-xs">{emp.employeeCode || emp.empId || "—"}</td>
                                  <td className="py-3 px-4 text-slate-600">{emp.designation || emp.role || "Staff"}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex flex-wrap items-center gap-1">
                                      {depts.map((d) => (
                                        <span
                                          key={d}
                                          className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium ${
                                            d === teamDeptFilter
                                              ? "bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                                              : "bg-slate-100 text-slate-600"
                                          }`}
                                        >
                                          {d}
                                        </span>
                                      ))}
                                      {isDual && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800" title={`Also active in ${otherDepts.join(", ")}`}>
                                          Dual Dept (also in {otherDepts.join(", ")})
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    {empTeams.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {empTeams.map((t) => (
                                          <span key={t.id} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-700">
                                            {t.name}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-muted text-xs italic">No squad assigned</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      {emp.status || "Active"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-muted">
                        No employees currently assigned to {teamDeptFilter}. Create a squad or assign employees to register them in this department.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* VIEW MODE 2: DEPARTMENT-WISE VIEW */}
          {teamViewMode === "by-dept" && (
            <div className="flex flex-col gap-5">
              {departmentsList
                .filter((d) => teamDeptFilter === "all" || teamDeptFilter === "dual-dept" || d === teamDeptFilter)
                .map((deptName) => {
                  const deptSquads = teams.filter(
                    (t) => (t.dept || t.department) === deptName || t.secondaryDept === deptName
                  );
                  const deptStaff = eligibleEmployees.filter((emp) => {
                    const depts = employeeDepartmentMap.get(emp.id) || [emp.department].filter(Boolean);
                    return depts.includes(deptName);
                  });
                  const deptDualStaff = deptStaff.filter(
                    (emp) => (employeeDepartmentMap.get(emp.id) || []).length > 1
                  );

                  if (teamDeptFilter === "dual-dept" && deptDualStaff.length === 0) return null;

                  return (
                    <div key={deptName} className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
                      {/* Department Section Header */}
                      <div className="p-4 bg-off/60 border-b border-bdr flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 border border-blue-200 flex items-center justify-center font-bold">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-[15px] text-slate-900">{deptName}</h3>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                {deptSquads.length} {deptSquads.length === 1 ? "Squad" : "Squads"}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {deptStaff.length} Staff Members
                              </span>
                              {deptDualStaff.length > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  {deptDualStaff.length} Dual-Dept Staff
                                </span>
                              )}
                            </div>
                            <p className="text-[11.5px] text-muted mt-0.5">
                              Operational squads &amp; workforce for {deptName}. Employees active in multiple departments have entries present here and in their co-departments.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!canEditOrg}
                          onClick={() => handleOpenAddTeam(deptName)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-navy text-white text-xs font-semibold rounded-xl hover:bg-navy/90 transition shadow-xs cursor-pointer"
                        >
                          <Plus size={14} /> Create Squad for {deptName}
                        </button>
                      </div>

                      {/* Department Squads Grid */}
                      <div className="p-4 border-b border-bdr/60">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                            <Layers size={13} className="text-blue-700" />
                            <span>{deptName} Squads ({deptSquads.length})</span>
                          </h4>
                          <span className="text-[11px] text-muted">
                            {deptSquads.length > 0 ? "Active teams under this department" : "No squads created yet"}
                          </span>
                        </div>
                        {deptSquads.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {deptSquads.map((squad) => {
                              const count = Number(squad.memberCount ?? squad.headcount ?? (Array.isArray(squad.membersDetail) ? squad.membersDetail.length : squad.members)) || 0;
                              return (
                                <div key={squad.id} className="p-3.5 rounded-xl border border-bdr bg-white hover:border-slate-300 transition shadow-2xs">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                      <div className="font-bold text-[13.5px] text-slate-900">{squad.name}</div>
                                      <span className="font-mono text-[11px] text-muted">{squad.code || squad.id}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenViewTeamDetails(squad)}
                                      className="text-xs text-blue-700 hover:underline font-semibold cursor-pointer"
                                    >
                                      View Roster
                                    </button>
                                  </div>
                                  <div className="text-xs text-slate-600 flex flex-col gap-1 mt-2 pt-2 border-t border-bdr/50">
                                    <div className="flex justify-between">
                                      <span className="text-muted">Lead:</span>
                                      <span className="font-medium text-slate-800">{squad.lead || squad.leadName || "Unassigned"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted">Approver:</span>
                                      <span className="font-medium text-slate-800">{squad.approver || squad.approverName || "Unassigned"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted">Headcount:</span>
                                      <span className="font-semibold text-slate-800">{count} members</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl border border-dashed border-bdr text-center text-xs text-muted">
                            No squads created for {deptName} yet. Click &quot;Create Squad for {deptName}&quot; above to organize this department.
                          </div>
                        )}
                      </div>

                      {/* Department Workforce List */}
                      <div className="p-4 bg-off/20">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                            <Users size={13} className="text-blue-700" />
                            <span>Active Workforce in {deptName} ({deptStaff.length})</span>
                          </h4>
                          <span className="text-[11px] text-muted">
                            Staff with multiple departments are listed in both department sections
                          </span>
                        </div>
                        {deptStaff.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {deptStaff.map((emp) => {
                              const depts = employeeDepartmentMap.get(emp.id) || [emp.department].filter(Boolean);
                              const isDual = depts.length > 1;
                              const otherDepts = depts.filter((d) => d !== deptName);
                              return (
                                <div key={emp.id} className="p-2.5 rounded-xl border border-bdr bg-white flex items-center justify-between gap-2 shadow-2xs">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                                      {(emp.name || "?").substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-semibold text-slate-900 text-[12.5px] truncate">{emp.name}</div>
                                      <div className="text-[11px] text-muted truncate">
                                        {emp.designation || emp.role || "Staff"} • {emp.employeeCode || emp.empId || ""}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    {isDual ? (
                                      <span
                                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 block"
                                        title={`Active in ${deptName} and ${otherDepts.join(", ")}`}
                                      >
                                        Also in {otherDepts[0]}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 block">
                                        {deptName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-muted italic">No employees assigned to this department.</div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 2: APPROVAL CHAINS (ROUTING WORKFLOWS)
          Separated dedicated container for approval tiers & SLA rules
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === "approvals" && (
        <div className="flex flex-col gap-4">
          {/* View Header */}
          <div className="bg-white border border-bdr rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Multi-Tier Approval Chains</h2>
                <p className="text-[12px] text-muted">
                  Define automated approval hierarchies, multi-level sign-offs, and SLA auto-escalations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                {approvalChains.filter((c) => c.status === "Active").length} Active Workflows
              </span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-bdr rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search workflows by module name or approver..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 text-xs rounded-xl border border-bdr bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-muted font-medium mr-1">Status:</span>
              {["all", "Active", "Inactive"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setChainStatusFilter(st)}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    chainStatusFilter === st
                      ? "bg-navy text-white font-semibold"
                      : "bg-off text-muted hover:text-slate-800"
                  }`}
                >
                  {st === "all" ? "All Workflows" : st}
                </button>
              ))}
            </div>
          </div>

          {/* Approval Chains Table */}
          <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] lg:min-w-0 text-left text-[13px]">
                <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
                  <tr>
                    <th className="py-3 px-5">Target Module</th>
                    <th className="py-3 px-5">Tier 1 (First Line)</th>
                    <th className="py-3 px-5">Tier 2 (Managerial)</th>
                    <th className="py-3 px-5">Tier 3 (Final Authority)</th>
                    <th className="py-3 px-5">SLA Escalation</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bdr/40">
                  {approvalChains
                    .filter((c) => {
                      const matchSearch =
                        !search ||
                        String(c.module ?? '').toLowerCase().includes(search.toLowerCase()) ||
                        String(c.tier1 ?? '').toLowerCase().includes(search.toLowerCase()) ||
                        String(c.tier2 ?? '').toLowerCase().includes(search.toLowerCase()) ||
                        String(c.tier3 ?? '').toLowerCase().includes(search.toLowerCase());
                      const matchStatus =
                        chainStatusFilter === "all" || c.status === chainStatusFilter;
                      return matchSearch && matchStatus;
                    })
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-off/60 transition">
                        <td className="py-4 px-5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Layers size={15} className="text-navy" />
                            <span>{c.module || "General"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-medium text-slate-800">
                            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center">1</span>
                            {c.tier1 || "—"}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-medium text-slate-800">
                            <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center">2</span>
                            {c.tier2 || "—"}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          {c.tier3 && c.tier3 !== "—" && c.tier3 !== "-" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-medium text-slate-800">
                              <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px] flex items-center justify-center">3</span>
                              {c.tier3}
                            </span>
                          ) : (
                            <span className="text-muted text-[12px]">—</span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                            <Clock size={12} />
                            {c.autoEscalateDays || 3} days
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <button
                            type="button"
                            onClick={() => toggleChainStatus(c.id)}
                            title="Click to toggle active status"
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                              c.status === "Active"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                            }`}
                          >
                            {c.status || "Active"}
                          </button>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditChain(c)}
                              className="p-1.5 hover:bg-slate-100 rounded-xl text-muted hover:text-slate-900 transition cursor-pointer"
                              title="Edit Approval Chain"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteChain(c.id, c.module)}
                              className="p-1.5 hover:bg-red-50 rounded-xl text-muted hover:text-red-600 transition cursor-pointer"
                              title="Delete Approval Chain"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {approvalChains.filter((c) => {
                    const matchSearch =
                      !search ||
                      String(c.module ?? '').toLowerCase().includes(search.toLowerCase()) ||
                      String(c.tier1 ?? '').toLowerCase().includes(search.toLowerCase()) ||
                      String(c.tier2 ?? '').toLowerCase().includes(search.toLowerCase()) ||
                      String(c.tier3 ?? '').toLowerCase().includes(search.toLowerCase());
                    const matchStatus =
                      chainStatusFilter === "all" || c.status === chainStatusFilter;
                    return matchSearch && matchStatus;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted">
                        <ShieldCheck size={36} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-700">No approval workflows found</p>
                        <p className="text-xs text-muted mt-0.5">
                          {search || chainStatusFilter !== "all"
                            ? "Try adjusting your search query or status filter."
                            : "Configure automated approval hierarchies for Leave, Attendance, Assets, and Payroll."}
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenAddChain}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy text-white text-xs font-semibold rounded-xl hover:bg-navy/90 transition shadow-xs cursor-pointer"
                        >
                          <Plus size={14} /> Add Approval Chain
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 3: EMPLOYMENT OFFER LETTERS (OPTION LIST)
          Separated dedicated container with recruitment integration
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === "offers" && (
        <div className="flex flex-col gap-4">
          {/* View Header */}
          <div className="bg-white border border-bdr rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold">
                <FileCheck2 size={20} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Employment Offer Letters &amp; Terms</h2>
                <p className="text-[12px] text-muted">
                  Track issued offer letters, compensation terms, candidate responses, and printable formal PDFs.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
                {offers.length} Generated Offers
              </span>
            </div>
          </div>

          {/* Hired Candidates Banner */}
          {candidates.some((c) => c.stage === "Hired") && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-emerald-950">
                    Recruitment Integration: Hired Candidates Ready for Official Offer Letters
                  </div>
                  <div className="text-[12px] text-emerald-700">
                    Candidates in pipeline currently in &ldquo;Hired&rdquo; stage:{" "}
                    <b>
                      {candidates
                        .filter((c) => c.stage === "Hired")
                        .map((c) => c.name)
                        .join(", ")}
                    </b>
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Ready for Offer
              </span>
            </div>
          )}

          {/* Filter / Search Bar */}
          <div className="bg-white border border-bdr rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search offer letters by candidate, position, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 text-xs rounded-xl border border-bdr bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-muted font-medium mr-1">Status:</span>
              {["all", "Accepted", "Pending", "Declined"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOfferStatusFilter(st)}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    offerStatusFilter === st
                      ? "bg-navy text-white font-semibold"
                      : "bg-off text-muted hover:text-slate-800"
                  }`}
                >
                  {st === "all" ? "All Offers" : st}
                </button>
              ))}
            </div>
          </div>

          {/* Offer Letters Table */}
          <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-bdr flex flex-wrap items-center justify-between gap-3 bg-off/50">
              <span className="text-[13px] font-semibold text-slate-800">
                Issued Employment Offer Letters &amp; Compensation Terms
              </span>
              <span className="text-[12px] text-muted">
                Showing {offers.length} total generated offers
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] lg:min-w-0 text-left text-[13px]">
                <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
                  <tr>
                    <th className="py-3 px-5">Candidate &amp; ID</th>
                    <th className="py-3 px-5">Role &amp; Department</th>
                    <th className="py-3 px-5">Job Type</th>
                    <th className="py-3 px-5">Stipend / Salary</th>
                    <th className="py-3 px-5">Location &amp; Mode</th>
                    <th className="py-3 px-5">Joining Date</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bdr/40">
                  {offers
                    .filter((o) => {
                      const matchSearch =
                        !search ||
                        o.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
                        o.position?.toLowerCase().includes(search.toLowerCase()) ||
                        o.id?.toLowerCase().includes(search.toLowerCase());
                      const matchStatus =
                        offerStatusFilter === "all" || o.status === offerStatusFilter;
                      return matchSearch && matchStatus;
                    })
                    .map((o) => (
                      <tr key={o.id} className="hover:bg-off/60 transition">
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900">{o.candidateName}</div>
                          <div className="text-[11px] font-mono text-muted">
                            {o.id} • {o.email || "No email"}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-slate-800 font-medium">{o.position}</div>
                          <div className="text-[11px] text-muted">{o.dept}</div>
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              o.jobType === "Internship"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : o.jobType === "Contract"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {o.jobType || "Full-time"}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="font-bold text-emerald-800">{o.salary}</div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-slate-800">{o.location || "New York HQ"}</div>
                          <div className="text-[11px] text-muted">{o.workMode || "Hybrid"}</div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-slate-800 font-medium">{o.joiningDate}</div>
                        </td>
                        <td className="py-4 px-5">
                          <select
                            value={o.status}
                            onChange={(e) => toggleOfferStatus(o.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer focus:outline-none ${
                              o.status === "Accepted"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : o.status === "Declined"
                                ? "bg-red-50 text-red-800 border-red-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Declined">Declined</option>
                          </select>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditOfferLetter(o)}
                              className="inline-flex items-center gap-1 btn-primary h-8 px-3 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
                              title="Edit Offer Letter Details"
                            >
                              <Edit size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintOfferLetter(o)}
                              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-2xs"
                              title="Print Official Offer Letter"
                            >
                              <Printer size={13} />
                              <span>Print</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOffer(o.id, o.candidateName)}
                              className="p-1.5 hover:bg-red-50 rounded-xl text-muted hover:text-red-600 transition cursor-pointer"
                              title="Delete Offer Letter"
                            >
                              <Trash2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOffer(o.id, o.candidateName)}
                              className="p-1.5 hover:bg-red-50 rounded-xl text-muted hover:text-red-600 transition cursor-pointer"
                              title="Delete Offer Letter"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 4: TERMINATION LIST
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === "terminations" && (
        <div className="flex flex-col gap-4">
          {/* Dedicated View Header */}
          <div className="bg-white border border-bdr rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center justify-center font-bold">
                <UserX size={20} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Involuntary Exits &amp; Disciplinary Records</h2>
                <p className="text-[12px] text-muted">
                  Formal legal notices, exit clearance tracking, and printable PDF separation documents.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-red-800 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                {terminations.length} Exit Records
              </span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-bdr rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search terminations by employee name, ID, or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 h-9 text-xs rounded-xl border border-bdr bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12px] text-muted font-medium mr-1">Status:</span>
              {["all", "Completed", "Pending Clearance"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTerminationFilter(st)}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    terminationFilter === st
                      ? "bg-navy text-white font-semibold shadow-2xs"
                      : "bg-off text-muted hover:text-slate-800"
                  }`}
                >
                  {st === "all" ? "All Exits" : st}
                </button>
              ))}
            </div>
          </div>

          {/* Terminations Table Container */}
          <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-bdr flex flex-wrap items-center justify-between gap-2 bg-off/50">
              <span className="text-[12.5px] font-bold text-slate-800">Exit Clearances &amp; Notices</span>
              <span className="text-[11.5px] text-muted">
                Showing{" "}
                {
                  terminations.filter((t) => {
                    const matchSearch =
                      !search ||
                      t.employee?.toLowerCase().includes(search.toLowerCase()) ||
                      t.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
                      t.role?.toLowerCase().includes(search.toLowerCase()) ||
                      t.id?.toLowerCase().includes(search.toLowerCase());
                    const matchStatus =
                      terminationFilter === "all" ||
                      (terminationFilter === "Completed" ? t.status === "Completed" : t.status !== "Completed");
                    return matchSearch && matchStatus;
                  }).length
                }{" "}
                of {terminations.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] lg:min-w-0 text-left text-[13px]">
                <thead className="bg-slate-50 border-b border-bdr text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Employee &amp; ID</th>
                    <th className="py-3 px-5">Department &amp; Role</th>
                    <th className="py-3 px-5">Termination Type</th>
                    <th className="py-3 px-5">Notice &amp; Exit Date</th>
                    <th className="py-3 px-5">Severance Terms</th>
                    <th className="py-3 px-5">Clearance Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bdr/40">
                  {terminations
                    .filter((t) => {
                      const matchSearch =
                        !search ||
                        t.employee?.toLowerCase().includes(search.toLowerCase()) ||
                        t.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
                        t.role?.toLowerCase().includes(search.toLowerCase()) ||
                        t.id?.toLowerCase().includes(search.toLowerCase());
                      const matchStatus =
                        terminationFilter === "all" ||
                        (terminationFilter === "Completed" ? t.status === "Completed" : t.status !== "Completed");
                      return matchSearch && matchStatus;
                    })
                    .map((t) => (
                      <tr key={t.id} className="hover:bg-off/60 transition">
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900">{t.employee}</div>
                          <div className="text-[11px] font-mono text-muted">{t.employeeId} • {t.id}</div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-slate-800 font-medium">{t.role}</div>
                          <div className="text-[11px] text-muted">{t.dept}</div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                            {t.terminationType}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-slate-800">Exit: <b>{t.exitDate}</b></div>
                          <div className="text-[11px] text-muted">Notice: {t.noticeDate}</div>
                        </td>
                        <td className="py-4 px-5 text-slate-700">{t.severance}</td>
                        <td className="py-4 px-5">
                          <button
                            type="button"
                            onClick={() => toggleTerminationStatus(t.id)}
                            title="Click to toggle clearance status"
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition cursor-pointer ${
                              t.status === "Completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            }`}
                          >
                            {t.status}
                          </button>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditTermination(t)}
                              className="inline-flex items-center gap-1 btn-danger h-8 px-3 rounded-xl text-xs font-semibold border border-red-200 transition cursor-pointer shadow-2xs"
                              title="Edit Separation Details"
                            >
                              <Edit size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintTermination(t)}
                              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-2xs"
                              title="Print Official Termination Letter / Save as PDF"
                            >
                              <Printer size={13} />
                              <span>Print</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => showToast(`Reason: ${t.reason}`)}
                              className="p-1.5 hover:bg-off rounded-xl text-muted hover:text-slate-900 cursor-pointer"
                              title="View Reason"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTermination(t.id, t.employee)}
                              className="p-1.5 hover:bg-red-50 rounded-xl text-muted hover:text-red-600 cursor-pointer"
                              title="Delete Termination"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {terminations.filter((t) => {
                const matchSearch =
                  !search ||
                  t.employee?.toLowerCase().includes(search.toLowerCase()) ||
                  t.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
                  t.role?.toLowerCase().includes(search.toLowerCase()) ||
                  t.id?.toLowerCase().includes(search.toLowerCase());
                const matchStatus =
                  terminationFilter === "all" ||
                  (terminationFilter === "Completed" ? t.status === "Completed" : t.status !== "Completed");
                return matchSearch && matchStatus;
              }).length === 0 && (
                <div className="py-12 text-center text-muted">
                  <UserX size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No termination records found</p>
                  <p className="text-xs text-muted mt-0.5">
                    {search || terminationFilter !== "all"
                      ? "Try adjusting your search query or status filter."
                      : "Record involuntary separations, legal notice periods, and clearance processes."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 5: RESIGNATION LIST
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === "resignations" && (
        <div className="flex flex-col gap-4">
          {/* Dedicated View Header */}
          <div className="bg-white border border-bdr rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                <UserMinus size={20} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Voluntary Resignations &amp; Notice Periods</h2>
                <p className="text-[12px] text-muted">
                  Knowledge transfer, handover coordination, and last working day clearance tracking.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                {resignations.length} Total Records • {resignations.filter((r) => r.status?.includes("Pending")).length} Pending Review
              </span>
              <button
                type="button"
                onClick={() => {
                  hrmsSync.pull('resignations').then((rows) => {
                    if (rows) setResignations(rows);
                  }).catch(console.warn);
                }}
                className="h-8 px-2.5 rounded-lg border border-bdr text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Refresh Resignations"
              >
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-bdr rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search resignations by employee name, ID, or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 h-9 text-xs rounded-xl border border-bdr bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12px] text-muted font-medium mr-1">Status:</span>
              {["all", "Pending", "Approved", "Notice Period", "Clearance"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setResignationFilter(st)}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    resignationFilter === st
                      ? "bg-navy text-white font-semibold shadow-2xs"
                      : "bg-off text-muted hover:text-slate-800"
                  }`}
                >
                  {st === "all" ? "All Resignations" : st}
                </button>
              ))}
            </div>
          </div>

          {/* Resignations Table Container */}
          <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-bdr flex flex-wrap items-center justify-between gap-2 bg-off/50">
              <span className="text-[12.5px] font-bold text-slate-800">Notice Period &amp; Handover Roster</span>
              <span className="text-[11.5px] text-muted">
                Showing{" "}
                {
                  resignations.filter((r) => {
                    const matchSearch =
                      !search ||
                      r.employee?.toLowerCase().includes(search.toLowerCase()) ||
                      r.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
                      r.role?.toLowerCase().includes(search.toLowerCase()) ||
                      r.id?.toLowerCase().includes(search.toLowerCase());
                    const matchStatus =
                      resignationFilter === "all" ||
                      r.status?.toLowerCase().includes(resignationFilter.toLowerCase());
                    return matchSearch && matchStatus;
                  }).length
                }{" "}
                of {resignations.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] lg:min-w-0 text-left text-[13px]">
                <thead className="bg-slate-50 border-b border-bdr text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Employee &amp; ID</th>
                    <th className="py-3 px-5">Role &amp; Department</th>
                    <th className="py-3 px-5">Submission Date</th>
                    <th className="py-3 px-5">Last Working Day</th>
                    <th className="py-3 px-5">Handover Assignee</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bdr/40">
                  {resignations
                    .filter((r) => {
                      const matchSearch =
                        !search ||
                        r.employee?.toLowerCase().includes(search.toLowerCase()) ||
                        r.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
                        r.role?.toLowerCase().includes(search.toLowerCase()) ||
                        r.id?.toLowerCase().includes(search.toLowerCase());
                      const matchStatus =
                        resignationFilter === "all" ||
                        r.status?.toLowerCase().includes(resignationFilter.toLowerCase());
                      return matchSearch && matchStatus;
                    })
                    .map((r) => (
                      <tr key={r.id} className="hover:bg-off/60 transition">
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900">{r.employee}</div>
                          <div className="text-[11px] font-mono text-muted">{r.employeeId} • {r.id}</div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-slate-800 font-medium">{r.role}</div>
                          <div className="text-[11px] text-muted">{r.dept}</div>
                        </td>
                        <td className="py-4 px-5 text-slate-700">{r.submittedDate}</td>
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900">{r.lastWorkingDay}</div>
                          <div className="text-[11px] text-muted">Notice: {r.noticePeriod}</div>
                          {r.noticeWaived && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Notice Waived
                            </span>
                          )}
                          {r.originalLastWorkingDay && r.originalLastWorkingDay !== r.lastWorkingDay && (
                            <div className="text-[10px] text-slate-400 line-through">Orig: {r.originalLastWorkingDay}</div>
                          )}
                        </td>
                        <td className="py-4 px-5 text-slate-800">{r.handoverTo}</td>
                        <td className="py-4 px-5">
                          <button
                            type="button"
                            onClick={() => toggleResignationStatus(r.id)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer ${
                              r.status.includes("Approved")
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : r.status.includes("Clearance")
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {r.status}
                          </button>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setNoticeActionModal({
                                  open: true,
                                  type: 'shorten',
                                  resignation: r,
                                  date: r.lastWorkingDay ? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                                  reason: '',
                                  loading: false,
                                });
                              }}
                              className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                              title="Shorten Notice Period"
                            >
                              Shorten
                            </button>
                            {!r.noticeWaived && (
                              <button
                                type="button"
                                onClick={() => {
                                  setNoticeActionModal({
                                    open: true,
                                    type: 'waive',
                                    resignation: r,
                                    date: new Date().toISOString().slice(0, 10),
                                    reason: '',
                                    loading: false,
                                  });
                                }}
                                className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-800 cursor-pointer"
                                title="Waive Notice Period"
                              >
                                Waive
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => showToast(`Resignation Reason: ${r.reason}`)}
                              className="p-1.5 hover:bg-off rounded-xl text-muted hover:text-slate-900 cursor-pointer"
                              title="View Reason"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteResignation(r.id, r.employee)}
                              className="p-1.5 hover:bg-red-50 rounded-xl text-muted hover:text-red-600 transition cursor-pointer"
                              title="Delete Resignation"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {resignations.filter((r) => {
                const matchSearch =
                  !search ||
                  r.employee?.toLowerCase().includes(search.toLowerCase()) ||
                  r.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
                  r.role?.toLowerCase().includes(search.toLowerCase()) ||
                  r.id?.toLowerCase().includes(search.toLowerCase());
                const matchStatus =
                  resignationFilter === "all" ||
                  r.status?.toLowerCase().includes(resignationFilter.toLowerCase());
                return matchSearch && matchStatus;
              }).length === 0 && (
                <div className="py-12 text-center text-muted">
                  <UserMinus size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No resignation records found</p>
                  <p className="text-xs text-muted mt-0.5">
                    {search || resignationFilter !== "all"
                      ? "Try adjusting your search query or status filter."
                      : "Track notice periods, manager handovers, and voluntary departure clearances."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 6: COMPLAINT & GRIEVANCE LIST
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === "complaints" && (
        <div className="flex flex-col gap-4">
          {/* Dedicated View Header */}
          <div className="bg-white border border-bdr rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
                <MessageSquareWarning size={20} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Employee Grievances, POSH &amp; Compliance Inquiries</h2>
                <p className="text-[12px] text-muted">
                  Confidential investigation, priority tracking, internal comments, and resolution records.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                {complaints.length} Registered Tickets
              </span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-bdr rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search tickets by ID, complainant, category, or investigator..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 h-9 text-xs rounded-xl border border-bdr bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12px] text-muted font-medium mr-1">Priority:</span>
              {["all", "High", "Medium", "Low"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setComplaintPriorityFilter(p)}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    complaintPriorityFilter === p
                      ? "bg-navy text-white font-semibold shadow-2xs"
                      : "bg-off text-muted hover:text-slate-800"
                  }`}
                >
                  {p === "all" ? "All Priorities" : p}
                </button>
              ))}
            </div>
          </div>

          {/* Complaints Table Container */}
          <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-bdr flex flex-wrap items-center justify-between gap-2 bg-off/50">
              <span className="text-[12.5px] font-bold text-slate-800">Confidential Grievance Logs</span>
              <span className="text-[11.5px] text-muted">
                Showing{" "}
                {
                  complaints.filter((c) => {
                    const matchSearch =
                      !search ||
                      c.id?.toLowerCase().includes(search.toLowerCase()) ||
                      c.complainant?.toLowerCase().includes(search.toLowerCase()) ||
                      c.against?.toLowerCase().includes(search.toLowerCase()) ||
                      c.category?.toLowerCase().includes(search.toLowerCase()) ||
                      c.assignedInvestigator?.toLowerCase().includes(search.toLowerCase());
                    const matchPriority =
                      complaintPriorityFilter === "all" ||
                      c.priority?.toLowerCase() === complaintPriorityFilter.toLowerCase();
                    return matchSearch && matchPriority;
                  }).length
                }{" "}
                of {complaints.length} tickets
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] lg:min-w-0 text-left text-[13px]">
                <thead className="bg-slate-50 border-b border-bdr text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Ticket &amp; Filed On</th>
                    <th className="py-3 px-5">Complainant / Against</th>
                    <th className="py-3 px-5">Category</th>
                    <th className="py-3 px-5">Priority</th>
                    <th className="py-3 px-5">Assigned Investigator</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bdr/40">
                  {complaints
                    .filter((c) => {
                      const matchSearch =
                        !search ||
                        c.id?.toLowerCase().includes(search.toLowerCase()) ||
                        c.complainant?.toLowerCase().includes(search.toLowerCase()) ||
                        c.against?.toLowerCase().includes(search.toLowerCase()) ||
                        c.category?.toLowerCase().includes(search.toLowerCase()) ||
                        c.assignedInvestigator?.toLowerCase().includes(search.toLowerCase());
                      const matchPriority =
                        complaintPriorityFilter === "all" ||
                        c.priority?.toLowerCase() === complaintPriorityFilter.toLowerCase();
                      return matchSearch && matchPriority;
                    })
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-off/60 transition">
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900">{c.id}</div>
                          <div className="text-[11px] text-muted">{c.filedOn}</div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-slate-900 font-medium">By: {c.complainant}</div>
                          <div className="text-[11px] text-muted">Target: {c.against}</div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-slate-800 font-semibold">{c.category}</div>
                          <div
                            className="text-[11.5px] text-slate-500 line-clamp-1 max-w-[220px] mt-0.5"
                            title={c.summary || c.description || c.reason || ""}
                          >
                            {c.summary || c.description || c.reason || "No complaint details"}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                              c.priority === "High"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : c.priority === "Medium"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {c.priority}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-800">{c.assignedInvestigator}</td>
                        <td className="py-4 px-5">
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(c)}
                            title="Click to view complaint reason & change status"
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition cursor-pointer shadow-2xs ${
                              c.status === "Resolved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : c.status === "Under Review" || c.status === "Under Investigation"
                                ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            }`}
                          >
                            <span>{c.status || "Open"}</span>
                            <ChevronDown size={11} className="opacity-70" />
                          </button>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingComplaint(c)}
                              className="p-1.5 hover:bg-off rounded-xl text-muted hover:text-slate-900 cursor-pointer"
                              title="View Details & Notes"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteComplaint(c.id)}
                              className="p-1.5 hover:bg-red-50 rounded-xl text-muted hover:text-red-600 transition cursor-pointer"
                              title="Delete Ticket"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {complaints.filter((c) => {
                const matchSearch =
                  !search ||
                  c.id?.toLowerCase().includes(search.toLowerCase()) ||
                  c.complainant?.toLowerCase().includes(search.toLowerCase()) ||
                  c.against?.toLowerCase().includes(search.toLowerCase()) ||
                  c.category?.toLowerCase().includes(search.toLowerCase()) ||
                  c.assignedInvestigator?.toLowerCase().includes(search.toLowerCase());
                const matchPriority =
                  complaintPriorityFilter === "all" ||
                  c.priority?.toLowerCase() === complaintPriorityFilter.toLowerCase();
                return matchSearch && matchPriority;
              }).length === 0 && (
                <div className="py-12 text-center text-muted">
                  <MessageSquareWarning size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No grievance tickets found</p>
                  <p className="text-xs text-muted mt-0.5">
                    {search || complaintPriorityFilter !== "all"
                      ? "Try adjusting your search query or priority filter."
                      : "File anonymous or registered workplace inquiries, POSH cases, and ethics disputes."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 7: HOLIDAYS SETUP CALENDAR
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === "holidays" && (
        <div className="flex flex-col gap-4">
          {/* Dedicated View Header */}
          <div className="bg-white border border-bdr rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
                <Calendar size={20} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">
                  Annual Enterprise Holiday Schedule ({new Date().getFullYear()}–{new Date().getFullYear() + 1})
                </h2>
                <p className="text-[12px] text-muted">
                  Synchronized across Attendance, Personal Calendar, and Working Days calculation.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                {holidays.filter((h) => h.status !== "Inactive").length} Published • {holidays.length} Total
              </span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-bdr rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search holidays by name or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 h-9 text-xs rounded-xl border border-bdr bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Year Filter */}
              <div className="flex items-center gap-1.5 bg-off border border-bdr rounded-xl px-3 h-9 text-xs">
                <Calendar size={13} className="text-muted shrink-0" />
                <span className="text-muted font-medium">Year:</span>
                <select
                  value={holidayYearFilter}
                  onChange={(e) => setHolidayYearFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="all">All Years</option>
                  <option value={String(new Date().getFullYear())}>{new Date().getFullYear()}</option>
                  <option value={String(new Date().getFullYear() + 1)}>{new Date().getFullYear() + 1}</option>
                  <option value={String(new Date().getFullYear() - 1)}>{new Date().getFullYear() - 1}</option>
                </select>
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-1.5 bg-off border border-bdr rounded-xl px-3 h-9 text-xs">
                <Building2 size={13} className="text-muted shrink-0" />
                <span className="text-muted font-medium">Scope:</span>
                <select
                  value={holidayDeptFilter}
                  onChange={(e) => setHolidayDeptFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="all">All Scopes</option>
                  {departmentsConfig.map((d) => (
                    <option key={d.id || d.name} value={d.id || d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Holidays Table Container */}
          <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] lg:min-w-0 text-left text-[13px]">
                <thead className="bg-slate-50 border-b border-bdr text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Holiday Name</th>
                    <th className="py-3 px-5">Date &amp; Day</th>
                    <th className="py-3 px-5">Classification</th>
                    <th className="py-3 px-5">Applies To</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bdr/40">
                  {holidays
                    .filter((h) => {
                      if (search) {
                        const term = search.toLowerCase();
                        const matchName = h.name?.toLowerCase().includes(term);
                        const matchDesc = h.description?.toLowerCase().includes(term);
                        if (!matchName && !matchDesc) return false;
                      }
                      if (holidayYearFilter !== "all") {
                        const yr = String(h.date || "").slice(0, 4);
                        if (yr !== holidayYearFilter) return false;
                      }
                      if (holidayDeptFilter !== "all") {
                        if (h.departmentId && h.departmentId !== holidayDeptFilter) return false;
                        if (!h.departmentId && h.departmentName && h.departmentName !== holidayDeptFilter) return false;
                        if (!h.departmentId && !h.departmentName && holidayDeptFilter !== "all") return false;
                      }
                      return true;
                    })
                    .map((h) => (
                      <tr key={h.id} className="hover:bg-off/60 transition">
                        <td className="py-4 px-5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Calendar size={15} className="text-navy shrink-0" />
                            <div>
                              <div>{h.name}</div>
                              {h.description && (
                                <div className="text-[11px] text-muted font-normal line-clamp-1">{h.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-slate-900 font-medium">{h.date}</div>
                          <div className="text-[11px] text-muted">{h.day}</div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-off border border-bdr text-slate-700">
                            {h.type}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-slate-50 border border-slate-200 text-slate-800">
                            <Building2 size={11} className="text-slate-500" />
                            {h.appliesTo || (h.departmentName ? `${h.departmentName} Dept` : "All Hubs & Remote")}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                h.status === "Published"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {h.status || "Published"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleHolidayStatus(h)}
                              disabled={!canEditOrg}
                              className={`p-1.5 rounded-xl transition cursor-pointer ${
                                h.status === "Published"
                                  ? "hover:bg-amber-50 text-emerald-600 hover:text-amber-700"
                                  : "hover:bg-emerald-50 text-slate-400 hover:text-emerald-700"
                              }`}
                              title={h.status === "Published" ? "Deactivate Holiday" : "Publish Holiday"}
                            >
                              {h.status === "Published" ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditHoliday(h)}
                              className="p-1.5 hover:bg-off rounded-xl text-muted hover:text-slate-900 cursor-pointer"
                              title="Edit Holiday"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteHoliday(h.id, h.name)}
                              className="p-1.5 hover:bg-red-50 rounded-xl text-muted hover:text-red-600 cursor-pointer"
                              title="Remove Holiday"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {holidays.filter((h) => {
                if (search) {
                  const term = search.toLowerCase();
                  const matchName = h.name?.toLowerCase().includes(term);
                  const matchDesc = h.description?.toLowerCase().includes(term);
                  if (!matchName && !matchDesc) return false;
                }
                if (holidayYearFilter !== "all") {
                  const yr = String(h.date || "").slice(0, 4);
                  if (yr !== holidayYearFilter) return false;
                }
                if (holidayDeptFilter !== "all") {
                  if (h.departmentId && h.departmentId !== holidayDeptFilter) return false;
                  if (!h.departmentId && h.departmentName && h.departmentName !== holidayDeptFilter) return false;
                  if (!h.departmentId && !h.departmentName && holidayDeptFilter !== "all") return false;
                }
                return true;
              }).length === 0 && (
                <div className="py-12 text-center text-muted">
                  <Calendar size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No holidays found</p>
                  <p className="text-xs text-muted mt-0.5">
                    {search || holidayYearFilter !== "all" || holidayDeptFilter !== "all"
                      ? "Try adjusting your search query, year, or scope filter."
                      : "Configure annual enterprise gazetted and optional holidays."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 8: GENERAL ORGANIZATION SETTINGS
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div className="flex flex-col gap-6">
          {/* Dedicated View Header */}
          <div className="bg-white border border-bdr rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-bold shadow-2xs">
                <Settings size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[17px] font-bold text-slate-900">Enterprise Organization Settings &amp; Governance</h2>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Governance Active
                  </span>
                </div>
                <p className="text-[12.5px] text-muted mt-0.5">
                  Inspect and manage all operational policies, security controls, leave deduction rules, and enterprise parameters running across the organization.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 inline-flex items-center gap-2 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{activeRulesCount} of {totalRulesCount} Rules Running</span>
              </span>
              <button
                type="button"
                onClick={() => scrollToRuleField("companyName")}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-300 transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
              >
                <span>Edit Parameters</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar: 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white border border-bdr rounded-xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11.5px] font-medium text-muted">Total Governance Rules</div>
                <div className="text-[20px] font-bold text-slate-900 mt-0.5">{totalRulesCount} Policies</div>
                <div className="text-[11px] text-muted mt-0.5">Defined enterprise rules</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                <Sliders size={20} />
              </div>
            </div>

            <div className="bg-white border border-bdr rounded-xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11.5px] font-medium text-emerald-700">Currently Running / Active</div>
                <div className="text-[20px] font-bold text-emerald-700 mt-0.5">{activeRulesCount} Active</div>
                <div className="text-[11px] text-emerald-600 mt-0.5">Enforcing real-time policies</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 size={20} />
              </div>
            </div>

            <div className="bg-white border border-bdr rounded-xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11.5px] font-medium text-amber-700">Paused / Inactive</div>
                <div className="text-[20px] font-bold text-amber-700 mt-0.5">{inactiveRulesCount} Inactive</div>
                <div className="text-[11px] text-muted mt-0.5">Disabled or custom</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                <AlertCircle size={20} />
              </div>
            </div>

            <div className="bg-white border border-bdr rounded-xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11.5px] font-medium text-blue-700">Department Schedules</div>
                <div className="text-[20px] font-bold text-slate-900 mt-0.5">{departmentsConfig.length} Depts</div>
                <div className="text-[11px] text-muted mt-0.5">Custom work days &amp; hours</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                <Building2 size={20} />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              INTERACTIVE GOVERNANCE RULES DIRECTORY (RUNNING & CONFIGURED)
             ══════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-bdr rounded-2xl p-5 shadow-xs flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-bdr">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-bold text-slate-900">All Organization Rules &amp; Governance Engine</h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {filteredGovernanceRules.length} Rules Shown
                  </span>
                </div>
                <p className="text-[12px] text-muted mt-0.5">
                  View all active rules running across attendance, security, leave deductions, approval workflows, and operational schedules.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setRuleFilterStatus("all")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    ruleFilterStatus === "all" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All Rules ({totalRulesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setRuleFilterStatus("active")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    ruleFilterStatus === "active" ? "bg-white text-emerald-800 shadow-2xs font-semibold" : "text-slate-600 hover:text-emerald-700"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Running ({activeRulesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setRuleFilterStatus("inactive")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    ruleFilterStatus === "inactive" ? "bg-white text-amber-800 shadow-2xs font-semibold" : "text-slate-600 hover:text-amber-700"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Paused ({inactiveRulesCount})
                </button>
              </div>
            </div>

            {/* Search and Category Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[260px]">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search rules by name, scope, or keywords..."
                  value={ruleSearchQuery}
                  onChange={(e) => setRuleSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 rounded-xl border border-bdr text-[12.5px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
                {ruleSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setRuleSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-slate-700 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 hidden sm:inline">Category:</span>
                <select
                  value={ruleFilterCategory}
                  onChange={(e) => setRuleFilterCategory(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-bdr text-xs bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition font-medium"
                >
                  <option value="all">All Categories ({totalRulesCount})</option>
                  <option value="Attendance & Leaves">Attendance &amp; Leaves</option>
                  <option value="Security & Access">Security &amp; Access</option>
                  <option value="Workflow & Delegation">Workflow &amp; Delegation</option>
                  <option value="Operations & Schedule">Operations &amp; Schedule</option>
                  <option value="Hiring & Onboarding">Hiring &amp; Onboarding</option>
                  <option value="Separations & Exits">Separations &amp; Exits</option>
                  <option value="Compliance & Payroll">Compliance &amp; Payroll</option>
                </select>
              </div>
            </div>

            {/* Rules Cards Grid */}
            {filteredGovernanceRules.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2">
                <Sliders size={28} className="text-muted" />
                <h4 className="text-[14px] font-bold text-slate-800">No Governance Rules Match Filter</h4>
                <p className="text-xs text-muted max-w-md">
                  No rules matched your current search &quot;{ruleSearchQuery}&quot; or selected category.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRuleSearchQuery("");
                    setRuleFilterStatus("all");
                    setRuleFilterCategory("all");
                  }}
                  className="mt-2 text-xs font-semibold text-navy hover:underline cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGovernanceRules.map((rule) => {
                  const RuleIcon = rule.icon || Sliders;
                  return (
                    <div
                      key={rule.id}
                      className={`rounded-xl border p-4.5 flex flex-col justify-between gap-3.5 transition-all shadow-xs ${
                        rule.isActive
                          ? "bg-white border-slate-200 hover:border-slate-300"
                          : "bg-slate-50/70 border-slate-200 opacity-80"
                      }`}
                    >
                      {/* Top Row: Icon + Title + Status */}
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold shrink-0 ${rule.badgeBg || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                              <RuleIcon size={18} />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                                {rule.category}
                              </span>
                              <h4 className="font-bold text-[13.5px] text-slate-900 leading-snug">
                                {rule.name}
                              </h4>
                            </div>
                          </div>
                          {rule.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Running
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-300 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Paused
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-[12px] text-slate-600 leading-relaxed min-h-[36px]">
                          {rule.description}
                        </p>
                      </div>

                      {/* Enforced Scope & Parameter Box */}
                      <div className="flex flex-col gap-1.5 bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted">Target Scope:</span>
                          <span className="font-semibold text-slate-800 text-right">{rule.scope}</span>
                        </div>
                        <div className="flex items-start justify-between text-[11px] pt-1 border-t border-slate-200/60">
                          <span className="text-muted shrink-0">Enforced Value:</span>
                          <span className="font-medium text-slate-900 text-right pl-2 leading-tight">
                            {rule.parameter}
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        {rule.isToggleable ? (
                          <>
                            <span className="text-[11px] font-medium text-muted">Live Execution</span>
                            <button
                              type="button"
                              onClick={() => handleToggleGovernanceRule(rule.toggleKey, rule.isActive)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11.5px] font-semibold transition cursor-pointer border shadow-2xs ${
                                rule.isActive
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                              }`}
                              title={rule.isActive ? "Click to deactivate rule" : "Click to activate rule"}
                            >
                              {rule.isActive ? (
                                <>
                                  <ToggleRight size={17} className="text-emerald-600" />
                                  <span>Active (Click to Pause)</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft size={17} className="text-slate-400" />
                                  <span>Paused (Click to Enable)</span>
                                </>
                              )}
                            </button>
                          </>
                        ) : rule.actionTab ? (
                          <>
                            <span className="text-[11px] font-medium text-muted">Dedicated Hub</span>
                            <button
                              type="button"
                              onClick={() => setActiveTab(rule.actionTab)}
                              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-navy hover:text-navy/80 hover:underline cursor-pointer"
                            >
                              <span>{rule.actionLabel || "Manage"}</span>
                              <ArrowRight size={13} />
                            </button>
                          </>
                        ) : rule.configTarget ? (
                          <>
                            <span className="text-[11px] font-medium text-muted">Enterprise Parameter</span>
                            <button
                              type="button"
                              onClick={() => scrollToRuleField(rule.configTarget)}
                              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-slate-700 hover:text-navy hover:underline cursor-pointer"
                            >
                              <span>Configure Value</span>
                              <Edit size={11} />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════
              ENTERPRISE PARAMETERS & CONFIGURATION FORM
             ══════════════════════════════════════════════════════════════ */}
          <form onSubmit={handleSaveOrgSettings} className="bg-white border border-bdr rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-bdr">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">Legal Profile &amp; Enterprise Parameters</h3>
                <p className="text-[12px] text-muted">
                  Update primary corporate parameters. Changes are immediately reflected across governance rules and employee workflows.
                </p>
              </div>
              <button
                type="submit"
                className="h-9 px-5 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 transition shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                <CheckCircle2 size={15} />
                <span>Save Organization Settings</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Legal Company Name</label>
                <input
                  id="org-input-companyName"
                  type="text"
                  value={orgSettings.companyName}
                  onChange={(e) => setOrgSettings({ ...orgSettings, companyName: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Work Week</label>
                <select
                  id="org-input-workWeek"
                  value={orgSettings.workWeek}
                  onChange={(e) => setOrgSettings({ ...orgSettings, workWeek: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                >
                  <option>Monday - Friday (5 Days)</option>
                  <option>Monday - Saturday (6 Days)</option>
                  <option>Alternate Saturdays Off (5.5 Days)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Primary Office Timezone</label>
                <select
                  id="org-input-timezone"
                  value={orgSettings.timezone}
                  onChange={(e) => setOrgSettings({ ...orgSettings, timezone: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                >
                  <option>IST (UTC +05:30) — Asia/Kolkata</option>
                  <option>EST (UTC -05:00) — America/New_York</option>
                  <option>GMT (UTC +00:00) — Europe/London</option>
                  <option>GST (UTC +04:00) — Asia/Dubai</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fiscal Year Start</label>
                <select
                  id="org-input-fiscalYearStart"
                  value={orgSettings.fiscalYearStart}
                  onChange={(e) => setOrgSettings({ ...orgSettings, fiscalYearStart: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                >
                  <option>April 01 (Indian Standard Fiscal Cycle)</option>
                  <option>January 01 (Calendar Year)</option>
                  <option>July 01</option>
                  <option>October 01</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Standard Probation Period</label>
                <input
                  id="org-input-probationPeriod"
                  type="text"
                  value={orgSettings.probationPeriod}
                  onChange={(e) => setOrgSettings({ ...orgSettings, probationPeriod: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Standard Notice Period</label>
                <input
                  id="org-input-noticePeriod"
                  type="text"
                  value={orgSettings.noticePeriod}
                  onChange={(e) => setOrgSettings({ ...orgSettings, noticePeriod: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-bdr flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="org-input-allowEmployeeDelegation"
                  type="checkbox"
                  checked={orgSettings.allowEmployeeDelegation}
                  onChange={(e) => setOrgSettings({ ...orgSettings, allowEmployeeDelegation: e.target.checked })}
                  className="w-4 h-4 rounded text-navy focus:ring-navy cursor-pointer"
                />
                <span className="text-[13px] text-slate-800">
                  Allow team members to designate peer delegates during planned leaves
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="org-input-requireTwoFactorForAdmin"
                  type="checkbox"
                  checked={orgSettings.requireTwoFactorForAdmin}
                  onChange={(e) => setOrgSettings({ ...orgSettings, requireTwoFactorForAdmin: e.target.checked })}
                  className="w-4 h-4 rounded text-navy focus:ring-navy cursor-pointer"
                />
                <span className="text-[13px] text-slate-800">
                  Enforce mandatory 2-Factor Authentication (2FA) for HR and Operations Admin accounts
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="org-input-sandwichRuleEnabled"
                  type="checkbox"
                  checked={orgSettings.sandwichRuleEnabled ?? true}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setOrgSettings({ ...orgSettings, sandwichRuleEnabled: checked });
                    if (typeof toggleSandwichRule === "function") toggleSandwichRule(checked);
                  }}
                  className="w-4 h-4 rounded text-navy focus:ring-navy cursor-pointer"
                />
                <span className="text-[13px] text-slate-800">
                  Enforce Sandwich Rule: Holidays and weekly offs falling between leave days count as consumed leaves
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="org-input-gracePeriodEnabled"
                  type="checkbox"
                  checked={orgSettings.gracePeriodEnabled ?? true}
                  onChange={(e) => setOrgSettings({ ...orgSettings, gracePeriodEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-navy focus:ring-navy cursor-pointer"
                />
                <span className="text-[13px] text-slate-800">
                  Enforce Attendance Grace Period: 15-minute tolerance window for employee punch-ins before late-entry deductions
                </span>
              </label>
              <div className="flex items-center gap-3 pt-2">
                <label className="text-xs font-semibold text-slate-700 min-w-[200px]">
                  Max Annual Leave Carry-Forward:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="org-input-maxCarryForwardDays"
                    type="number"
                    min="0"
                    max="180"
                    value={orgSettings.maxCarryForwardDays ?? 15}
                    onChange={(e) => setOrgSettings({ ...orgSettings, maxCarryForwardDays: parseInt(e.target.value, 10) || 0 })}
                    className="w-24 h-9 px-3 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                  <span className="text-xs text-muted">Days</span>
                </div>
              </div>
            </div>

            {/* Department Working Days Policy Preview Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 lg:gap-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                  <CalendarCheck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-[14px] text-slate-900">Department Working Days Policy</h4>
                  <p className="text-[12px] text-muted">
                    Configured across {departmentsConfig.length} operational departments. Controls salary per-day rates and absent day deductions in Payroll.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("working-days")}
                className="inline-flex items-center gap-1.5 h-9 px-4 bg-white border border-slate-300 text-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                <span>Configure Schedule</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-bdr">
              <button
                type="submit"
                className="h-9 px-5 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 transition shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                <CheckCircle2 size={15} />
                <span>Save Organization Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 9: DEPARTMENT WORKING DAYS GOVERNANCE
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === "working-days" && (
        <div className="flex flex-col gap-4">
          {/* Dedicated View Header */}
          <div className="bg-white border border-bdr rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                <CalendarCheck size={20} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Department Working Schedule &amp; Hours Governance</h2>
                <p className="text-[12px] text-muted">
                  Configure monthly working days and daily operational working hours per department. All changes sync dynamically with Employee-wise Payroll calculations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                {departmentsConfig.length} Operational Departments Configured
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar (4 Metrics) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-bdr rounded-xl p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11.5px] font-medium text-muted">Configured Departments</div>
                <div className="text-[20px] font-bold text-slate-900 mt-0.5">{departmentsConfig.length} Departments</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                <Building2 size={18} />
              </div>
            </div>

            <div className="bg-white border border-bdr rounded-xl p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11.5px] font-medium text-muted">Standard Working Days</div>
                <div className="text-[20px] font-bold text-slate-900 mt-0.5">24 Days / Month</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                <Calendar size={18} />
              </div>
            </div>

            <div className="bg-white border border-bdr rounded-xl p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11.5px] font-medium text-muted">Standard Daily Hours</div>
                <div className="text-[20px] font-bold text-slate-900 mt-0.5">8.0 Hours / Day</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                <Clock size={18} />
              </div>
            </div>

            <div className="bg-white border border-bdr rounded-xl p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11.5px] font-medium text-muted">Payroll Attendance Sync</div>
                <div className="text-[13px] font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  Live Reactive Calculations
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 size={18} />
              </div>
            </div>
          </div>

          {/* ── Enterprise Work Schedules & Shift Roster (§11.8) ── */}
          <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-bdr flex flex-wrap items-center justify-between gap-3 bg-off/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[14px] text-slate-900">Enterprise Work Schedules &amp; Shift Roster</h3>
                  <p className="text-[12px] text-muted">
                    Configure shifts, working days, weekly offs, and working hours with live precedence resolution in Attendance.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter pills */}
                <div className="flex items-center gap-1 bg-white border border-bdr rounded-xl p-1 text-xs">
                  {["all", "Active", "Regular", "Flexible", "Night", "Rotational"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setWorkScheduleFilter(type)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition capitalize cursor-pointer ${
                        workScheduleFilter === type
                          ? "bg-navy text-white shadow-2xs font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!canEditOrg}
                  onClick={handleOpenAddSchedule}
                  className="inline-flex items-center gap-1.5 btn-primary h-8 px-3 rounded-xl text-xs font-semibold hover:bg-navy/90 transition shadow-xs cursor-pointer"
                >
                  <Plus size={14} /> Add Shift Schedule
                </button>
              </div>
            </div>

            {/* Schedules Grid */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {workSchedules.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-400">
                  <Clock size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No work schedules defined yet.</p>
                  <p className="text-xs text-muted mt-1">Click "Add Shift Schedule" to create your first roster.</p>
                </div>
              ) : (
                workSchedules
                  .filter((s) => {
                    if (workScheduleFilter === "Active") return s.status === "Active";
                    if (workScheduleFilter !== "all") return s.shiftType === workScheduleFilter;
                    return true;
                  })
                  .map((s) => {
                    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                    const workingDays = Array.isArray(s.workingDays) ? s.workingDays : [0, 1, 2, 3, 4];
                    const weeklyOffs = Array.isArray(s.weeklyOffs) ? s.weeklyOffs : [5, 6];

                    return (
                      <div
                        key={s.id}
                        className={`border rounded-xl p-4 flex flex-col justify-between gap-3.5 transition hover:shadow-xs ${
                          s.status === "Active" ? "border-bdr bg-white" : "border-slate-200 bg-slate-50/70 opacity-80"
                        }`}
                      >
                        <div>
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-[14px] text-slate-900">{s.name}</h4>
                                {s.isDefault && (
                                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    Default
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-muted font-mono">{s.code || "SCH-GENERAL"}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                s.status === "Active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {s.status}
                            </span>
                          </div>

                          {/* Timing badge */}
                          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-800">
                              <Clock size={14} className="text-emerald-700" />
                              <span>{s.shiftStart} – {s.shiftEnd}</span>
                            </div>
                            <span className="text-[11.5px] font-medium text-slate-600">
                              {s.workingHours}h/day • {s.breakDuration}m break
                            </span>
                          </div>

                          {/* Days of week */}
                          <div className="flex flex-col gap-1.5 mb-3">
                            <div className="text-[11px] font-medium text-slate-500">Working Days &amp; Weekly Offs:</div>
                            <div className="flex items-center gap-1">
                              {dayNames.map((dName, idx) => {
                                const isWork = workingDays.includes(idx);
                                const isOff = weeklyOffs.includes(idx);
                                return (
                                  <span
                                    key={dName}
                                    className={`w-7 h-7 rounded-lg text-[10.5px] font-bold flex items-center justify-center border ${
                                      isWork
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : isOff
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-slate-100 text-slate-400 border-slate-200"
                                    }`}
                                    title={`${dName}: ${isWork ? "Working Day" : isOff ? "Weekly Off" : "Unassigned"}`}
                                  >
                                    {dName[0]}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Scope */}
                          <div className="text-[11.5px] text-slate-600 flex items-center gap-1.5 mb-1">
                            <Building2 size={13} className="text-slate-400 shrink-0" />
                            <span>
                              {s.teamName
                                ? `Assigned to Team: ${s.teamName}`
                                : s.departmentName
                                ? `Assigned to Dept: ${s.departmentName}`
                                : s.isDefault
                                ? "Applied Org-Wide (Tenant Default)"
                                : "Unassigned Scope"}
                            </span>
                          </div>

                          {/* Assigned staff count */}
                          <div className="text-[11.5px] text-slate-600 flex items-center gap-1.5">
                            <Users size={13} className="text-slate-400 shrink-0" />
                            <span>{s.assignedCount ?? 0} Employees Assigned</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2.5 border-t border-bdr/60 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleToggleScheduleStatus(s)}
                            disabled={!canEditOrg}
                            className={`inline-flex items-center gap-1 text-[11.5px] font-medium px-2.5 py-1 rounded-lg transition cursor-pointer ${
                              s.status === "Active"
                                ? "bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {s.status === "Active" ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                            <span>{s.status === "Active" ? "Deactivate" : "Activate"}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditSchedule(s)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
                              title="Edit Schedule"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSchedule(s.id, s.name)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer"
                              title="Delete Schedule"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Department Working Days & Hours Table */}
          <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-bdr/60 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0">
              <div>
                <h3 className="font-bold text-[14px] text-slate-900">Monthly Working Days &amp; Daily Hours by Department</h3>
                <p className="text-[12px] text-muted">
                  Use dropdowns to customize days and daily hours. Pure dropdown selectors without up/down arrows — synced to payroll calculations.
                </p>
              </div>
              <span className="text-[12px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <Check size={12} />
                Auto-Saved to Local Storage
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] lg:min-w-0 text-[13px]">
                <thead className="bg-slate-50/75 border-b border-bdr/60 text-slate-600 font-semibold text-[12px]">
                  <tr>
                    <th className="py-3 px-4 text-left">Department</th>
                    <th className="py-3 px-4 text-left">Department Head</th>
                    <th className="py-3 px-4 text-center">Payroll Staff</th>
                    <th className="py-3 px-4 text-left">Working Days (Dropdown)</th>
                    <th className="py-3 px-4 text-left">Daily Working Hours (Dropdown)</th>
                    <th className="py-3 px-4 text-right">Payroll Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bdr/60">
                  {departmentsConfig.map((dept) => {
                    const currentDays = getDepartmentDays(departmentWorkingDays, dept.name);
                    const currentHours = getDepartmentHours(departmentWorkingHours, dept.name);
                    const staffCount = payrollEmployees.filter(
                      (e) =>
                        e.department?.toLowerCase() === String(dept.name ?? '').toLowerCase() ||
                        (dept.name === "Human Resources" && e.department?.toLowerCase() === "hr") ||
                        (dept.name === "Sales & CRM" && e.department?.toLowerCase().includes("sales")) ||
                        (dept.name === "Warehouse & Inventory" && e.department?.toLowerCase().includes("warehouse"))
                    ).length;

                    return (
                      <tr key={dept.name} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[12px] border border-blue-100">
                              <Building2 size={15} />
                            </div>
                            <div>
                              <div>{dept.name}</div>
                              <div className="text-[11px] text-muted font-normal">{dept.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="font-medium">{dept.head}</div>
                          <div className="text-[11px] text-muted">{dept.role}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-semibold text-[11.5px] border border-slate-200">
                            {staffCount} Staff
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {/* Pure Dropdown with NO up/down arrows */}
                          <div className="inline-flex items-center gap-2 bg-slate-50 border border-bdr rounded-xl px-2.5 py-1 shadow-2xs">
                            <Calendar size={14} className="text-navy" />
                            <select
                              value={currentDays}
                              disabled={!canEditOrg}
                              title={canEditOrg ? "Monthly working days" : "Requires edit_staff permission"}
                              onChange={(e) => {
                                const days = Number(e.target.value);
                                setDepartmentWorkingDays(dept.name, days);
                                showToast(`Updated ${dept.name} to ${days} working days. Payroll synced.`);
                              }}
                              className="font-bold text-slate-900 bg-transparent outline-none cursor-pointer text-[13px] py-1"
                            >
                              <option value={20}>20 Days</option>
                              <option value={21}>21 Days</option>
                              <option value={22}>22 Days</option>
                              <option value={23}>23 Days</option>
                              <option value={24}>24 Days (Standard)</option>
                              <option value={25}>25 Days</option>
                              <option value={26}>26 Days</option>
                              <option value={27}>27 Days</option>
                              <option value={28}>28 Days</option>
                              <option value={30}>30 Days</option>
                              <option value={31}>31 Days</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {/* Pure Dropdown for Daily Hours */}
                          <div className="inline-flex items-center gap-2 bg-slate-50 border border-bdr rounded-xl px-2.5 py-1 shadow-2xs">
                            <Clock size={14} className="text-emerald-700" />
                            <select
                              value={currentHours}
                              disabled={!canEditOrg}
                              title={canEditOrg ? "Daily working hours" : "Requires edit_staff permission"}
                              onChange={(e) => {
                                const hrs = Number(e.target.value);
                                setDepartmentWorkingHours(dept.name, hrs);
                                showToast(`Updated ${dept.name} to ${hrs} hours/day. Synced to Payroll.`);
                              }}
                              className="font-bold text-slate-900 bg-transparent outline-none cursor-pointer text-[13px] py-1"
                            >
                              <option value={7}>7.0 Hours/day</option>
                              <option value={7.5}>7.5 Hours/day</option>
                              <option value={8}>8.0 Hours/day (Standard)</option>
                              <option value={8.5}>8.5 Hours/day</option>
                              <option value={9}>9.0 Hours/day</option>
                              <option value={9.5}>9.5 Hours/day</option>
                              <option value={10}>10.0 Hours/day</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <Check size={12} /> Active in Payroll
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leave Policy, Carry-Forward & Sandwich-Leave Governance Card */}
          <div className="bg-white border border-bdr rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bdr/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900">Leave Policy, Carry-Forward &amp; Sandwich Rule Governance</h3>
                  <p className="text-[12px] text-muted">
                    Configure automated sandwich leave deduction rules and annual leave rollover caps for organizational compliance.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  executeCarryForwardRollover();
                  showToast(`Executed Year-End Rollover: Rolled over up to ${maxCarryForwardDays || 12} days per employee for the new cycle.`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-[12.5px] font-semibold transition shadow-xs cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Execute Year-End Rollover</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sandwich-Leave Rule Card */}
              <div className="bg-slate-50 border border-bdr rounded-xl p-4 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
                      🥪 Sandwich-Leave Policy Rule
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${sandwichRuleEnabled ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-300"}`}>
                      {sandwichRuleEnabled ? "Active Policy" : "Rule Disabled"}
                    </span>
                  </div>
                  <p className="text-[12px] text-muted mt-1 leading-relaxed">
                    When enabled, intervening weekend days and gazetted holidays falling between leave days (e.g. Friday to Monday) are counted and deducted from employee leave balances.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-bdr/60">
                  <span className="text-[12px] font-medium text-slate-700">Policy Mode:</span>
                  <div className="inline-flex items-center gap-2 bg-white border border-bdr rounded-xl px-2.5 py-1 shadow-2xs">
                    <select
                      value={sandwichRuleEnabled ? "enabled" : "disabled"}
                      onChange={(e) => {
                        const val = e.target.value === "enabled";
                        toggleSandwichRule(val);
                        showToast(`Sandwich Rule ${val ? "Enabled" : "Disabled"}. Leave calculations updated.`);
                      }}
                      className="font-bold text-slate-900 bg-transparent outline-none cursor-pointer text-[12.5px] py-0.5"
                    >
                      <option value="enabled">Enabled (Count Intervening Weekends)</option>
                      <option value="disabled">Disabled (Exclude Weekends &amp; Holidays)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Carry-Forward Policy Card */}
              <div className="bg-slate-50 border border-bdr rounded-xl p-4 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
                      🔄 Annual Leave Carry-Forward Threshold
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                      Cap: {maxCarryForwardDays || 12} Days
                    </span>
                  </div>
                  <p className="text-[12px] text-muted mt-1 leading-relaxed">
                    Maximum unutilized annual leave days permitted to roll over into the subsequent calendar or financial year cycle. Excess unused balances lapse automatically.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-bdr/60">
                  <span className="text-[12px] font-medium text-slate-700">Max Carry-Forward Cap:</span>
                  <div className="inline-flex items-center gap-2 bg-white border border-bdr rounded-xl px-2.5 py-1 shadow-2xs">
                    <select
                      value={maxCarryForwardDays || 12}
                      onChange={(e) => {
                        const days = Number(e.target.value);
                        setMaxCarryForwardDays(days);
                        showToast(`Updated Carry-Forward cap to ${days} days.`);
                      }}
                      className="font-bold text-slate-900 bg-transparent outline-none cursor-pointer text-[12.5px] py-0.5"
                    >
                      <option value={6}>6 Days Maximum</option>
                      <option value={8}>8 Days Maximum</option>
                      <option value={10}>10 Days Maximum</option>
                      <option value={12}>12 Days Maximum (Standard Policy)</option>
                      <option value={15}>15 Days Maximum</option>
                      <option value={18}>18 Days Maximum (Full Rollover)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Rollover Summary Pill */}
            <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl text-[12px] text-purple-950 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-purple-700 shrink-0" />
                <span>
                  <b>Current Active Rollover Pool:</b>{" "}
                  {Object.entries(carriedForwardLeaves || {}).map(([emp, d]) => `${emp}: ${d}d`).join(", ") || "None yet"}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                Synced with Leave Balance Quotas
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 10: ANNOUNCEMENTS & COMPANY BROADCASTS
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === "announcements" && (
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-bdr rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                <Megaphone size={20} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Company Announcements &amp; Circulars</h2>
                <p className="text-[12px] text-muted">
                  Broadcast organization-wide notices, departmental circulars, and executive updates.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                {announcements.length} Published Notices • {announcements.filter((a) => a.is_pinned).length} Pinned
              </span>
            </div>
          </div>

          {/* Search & Priority Filter Toolbar */}
          <div className="bg-white border border-bdr rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search announcements by title or content..."
                  value={announcementSearch}
                  onChange={(e) => setAnnouncementSearch(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 text-xs rounded-xl border border-bdr bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12px] text-muted font-medium mr-1">Status:</span>
              {["all", "published", "draft", "archived"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setAnnouncementStatusFilter(st)}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                    announcementStatusFilter === st
                      ? "bg-navy text-white font-semibold"
                      : "bg-off text-muted hover:text-slate-800"
                  }`}
                >
                  {st}
                </button>
              ))}
              <span className="text-[12px] text-muted font-medium ml-2 mr-1">Priority:</span>
              {["all", "urgent", "high", "normal", "low"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAnnouncementPriorityFilter(p)}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                    announcementPriorityFilter === p
                      ? "bg-navy text-white font-semibold"
                      : "bg-off text-muted hover:text-slate-800"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Priority Filter Toolbar */}
          <div className="bg-white border border-bdr rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search announcements by title or content..."
                  value={announcementSearch}
                  onChange={(e) => setAnnouncementSearch(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 text-xs rounded-xl border border-bdr bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12px] text-muted font-medium mr-1">Status:</span>
              {["all", "published", "draft", "archived"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setAnnouncementStatusFilter(st)}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                    announcementStatusFilter === st
                      ? "bg-navy text-white font-semibold"
                      : "bg-off text-muted hover:text-slate-800"
                  }`}
                >
                  {st}
                </button>
              ))}
              <span className="text-[12px] text-muted font-medium ml-2 mr-1">Priority:</span>
              {["all", "urgent", "high", "normal", "low"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAnnouncementPriorityFilter(p)}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                    announcementPriorityFilter === p
                      ? "bg-navy text-white font-semibold"
                      : "bg-off text-muted hover:text-slate-800"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements
              .filter((ann) => {
                const matchSearch =
                  !announcementSearch ||
                  ann.title?.toLowerCase().includes(announcementSearch.toLowerCase()) ||
                  ann.content?.toLowerCase().includes(announcementSearch.toLowerCase());
                const matchPriority =
                  announcementPriorityFilter === "all" ||
                  ann.priority?.toLowerCase() === announcementPriorityFilter.toLowerCase();
                const matchStatus =
                  announcementStatusFilter === "all" ||
                  (ann.status || "Published").toLowerCase() === announcementStatusFilter.toLowerCase();
                return matchSearch && matchPriority && matchStatus;
              })
              .length === 0 ? (
              <div className="col-span-full bg-white border border-dashed border-bdr rounded-xl p-12 text-center text-slate-400 space-y-2">
                <Megaphone size={36} className="mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No announcements found</p>
                <p className="text-xs">Click &quot;Publish Announcement&quot; to issue a new organizational circular.</p>
              </div>
            ) : (
              announcements
                .filter((ann) => {
                  const matchSearch =
                    !announcementSearch ||
                    ann.title?.toLowerCase().includes(announcementSearch.toLowerCase()) ||
                    ann.content?.toLowerCase().includes(announcementSearch.toLowerCase());
                  const matchPriority =
                    announcementPriorityFilter === "all" ||
                    ann.priority?.toLowerCase() === announcementPriorityFilter.toLowerCase();
                  const matchStatus =
                    announcementStatusFilter === "all" ||
                    (ann.status || "Published").toLowerCase() === announcementStatusFilter.toLowerCase();
                  return matchSearch && matchPriority && matchStatus;
                })
                .map((ann) => (
                  <div
                    key={ann.id}
                    className={`bg-white rounded-xl border p-5 flex flex-col justify-between shadow-xs transition hover:shadow-md ${
                      ann.is_pinned ? "border-amber-300 ring-1 ring-amber-200" : "border-bdr"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {ann.is_pinned && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              📌 PINNED
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              (ann.status || "Published").toLowerCase() === "published"
                                ? "bg-emerald-100 text-emerald-800"
                                : (ann.status || "").toLowerCase() === "draft"
                                ? "bg-slate-100 text-slate-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {ann.status || "Published"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              ann.priority?.toLowerCase() === "urgent"
                                ? "bg-red-100 text-red-700"
                                : ann.priority?.toLowerCase() === "high"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {ann.priority || "normal"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {ann.status === "Draft" && (
                            <button
                              type="button"
                              onClick={() => handlePublishAnnouncement(ann)}
                              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                              title="Publish Announcement"
                            >
                              Publish
                            </button>
                          )}
                          {(ann.status === "Published" || !ann.status) && (
                            <button
                              type="button"
                              onClick={() => handleArchiveAnnouncement(ann)}
                              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                              title="Archive Announcement"
                            >
                              Archive
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleTogglePinAnnouncement(ann)}
                            className={`p-1 rounded-lg text-xs transition cursor-pointer ${
                              ann.is_pinned ? "text-amber-600 bg-amber-50" : "text-muted hover:text-slate-800 hover:bg-slate-100"
                            }`}
                            title={ann.is_pinned ? "Unpin Announcement" : "Pin Announcement"}
                          >
                            📌
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditAnnouncement(ann)}
                            className="p-1 rounded-lg text-muted hover:text-navy hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Announcement"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                            className="p-1 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Announcement"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="text-[11px] text-muted mb-1">{ann.publish_date}</div>
                      <h3 className="font-bold text-[15px] text-slate-900 mb-1.5">{ann.title}</h3>
                      <p className="text-[12.5px] text-slate-600 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                        {ann.content}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-bdr/60 flex items-center justify-between text-[11px] text-muted">
                      <span>By: <strong className="text-slate-700">{ann.author_name || "HR Admin"}</strong></span>
                      {ann.targetDepartmentName && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                          Dept: {ann.targetDepartmentName}
                        </span>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 11: EMPLOYEE TRAVEL REQUISITIONS & ALLOWANCES
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === "travel" && (
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-bdr rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold">
                <Plane size={20} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Employee Travel Requisitions &amp; Conveyance</h2>
                <p className="text-[12px] text-muted">
                  Manage business tours, flight/rail requisition workflows, travel advances, and expense settlements.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-sky-800 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200">
                {travelRequests.length} Total Requests • {travelRequests.filter((t) => (t.status || "").toLowerCase() === "approved").length} Approved
              </span>
            </div>
          </div>

          {/* Search & Status Filter Toolbar */}
          <div className="bg-white border border-bdr rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search by employee, destination, or purpose..."
                  value={travelSearch}
                  onChange={(e) => setTravelSearch(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 text-xs rounded-xl border border-bdr bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12px] text-muted font-medium mr-1">Status:</span>
              {["all", "submitted", "approved", "rejected", "settled"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTravelStatusFilter(st)}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                    travelStatusFilter === st
                      ? "bg-navy text-white font-semibold"
                      : "bg-off text-muted hover:text-slate-800"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Status Filter Toolbar */}
          <div className="bg-white border border-bdr rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search by employee, destination, or purpose..."
                  value={travelSearch}
                  onChange={(e) => setTravelSearch(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 text-xs rounded-xl border border-bdr bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12px] text-muted font-medium mr-1">Status:</span>
              {["all", "submitted", "approved", "rejected", "settled"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTravelStatusFilter(st)}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                    travelStatusFilter === st
                      ? "bg-navy text-white font-semibold"
                      : "bg-off text-muted hover:text-slate-800"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-bdr rounded-xl overflow-hidden shadow-xs">
            {travelRequests
              .filter((trv) => {
                const matchSearch =
                  !travelSearch ||
                  trv.employeeName?.toLowerCase().includes(travelSearch.toLowerCase()) ||
                  trv.employeeCode?.toLowerCase().includes(travelSearch.toLowerCase()) ||
                  trv.destination?.toLowerCase().includes(travelSearch.toLowerCase()) ||
                  trv.purpose?.toLowerCase().includes(travelSearch.toLowerCase()) ||
                  trv.travel_number?.toLowerCase().includes(travelSearch.toLowerCase());
                const matchStatus =
                  travelStatusFilter === "all" ||
                  trv.status?.toLowerCase() === travelStatusFilter.toLowerCase();
                return matchSearch && matchStatus;
              })
              .length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Plane size={36} className="mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No travel requisitions found</p>
                <p className="text-xs">Submit a business tour or site-visit approval request using the button above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px] text-slate-600">
                  <thead className="bg-slate-50 border-b border-bdr text-[11px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Travel #</th>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Destination &amp; Purpose</th>
                      <th className="py-3 px-4">Dates</th>
                      <th className="py-3 px-4">Advance Req.</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bdr">
                    {travelRequests
                      .filter((trv) => {
                        const matchSearch =
                          !travelSearch ||
                          trv.employeeName?.toLowerCase().includes(travelSearch.toLowerCase()) ||
                          trv.employeeCode?.toLowerCase().includes(travelSearch.toLowerCase()) ||
                          trv.destination?.toLowerCase().includes(travelSearch.toLowerCase()) ||
                          trv.purpose?.toLowerCase().includes(travelSearch.toLowerCase()) ||
                          trv.travel_number?.toLowerCase().includes(travelSearch.toLowerCase());
                        const matchStatus =
                          travelStatusFilter === "all" ||
                          trv.status?.toLowerCase() === travelStatusFilter.toLowerCase();
                        return matchSearch && matchStatus;
                      })
                      .map((trv) => {
                        const st = (trv.status || "submitted").toLowerCase();
                        return (
                          <tr key={trv.id} className="hover:bg-slate-50/60">
                            <td className="py-3.5 px-4 font-mono font-bold text-navy">
                              {trv.travel_number || `TRV-${trv.id?.slice(0, 6)}`}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900">{trv.employeeName || "Employee"}</div>
                              <div className="text-[11px] text-muted font-mono">{trv.employeeCode}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-slate-800">{trv.destination}</div>
                              <div className="text-[11px] text-muted line-clamp-1">{trv.purpose}</div>
                            </td>
                            <td className="py-3.5 px-4 text-[12px]">
                              {trv.start_date} → {trv.end_date}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              ₹{Number(trv.advance_requested || 0).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                                    st === "approved"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : st === "rejected"
                                      ? "bg-red-50 text-red-700 border border-red-200"
                                      : st === "settled"
                                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  {trv.status || "Submitted"}
                                </span>
                                {trv.currentStep > 1 && st !== "approved" && st !== "rejected" && st !== "settled" && (
                                  <span className="text-[10.5px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                    Tier {trv.currentStep} Pending
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {(st === "submitted" || st === "pending" || st.startsWith("pending")) && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveTravel(trv.id)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                                      title="Approve / Escalate to Next Tier"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectTravel(trv.id)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition cursor-pointer"
                                      title="Reject Tour"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                {st === "approved" && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSettleTravel(trv)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                                    title="Settle Expenses & Advances"
                                  >
                                    Settle
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTravel(trv.id, trv.travel_number)}
                                  className="p-1.5 hover:bg-red-50 rounded-xl text-muted hover:text-red-600 transition cursor-pointer"
                                  title="Delete Travel Request"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Add / Edit Team ── */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-xl p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-bdr">
              <div>
                <h3 className="font-bold text-[16px] text-slate-900">
                  {editingTeam ? `Edit Squad: ${editingTeam.name}` : "Create New Squad / Team"}
                </h3>
                <p className="text-[12px] text-muted mt-0.5">
                  {editingTeam ? `Team ID: ${editingTeam.code || editingTeam.id}` : "Configure unique code, department, leadership, approver and squad members."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {teamFormError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-600" />
                <span>{teamFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTeam} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Squad Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mobile Engineering Squad"
                    value={newTeam.name}
                    onChange={(e) => {
                      setNewTeam({ ...newTeam, name: e.target.value });
                      setTeamFormError("");
                    }}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Team Code / ID <span className="text-[11px] text-muted font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. T-01 or auto"
                    value={newTeam.code}
                    onChange={(e) => {
                      setNewTeam({ ...newTeam, code: e.target.value });
                      setTeamFormError("");
                    }}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy font-mono transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Primary Department *
                  </label>
                  <input
                    type="text"
                    required
                    list="team-primary-dept-list"
                    placeholder="e.g. Accounts & Finance"
                    value={newTeam.dept}
                    onChange={(e) => {
                      const val = e.target.value;
                      const foundDept = departmentsConfig.find((d) => d.name === val || d.id === val);
                      setNewTeam({
                        ...newTeam,
                        dept: val,
                        departmentId: foundDept ? foundDept.id : "",
                      });
                    }}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                  <datalist id="team-primary-dept-list">
                    {departmentsList.map((deptName) => (
                      <option key={deptName} value={deptName} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Co-Department <span className="text-[11px] text-muted font-normal">(Optional cross-dept)</span>
                  </label>
                  <input
                    type="text"
                    list="team-secondary-dept-list"
                    placeholder="e.g. Operations"
                    value={newTeam.secondaryDept || ""}
                    onChange={(e) => setNewTeam({ ...newTeam, secondaryDept: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                  <datalist id="team-secondary-dept-list">
                    {departmentsList.filter((d) => d !== newTeam.dept).map((deptName) => (
                      <option key={deptName} value={deptName} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Team Leader</label>
                  <select
                    value={newTeam.leadId || newTeam.lead}
                    onChange={(e) => {
                      const val = e.target.value;
                      const emp = eligibleEmployees.find((em) => em.id === val || em.name === val);
                      setNewTeam({
                        ...newTeam,
                        lead: emp ? emp.name : val,
                        leadId: emp ? emp.id : "",
                      });
                    }}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                  >
                    <option value="">Select Team Leader...</option>
                    {eligibleEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode || emp.empId || "Staff"}) {emp.designation ? `— ${emp.designation}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Approver</label>
                  <select
                    value={newTeam.approverId || newTeam.approver}
                    onChange={(e) => {
                      const val = e.target.value;
                      const emp = eligibleEmployees.find((em) => em.id === val || em.name === val);
                      setNewTeam({
                        ...newTeam,
                        approver: emp ? emp.name : val,
                        approverId: emp ? emp.id : "",
                      });
                    }}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                  >
                    <option value="">Select Default Approver...</option>
                    {eligibleEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode || emp.empId || "Staff"}) {emp.designation ? `— ${emp.designation}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Operational Scope / Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of this squad's responsibilities..."
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy resize-none transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Squad Members ({newTeam.memberIds.length} assigned)
                  </label>
                  <span className="text-[11px] text-muted">
                    Headcount: {newTeam.memberIds.length}
                  </span>
                </div>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Filter staff to assign..."
                    value={teamMemberSearch}
                    onChange={(e) => setTeamMemberSearch(e.target.value)}
                    className="h-9 w-full pl-8 pr-3 text-xs rounded-xl border border-bdr bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div className="border border-bdr rounded-xl max-h-40 overflow-y-auto divide-y divide-bdr/50 bg-white">
                  {eligibleEmployees
                    .filter((emp) => {
                      if (!teamMemberSearch) return true;
                      const term = teamMemberSearch.toLowerCase();
                      return (
                        (emp.name && emp.name.toLowerCase().includes(term)) ||
                        (emp.department && emp.department.toLowerCase().includes(term)) ||
                        (emp.employeeCode && emp.employeeCode.toLowerCase().includes(term)) ||
                        (emp.empId && emp.empId.toLowerCase().includes(term)) ||
                        (emp.designation && emp.designation.toLowerCase().includes(term))
                      );
                    })
                    .map((emp) => {
                      const isAssigned = newTeam.memberIds.includes(emp.id);
                      const isDeptMatch =
                        newTeam.dept &&
                        String(emp.department || "").toLowerCase() === String(newTeam.dept).toLowerCase();
                      return (
                        <label
                          key={emp.id}
                          className="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewTeam({ ...newTeam, memberIds: [...newTeam.memberIds, emp.id] });
                                } else {
                                  setNewTeam({
                                    ...newTeam,
                                    memberIds: newTeam.memberIds.filter((id) => id !== emp.id),
                                  });
                                }
                              }}
                              className="rounded text-navy focus:ring-navy"
                            />
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {(emp.name || "?").substring(0, 2).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <span className="font-medium text-slate-800">{emp.name}</span>
                              <span className="text-[11px] text-muted ml-1.5 font-mono">
                                {emp.employeeCode || emp.empId || ""}
                              </span>
                              <span className="text-[11px] text-slate-500 ml-1.5">
                                • {emp.designation || emp.role || "Staff"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {(() => {
                              const empDepts = employeeDepartmentMap.get(emp.id) || [emp.department].filter(Boolean);
                              const isDual = empDepts.length > 1;
                              const isCrossDeptAssignment = newTeam.dept && !empDepts.includes(newTeam.dept);
                              return (
                                <div className="flex flex-wrap items-center gap-1 justify-end">
                                  {empDepts.map((d) => (
                                    <span
                                      key={d}
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                        d === newTeam.dept || d === newTeam.secondaryDept
                                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {d}
                                    </span>
                                  ))}
                                  {isDual && (
                                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-purple-100 text-purple-800">
                                      Dual Dept
                                    </span>
                                  )}
                                  {isAssigned && isCrossDeptAssignment && (
                                    <span
                                      className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-emerald-100 text-emerald-800"
                                      title={`Will be entered in both ${empDepts.join(', ')} and ${newTeam.dept}`}
                                    >
                                      In both depts
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="h-9 px-4 border border-bdr rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTeam}
                  className="h-9 px-4 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 cursor-pointer shadow-xs disabled:opacity-60 inline-flex items-center gap-1.5 transition"
                >
                  {isSavingTeam && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingTeam ? "Save Changes" : "Create Team"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: View Team Details & Squad Roster ── */}
      {isTeamDetailsModalOpen && activeTeamDetails && (() => {
        const rosterMembers =
          activeTeamDetails.membersDetail && activeTeamDetails.membersDetail.length > 0
            ? activeTeamDetails.membersDetail
            : Array.isArray(activeTeamDetails.memberIds) && activeTeamDetails.memberIds.length > 0
            ? eligibleEmployees
                .filter((e) => activeTeamDetails.memberIds.includes(e.id))
                .map((e) => ({
                  id: e.id,
                  name: e.name,
                  employeeCode: e.employeeCode || e.empId || "",
                  department: e.department || "",
                  designation: e.designation || e.role || "",
                  status: e.status || "Active",
                }))
            : [];

        const assignedIds = new Set([
          ...(activeTeamDetails.memberIds || []),
          ...rosterMembers.map((m) => m.id),
        ]);
        const availableEmployeesToAdd = eligibleEmployees.filter((e) => !assignedIds.has(e.id));

        return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-2xl p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-bdr">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center font-bold text-[14px]">
                    {(activeTeamDetails.name || "SQ").substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-[17px] text-slate-900">{activeTeamDetails.name}</h3>
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                        {activeTeamDetails.code || activeTeamDetails.teamCode || activeTeamDetails.id}
                      </span>
                      {activeTeamDetails.status && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {activeTeamDetails.status}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted mt-0.5">
                      {activeTeamDetails.dept || activeTeamDetails.department || "No department specified"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsTeamDetailsModalOpen(false);
                    setActiveTeamDetails(null);
                  }}
                  className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted hover:text-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Squad Metadata Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                <div className="p-3 rounded-xl bg-off/60 border border-bdr">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-muted block mb-1">
                    Team Leader
                  </span>
                  <div className="font-semibold text-[13px] text-slate-900">
                    {activeTeamDetails.lead || activeTeamDetails.leadName || <span className="text-muted font-normal">Unassigned</span>}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-off/60 border border-bdr">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-muted block mb-1">
                    Default Approver
                  </span>
                  <div className="font-semibold text-[13px] text-slate-900 flex items-center gap-1.5">
                    {activeTeamDetails.approver || activeTeamDetails.approverName ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        <span>{activeTeamDetails.approver || activeTeamDetails.approverName}</span>
                      </>
                    ) : (
                      <span className="text-muted font-normal">Unassigned</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-off/60 border border-bdr">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-muted block mb-1">
                    Squad Headcount
                  </span>
                  <div className="font-semibold text-[13px] text-slate-900 flex items-center gap-1.5">
                    <Users size={14} className="text-blue-700 shrink-0" />
                    <span>{rosterMembers.length} Staff Assigned</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {activeTeamDetails.description && (
                <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                  <span className="font-semibold text-slate-900 block mb-0.5">Operational Scope:</span>
                  {activeTeamDetails.description}
                </div>
              )}

              {/* Squad Roster Section */}
              <div className="mt-5 pt-4 border-t border-bdr">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="font-bold text-[14px] text-slate-900 flex items-center gap-2">
                    <Users size={16} className="text-blue-700" />
                    Squad Roster ({rosterMembers.length})
                  </h4>
                </div>

                {/* Inline Add Member Control */}
                {canEditOrg && (
                  <form onSubmit={handleAddMemberToTeam} className="flex items-center gap-2 mb-3">
                    <select
                      value={selectedNewMemberId}
                      onChange={(e) => setSelectedNewMemberId(e.target.value)}
                      className="h-9 flex-1 px-3 text-xs rounded-xl border border-bdr bg-off focus:bg-white focus:outline-none focus:border-navy transition cursor-pointer"
                    >
                      <option value="">Select an active employee to add to this squad...</option>
                      {availableEmployeesToAdd.map((emp) => {
                        const depts = employeeDepartmentMap.get(emp.id) || [emp.department].filter(Boolean);
                        const isCross = activeTeamDetails.dept && !depts.includes(activeTeamDetails.dept);
                        return (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.employeeCode || emp.empId || "Staff"}) — Dept: {depts.join(", ") || "No Dept"}{isCross ? ` (Will also be entered in ${activeTeamDetails.dept})` : ""}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="submit"
                      disabled={!selectedNewMemberId || isRosterActionLoading}
                      className="h-9 px-3.5 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 transition shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shrink-0"
                    >
                      {isRosterActionLoading ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                      <span>Add Member</span>
                    </button>
                  </form>
                )}

                {/* Members Table */}
                {rosterMembers.length > 0 ? (
                  <div className="border border-bdr rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
                        <tr>
                          <th className="py-2.5 px-3.5">Employee</th>
                          <th className="py-2.5 px-3.5">Code</th>
                          <th className="py-2.5 px-3.5">Department</th>
                          <th className="py-2.5 px-3.5">Designation</th>
                          <th className="py-2.5 px-3.5">Status</th>
                          {canEditOrg && <th className="py-2.5 px-3.5 text-right">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-bdr/50">
                        {rosterMembers.map((member) => {
                          const depts = employeeDepartmentMap.get(member.id) || [member.department].filter(Boolean);
                          const isDual = depts.length > 1;
                          return (
                            <tr key={member.id} className="hover:bg-off/60 transition">
                              <td className="py-2.5 px-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {(member.name || "?").substring(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-slate-800">{member.name}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3.5 font-mono text-muted">{member.employeeCode || "—"}</td>
                              <td className="py-2.5 px-3.5">
                                <div className="flex flex-col gap-0.5 items-start">
                                  <div className="flex flex-wrap gap-1">
                                    {depts.map((d) => (
                                      <span
                                        key={d}
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                          d === activeTeamDetails.dept || d === activeTeamDetails.secondaryDept
                                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                                            : "bg-slate-100 text-slate-600"
                                        }`}
                                      >
                                        {d}
                                      </span>
                                    ))}
                                  </div>
                                  {isDual && (
                                    <span className="text-[9.5px] text-purple-700 font-semibold">
                                      Dual Department
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-600">{member.designation || "Staff"}</td>
                              <td className="py-2.5 px-3.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {member.status || "Active"}
                                </span>
                              </td>
                            {canEditOrg && (
                              <td className="py-2.5 px-3.5 text-right">
                                <button
                                  type="button"
                                  disabled={isRosterActionLoading}
                                  onClick={() => handleRemoveMemberFromTeam(member.id, member.name)}
                                  className="p-1 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="Remove member from squad"
                                >
                                  <UserMinus size={14} />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted border border-dashed border-bdr rounded-xl bg-off/30">
                    <Users size={24} className="mx-auto mb-1.5 opacity-40 text-navy" />
                    <p className="font-semibold text-slate-700 text-xs">No squad members assigned yet</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      Use the member selector above to add active personnel to this squad roster.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-between items-center gap-2 mt-5 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditTeam(activeTeamDetails);
                    setIsTeamDetailsModalOpen(false);
                  }}
                  disabled={!canEditOrg}
                  className={`h-9 px-4 border border-bdr rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1.5 text-slate-700 transition ${
                    !canEditOrg ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                >
                  <Edit size={13} />
                  <span>Edit Squad Configuration</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTeamDetailsModalOpen(false);
                    setActiveTeamDetails(null);
                  }}
                  className="h-9 px-5 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 cursor-pointer shadow-xs transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal: Add / Edit Approval Chain ── */}
      {isChainModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-md p-5 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-bdr">
              <h3 className="font-bold text-[16px] text-slate-900">
                {editingChain ? `Edit Chain (${editingChain.module})` : "New Approval Chain"}
              </h3>
              <button
                type="button"
                onClick={() => setIsChainModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveChain} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Module</label>
                <select
                  value={newChain.module}
                  onChange={(e) => setNewChain({ ...newChain, module: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                >
                  <option>Leave Management</option>
                  <option>Attendance Regularization</option>
                  <option>Asset Allocation</option>
                  <option>Payroll Revisions</option>
                  <option>Expense Reimbursement</option>
                  <option>Travel Requisitions</option>
                  <option>Grievances</option>
                  <option>Resignations</option>
                  <option>Terminations</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tier 1 Approver</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Line Manager"
                  value={newChain.tier1}
                  onChange={(e) => setNewChain({ ...newChain, tier1: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tier 2 Approver</label>
                <input
                  type="text"
                  placeholder="e.g. Department Head"
                  value={newChain.tier2}
                  onChange={(e) => setNewChain({ ...newChain, tier2: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tier 3 (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. HR Director"
                    value={newChain.tier3}
                    onChange={(e) => setNewChain({ ...newChain, tier3: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">SLA Escalation (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={newChain.autoEscalateDays}
                    onChange={(e) => setNewChain({ ...newChain, autoEscalateDays: Number(e.target.value) })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsChainModalOpen(false)}
                  className="h-9 px-4 border border-bdr rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition"
                >
                  <Check size={14} />
                  <span>{editingChain ? "Save Workflow" : "Save Chain"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Record Termination ── */}
      {isTerminationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-lg p-5 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-bdr">
              <div>
                <h3 className="font-bold text-[16px] text-slate-900">Record Employee Termination</h3>
                <p className="text-[11.5px] text-muted">Auto-generates official separation letter upon submission</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTerminationModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTermination} className="flex flex-col gap-4">
              {/* Quick Select Employee from Directory */}
              <div
                ref={terminationEmpDropdownRef}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Employee (Auto-fills from Staff Directory)
                  </label>
                  {newTermination.employee && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewTermination({
                          ...newTermination,
                          employee: "",
                          employeeId: "",
                          dept: "",
                          role: "",
                        });
                        setTerminationEmpSearch("");
                      }}
                      className="text-[11px] text-red-600 hover:underline font-medium cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Selected Employee Preview or Search Input */}
                {newTermination.employee && !isTerminationEmpDropdownOpen ? (
                  <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {newTermination.employee.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[13px] text-slate-900 truncate">
                            {newTermination.employee}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 font-semibold shrink-0">
                            {newTermination.employeeId}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {newTermination.role || "Staff"} • {newTermination.dept || "General"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTerminationEmpSearch("");
                        setIsTerminationEmpDropdownOpen(true);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition cursor-pointer shrink-0 ml-2"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        placeholder="Search employee by name, ID, or department..."
                        value={terminationEmpSearch}
                        onChange={(e) => {
                          setTerminationEmpSearch(e.target.value);
                          setIsTerminationEmpDropdownOpen(true);
                        }}
                        onFocus={() => setIsTerminationEmpDropdownOpen(true)}
                        className="h-10 w-full pl-9 pr-8 rounded-xl border border-slate-300 text-[12.5px] bg-white text-slate-800 focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-400 shadow-2xs"
                      />
                      {terminationEmpSearch && (
                        <button
                          type="button"
                          onClick={() => setTerminationEmpSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {isTerminationEmpDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 z-50">
                        {filteredTerminationEmployees.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-500">
                            No employees match "{terminationEmpSearch}"
                          </div>
                        ) : (
                          filteredTerminationEmployees.map((emp) => {
                            const code = emp.employeeCode || emp.empId || emp.employee_code || "Staff";
                            const desig = emp.designation || "Staff";
                            const dept = emp.department || "General";
                            return (
                              <button
                                key={emp.id}
                                type="button"
                                onClick={() => {
                                  setNewTermination({
                                    ...newTermination,
                                    employee: emp.name,
                                    employeeId: code !== "Staff" ? code : emp.id,
                                    dept: dept,
                                    role: desig,
                                  });
                                  setTerminationEmpSearch("");
                                  setIsTerminationEmpDropdownOpen(false);
                                }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50/70 flex items-center justify-between gap-2 transition cursor-pointer"
                              >
                                <div className="min-w-0">
                                  <div className="font-semibold text-[13px] text-slate-900 truncate">
                                    {emp.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {desig} • {dept}
                                  </div>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 font-medium shrink-0">
                                  {code}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sameer Dixit"
                    value={newTermination.employee}
                    onChange={(e) => setNewTermination({ ...newTermination, employee: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employee ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-1099"
                    value={newTermination.employeeId}
                    onChange={(e) => setNewTermination({ ...newTermination, employeeId: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
                  <input
                    list="hr-dept-options"
                    value={newTermination.dept}
                    onChange={(e) => setNewTermination({ ...newTermination, dept: e.target.value })}
                    placeholder="Enter department"
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Designation / Role *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Staff Architect"
                    value={newTermination.role}
                    onChange={(e) => setNewTermination({ ...newTermination, role: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Termination Type</label>
                  <select
                    value={newTermination.terminationType}
                    onChange={(e) => setNewTermination({ ...newTermination, terminationType: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                  >
                    <option>Involuntary (Performance)</option>
                    <option>Disciplinary / Breach</option>
                    <option>Redundancy / Restructuring</option>
                    <option>Contract Non-Renewal</option>
                    <option>Probation Failure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Severance Terms</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Months Gross"
                    value={newTermination.severance}
                    onChange={(e) => setNewTermination({ ...newTermination, severance: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notice Served Date</label>
                  <input
                    type="date"
                    value={newTermination.noticeDate}
                    onChange={(e) => setNewTermination({ ...newTermination, noticeDate: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Exit Date</label>
                  <input
                    type="date"
                    value={newTermination.exitDate}
                    onChange={(e) => setNewTermination({ ...newTermination, exitDate: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reason &amp; Legal Context *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summarize the background, review documents, and justification..."
                  value={newTermination.reason}
                  onChange={(e) => setNewTermination({ ...newTermination, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>
              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsTerminationModalOpen(false)}
                  className="h-9 px-4 border border-bdr rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-red-700 text-white rounded-xl text-xs font-semibold hover:bg-red-800 inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                >
                  <FileText size={14} />
                  <span>Confirm &amp; Generate Letter</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Submit Resignation ── */}
      {isResignationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-bdr">
              <h3 className="font-bold text-[16px] text-slate-900">Log Voluntary Resignation</h3>
              <button
                type="button"
                onClick={() => setIsResignationModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateResignation} className="flex flex-col gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Select Employee (Auto-fills from Staff Directory)
                </label>
                <select
                  value={newResignation.employeeId || ""}
                  onChange={(e) => {
                    const emp = employees.find((x) => x.id === e.target.value);
                    if (emp) {
                      setNewResignation({
                        ...newResignation,
                        employee: emp.name,
                        employeeId: emp.employeeCode || emp.empId || emp.employee_code || emp.id,
                        dept: emp.department || newResignation.dept,
                        role: emp.designation || newResignation.role,
                      });
                    }
                  }}
                  className="h-10 w-full px-3 rounded-xl border border-slate-300 text-[12.5px] bg-white text-slate-800 focus:outline-none focus:border-navy cursor-pointer transition"
                >
                  <option value="">-- Choose active staff member (or enter below) --</option>
                  {employees.map((emp) => {
                    const code = emp.employeeCode || emp.empId || emp.employee_code || "Staff";
                    const desig = emp.designation || "Staff";
                    const dept = emp.department || "General";
                    return (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({code}) — {desig} ({dept})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Varma"
                    value={newResignation.employee}
                    onChange={(e) => setNewResignation({ ...newResignation, employee: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employee ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-1044"
                    value={newResignation.employeeId}
                    onChange={(e) => setNewResignation({ ...newResignation, employeeId: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
                  <input
                    list="hr-dept-options"
                    value={newResignation.dept}
                    onChange={(e) => setNewResignation({ ...newResignation, dept: e.target.value })}
                    placeholder="Enter department"
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role / Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior UI Designer"
                    value={newResignation.role}
                    onChange={(e) => setNewResignation({ ...newResignation, role: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Submission Date</label>
                  <input
                    type="date"
                    value={newResignation.submittedDate}
                    onChange={(e) => setNewResignation({ ...newResignation, submittedDate: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Working Day</label>
                  <input
                    type="date"
                    value={newResignation.lastWorkingDay}
                    onChange={(e) => setNewResignation({ ...newResignation, lastWorkingDay: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notice Period</label>
                  <input
                    type="text"
                    value={newResignation.noticePeriod}
                    onChange={(e) => setNewResignation({ ...newResignation, noticePeriod: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Handover To (Assignee)</label>
                  <input
                    type="text"
                    placeholder="e.g. Marcus Chen"
                    value={newResignation.handoverTo}
                    onChange={(e) => setNewResignation({ ...newResignation, handoverTo: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reason for Resignation *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Employee reasons, transition plan notes..."
                  value={newResignation.reason}
                  onChange={(e) => setNewResignation({ ...newResignation, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>
              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsResignationModalOpen(false)}
                  className="h-9 px-4 border border-bdr rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition"
                >
                  <Check size={14} />
                  <span>Submit Resignation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: File Grievance / Complaint ── */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-bdr">
              <div>
                <h3 className="font-bold text-[16px] text-slate-900">File Grievance / Compliance Ticket</h3>
                <p className="text-[11.5px] text-muted">Confidential intake with assigned legal/HR investigator</p>
              </div>
              <button
                type="button"
                onClick={() => setIsComplaintModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateComplaint} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Complainant Name</label>
                  <input
                    type="text"
                    placeholder="Leave blank for Anonymous"
                    value={newComplaint.complainant}
                    onChange={(e) => setNewComplaint({ ...newComplaint, complainant: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Against / Target *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operations Manager"
                    value={newComplaint.against}
                    onChange={(e) => setNewComplaint({ ...newComplaint, against: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
                  <select
                    value={newComplaint.category}
                    onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                  >
                    <option>Workplace Harassment / POSH</option>
                    <option>Reimbursement &amp; Payroll Delay</option>
                    <option>Physical Workplace Environment</option>
                    <option>Management / Discrimination</option>
                    <option>Ethics &amp; Compliance Violation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority Level</label>
                  <select
                    value={newComplaint.priority}
                    onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assign Lead Investigator</label>
                <select
                  value={newComplaint.assignedInvestigator}
                  onChange={(e) => setNewComplaint({ ...newComplaint, assignedInvestigator: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                >
                  <option value="">{currentUser?.name ? `${currentUser.name} (You)` : "Select investigator"}</option>
                  {Array.from(new Map(employees.filter((e) => e.name).map((e) => [e.name.toLowerCase(), e])).values()).map((e) => (
                    <option key={e.id || e.name} value={`${e.name}${e.designation ? ` (${e.designation})` : ""}`}>
                      {e.name}{e.designation ? ` (${e.designation})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Summary of Grievance *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed description of incidents, dates, and impact..."
                  value={newComplaint.summary}
                  onChange={(e) => setNewComplaint({ ...newComplaint, summary: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>
              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsComplaintModalOpen(false)}
                  className="h-9 px-4 border border-bdr rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-amber-700 text-white rounded-xl text-xs font-semibold hover:bg-amber-800 cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition"
                >
                  <MessageSquareWarning size={14} />
                  <span>File Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: View Grievance & Investigation Notes ── */}
      {viewingComplaint && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-2xl p-5 sm:p-6 max-h-[95vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex justify-between items-start pb-3 border-b border-bdr">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-base text-navy">{viewingComplaint.id}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      viewingComplaint.status === "Resolved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : viewingComplaint.status === "Under Review" || viewingComplaint.status === "Under Investigation"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {viewingComplaint.status}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      viewingComplaint.priority === "High"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : viewingComplaint.priority === "Medium"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {viewingComplaint.priority} Priority
                  </span>
                </div>
                <h3 className="font-bold text-[15px] text-slate-900">{viewingComplaint.category}</h3>
                <p className="text-[11.5px] text-muted">Filed on {viewingComplaint.filedOn}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingComplaint(null)}
                className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Complainant & Target info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-bdr text-[12.5px]">
              <div>
                <span className="text-muted block text-[11px]">Complainant / Source</span>
                <span className="font-semibold text-slate-800">{viewingComplaint.complainant || "Anonymous"}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px]">Against / Target</span>
                <span className="font-semibold text-slate-800">{viewingComplaint.against}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted block text-[11px]">Assigned Investigator</span>
                <span className="font-medium text-slate-700">{viewingComplaint.assignedInvestigator || "HR Committee"}</span>
              </div>
            </div>

            {/* Grievance Statement */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Incident Summary & Statement</h4>
              <p className="text-[13px] text-slate-800 bg-white p-3 rounded-xl border border-bdr leading-relaxed whitespace-pre-wrap">
                {viewingComplaint.summary || viewingComplaint.description || "No description provided."}
              </p>
            </div>

            {/* Resolution Panel */}
            {viewingComplaint.status === "Resolved" ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                  <CheckCircle2 size={15} /> Case Resolved
                </div>
                <p className="text-[12.5px] text-emerald-900 leading-relaxed whitespace-pre-wrap">
                  {viewingComplaint.resolution || "Resolved with satisfactory outcome for all parties."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleResolveComplaint} className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <h4 className="text-xs font-semibold text-amber-900">Case Resolution</h4>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter conclusion, actions taken, and closing remarks..."
                  value={complaintResolutionText}
                  onChange={(e) => setComplaintResolutionText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-[12.5px] bg-white focus:outline-none focus:border-navy"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isResolvingComplaint}
                    className="px-3.5 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 disabled:opacity-50 transition cursor-pointer shadow-xs"
                  >
                    {isResolvingComplaint ? "Resolving..." : "Mark Case as Resolved"}
                  </button>
                </div>
              </form>
            )}

            {/* Investigation Notes / Timeline */}
            <div className="space-y-2 pt-2 border-t border-bdr">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Investigation Notes &amp; Updates ({(viewingComplaint.comments || []).length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(viewingComplaint.comments || []).length === 0 ? (
                  <p className="text-[12px] text-muted italic">No investigation notes entered yet.</p>
                ) : (
                  viewingComplaint.comments.map((note, idx) => (
                    <div key={idx} className="bg-off p-2.5 rounded-lg border border-bdr/60 text-[12px]">
                      <div className="flex items-center justify-between text-muted text-[10.5px] mb-1">
                        <strong className="text-slate-700">{note.author_name || "Investigator"}</strong>
                        <span>{note.created_at ? new Date(note.created_at).toLocaleString() : ""}</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">{note.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddComplaintComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add confidential investigation note..."
                  value={complaintCommentText}
                  onChange={(e) => setComplaintCommentText(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-bdr text-[12.5px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !complaintCommentText.trim()}
                  className="px-3 py-1.5 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  {isSubmittingComment ? "Adding..." : "Add Note"}
                </button>
              </form>
            </div>

            <div className="flex justify-end pt-2 border-t border-bdr">
              <button
                type="button"
                onClick={() => setViewingComplaint(null)}
                className="px-4 py-2 border border-bdr rounded-xl text-xs font-semibold hover:bg-off cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Update Grievance Status with Complaint Reason ── */}
      {statusChangeComplaint && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-lg p-5 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-bdr">
              <div>
                <span className="text-[11px] font-mono text-muted uppercase tracking-wider block">
                  Ticket #{statusChangeComplaint.id}
                </span>
                <h3 className="font-bold text-[16px] text-slate-900">
                  Update Grievance Status
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStatusChangeComplaint(null)}
                className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStatusChange} className="flex flex-col gap-4">
              {/* Complainant & Incident Meta */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Complainant</span>
                  <span className="font-semibold text-slate-800">
                    {statusChangeComplaint.complainant || "Anonymous"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Target / Against</span>
                  <span className="font-semibold text-slate-800">
                    {statusChangeComplaint.against || "General"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Category</span>
                  <span className="font-medium text-slate-700">
                    {statusChangeComplaint.category}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Priority</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      statusChangeComplaint.priority === "High"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {statusChangeComplaint.priority}
                  </span>
                </div>
              </div>

              {/* Prominent Reason of Complaint Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Reason of Complaint / Incident Statement:
                </label>
                <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl text-[13px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {statusChangeComplaint.summary ||
                    statusChangeComplaint.description ||
                    statusChangeComplaint.reason ||
                    "No description provided for this grievance."}
                </div>
              </div>

              {/* Status Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Select New Status:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "Open", label: "Open" },
                    { val: "Under Review", label: "Under Review" },
                    { val: "Resolved", label: "Resolved" },
                  ].map((s) => (
                    <label
                      key={s.val}
                      className="cursor-pointer relative"
                    >
                      <input
                        type="radio"
                        name="grievance_status"
                        value={s.val}
                        checked={newComplaintStatus === s.val}
                        onChange={(e) => setNewComplaintStatus(e.target.value)}
                        className="peer sr-only"
                      />
                      <div
                        className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition ${
                          newComplaintStatus === s.val
                            ? s.val === "Resolved"
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                              : s.val === "Under Review"
                              ? "bg-purple-50 border-purple-500 text-purple-800 shadow-xs"
                              : "bg-amber-50 border-amber-500 text-amber-800 shadow-xs"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {s.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes / Resolution text */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {newComplaintStatus === "Resolved"
                    ? "Resolution Summary & Actions Taken"
                    : newComplaintStatus === "Under Review"
                    ? "Investigation & Review Notes"
                    : "Notes / Comments (Optional)"}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    newComplaintStatus === "Resolved"
                      ? "Describe the final outcome and corrective measures..."
                      : "Describe ongoing review steps or findings..."
                  }
                  value={statusChangeNote}
                  onChange={(e) => setStatusChangeNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-[12.5px] bg-white focus:outline-none focus:border-navy transition resize-none placeholder:text-slate-400"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setStatusChangeComplaint(null)}
                  className="h-9 px-4 border border-bdr rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="h-9 px-4 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  {isUpdatingStatus ? "Updating..." : `Confirm Status: ${newComplaintStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: View Grievance & Investigation Notes ── */}
      {viewingComplaint && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-2xl p-5 sm:p-6 max-h-[95vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex justify-between items-start pb-3 border-b border-bdr">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-base text-navy">{viewingComplaint.id}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      viewingComplaint.status === "Resolved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : viewingComplaint.status === "Under Review" || viewingComplaint.status === "Under Investigation"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {viewingComplaint.status}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      viewingComplaint.priority === "High"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : viewingComplaint.priority === "Medium"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {viewingComplaint.priority} Priority
                  </span>
                </div>
                <h3 className="font-bold text-[15px] text-slate-900">{viewingComplaint.category}</h3>
                <p className="text-[11.5px] text-muted">Filed on {viewingComplaint.filedOn}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingComplaint(null)}
                className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Complainant & Target info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-bdr text-[12.5px]">
              <div>
                <span className="text-muted block text-[11px]">Complainant / Source</span>
                <span className="font-semibold text-slate-800">{viewingComplaint.complainant || "Anonymous"}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px]">Against / Target</span>
                <span className="font-semibold text-slate-800">{viewingComplaint.against}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted block text-[11px]">Assigned Investigator</span>
                <span className="font-medium text-slate-700">{viewingComplaint.assignedInvestigator || "HR Committee"}</span>
              </div>
            </div>

            {/* Grievance Statement */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Incident Summary & Statement</h4>
              <p className="text-[13px] text-slate-800 bg-white p-3 rounded-xl border border-bdr leading-relaxed whitespace-pre-wrap">
                {viewingComplaint.summary || viewingComplaint.description || "No description provided."}
              </p>
            </div>

            {/* Resolution Panel */}
            {viewingComplaint.status === "Resolved" ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                  <CheckCircle2 size={15} /> Case Resolved
                </div>
                <p className="text-[12.5px] text-emerald-900 leading-relaxed whitespace-pre-wrap">
                  {viewingComplaint.resolution || "Resolved with satisfactory outcome for all parties."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleResolveComplaint} className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <h4 className="text-xs font-semibold text-amber-900">Case Resolution</h4>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter conclusion, actions taken, and closing remarks..."
                  value={complaintResolutionText}
                  onChange={(e) => setComplaintResolutionText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-[12.5px] bg-white focus:outline-none focus:border-navy"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isResolvingComplaint}
                    className="px-3.5 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 disabled:opacity-50 transition cursor-pointer shadow-xs"
                  >
                    {isResolvingComplaint ? "Resolving..." : "Mark Case as Resolved"}
                  </button>
                </div>
              </form>
            )}

            {/* Investigation Notes / Timeline */}
            <div className="space-y-2 pt-2 border-t border-bdr">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Investigation Notes &amp; Updates ({(viewingComplaint.comments || []).length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(viewingComplaint.comments || []).length === 0 ? (
                  <p className="text-[12px] text-muted italic">No investigation notes entered yet.</p>
                ) : (
                  viewingComplaint.comments.map((note, idx) => (
                    <div key={idx} className="bg-off p-2.5 rounded-lg border border-bdr/60 text-[12px]">
                      <div className="flex items-center justify-between text-muted text-[10.5px] mb-1">
                        <strong className="text-slate-700">{note.author_name || "Investigator"}</strong>
                        <span>{note.created_at ? new Date(note.created_at).toLocaleString() : ""}</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">{note.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddComplaintComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add confidential investigation note..."
                  value={complaintCommentText}
                  onChange={(e) => setComplaintCommentText(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-bdr text-[12.5px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !complaintCommentText.trim()}
                  className="px-3 py-1.5 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  {isSubmittingComment ? "Adding..." : "Add Note"}
                </button>
              </form>
            </div>

            <div className="flex justify-end pt-2 border-t border-bdr">
              <button
                type="button"
                onClick={() => setViewingComplaint(null)}
                className="px-4 py-2 border border-bdr rounded-xl text-xs font-semibold hover:bg-off cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add / Edit Holiday ── */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-lg p-5 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-bdr">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-navy" />
                <h3 className="font-bold text-[16px] text-slate-900">
                  {editingHoliday ? "Edit Holiday" : "Add Holiday to Calendar"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHolidayModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveHoliday} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Holiday Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Independence Day"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Holiday Date *</label>
                  <input
                    type="date"
                    required
                    value={newHoliday.date}
                    onChange={(e) => {
                      const d = e.target.value;
                      let dayName = "";
                      try {
                        const parsed = new Date(d);
                        if (!Number.isNaN(parsed.getTime())) {
                          dayName = parsed.toLocaleDateString("en-US", { weekday: "long" });
                        }
                      } catch {}
                      setNewHoliday({ ...newHoliday, date: d, day: dayName });
                    }}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Day of Week</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Auto-calculated"
                    value={newHoliday.day}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-slate-50 text-slate-600 font-medium outline-none cursor-not-allowed transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Classification</label>
                  <select
                    value={newHoliday.type}
                    onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                  >
                    <option value="National Gazetted">National Gazetted</option>
                    <option value="Regional Holiday">Regional Holiday</option>
                    <option value="Restricted / Optional">Restricted / Optional</option>
                    <option value="Company Milestone Day">Company Milestone Day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Publication Status</label>
                  <select
                    value={newHoliday.status || "Published"}
                    onChange={(e) => setNewHoliday({ ...newHoliday, status: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                  >
                    <option value="Published">Published (Active)</option>
                    <option value="Inactive">Inactive / Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Applicable Department</label>
                  <select
                    value={newHoliday.departmentId || ""}
                    onChange={(e) => setNewHoliday({ ...newHoliday, departmentId: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                  >
                    <option value="">All Departments (Global)</option>
                    {departmentsConfig.map((d) => (
                      <option key={d.id || d.name} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Applicable Location / Hub</label>
                  <select
                    value={newHoliday.locationId || ""}
                    onChange={(e) => setNewHoliday({ ...newHoliday, locationId: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                  >
                    <option value="">All Locations &amp; Hubs</option>
                    {locations.map((loc) => (
                      <option key={loc.id || loc.name} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description &amp; Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional context about gazette notification or observance..."
                  value={newHoliday.description || ""}
                  onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="h-9 px-4 border border-bdr rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition"
                >
                  <CalendarCheck size={14} />
                  <span>{editingHoliday ? "Save Holiday" : "Publish Holiday"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Create / Edit Work Schedule (§11.8) ── */}
      {isWorkScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-lg p-5 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-bdr">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-navy" />
                <h3 className="font-bold text-[16px] text-slate-900">
                  {editingWorkSchedule ? "Edit Work Schedule" : "Create Work Schedule"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkScheduleModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveSchedule} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Schedule Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Morning Shift"
                    value={workScheduleForm.name}
                    onChange={(e) => setWorkScheduleForm({ ...workScheduleForm, name: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Schedule Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SCH-01"
                    value={workScheduleForm.code}
                    onChange={(e) => setWorkScheduleForm({ ...workScheduleForm, code: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy font-mono transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Shift Type</label>
                  <select
                    value={workScheduleForm.shiftType}
                    onChange={(e) => setWorkScheduleForm({ ...workScheduleForm, shiftType: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Flexible">Flexible</option>
                    <option value="Rotational">Rotational</option>
                    <option value="Night">Night Shift</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Shift Start Time *</label>
                  <input
                    type="time"
                    required
                    value={workScheduleForm.shiftStart}
                    onChange={(e) => setWorkScheduleForm({ ...workScheduleForm, shiftStart: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Shift End Time *</label>
                  <input
                    type="time"
                    required
                    value={workScheduleForm.shiftEnd}
                    onChange={(e) => setWorkScheduleForm({ ...workScheduleForm, shiftEnd: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Daily Working Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    value={workScheduleForm.workingHours}
                    onChange={(e) => setWorkScheduleForm({ ...workScheduleForm, workingHours: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Break Duration (Minutes)</label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    max="180"
                    value={workScheduleForm.breakDuration}
                    onChange={(e) => setWorkScheduleForm({ ...workScheduleForm, breakDuration: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
              </div>

              {/* Working Days Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Working Days (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((dayName, idx) => {
                    const isSelected = workScheduleForm.workingDays.includes(idx);
                    return (
                      <button
                        key={dayName}
                        type="button"
                        onClick={() => {
                          const nextDays = isSelected
                            ? workScheduleForm.workingDays.filter((d) => d !== idx)
                            : [...workScheduleForm.workingDays, idx].sort();
                          // If adding as working day, remove from weekly offs
                          const nextOffs = workScheduleForm.weeklyOffs.filter((d) => d !== idx);
                          setWorkScheduleForm({ ...workScheduleForm, workingDays: nextDays, weeklyOffs: nextOffs });
                        }}
                        className={`h-8 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          isSelected
                            ? "bg-navy text-white border-navy shadow-2xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {dayName.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Offs Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Weekly Offs (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((dayName, idx) => {
                    const isSelected = workScheduleForm.weeklyOffs.includes(idx);
                    return (
                      <button
                        key={dayName}
                        type="button"
                        onClick={() => {
                          const nextOffs = isSelected
                            ? workScheduleForm.weeklyOffs.filter((d) => d !== idx)
                            : [...workScheduleForm.weeklyOffs, idx].sort();
                          // If adding as weekly off, remove from working days
                          const nextDays = workScheduleForm.workingDays.filter((d) => d !== idx);
                          setWorkScheduleForm({ ...workScheduleForm, weeklyOffs: nextOffs, workingDays: nextDays });
                        }}
                        className={`h-8 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          isSelected
                            ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {dayName.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assignment Scope */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2.5">
                <label className="block text-xs font-semibold text-slate-800">Schedule Assignment Scope</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "default", label: "Org-Wide Default" },
                    { id: "department", label: "By Department" },
                    { id: "team", label: "By Squad / Team" },
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setWorkScheduleForm({ ...workScheduleForm, scopeType: sc.id })}
                      className={`h-8 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        workScheduleForm.scopeType === sc.id
                          ? "bg-navy text-white border-navy"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>

                {workScheduleForm.scopeType === "department" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Department *</label>
                    <select
                      required
                      value={workScheduleForm.departmentId}
                      onChange={(e) => setWorkScheduleForm({ ...workScheduleForm, departmentId: e.target.value })}
                      className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                    >
                      <option value="">Select Department</option>
                      {departmentsConfig.map((d) => (
                        <option key={d.id || d.name} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {workScheduleForm.scopeType === "team" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Squad / Team *</label>
                    <select
                      required
                      value={workScheduleForm.teamId}
                      onChange={(e) => setWorkScheduleForm({ ...workScheduleForm, teamId: e.target.value })}
                      className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                    >
                      <option value="">Select Team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.dept || t.department || "General"})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Effective Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Effective From</label>
                  <input
                    type="date"
                    value={workScheduleForm.effectiveFrom}
                    onChange={(e) => setWorkScheduleForm({ ...workScheduleForm, effectiveFrom: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Effective To (Optional)</label>
                  <input
                    type="date"
                    value={workScheduleForm.effectiveTo}
                    onChange={(e) => setWorkScheduleForm({ ...workScheduleForm, effectiveTo: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description &amp; Shift Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes about break policies, rotational periods, or handovers..."
                  value={workScheduleForm.description}
                  onChange={(e) => setWorkScheduleForm({ ...workScheduleForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsWorkScheduleModalOpen(false)}
                  className="h-9 px-4 border border-bdr rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition"
                >
                  <Clock size={14} />
                  <span>{editingWorkSchedule ? "Save Schedule" : "Create Schedule"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Termination Letter Live Editor & PDF ── */}
      <datalist id="hr-dept-options">
        {hrDeptOptions.map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>

      <TerminationLetterModal
        isOpen={isTerminationLetterModalOpen}
        onClose={() => {
          setIsTerminationLetterModalOpen(false);
          setTerminationAutoPrint(false);
        }}
        termination={activeTerminationLetter}
        onUpdateTermination={handleUpdateTermination}
        initialEdit={terminationInitialEdit}
        autoPrint={terminationAutoPrint}
      />

      {/* ── Modal: Offer Letter Live Editor & PDF ── */}
      <OfferLetterModal
        isOpen={isOfferLetterModalOpen}
        onClose={() => {
          setIsOfferLetterModalOpen(false);
          setOfferLetterAutoPrint(false);
        }}
        offer={activeOfferLetter}
        onUpdateOffer={handleUpdateOffer}
        initialEdit={offerLetterInitialEdit}
        autoPrint={offerLetterAutoPrint}
      />

      {/* ── Modal: Publish Announcement ── */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-lg p-5 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-bdr">
              <div className="flex items-center gap-2">
                <Megaphone size={18} className="text-amber-600" />
                <h3 className="font-bold text-[16px] text-slate-900">
                  {editingAnnouncement ? "Edit Company Announcement" : "Publish Company Announcement"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted hover:text-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncementSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Townhall & All-Hands Strategy Meeting"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Content / Circular Text *
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide comprehensive announcement details, timings, and agenda..."
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Department
                  </label>
                  <select
                    value={newAnnouncement.targetDepartmentId || ""}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetDepartmentId: e.target.value || null })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                  >
                    <option value="">All Organization</option>
                    {departmentsConfig.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Author / Publisher Name
                </label>
                <input
                  type="text"
                  value={newAnnouncement.author_name}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, author_name: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_ann_pinned"
                  checked={newAnnouncement.is_pinned}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, is_pinned: e.target.checked })}
                  className="rounded border-bdr text-navy focus:ring-navy cursor-pointer"
                />
                <label htmlFor="is_ann_pinned" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Pin to top of employee dashboard &amp; circular feed
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="h-9 px-4 border border-bdr rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 shadow-xs cursor-pointer inline-flex items-center gap-2 transition"
                >
                  <Megaphone size={14} />
                  <span>{editingAnnouncement ? "Save Changes" : "Publish Announcement"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Request Travel Approval ── */}
      {isTravelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-lg p-5 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-bdr">
              <div className="flex items-center gap-2">
                <Plane size={18} className="text-sky-600" />
                <h3 className="font-bold text-[16px] text-slate-900">Request Travel Requisition</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTravelModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted hover:text-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTravelSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Employee *
                </label>
                <select
                  value={newTravel.employeeId}
                  onChange={(e) => setNewTravel({ ...newTravel, employeeId: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer transition"
                  required
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode || emp.empId || emp.employee_code || "Staff"}) - {emp.department || "General"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Destination *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore Plant / Client HQ Mumbai"
                  value={newTravel.destination}
                  onChange={(e) => setNewTravel({ ...newTravel, destination: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tour Purpose *
                </label>
                <input
                  type="text"
                  placeholder="e.g. On-site commissioning and acceptance testing"
                  value={newTravel.purpose}
                  onChange={(e) => setNewTravel({ ...newTravel, purpose: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newTravel.start_date}
                    onChange={(e) => setNewTravel({ ...newTravel, start_date: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={newTravel.end_date}
                    onChange={(e) => setNewTravel({ ...newTravel, end_date: e.target.value })}
                    className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Advance Amount Requested (₹)
                </label>
                <input
                  type="number"
                  value={newTravel.advance_requested}
                  onChange={(e) => setNewTravel({ ...newTravel, advance_requested: Number(e.target.value) })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsTravelModalOpen(false)}
                  className="h-9 px-4 border border-bdr rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 shadow-xs cursor-pointer inline-flex items-center gap-2 transition"
                >
                  <Plane size={14} />
                  <span>Submit Requisition</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Settle Travel Expenses ── */}
      {isSettleTravelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-md p-5 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-bdr">
              <div>
                <h3 className="font-bold text-[16px] text-slate-900">Settle Travel Requisition</h3>
                <p className="text-[11.5px] text-muted">
                  {settleTravelData.travel_number} • {settleTravelData.employeeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSettleTravelModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted hover:text-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSettleTravelSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Advance Disbursed (₹)
                </label>
                <input
                  type="number"
                  value={settleTravelData.advance_disbursed}
                  onChange={(e) =>
                    setSettleTravelData({ ...settleTravelData, advance_disbursed: e.target.value })
                  }
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Actual Expenses Claimed (₹)
                </label>
                <input
                  type="number"
                  value={settleTravelData.actual_expenses}
                  onChange={(e) =>
                    setSettleTravelData({ ...settleTravelData, actual_expenses: e.target.value })
                  }
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>Net Balance:</span>
                  <span
                    className={
                      Number(settleTravelData.actual_expenses) - Number(settleTravelData.advance_disbursed) >= 0
                        ? "text-emerald-700 font-bold"
                        : "text-amber-700 font-bold"
                    }
                  >
                    {Number(settleTravelData.actual_expenses) - Number(settleTravelData.advance_disbursed) >= 0
                      ? `Company Reimburses: ₹${(
                          Number(settleTravelData.actual_expenses) - Number(settleTravelData.advance_disbursed)
                        ).toLocaleString()}`
                      : `Employee Refunds: ₹${Math.abs(
                          Number(settleTravelData.actual_expenses) - Number(settleTravelData.advance_disbursed)
                        ).toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Settlement Notes / Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Voucher references, boarding pass verifications, notes..."
                  value={settleTravelData.settlement_notes}
                  onChange={(e) =>
                    setSettleTravelData({ ...settleTravelData, settlement_notes: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsSettleTravelModalOpen(false)}
                  className="h-9 px-4 border border-bdr rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 shadow-xs cursor-pointer inline-flex items-center gap-2 transition"
                >
                  <Receipt size={14} />
                  <span>Confirm Settlement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Waive or Shorten Resignation Notice Period ── */}
      {noticeActionModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-md p-5 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-bdr">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-amber-600" />
                <h3 className="font-bold text-[16px] text-slate-900">
                  {noticeActionModal.type === 'waive' ? 'Waive Notice Period' : 'Shorten Notice Period'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNoticeActionModal({ open: false, type: 'waive', resignation: null, date: '', reason: '', loading: false })}
                className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted hover:text-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleNoticeActionSubmit} className="flex flex-col gap-3.5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                <p className="font-semibold text-slate-800">{noticeActionModal.resignation?.employee}</p>
                <p className="text-slate-500 mt-0.5">
                  Current Last Working Day: <span className="font-semibold text-slate-700">{noticeActionModal.resignation?.lastWorkingDay || '—'}</span>
                </p>
                <p className="text-slate-500">
                  Notice Duration: <span className="font-semibold text-slate-700">{noticeActionModal.resignation?.noticePeriod}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {noticeActionModal.type === 'waive' ? 'Effective Departure Date' : 'Revised Last Working Day *'}
                </label>
                <input
                  type="date"
                  required
                  value={noticeActionModal.date}
                  onChange={(e) => setNoticeActionModal({ ...noticeActionModal, date: e.target.value })}
                  className="h-10 w-full px-3.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason / Management Approval *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    noticeActionModal.type === 'waive'
                      ? "e.g. Mutual consent waiver approved by Department Head and HR..."
                      : "e.g. Early handover completion and project transition concluded..."
                  }
                  value={noticeActionModal.reason}
                  onChange={(e) => setNoticeActionModal({ ...noticeActionModal, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setNoticeActionModal({ open: false, type: 'waive', resignation: null, date: '', reason: '', loading: false })}
                  className="h-9 px-4 border border-bdr rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={noticeActionModal.loading}
                  className={`h-9 px-4 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-2 transition ${
                    noticeActionModal.type === 'waive' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-navy hover:bg-navy/90'
                  }`}
                >
                  <span>{noticeActionModal.loading ? 'Saving...' : noticeActionModal.type === 'waive' ? 'Confirm Waiver' : 'Update Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Generate Offer Letter (Connected to Recruits) ── */}
      <GenerateOfferModal
        isOpen={isGenerateOfferModalOpen}
        onClose={() => setIsGenerateOfferModalOpen(false)}
        onSubmit={handleCreateOffer}
      />
    </div>
  );
}
