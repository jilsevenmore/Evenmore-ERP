// Centralized Performance mock data — realistic, diversified for pagination/search/filter/sort demos
export const indicatorsMock = [
  { id:'IND-001', name:'Code Quality & Review Discipline', branch:'New York', department:'Engineering', designation:'Senior Engineer', description:'Consistent peer reviews, clean commits, low defect leakage.', weight:15, rating:4.6, status:'Active', addedBy:'Ayesha Khan', createdAt:'12 Sep 2024', updatedAt:'02 Oct 2024' },
  { id:'IND-002', name:'System Design Ownership', branch:'London', department:'Engineering', designation:'Tech Lead', description:'Owns architecture decisions and mentors juniors on design tradeoffs.', weight:12, rating:4.3, status:'Active', addedBy:'David Park', createdAt:'10 Sep 2024', updatedAt:'01 Oct 2024' },
  { id:'IND-003', name:'Customer Empathy in Delivery', branch:'Dubai', department:'Design', designation:'Product Designer', description:'Translates user research into shipped experiences with measured outcomes.', weight:10, rating:4.1, status:'Active', addedBy:'Sophia Lindqvist', createdAt:'08 Sep 2024', updatedAt:'30 Sep 2024' },
  { id:'IND-004', name:'Pipeline Reliability', branch:'New York', department:'Engineering', designation:'DevOps Engineer', description:'Uptime, deployment frequency and mean recovery time.', weight:14, rating:3.9, status:'Active', addedBy:'Ayesha Khan', createdAt:'05 Sep 2024', updatedAt:'28 Sep 2024' },
  { id:'IND-005', name:'Brand Consistency', branch:'London', department:'Marketing', designation:'Brand Strategist', description:'Maintains voice and visual coherence across campaigns.', weight:8, rating:4.4, status:'Active', addedBy:'Elena Rostova', createdAt:'03 Sep 2024', updatedAt:'27 Sep 2024' },
  { id:'IND-006', name:'Financial Forecast Accuracy', branch:'New York', department:'Finance', designation:'Analyst', description:'Variance within ±3% on quarterly forecasts.', weight:9, rating:3.7, status:'Draft', addedBy:'James Wilson', createdAt:'01 Sep 2024', updatedAt:'25 Sep 2024' },
  { id:'IND-007', name:'Talent Coaching', branch:'London', department:'HR', designation:'HR Manager', description:'Coaching plans, 1:1 cadence and retention impact.', weight:11, rating:4.2, status:'Active', addedBy:'Ayesha Khan', createdAt:'29 Aug 2024', updatedAt:'22 Sep 2024' },
  { id:'IND-008', name:'QA Automation Coverage', branch:'Dubai', department:'Engineering', designation:'QA Engineer', description:'Automated coverage and flake rate.', weight:10, rating:4.0, status:'Inactive', addedBy:'Marcus Chen', createdAt:'27 Aug 2024', updatedAt:'20 Sep 2024' },
  { id:'IND-009', name:'Content Throughput', branch:'New York', department:'Marketing', designation:'Content Lead', description:'On-time publish rate and editorial quality.', weight:7, rating:3.8, status:'Active', addedBy:'Ana Silva', createdAt:'25 Aug 2024', updatedAt:'18 Sep 2024' },
  { id:'IND-010', name:'Incident Response', branch:'New York', department:'Operations', designation:'Ops Manager', description:'MTTA and post-mortem quality.', weight:13, rating:4.5, status:'Active', addedBy:'Chen Li', createdAt:'22 Aug 2024', updatedAt:'15 Sep 2024' },
  { id:'IND-011', name:'API Latency Reduction', branch:'London', department:'Engineering', designation:'Senior Engineer', description:'P95 latency and SLO adherence.', weight:12, rating:4.2, status:'Active', addedBy:'David Park', createdAt:'20 Aug 2024', updatedAt:'12 Sep 2024' },
  { id:'IND-012', name:'Design System Adoption', branch:'Dubai', department:'Design', designation:'Lead Designer', description:'Component reuse and token compliance.', weight:9, rating:4.0, status:'Active', addedBy:'Marcus Chen', createdAt:'18 Aug 2024', updatedAt:'10 Sep 2024' },
  { id:'IND-013', name:'Revenue Operations', branch:'New York', department:'Finance', designation:'Finance Manager', description:'Close cycle and audit readiness.', weight:10, rating:3.6, status:'Draft', addedBy:'James Wilson', createdAt:'15 Aug 2024', updatedAt:'08 Sep 2024' },
  { id:'IND-014', name:'Hiring Velocity', branch:'London', department:'HR', designation:'Recruiter', description:'Time-to-hire and offer acceptance.', weight:8, rating:4.1, status:'Active', addedBy:'Ayesha Khan', createdAt:'12 Aug 2024', updatedAt:'05 Sep 2024' },
  { id:'IND-015', name:'Mobile Performance', branch:'Dubai', department:'Engineering', designation:'Mobile Engineer', description:'App launch time and crash-free rate.', weight:11, rating:3.9, status:'Active', addedBy:'David Park', createdAt:'10 Aug 2024', updatedAt:'03 Sep 2024' },
];

export const kpisMock = [
  { id:'KPI-101', name:'Sprint Velocity Stability', department:'Engineering', designation:'Senior Engineer', target:'≥ 42 pts', weight:15, status:'Active', createdAt:'10 Sep 2024' },
  { id:'KPI-102', name:'Net Promoter Score', department:'Design', designation:'Product Designer', target:'≥ 52', weight:10, status:'Active', createdAt:'08 Sep 2024' },
  { id:'KPI-103', name:'Lead Conversion Rate', department:'Marketing', designation:'Brand Strategist', target:'≥ 4.2%', weight:12, status:'Active', createdAt:'05 Sep 2024' },
  { id:'KPI-104', name:'Budget Variance', department:'Finance', designation:'Analyst', target:'±3%', weight:9, status:'Draft', createdAt:'03 Sep 2024' },
  { id:'KPI-105', name:'Offer Acceptance', department:'HR', designation:'Recruiter', target:'≥ 88%', weight:8, status:'Active', createdAt:'01 Sep 2024' },
  { id:'KPI-106', name:'Deployment Frequency', department:'Engineering', designation:'DevOps Engineer', target:'3×/week', weight:11, status:'Active', createdAt:'28 Aug 2024' },
  { id:'KPI-107', name:'Support CSAT', department:'Operations', designation:'Ops Manager', target:'≥ 4.6', weight:10, status:'Inactive', createdAt:'25 Aug 2024' },
  { id:'KPI-108', name:'Content Publish SLA', department:'Marketing', designation:'Content Lead', target:'100% on-time', weight:7, status:'Active', createdAt:'22 Aug 2024' },
  { id:'KPI-109', name:'Forecast Accuracy', department:'Finance', designation:'Finance Manager', target:'±2.5%', weight:10, status:'Active', createdAt:'20 Aug 2024' },
  { id:'KPI-110', name:'Automation Coverage', department:'Engineering', designation:'QA Engineer', target:'≥ 78%', weight:9, status:'Active', createdAt:'18 Aug 2024' },
  { id:'KPI-111', name:'Retention Rate', department:'HR', designation:'HR Manager', target:'≥ 92%', weight:11, status:'Active', createdAt:'15 Aug 2024' },
  { id:'KPI-112', name:'App Crash-Free', department:'Engineering', designation:'Mobile Engineer', target:'≥ 99.8%', weight:10, status:'Active', createdAt:'12 Aug 2024' },
];

export const appraisalsMock = [
  { id:'APR-001', employee:'Priya Patel', avatar:'https://i.pravatar.cc/100?img=15', cycle:'Q3 2024', reviewer:'David Park', rating:4.6, status:'Completed', due:'10 Oct 2024', department:'Engineering' },
  { id:'APR-002', employee:'Marcus Chen', avatar:'https://i.pravatar.cc/100?img=16', cycle:'Q3 2024', reviewer:'Sophia Lindqvist', rating:4.2, status:'In Review', due:'12 Oct 2024', department:'Design' },
  { id:'APR-003', employee:'Liam Cooper', avatar:'https://i.pravatar.cc/100?img=20', cycle:'Q3 2024', reviewer:'David Park', rating:3.8, status:'Pending', due:'14 Oct 2024', department:'Engineering' },
  { id:'APR-004', employee:'Sarah Wilson', avatar:'https://i.pravatar.cc/100?img=8', cycle:'Q3 2024', reviewer:'Elena Rostova', rating:4.0, status:'In Review', due:'11 Oct 2024', department:'Marketing' },
  { id:'APR-005', employee:'Chen Li', avatar:'https://i.pravatar.cc/100?img=34', cycle:'Q3 2024', reviewer:'David Park', rating:3.9, status:'Draft', due:'15 Oct 2024', department:'Operations' },
  { id:'APR-006', employee:'Rahul Verma', avatar:'https://i.pravatar.cc/100?img=33', cycle:'Q3 2024', reviewer:'Marcus Chen', rating:4.1, status:'Pending', due:'13 Oct 2024', department:'Design' },
  { id:'APR-007', employee:'Ana Silva', avatar:'https://i.pravatar.cc/100?img=32', cycle:'Q2 2024', reviewer:'Sarah Wilson', rating:4.3, status:'Completed', due:'10 Jul 2024', department:'Marketing' },
  { id:'APR-008', employee:'Tariq Al-Mansoor', avatar:'https://i.pravatar.cc/100?img=17', cycle:'Q3 2024', reviewer:'Ayesha Khan', rating:4.0, status:'In Review', due:'12 Oct 2024', department:'HR' },
  { id:'APR-009', employee:'Sofia Reyes', avatar:'https://i.pravatar.cc/100?img=26', cycle:'Q3 2024', reviewer:'James Wilson', rating:3.6, status:'Draft', due:'16 Oct 2024', department:'Finance' },
  { id:'APR-010', employee:'James Wilson', avatar:'https://i.pravatar.cc/100?img=12', cycle:'Q3 2024', reviewer:'Sarah Mitchell', rating:4.4, status:'Completed', due:'09 Oct 2024', department:'Finance' },
  { id:'APR-011', employee:'David Park', avatar:'https://i.pravatar.cc/100?img=11', cycle:'Q3 2024', reviewer:'Sarah Mitchell', rating:4.7, status:'Completed', due:'08 Oct 2024', department:'Engineering' },
  { id:'APR-012', employee:'Elena Rostova', avatar:'https://i.pravatar.cc/100?img=21', cycle:'Q3 2024', reviewer:'Sarah Mitchell', rating:4.2, status:'Pending', due:'13 Oct 2024', department:'Marketing' },
];

export const goalsMock = [
  { id:'GOAL-01', employee:'Priya Patel', avatar:'https://i.pravatar.cc/100?img=15', department:'Engineering', goal:'Reduce API latency by 30%', target:'30%', current:'22%', progress:72, due:'31 Dec 2024', status:'In Progress' },
  { id:'GOAL-02', employee:'Marcus Chen', avatar:'https://i.pravatar.cc/100?img=16', department:'Design', goal:'Launch Design System v2', target:'1 release', current:'1 release', progress:100, due:'15 Oct 2024', status:'Completed' },
  { id:'GOAL-03', employee:'Liam Cooper', avatar:'https://i.pravatar.cc/100?img=20', department:'Engineering', goal:'Migrate CI to Buildkite', target:'100% jobs', current:'45%', progress:45, due:'30 Nov 2024', status:'At Risk' },
  { id:'GOAL-04', employee:'Sarah Wilson', avatar:'https://i.pravatar.cc/100?img=8', department:'Marketing', goal:'Increase organic traffic 25%', target:'25%', current:'12%', progress:48, due:'31 Dec 2024', status:'In Progress' },
  { id:'GOAL-05', employee:'Chen Li', avatar:'https://i.pravatar.cc/100?img=34', department:'Operations', goal:'Cut MTTR to < 30m', target:'30m', current:'42m', progress:60, due:'31 Oct 2024', status:'At Risk' },
  { id:'GOAL-06', employee:'Ana Silva', avatar:'https://i.pravatar.cc/100?img=32', department:'Marketing', goal:'Publish 12 thought-leadership posts', target:'12', current:'12', progress:100, due:'30 Sep 2024', status:'Completed' },
  { id:'GOAL-07', employee:'Rahul Verma', avatar:'https://i.pravatar.cc/100?img=33', department:'Design', goal:'Prototype Checkout Revamp', target:'1 prototype', current:'0.6', progress:60, due:'20 Oct 2024', status:'In Progress' },
  { id:'GOAL-08', employee:'Tariq Al-Mansoor', avatar:'https://i.pravatar.cc/100?img=17', department:'HR', goal:'Close 8 engineering hires', target:'8', current:'5', progress:62, due:'31 Dec 2024', status:'In Progress' },
  { id:'GOAL-09', employee:'Sofia Reyes', avatar:'https://i.pravatar.cc/100?img=26', department:'Finance', goal:'Automate close checklist', target:'1 flow', current:'0', progress:0, due:'31 Jan 2025', status:'Not Started' },
  { id:'GOAL-10', employee:'James Wilson', avatar:'https://i.pravatar.cc/100?img=12', department:'Finance', goal:'Reduce close to 4 days', target:'4 days', current:'5.2 days', progress:55, due:'31 Dec 2024', status:'At Risk' },
  { id:'GOAL-11', employee:'David Park', avatar:'https://i.pravatar.cc/100?img=11', department:'Engineering', goal:'Hire 3 senior engineers', target:'3', current:'2', progress:66, due:'30 Nov 2024', status:'In Progress' },
  { id:'GOAL-12', employee:'Ayesha Khan', avatar:'https://i.pravatar.cc/100?img=5', department:'HR', goal:'Launch career ladder v2', target:'1', current:'1', progress:100, due:'30 Sep 2024', status:'Completed' },
];

export const trainingsMock = [
  { id:'TRN-001', name:'Leadership Essentials', trainer:'Sarah Mitchell', avatar:'https://i.pravatar.cc/100?img=8', department:'HR', type:'Leadership', participants:24, start:'18 Oct 2024', end:'19 Oct 2024', status:'Planned' },
  { id:'TRN-002', name:'Secure Coding 101', trainer:'David Park', avatar:'https://i.pravatar.cc/100?img=11', department:'Engineering', type:'Technical', participants:42, start:'08 Oct 2024', end:'08 Oct 2024', status:'Completed' },
  { id:'TRN-003', name:'Advanced Figma', trainer:'Marcus Chen', avatar:'https://i.pravatar.cc/100?img=16', department:'Design', type:'Design', participants:18, start:'12 Oct 2024', end:'12 Oct 2024', status:'Registered' },
  { id:'TRN-004', name:'Brand Sprint', trainer:'Elena Rostova', avatar:'https://i.pravatar.cc/100?img=21', department:'Marketing', type:'Workshop', participants:16, start:'14 Oct 2024', end:'15 Oct 2024', status:'In Progress' },
  { id:'TRN-005', name:'Financial Modeling', trainer:'James Wilson', avatar:'https://i.pravatar.cc/100?img=12', department:'Finance', type:'Technical', participants:12, start:'20 Oct 2024', end:'21 Oct 2024', status:'Planned' },
  { id:'TRN-006', name:'Incident Command', trainer:'Chen Li', avatar:'https://i.pravatar.cc/100?img=34', department:'Operations', type:'Operations', participants:20, start:'05 Oct 2024', end:'05 Oct 2024', status:'Completed' },
  { id:'TRN-007', name:'UX Research Deep Dive', trainer:'Rahul Verma', avatar:'https://i.pravatar.cc/100?img=33', department:'Design', type:'Design', participants:14, start:'10 Oct 2024', end:'11 Oct 2024', status:'In Progress' },
  { id:'TRN-008', name:'Recruiting Analytics', trainer:'Ayesha Khan', avatar:'https://i.pravatar.cc/100?img=5', department:'HR', type:'Leadership', participants:10, start:'22 Oct 2024', end:'22 Oct 2024', status:'Planned' },
  { id:'TRN-009', name:'Data Pipelines', trainer:'Priya Patel', avatar:'https://i.pravatar.cc/100?img=15', department:'Engineering', type:'Technical', participants:22, start:'02 Oct 2024', end:'03 Oct 2024', status:'Completed' },
  { id:'TRN-010', name:'OKR Writing', trainer:'David Park', avatar:'https://i.pravatar.cc/100?img=11', department:'HR', type:'Leadership', participants:30, start:'25 Sep 2024', end:'25 Sep 2024', status:'Completed' },
];

export const trainersMock = [
  { id:'TRNR-01', name:'Sarah Mitchell', avatar:'https://i.pravatar.cc/100?img=8', specialization:'Leadership', email:'sarah.m@company.com', phone:'+1 212-555-0141', programs:4, status:'Active' },
  { id:'TRNR-02', name:'David Park', avatar:'https://i.pravatar.cc/100?img=11', specialization:'Engineering', email:'david.p@company.com', phone:'+44 20-7946-0958', programs:5, status:'Active' },
  { id:'TRNR-03', name:'Marcus Chen', avatar:'https://i.pravatar.cc/100?img=16', specialization:'Design', email:'marcus.c@company.com', phone:'+44 20-7946-0123', programs:3, status:'Active' },
  { id:'TRNR-04', name:'Elena Rostova', avatar:'https://i.pravatar.cc/100?img=21', specialization:'Marketing', email:'elena.r@company.com', phone:'+1 212-555-0188', programs:2, status:'On Leave' },
  { id:'TRNR-05', name:'James Wilson', avatar:'https://i.pravatar.cc/100?img=12', specialization:'Finance', email:'james.w@company.com', phone:'+1 212-555-0199', programs:2, status:'Active' },
  { id:'TRNR-06', name:'Chen Li', avatar:'https://i.pravatar.cc/100?img=34', specialization:'Operations', email:'chen.l@company.com', phone:'+971 4-555-0144', programs:3, status:'Active' },
  { id:'TRNR-07', name:'Priya Patel', avatar:'https://i.pravatar.cc/100?img=15', specialization:'Engineering', email:'priya.p@company.com', phone:'+1 212-555-0160', programs:1, status:'Active' },
  { id:'TRNR-08', name:'Ayesha Khan', avatar:'https://i.pravatar.cc/100?img=5', specialization:'Leadership', email:'ayesha.k@company.com', phone:'+1 212-555-0145', programs:2, status:'Active' },
];

export const dashboardMetrics = [
  { label:'Active Cycle', value:'Q3 2024', sub:'Jul – Sep' },
  { label:'Reviews Pending', value:'42', sub:'Awaiting action' },
  { label:'Completed', value:'186', sub:'This cycle' },
  { label:'Avg Rating', value:'4.2 / 5', sub:'Across all' },
  { label:'Goals Completed', value:'78%', sub:'+6% vs last quarter' },
];
