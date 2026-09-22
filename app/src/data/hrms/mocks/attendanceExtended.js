// Shared HRMS attendance directory + shift helpers.
// Restored to satisfy imports from Topbar, Today, Overview, IndividualAttendance.
// Previously missing file caused: Failed to resolve import
// "../../data/hrms/mocks/attendanceExtended" from Topbar.jsx.

export const attendanceEmployees = [
  { id: 'EMP1024', name: 'Priya Patel', designation: 'Senior Engineer', dept: 'Engineering', department: 'Engineering', manager: 'David Park', status: 'Active', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', shift: 'General', location: 'On-Site' },
  { id: 'EMP1025', name: 'Marcus Chen', designation: 'Lead Designer', dept: 'Design', department: 'Design', manager: 'David Park', status: 'Active', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', shift: 'General', location: 'On-Site' },
  { id: 'EMP1026', name: 'Liam Cooper', designation: 'DevOps Engineer', dept: 'Engineering', department: 'Engineering', manager: 'David Park', status: 'Active', avatar: 'https://randomuser.me/api/portraits/men/75.jpg', shift: 'General', location: 'On-Site' },
  { id: 'EMP1027', name: 'Sarah Wilson', designation: 'Brand Strategist', dept: 'Marketing', department: 'Marketing', manager: 'David Park', status: 'Active', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', shift: 'Flexible', location: 'Remote' },
  { id: 'EMP1028', name: 'James Wilson', designation: 'Finance Executive', dept: 'Finance', department: 'Finance', manager: 'David Park', status: 'Active', avatar: 'https://randomuser.me/api/portraits/men/54.jpg', shift: 'General', location: 'On-Site' },
  { id: 'EMP1029', name: 'Ayesha Khan', designation: 'HR Executive', dept: 'HR', department: 'HR', manager: 'Tariq Al-Mansoor', status: 'Active', avatar: 'https://randomuser.me/api/portraits/women/24.jpg', shift: 'General', location: 'On-Site' },
  { id: 'EMP1030', name: 'David Park', designation: 'Engineering Manager', dept: 'Engineering', department: 'Engineering', manager: 'HR Manager', status: 'Active', avatar: 'https://randomuser.me/api/portraits/men/46.jpg', shift: 'General', location: 'On-Site' },
  { id: 'EMP1031', name: 'Chen Li', designation: 'Operations Executive', dept: 'Operations', department: 'Operations', manager: 'David Park', status: 'Active', avatar: 'https://randomuser.me/api/portraits/women/33.jpg', shift: 'Night', location: 'On-Site' },
  { id: 'EMP1032', name: 'Rahul Verma', designation: 'Designer', dept: 'Design', department: 'Design', manager: 'David Park', status: 'Active', avatar: 'https://randomuser.me/api/portraits/men/62.jpg', shift: 'Flexible', location: 'On-Site' },
  { id: 'EMP1033', name: 'Ana Silva', designation: 'Marketing Executive', dept: 'Marketing', department: 'Marketing', manager: 'David Park', status: 'Active', avatar: 'https://randomuser.me/api/portraits/women/32.jpg', shift: 'Flexible', location: 'Remote' },
  { id: 'EMP1034', name: 'Tariq Al-Mansoor', designation: 'HR Manager', dept: 'HR', department: 'HR', manager: 'HR Manager', status: 'Active', avatar: 'https://randomuser.me/api/portraits/men/17.jpg', shift: 'General', location: 'On-Site' },
  { id: 'EMP1035', name: 'Sofia Reyes', designation: 'Finance Analyst', dept: 'Finance', department: 'Finance', manager: 'David Park', status: 'Active', avatar: 'https://randomuser.me/api/portraits/women/26.jpg', shift: 'General', location: 'Remote' },
];

const SHIFT_TIMINGS = {
  General: { name: 'General', start: '09:00', end: '18:00' },
  Flexible: { name: 'Flexible', start: '10:00', end: '19:00' },
  Night: { name: 'Night', start: '22:00', end: '06:00' },
};

export function getShiftTiming(shift) {
  if (!shift) return SHIFT_TIMINGS.General;
  return SHIFT_TIMINGS[shift] || SHIFT_TIMINGS.General;
}

export function minutesOfTime(hhmm) {
  if (hhmm === null || hhmm === undefined) return 0;
  const parts = String(hhmm).split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h)) return 0;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

export default attendanceEmployees;
