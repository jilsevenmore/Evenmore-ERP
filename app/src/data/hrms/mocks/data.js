export const employeesMock = [
  { id: "EMP1024", name: "Priya Patel", email: "priya.p@company.com", avatar: "https://i.pravatar.cc/100?img=15", designation: "Senior Engineer", department: "Engineering", manager: "David Park", location: "New York", joining: "Mar 12, 2022", status: "Active" },
  { id: "EMP1025", name: "Marcus Chen", email: "marcus.c@company.com", avatar: "https://i.pravatar.cc/100?img=16", designation: "Lead Designer", department: "Design", manager: "Sophia Lindqvist", location: "London", joining: "Jan 05, 2021", status: "Active" },
  { id: "EMP1026", name: "Liam Cooper", email: "liam.c@company.com", avatar: "https://i.pravatar.cc/100?img=20", designation: "DevOps Engineer", department: "Engineering", manager: "David Park", location: "New York", joining: "Jun 18, 2023", status: "On Leave" },
  { id: "EMP1027", name: "Elena Rostova", email: "elena.r@company.com", avatar: "https://i.pravatar.cc/100?img=21", designation: "Brand Strategist", department: "Marketing", manager: "\u2014", location: "Dubai", joining: "Sep 02, 2020", status: "Active" },
  { id: "EMP1028", name: "James Wilson", email: "james.w@company.com", avatar: "https://i.pravatar.cc/100?img=12", designation: "Finance Manager", department: "Finance", manager: "Sarah Mitchell", location: "New York", joining: "Apr 22, 2019", status: "Probation" },
  { id: "EMP1029", name: "Ayesha Khan", email: "ayesha.k@company.com", avatar: "https://i.pravatar.cc/100?img=5", designation: "HR Director", department: "HR", manager: "Sarah Mitchell", location: "New York", joining: "Feb 10, 2018", status: "Active" },
  { id: "EMP1030", name: "David Park", email: "david.p@company.com", avatar: "https://i.pravatar.cc/100?img=11", designation: "CTO", department: "Engineering", manager: "Sarah Mitchell", location: "London", joining: "Nov 01, 2017", status: "Active" },
  { id: "EMP1031", name: "Sarah Mitchell", email: "sarah.m@company.com", avatar: "https://i.pravatar.cc/100?img=8", designation: "Chief Executive Officer", department: "Executive", manager: "\u2014", location: "New York", joining: "Jan 01, 2015", status: "Active" }
];
export const leaveRequestsMock = [
  { id: "LV-2041", employee: "Liam Cooper", avatar: "https://i.pravatar.cc/100?img=20", type: "Annual Leave", from: "Oct 20, 2024", to: "Oct 24, 2024", days: 4, reason: "Family event", delegate: "Priya Patel", delegateAvatar: "https://i.pravatar.cc/100?img=15", status: "Pending Review" },
  { id: "LV-2042", employee: "Sophia Lindqvist", avatar: "https://i.pravatar.cc/100?img=21", type: "Sick Leave", from: "Oct 12, 2024", to: "Oct 13, 2024", days: 2, reason: "Medical", delegate: "Marcus Chen", delegateAvatar: "https://i.pravatar.cc/100?img=16", status: "Delegate Confirmed" }
];
export const attendanceMock = [
  { employee: "Priya Patel", avatar: "https://i.pravatar.cc/100?img=15", checkIn: "09:02", checkOut: "18:04", hours: "08:32", status: "Present" },
  { employee: "Marcus Chen", avatar: "https://i.pravatar.cc/100?img=16", checkIn: "09:18", checkOut: "18:30", hours: "08:42", status: "Late" },
  { employee: "Liam Cooper", avatar: "https://i.pravatar.cc/100?img=20", checkIn: "\u2014", checkOut: "\u2014", hours: "\u2014", status: "Absent" },
  { employee: "Sarah Wilson", avatar: "https://i.pravatar.cc/100?img=8", checkIn: "09:00", checkOut: "17:55", hours: "08:25", status: "WFH" }
];
export const departmentsMock = [
  { name: "Engineering", head: "David Park", avatar: "https://i.pravatar.cc/100?img=11", teams: 8, employees: 142, status: "Active", icon: "code" },
  { name: "Marketing", head: "Elena Rostova", avatar: "https://i.pravatar.cc/100?img=9", teams: 4, employees: 56, status: "Active", icon: "campaign" },
  { name: "Human Resources", head: "Ayesha Khan", avatar: "https://i.pravatar.cc/100?img=5", teams: 3, employees: 24, status: "Active", icon: "group" },
  { name: "Finance", head: "James Wilson", avatar: "https://i.pravatar.cc/100?img=12", teams: 5, employees: 38, status: "Restructuring", icon: "payments" }
];
export const candidatesMock = [
  { id: "C1", name: "Ana Silva", avatar: "https://i.pravatar.cc/100?img=32", role: "Backend", exp: "5y", stage: "Applied" },
  { id: "C2", name: "Rahul Verma", avatar: "https://i.pravatar.cc/100?img=33", role: "Frontend", exp: "4y", stage: "Screening" },
  { id: "C3", name: "Chen Li", avatar: "https://i.pravatar.cc/100?img=34", role: "Data", exp: "6y", stage: "Interview" }
];
export const scheduleMock = [
  { time: "09:30 AM", person: "Marcus Chen", avatar: "https://i.pravatar.cc/100?img=16", dept: "Core Infrastructure", type: "Technical Interview", status: "Confirmed" },
  { time: "11:00 AM", person: "Elena Rostova", avatar: "https://i.pravatar.cc/100?img=21", dept: "Global Marketing", type: "First Day Onboarding", status: "In Progress" },
  { time: "02:15 PM", person: "Tariq Al-Mansoor", avatar: "https://i.pravatar.cc/100?img=17", dept: "People Ops", type: "Quarterly Performance", status: "Scheduled" },
  { time: "04:00 PM", person: "Sophia Lindqvist", avatar: "https://i.pravatar.cc/100?img=16", dept: "Design System", type: "Role Realignment", status: "Confirmed" }
];
