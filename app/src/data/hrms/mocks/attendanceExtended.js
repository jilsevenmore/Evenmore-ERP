export const attendanceEmployees = [
  { id: "EMP1024", name: "Priya Patel", avatar: "https://i.pravatar.cc/100?img=15", dept: "Engineering", designation: "Senior Engineer", manager: "David Park", location: "New York", employmentType: "Full-time", shift: "General", status: "Active" },
  { id: "EMP1025", name: "Marcus Chen", avatar: "https://i.pravatar.cc/100?img=16", dept: "Design", designation: "Lead Designer", manager: "Sophia Lindqvist", location: "London", employmentType: "Full-time", shift: "General", status: "Active" },
  { id: "EMP1026", name: "Liam Cooper", avatar: "https://i.pravatar.cc/100?img=20", dept: "Engineering", designation: "DevOps Engineer", manager: "David Park", location: "New York", employmentType: "Full-time", shift: "General", status: "Active" },
  { id: "EMP1027", name: "Sarah Wilson", avatar: "https://i.pravatar.cc/100?img=8", dept: "Marketing", designation: "Brand Strategist", manager: "Elena Rostova", location: "New York", employmentType: "Full-time", shift: "Flexible", status: "Active" },
  { id: "EMP1028", name: "James Wilson", avatar: "https://i.pravatar.cc/100?img=12", dept: "Finance", designation: "Finance Manager", manager: "Sarah Mitchell", location: "London", employmentType: "Full-time", shift: "General", status: "Active" },
  { id: "EMP1029", name: "Ayesha Khan", avatar: "https://i.pravatar.cc/100?img=5", dept: "HR", designation: "HR Lead", manager: "Sarah Mitchell", location: "New York", employmentType: "Full-time", shift: "General", status: "Active" },
  { id: "EMP1030", name: "David Park", avatar: "https://i.pravatar.cc/100?img=11", dept: "Engineering", designation: "CTO", manager: "Sarah Mitchell", location: "New York", employmentType: "Full-time", shift: "General", status: "Active" },
  { id: "EMP1031", name: "Chen Li", avatar: "https://i.pravatar.cc/100?img=34", dept: "Operations", designation: "Operations Manager", manager: "David Park", location: "Dubai", employmentType: "Contract", shift: "Night", status: "Active" },
  { id: "EMP1032", name: "Rahul Verma", avatar: "https://i.pravatar.cc/100?img=33", dept: "Design", designation: "UX Designer", manager: "Marcus Chen", location: "London", employmentType: "Full-time", shift: "General", status: "Active" },
  { id: "EMP1033", name: "Ana Silva", avatar: "https://i.pravatar.cc/100?img=32", dept: "Marketing", designation: "Content Lead", manager: "Sarah Wilson", location: "New York", employmentType: "Part-time", shift: "Flexible", status: "Active" },
  { id: "EMP1034", name: "Tariq Al-Mansoor", avatar: "https://i.pravatar.cc/100?img=17", dept: "HR", designation: "People Ops Specialist", manager: "Ayesha Khan", location: "Dubai", employmentType: "Full-time", shift: "General", status: "Active" },
  { id: "EMP1035", name: "Sofia Reyes", avatar: "https://i.pravatar.cc/100?img=26", dept: "Finance", designation: "Analyst", manager: "James Wilson", location: "London", employmentType: "Full-time", shift: "General", status: "Probation" }
];
export const dailyRecords = attendanceEmployees.map((e, i) => {
  const variants = [
    { ci: "09:02", co: "18:04", wh: "08:32", status: "Present" },
    { ci: "09:18", co: "18:30", wh: "08:42", status: "Late" },
    { ci: "\u2014", co: "\u2014", wh: "\u2014", status: "Absent" },
    { ci: "09:00", co: "17:55", wh: "08:25", status: "WFH" },
    { ci: "09:42", co: "13:30", wh: "03:48", status: "Half Day" },
    { ci: "\u2014", co: "\u2014", wh: "\u2014", status: "On Leave" },
    { ci: "09:05", co: "18:10", wh: "08:35", status: "Present" },
    { ci: "09:22", co: "18:00", wh: "08:08", status: "Late" }
  ];
  const v = variants[i % variants.length];
  return { ...e, checkIn: v.ci, checkOut: v.co, workHours: v.wh, status: v.status, date: "11 Oct 2024" };
});
export const monthlyRecords = (_employeeId) => {
  const base = ["Present", "Present", "Late", "Present", "WFH", "Absent", "Present", "Half Day", "On Leave", "Present", "Present", "Late", "Present", "WFH", "Present", "Present", "Absent", "Present", "Present", "Late", "Present", "Present", "WFH", "Present", "Half Day", "Present", "Present", "Late", "Present", "Present"];
  return base.map((status, idx) => {
    const date = idx + 1;
    const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][date % 7];
    const checkIn = status === "Absent" || status === "On Leave" ? "\u2014" : status === "Late" ? "09:18" : status === "Half Day" ? "09:42" : "09:02";
    const checkOut = status === "Absent" || status === "On Leave" ? "\u2014" : status === "Half Day" ? "13:30" : "18:04";
    const wh = status === "Absent" || status === "On Leave" ? "\u2014" : status === "Half Day" ? "03:48" : "08:32";
    const shift = idx % 3 === 0 ? "Flexible" : "General";
    return { date: `${String(date).padStart(2, "0")} Oct 2024`, day, checkIn, checkOut, workHours: wh, shift, status, remarks: status === "Late" ? "Grace 10 min" : status === "Half Day" ? "Personal" : "" };
  });
};
export const attendanceRequestsMock = [
  { id: "REQ-1001", employee: "Priya Patel", employeeId: "EMP1024", avatar: "https://i.pravatar.cc/100?img=15", dept: "Engineering", type: "Regularization", date: "10 Oct 2024", currentIn: "09:15", currentOut: "17:45", requestedIn: "09:30", requestedOut: "18:30", reason: "Missed punch", requestedBy: "Priya Patel", submitted: "10 Oct", status: "Pending" },
  { id: "REQ-1002", employee: "Marcus Chen", employeeId: "EMP1025", avatar: "https://i.pravatar.cc/100?img=16", dept: "Design", type: "Early Clock-Out", date: "11 Oct 2024", currentIn: "09:18", currentOut: "18:30", requestedIn: "09:18", requestedOut: "16:30", reason: "Personal appointment", requestedBy: "Marcus Chen", submitted: "11 Oct", status: "Pending" },
  { id: "REQ-1003", employee: "Liam Cooper", employeeId: "EMP1026", avatar: "https://i.pravatar.cc/100?img=20", dept: "Engineering", type: "Regularization", date: "09 Oct 2024", currentIn: "\u2014", currentOut: "\u2014", requestedIn: "09:02", requestedOut: "18:04", reason: "Missing Check-In", requestedBy: "Liam Cooper", submitted: "09 Oct", status: "Approved", reviewer: "Ayesha Khan", reviewedAt: "10 Oct 09:20" },
  { id: "REQ-1004", employee: "Sarah Wilson", employeeId: "EMP1027", avatar: "https://i.pravatar.cc/100?img=8", dept: "Marketing", type: "Early Clock-Out", date: "08 Oct 2024", currentIn: "09:00", currentOut: "17:55", requestedIn: "09:00", requestedOut: "15:00", reason: "Medical", requestedBy: "Sarah Wilson", submitted: "08 Oct", status: "Rejected", reviewer: "Ayesha Khan", rejectReason: "Insufficient coverage" },
  { id: "REQ-1005", employee: "Chen Li", employeeId: "EMP1031", avatar: "https://i.pravatar.cc/100?img=34", dept: "Operations", type: "Regularization", date: "07 Oct 2024", currentIn: "09:42", currentOut: "18:10", requestedIn: "09:02", requestedOut: "18:10", reason: "Incorrect Check-In", requestedBy: "Chen Li", submitted: "07 Oct", status: "Cancelled" },
  { id: "REQ-1006", employee: "Rahul Verma", employeeId: "EMP1032", avatar: "https://i.pravatar.cc/100?img=33", dept: "Design", type: "Regularization", date: "06 Oct 2024", currentIn: "09:00", currentOut: "\u2014", requestedIn: "09:00", requestedOut: "18:00", reason: "Missing Check-Out", requestedBy: "Rahul Verma", submitted: "06 Oct", status: "Pending" },
  { id: "REQ-1007", employee: "Ana Silva", employeeId: "EMP1033", avatar: "https://i.pravatar.cc/100?img=32", dept: "Marketing", type: "Early Clock-Out", date: "05 Oct 2024", currentIn: "09:05", currentOut: "18:00", requestedIn: "09:05", requestedOut: "14:00", reason: "Family event", requestedBy: "Ana Silva", submitted: "05 Oct", status: "Approved", reviewer: "David Park" },
  { id: "REQ-1008", employee: "Tariq Al-Mansoor", employeeId: "EMP1034", avatar: "https://i.pravatar.cc/100?img=17", dept: "HR", type: "Regularization", date: "04 Oct 2024", currentIn: "09:18", currentOut: "18:04", requestedIn: "09:02", requestedOut: "18:04", reason: "Incorrect Status", requestedBy: "Tariq Al-Mansoor", submitted: "04 Oct", status: "Pending" },
  { id: "REQ-1009", employee: "Sofia Reyes", employeeId: "EMP1035", avatar: "https://i.pravatar.cc/100?img=26", dept: "Finance", type: "Regularization", date: "03 Oct 2024", currentIn: "09:30", currentOut: "13:30", requestedIn: "09:30", requestedOut: "18:30", reason: "Half Day \u2192 Full Day", requestedBy: "Sofia Reyes", submitted: "03 Oct", status: "Rejected", rejectReason: "Manager did not approve" },
  { id: "REQ-1010", employee: "James Wilson", employeeId: "EMP1028", avatar: "https://i.pravatar.cc/100?img=12", dept: "Finance", type: "Early Clock-Out", date: "02 Oct 2024", currentIn: "09:02", currentOut: "18:04", requestedIn: "09:02", requestedOut: "16:00", reason: "Client meeting", requestedBy: "James Wilson", submitted: "02 Oct", status: "Pending" }
];
export const flexibilityDefaults = {
  gracePeriod: "10 minutes",
  lateAfter: "09:10",
  halfDayAfter: "11:00",
  halfDayThreshold: "4 hours",
  minimumWorkingHours: "8 hours",
  overtimeStartsAfter: "8 hours",
  flexibleWorkingHours: "09:00 - 18:00 (Flexible)",
  earlyClockOutRequiresApproval: true,
  overtimeRequiresApproval: true
};
export const auditMock = [
  { id: "A1", action: "Attendance Updated", who: "Priya Patel", target: "EMP1024", from: "09:15", to: "09:02", changedBy: "Ayesha Khan", reason: "Missed punch correction", at: "09 Sep 2026, 10:32 AM" },
  { id: "A2", action: "Request Submitted", who: "Marcus Chen", target: "REQ-1002", changedBy: "Marcus Chen", reason: "Personal appointment", at: "11 Oct 2024, 09:15 AM" },
  { id: "A3", action: "Request Approved", who: "Liam Cooper", target: "REQ-1003", changedBy: "Ayesha Khan", reason: "Verified with manager", at: "10 Oct 2024, 09:20 AM" },
  { id: "A4", action: "Settings Changed", who: "\u2014", target: "Flexibility", changedBy: "Ayesha Khan", reason: "Grace 5 \u2192 10 minutes", at: "08 Oct 2024, 11:00 AM" }
];
