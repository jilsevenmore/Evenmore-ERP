import { create } from "zustand";

const POLICIES_STORAGE_KEY = "hrms_company_policies_v1";
const CATEGORIES_STORAGE_KEY = "hrms_policy_categories_v1";
const ACKS_STORAGE_KEY = "hrms_policy_acknowledgements_v1";

export const INITIAL_CATEGORIES = [
  { id: "CAT-01", name: "Code of Conduct", description: "Ethical standards, workplace behavior, anti-harassment, and whistleblower guidelines.", color: "blue", icon: "Shield" },
  { id: "CAT-02", name: "IT & Security", description: "Data security, encryption, device usage, password governance, and clean desk rules.", color: "purple", icon: "Lock" },
  { id: "CAT-03", name: "Employee Benefits", description: "Health insurance, retirement plans, parental leave benefits, and education allowances.", color: "green", icon: "Heart" },
  { id: "CAT-04", name: "Workplace Safety", description: "Health, fire drills, emergency evacuation, ergonomic rules, and incident reporting.", color: "orange", icon: "AlertTriangle" },
  { id: "CAT-05", name: "Remote Work", description: "Hybrid hours, home office security, hardware stipends, and communication etiquette.", color: "cyan", icon: "Laptop" },
  { id: "CAT-06", name: "Compliance", description: "Regulatory filings, anti-corruption, financial integrity, and audit commitments.", color: "red", icon: "Scale" },
  { id: "CAT-07", name: "Employee Relations", description: "Grievance redressal, conflict resolution, performance counseling, and separations.", color: "amber", icon: "Users" },
];

export const INITIAL_POLICIES = [
  {
    id: "POL-001",
    name: "Code of Business Conduct & Ethics",
    category: "Code of Conduct",
    ownerDept: "Human Resources",
    applicableTo: "All Employees",
    version: "v3.0",
    effectiveDate: "2024-01-15",
    reviewDate: "2025-01-15",
    approvalRequired: true,
    ackRequired: true,
    status: "Active", // Draft | Pending Approval | Approved | Active | Review / Update | Archived
    summary: "Professional behavior standards, anti-harassment regulations, gift acceptance thresholds, conflict of interest disclosures, and whistleblower protections.",
    content: `## 1. Objective & Purpose
The objective of this Code of Business Conduct is to establish a culture of honesty, ethical integrity, and mutual respect throughout all operations of the company.

## 2. Scope & Applicability
This policy applies to all global full-time employees, contractors, interns, board members, and third-party vendors acting on behalf of the company.

## 3. Core Principles
- **Zero Tolerance for Harassment:** Discrimination or harassment based on race, gender, religion, age, or disability is strictly prohibited.
- **Anti-Bribery & Corruption:** Employees must never accept, solicit, or offer unauthorized financial advantages or gifts valued in excess of ₹2,500 ($30).
- **Conflict of Interest:** Any personal involvement or external investment that interferes with objective corporate decision-making must be reported to HR immediately.

## 4. Whistleblower Protection
Reports of suspected violations made in good faith will be investigated confidentially with absolute protection against retaliation or adverse career actions.`,
    versionHistory: [
      { version: "v3.0", effectiveDate: "2024-01-15", updatedBy: "Sarah Mitchell (CEO)", summary: "Annual compliance update and international gifts policy revision.", status: "Active" },
      { version: "v2.0", effectiveDate: "2023-01-10", updatedBy: "Ayesha Khan (HR)", summary: "Inclusion of DEI standards and modern whistleblower portal.", status: "Archived" },
      { version: "v1.0", effectiveDate: "2022-01-05", updatedBy: "Legal Ops", summary: "Initial enterprise policy release.", status: "Archived" },
    ],
    activityLog: [
      { date: "2024-01-15 09:30", actor: "Sarah Mitchell", action: "Approved and published version v3.0" },
      { date: "2024-01-12 14:15", actor: "Ayesha Khan", action: "Submitted v3.0 for executive approval" },
      { date: "2024-01-10 11:00", actor: "Legal Counsel", action: "Drafted v3.0 revisions" },
    ],
    updatedAt: "2024-01-15",
  },
  {
    id: "POL-002",
    name: "Information Security & ISO 27001 Access Governance",
    category: "IT & Security",
    ownerDept: "Information Technology",
    applicableTo: "All Employees",
    version: "v4.2",
    effectiveDate: "2024-07-20",
    reviewDate: "2024-10-15", // Due for review soon!
    approvalRequired: true,
    ackRequired: true,
    status: "Active",
    summary: "Mandatory password lifecycles, dual-factor authentication, customer PII encryption requirements, clean desk regulations, and incident response protocols.",
    content: `## 1. Purpose
Ensures company information assets, cloud environments, and customer PII are guarded against unauthorized access, loss, or security breaches.

## 2. Authentication & Credential Standards
- All systems require multi-factor authentication (MFA) via enterprise authenticator apps.
- Passwords must be at least 14 characters with alphanumeric and special characters, rotated every 90 days.
- Hardcoded secrets and plain-text API keys in repositories are strictly forbidden.

## 3. Remote Access & Clean Desk
- Only company-enrolled MDM devices may access internal VPCs and production databases.
- Screen locking is mandatory upon leaving any workstation for more than 2 minutes.

## 4. Security Incident Reporting
Any suspected phishing attack, lost device, or anomalous access must be declared to security@evenmore.io within 60 minutes.`,
    versionHistory: [
      { version: "v4.2", effectiveDate: "2024-07-20", updatedBy: "David Park (CTO)", summary: "Zero-trust network architecture compliance and MFA mandate.", status: "Active" },
      { version: "v4.1", effectiveDate: "2023-11-15", updatedBy: "Infosec Team", summary: "Updated customer PII encryption benchmarks.", status: "Archived" },
    ],
    activityLog: [
      { date: "2024-07-20 16:00", actor: "David Park", action: "Published v4.2" },
      { date: "2024-07-18 10:20", actor: "Infosec Lead", action: "Submitted v4.2 for CTO sign-off" },
    ],
    updatedAt: "2024-07-20",
  },
  {
    id: "POL-003",
    name: "Remote & Hybrid Work Protocol",
    category: "Remote Work",
    ownerDept: "Operations",
    applicableTo: "All Employees",
    version: "v2.1",
    effectiveDate: "2024-09-01",
    reviewDate: "2025-09-01",
    approvalRequired: true,
    ackRequired: true,
    status: "Active",
    summary: "Guidelines for core working hours, home office security protocols, communication SLAs, hardware provisioning, and internet allowances.",
    content: `## 1. Overview
The Remote & Hybrid Work Protocol empowers our workforce to collaborate effectively across distributed regions while ensuring operational excellence.

## 2. Core Working Hours & Availability
- Core sync hours are 10:00 AM to 04:00 PM in the employee's designated primary regional time zone.
- Employees must update their calendar status and Slack status when away from keyboard or in focus sessions.

## 3. Hardware & Ergonomics
- The company provides a company laptop, external monitor, and a ₹15,000 ($200) home ergonomic setup stipend.
- Monthly broadband reimbursements are processed automatically with the payroll run.`,
    versionHistory: [
      { version: "v2.1", effectiveDate: "2024-09-01", updatedBy: "Ayesha Khan", summary: "Expanded broadband stipend to global contractors.", status: "Active" },
      { version: "v2.0", effectiveDate: "2023-08-01", updatedBy: "Operations", summary: "Introduced 3-day in-office hybrid baseline for HQ teams.", status: "Archived" },
    ],
    activityLog: [
      { date: "2024-09-01 10:00", actor: "Ayesha Khan", action: "Published v2.1" },
    ],
    updatedAt: "2024-09-01",
  },
  {
    id: "POL-004",
    name: "Annual Leave & Comprehensive Benefits Policy",
    category: "Employee Benefits",
    ownerDept: "Human Resources",
    applicableTo: "Full-Time Staff",
    version: "v2.5",
    effectiveDate: "2024-10-01",
    reviewDate: "2025-10-01",
    approvalRequired: true,
    ackRequired: true,
    status: "Pending Approval",
    summary: "Revision for enhanced parental leave (26 weeks), expanded wellness reimbursements, and relaxed leave carry-forward thresholds up to 12 days.",
    content: `## 1. Purpose
Provides comprehensive paid time off, medical safety nets, and wellness stipends to foster employee well-being and retention.

## 2. Leave Entitlements
- **Annual / Earned Leave:** 24 days accrued per calendar year.
- **Casual / Sick Leave:** 12 days per calendar year.
- **Parental Leave:** 26 weeks paid maternity; 6 weeks paid paternity/partner leave.
- **Carry-Over Allowance:** Up to 12 unused annual leave days roll forward into the subsequent calendar year.

## 3. Wellness & Insurance Benefits
- Group medical insurance cover of ₹10,00,000 for employee, spouse, and up to two dependents.
- Annual health check-up voucher and mental wellness counseling access.`,
    versionHistory: [
      { version: "v2.5", effectiveDate: "2024-10-01", updatedBy: "Priya Patel (HR Lead)", summary: "Proposed parental leave extension and carry-over increase.", status: "Pending Approval" },
      { version: "v2.4", effectiveDate: "2023-10-01", updatedBy: "Ayesha Khan", summary: "Previous approved leave guidelines.", status: "Archived" },
    ],
    activityLog: [
      { date: "2024-09-12 11:30", actor: "Priya Patel", action: "Submitted v2.5 for Executive Board Approval" },
      { date: "2024-09-10 15:00", actor: "HR Compensation Committee", action: "Drafted revised benefit schedule" },
    ],
    updatedAt: "2024-09-12",
  },
  {
    id: "POL-005",
    name: "Travel & Corporate Expense Reimbursement",
    category: "Compliance",
    ownerDept: "Finance",
    applicableTo: "Management & Sales",
    version: "v1.8",
    effectiveDate: "2024-08-10",
    reviewDate: "2024-11-01", // Due for review soon!
    approvalRequired: true,
    ackRequired: true,
    status: "Active",
    summary: "Permissible per diem meal allowances, corporate credit card usage, flight class ceilings, and hotel expense claim approval hierarchies.",
    content: `## 1. Overview
Establishes prudent financial governance for business travel, client entertainment, and official expense claims.

## 2. Travel Bookings
- Domestic air travel must be booked in Economy Class at least 14 days in advance when possible.
- Hotel accommodation is capped at ₹7,500/night for tier-1 metro cities and ₹5,000/night for tier-2 cities.

## 3. Claims Submission
- All expense receipts must be uploaded into HRMS within 15 days of travel completion.
- Late submissions exceeding 30 days require CFO justification and may be forfeited.`,
    versionHistory: [
      { version: "v1.8", effectiveDate: "2024-08-10", updatedBy: "James Wilson (Finance)", summary: "Adjusted per diem for international flight layovers.", status: "Active" },
    ],
    activityLog: [
      { date: "2024-08-10 09:00", actor: "James Wilson", action: "Published v1.8" },
    ],
    updatedAt: "2024-08-10",
  },
  {
    id: "POL-006",
    name: "Workplace Health, Safety & Emergency Protocols",
    category: "Workplace Safety",
    ownerDept: "Facilities & Admin",
    applicableTo: "All Employees",
    version: "v1.4",
    effectiveDate: "2024-06-11",
    reviewDate: "2025-06-11",
    approvalRequired: true,
    ackRequired: true,
    status: "Active",
    summary: "Emergency evacuation floor plans, fire extinguisher placements, designated first-aid wardens, ergonomic evaluations, and hazardous material protocols.",
    content: `## 1. Policy Statement
The company is committed to maintaining a safe, healthy, and hazard-free workplace for all employees, visitors, and facility staff.

## 2. Safety Guidelines
- Emergency evacuation routes must remain unobstructed at all times.
- First aid kits are stationed on every floor adjacent to the central elevator lobby.
- In case of fire alarms, all staff must immediately evacuate via marked emergency stairwells. Elevators must not be used.`,
    versionHistory: [
      { version: "v1.4", effectiveDate: "2024-06-11", updatedBy: "Admin Operations", summary: "Annual safety audit compliance update.", status: "Active" },
    ],
    activityLog: [
      { date: "2024-06-11 14:00", actor: "Admin Operations", action: "Published v1.4" },
    ],
    updatedAt: "2024-06-11",
  },
  {
    id: "POL-007",
    name: "Employee Anti-Harassment & Grievance Redressal",
    category: "Employee Relations",
    ownerDept: "Human Resources",
    applicableTo: "All Employees",
    version: "v2.0",
    effectiveDate: "2024-03-01",
    reviewDate: "2025-03-01",
    approvalRequired: true,
    ackRequired: true,
    status: "Active",
    summary: "Formal complaint escalation steps, Internal Complaints Committee (ICC) jurisdiction, investigation timelines, and strict zero-retaliation enforcement.",
    content: `## 1. Zero Tolerance Mandate
We enforce strict zero tolerance for any form of harassment, intimidation, or inappropriate conduct in person or via digital workspaces.

## 2. Redressal Mechanism
- Any aggrieved employee may submit a confidential complaint directly to hr-relations@evenmore.io or via the anonymous portal.
- The Internal Complaints Committee must initiate an inquiry within 48 hours and conclude proceedings within 30 business days.`,
    versionHistory: [
      { version: "v2.0", effectiveDate: "2024-03-01", updatedBy: "Ayesha Khan", summary: "Incorporated POSH guidelines and anonymous grievance channels.", status: "Active" },
    ],
    activityLog: [
      { date: "2024-03-01 10:00", actor: "Ayesha Khan", action: "Published v2.0" },
    ],
    updatedAt: "2024-03-01",
  },
  {
    id: "POL-008",
    name: "Social Media & Public Communications Standard",
    category: "Code of Conduct",
    ownerDept: "Marketing & Legal",
    applicableTo: "All Employees",
    version: "v1.1",
    effectiveDate: "2023-05-15",
    reviewDate: "2024-05-15",
    approvalRequired: false,
    ackRequired: false,
    status: "Archived",
    summary: "Legacy 2023 communications guidelines. Replaced by unified Enterprise Brand & Public Disclosures 2024.",
    content: `## 1. Historical Note
This policy has been officially archived and superseded. Please consult the Code of Business Conduct and corporate PR team for active media guidelines.`,
    versionHistory: [
      { version: "v1.1", effectiveDate: "2023-05-15", updatedBy: "Brand Lead", summary: "Legacy document.", status: "Archived" },
    ],
    activityLog: [
      { date: "2024-01-15 10:00", actor: "Legal Ops", action: "Archived policy and marked superseded" },
    ],
    updatedAt: "2024-01-15",
  },
  {
    id: "POL-009",
    name: "Artificial Intelligence & LLM Usage in Engineering",
    category: "IT & Security",
    ownerDept: "Engineering",
    applicableTo: "Engineering & Product",
    version: "v1.0-draft",
    effectiveDate: "2024-11-01",
    reviewDate: "2025-11-01",
    approvalRequired: true,
    ackRequired: true,
    status: "Draft",
    summary: "Guidelines governing the permissible use of generative AI coding assistants, data leakage safeguards, and proprietary IP protections.",
    content: `## 1. Scope
Applies to software engineers, QA teams, and product managers utilizing generative AI tools in daily product development.

## 2. Permissible Tools
Only enterprise-licensed tools with verified zero-data-retention agreements may be used. Customer secrets, tokens, and PII must NEVER be fed into LLM prompts.`,
    versionHistory: [
      { version: "v1.0-draft", effectiveDate: "2024-11-01", updatedBy: "David Park", summary: "Initial engineering draft.", status: "Draft" },
    ],
    activityLog: [
      { date: "2024-09-14 16:20", actor: "David Park", action: "Created policy draft" },
    ],
    updatedAt: "2024-09-14",
  },
];

// Mock individual acknowledgements by staff
export const INITIAL_ACKNOWLEDGEMENTS = [
  { id: "ACK-101", policyId: "POL-001", policyName: "Code of Business Conduct & Ethics", version: "v3.0", employeeName: "Adarsh Gupta", employeeId: "EMP-USR", dept: "Operations", status: "Acknowledged", ackDate: "2024-01-16 11:45" },
  { id: "ACK-102", policyId: "POL-001", policyName: "Code of Business Conduct & Ethics", version: "v3.0", employeeName: "Priya Patel", employeeId: "EMP-1024", dept: "Engineering", status: "Acknowledged", ackDate: "2024-01-16 14:20" },
  { id: "ACK-103", policyId: "POL-001", policyName: "Code of Business Conduct & Ethics", version: "v3.0", employeeName: "David Park", employeeId: "EMP-1030", dept: "Engineering", status: "Acknowledged", ackDate: "2024-01-17 09:10" },
  { id: "ACK-104", policyId: "POL-001", policyName: "Code of Business Conduct & Ethics", version: "v3.0", employeeName: "Elena Rostova", employeeId: "EMP-1027", dept: "Marketing", status: "Pending", ackDate: null },
  { id: "ACK-105", policyId: "POL-001", policyName: "Code of Business Conduct & Ethics", version: "v3.0", employeeName: "James Wilson", employeeId: "EMP-1028", dept: "Finance", status: "Acknowledged", ackDate: "2024-01-18 16:30" },

  { id: "ACK-201", policyId: "POL-002", policyName: "Information Security & ISO 27001 Access Governance", version: "v4.2", employeeName: "Adarsh Gupta", employeeId: "EMP-USR", dept: "Operations", status: "Acknowledged", ackDate: "2024-07-22 10:15" },
  { id: "ACK-202", policyId: "POL-002", policyName: "Information Security & ISO 27001 Access Governance", version: "v4.2", employeeName: "Priya Patel", employeeId: "EMP-1024", dept: "Engineering", status: "Acknowledged", ackDate: "2024-07-21 16:40" },
  { id: "ACK-203", policyId: "POL-002", policyName: "Information Security & ISO 27001 Access Governance", version: "v4.2", employeeName: "Marcus Chen", employeeId: "EMP-1025", dept: "Design", status: "Pending", ackDate: null },
  { id: "ACK-204", policyId: "POL-002", policyName: "Information Security & ISO 27001 Access Governance", version: "v4.2", employeeName: "Ananya Deshmukh", employeeId: "EMP-1052", dept: "Sales", status: "Overdue", ackDate: null },

  { id: "ACK-301", policyId: "POL-003", policyName: "Remote & Hybrid Work Protocol", version: "v2.1", employeeName: "Adarsh Gupta", employeeId: "EMP-USR", dept: "Operations", status: "Pending", ackDate: null }, // User has this pending!
  { id: "ACK-302", policyId: "POL-003", policyName: "Remote & Hybrid Work Protocol", version: "v2.1", employeeName: "Priya Patel", employeeId: "EMP-1024", dept: "Engineering", status: "Acknowledged", ackDate: "2024-09-03 12:00" },
  { id: "ACK-303", policyId: "POL-003", policyName: "Remote & Hybrid Work Protocol", version: "v2.1", employeeName: "Sarah Mitchell", employeeId: "EMP-1001", dept: "Executive", status: "Acknowledged", ackDate: "2024-09-02 09:30" },

  { id: "ACK-401", policyId: "POL-006", policyName: "Workplace Health, Safety & Emergency Protocols", version: "v1.4", employeeName: "Adarsh Gupta", employeeId: "EMP-USR", dept: "Operations", status: "Acknowledged", ackDate: "2024-06-15 14:00" },
  { id: "ACK-402", policyId: "POL-006", policyName: "Workplace Health, Safety & Emergency Protocols", version: "v1.4", employeeName: "Chen Li", employeeId: "EMP-1033", dept: "Operations", status: "Overdue", ackDate: null },
];

function loadStored(key, initial) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return initial;
}

export const usePolicyStore = create((set, get) => ({
  policies: loadStored(POLICIES_STORAGE_KEY, INITIAL_POLICIES),
  categories: loadStored(CATEGORIES_STORAGE_KEY, INITIAL_CATEGORIES),
  acknowledgements: loadStored(ACKS_STORAGE_KEY, INITIAL_ACKNOWLEDGEMENTS),

  // Save helpers
  persistPolicies: (policies) => {
    try { localStorage.setItem(POLICIES_STORAGE_KEY, JSON.stringify(policies)); } catch {}
  },
  persistCategories: (categories) => {
    try { localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories)); } catch {}
  },
  persistAcks: (acks) => {
    try { localStorage.setItem(ACKS_STORAGE_KEY, JSON.stringify(acks)); } catch {}
  },

  // ── Policy Actions ─────────────────────────────────────────
  addPolicy: (data, submitForApproval = false) => {
    const state = get();
    const today = new Date().toISOString().slice(0, 10);
    const count = state.policies.length + 1;
    const newId = `POL-${String(count).padStart(3, "0")}`;
    const status = submitForApproval
      ? (data.approvalRequired ? "Pending Approval" : "Active")
      : (data.status || "Draft");

    const newPolicy = {
      id: newId,
      name: data.name || "Untitled Policy",
      category: data.category || "Code of Conduct",
      ownerDept: data.ownerDept || "Human Resources",
      applicableTo: data.applicableTo || "All Employees",
      version: data.version || "v1.0",
      effectiveDate: data.effectiveDate || today,
      reviewDate: data.reviewDate || "",
      approvalRequired: Boolean(data.approvalRequired),
      ackRequired: Boolean(data.ackRequired),
      status,
      summary: data.summary || "",
      content: data.content || "",
      versionHistory: [
        {
          version: data.version || "v1.0",
          effectiveDate: data.effectiveDate || today,
          updatedBy: data.author || "Adarsh Gupta",
          summary: data.summary || "Initial policy creation.",
          status,
        },
      ],
      activityLog: [
        {
          date: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          actor: data.author || "Adarsh Gupta",
          action: submitForApproval ? "Created and submitted policy for approval" : "Created policy draft",
        },
      ],
      updatedAt: today,
    };

    const updated = [newPolicy, ...state.policies];
    set({ policies: updated });
    get().persistPolicies(updated);
    return newPolicy;
  },

  updatePolicy: (id, updates) => {
    const state = get();
    const today = new Date().toISOString().slice(0, 10);
    const updated = state.policies.map((p) => {
      if (p.id !== id) return p;
      return {
        ...p,
        ...updates,
        updatedAt: today,
        activityLog: [
          {
            date: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            actor: updates.actor || "Adarsh Gupta",
            action: updates.actionLogText || `Updated policy details (${Object.keys(updates).filter(k => k !== 'activityLog' && k !== 'versionHistory').join(', ')})`,
          },
          ...(p.activityLog || []),
        ],
      };
    });
    set({ policies: updated });
    get().persistPolicies(updated);
  },

  approvePolicy: (id, actor = "Adarsh Gupta") => {
    const state = get();
    const today = new Date().toISOString().slice(0, 10);
    const updated = state.policies.map((p) => {
      if (p.id !== id) return p;
      const newStatus = "Active";
      const updatedHistory = (p.versionHistory || []).map((v, i) =>
        i === 0 ? { ...v, status: "Active" } : v
      );
      return {
        ...p,
        status: newStatus,
        updatedAt: today,
        versionHistory: updatedHistory,
        activityLog: [
          {
            date: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            actor,
            action: `Approved policy ${p.version} and published to Active`,
          },
          ...(p.activityLog || []),
        ],
      };
    });
    set({ policies: updated });
    get().persistPolicies(updated);
  },

  rejectPolicy: (id, reason = "", actor = "Adarsh Gupta") => {
    const state = get();
    const today = new Date().toISOString().slice(0, 10);
    const updated = state.policies.map((p) => {
      if (p.id !== id) return p;
      return {
        ...p,
        status: "Draft",
        updatedAt: today,
        activityLog: [
          {
            date: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            actor,
            action: `Returned policy to Draft. Reason: ${reason || "Revisions requested"}`,
          },
          ...(p.activityLog || []),
        ],
      };
    });
    set({ policies: updated });
    get().persistPolicies(updated);
  },

  publishPolicy: (id, actor = "Adarsh Gupta") => {
    const state = get();
    const today = new Date().toISOString().slice(0, 10);
    const updated = state.policies.map((p) => {
      if (p.id !== id) return p;
      return {
        ...p,
        status: "Active",
        updatedAt: today,
        activityLog: [
          {
            date: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            actor,
            action: `Published policy (${p.version}) as Active`,
          },
          ...(p.activityLog || []),
        ],
      };
    });
    set({ policies: updated });
    get().persistPolicies(updated);
  },

  archivePolicy: (id, actor = "Adarsh Gupta") => {
    const state = get();
    const today = new Date().toISOString().slice(0, 10);
    const updated = state.policies.map((p) => {
      if (p.id !== id) return p;
      return {
        ...p,
        status: "Archived",
        updatedAt: today,
        activityLog: [
          {
            date: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            actor,
            action: `Archived policy (${p.version})`,
          },
          ...(p.activityLog || []),
        ],
      };
    });
    set({ policies: updated });
    get().persistPolicies(updated);
  },

  restorePolicy: (id, actor = "Adarsh Gupta") => {
    const state = get();
    const today = new Date().toISOString().slice(0, 10);
    const updated = state.policies.map((p) => {
      if (p.id !== id) return p;
      return {
        ...p,
        status: "Active",
        updatedAt: today,
        activityLog: [
          {
            date: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            actor,
            action: `Restored policy from archive to Active`,
          },
          ...(p.activityLog || []),
        ],
      };
    });
    set({ policies: updated });
    get().persistPolicies(updated);
  },

  deletePolicy: (id) => {
    const state = get();
    const updated = state.policies.filter((p) => p.id !== id);
    set({ policies: updated });
    get().persistPolicies(updated);
  },

  createNewVersion: (id, newVersionData) => {
    const state = get();
    const today = new Date().toISOString().slice(0, 10);
    const updated = state.policies.map((p) => {
      if (p.id !== id) return p;

      const updatedHistory = [
        {
          version: newVersionData.version || `v${(parseFloat(p.version.replace("v", "")) + 0.1).toFixed(1)}`,
          effectiveDate: newVersionData.effectiveDate || today,
          updatedBy: newVersionData.author || "Adarsh Gupta",
          summary: newVersionData.summary || "New version release",
          status: newVersionData.approvalRequired ? "Pending Approval" : "Active",
        },
        ...(p.versionHistory || []).map((h) => ({ ...h, status: "Archived" })),
      ];

      return {
        ...p,
        version: newVersionData.version || `v${(parseFloat(p.version.replace("v", "")) + 0.1).toFixed(1)}`,
        effectiveDate: newVersionData.effectiveDate || today,
        reviewDate: newVersionData.reviewDate || p.reviewDate,
        summary: newVersionData.summary || p.summary,
        content: newVersionData.content || p.content,
        status: newVersionData.approvalRequired ? "Pending Approval" : "Active",
        updatedAt: today,
        versionHistory: updatedHistory,
        activityLog: [
          {
            date: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            actor: newVersionData.author || "Adarsh Gupta",
            action: `Created new version ${newVersionData.version || "update"} (${newVersionData.approvalRequired ? "Submitted for approval" : "Directly activated"})`,
          },
          ...(p.activityLog || []),
        ],
      };
    });
    set({ policies: updated });
    get().persistPolicies(updated);
  },

  // ── Categories Actions ─────────────────────────────────────
  addCategory: (categoryData) => {
    const state = get();
    const count = state.categories.length + 1;
    const newCat = {
      id: `CAT-${String(count).padStart(2, "0")}`,
      name: categoryData.name,
      description: categoryData.description || "",
      color: categoryData.color || "blue",
      icon: categoryData.icon || "Folder",
    };
    const updated = [...state.categories, newCat];
    set({ categories: updated });
    get().persistCategories(updated);
    return newCat;
  },

  updateCategory: (id, updates) => {
    const state = get();
    const updated = state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
    set({ categories: updated });
    get().persistCategories(updated);
  },

  deleteCategory: (id) => {
    const state = get();
    const updated = state.categories.filter((c) => c.id !== id);
    set({ categories: updated });
    get().persistCategories(updated);
  },

  // ── Acknowledgements Actions ───────────────────────────────
  acknowledgePolicy: (policyId, employeeName = "Adarsh Gupta", employeeId = "EMP-USR", dept = "Operations") => {
    const state = get();
    const policy = state.policies.find((p) => p.id === policyId);
    const now = new Date();
    const nowStr = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const existingIndex = state.acknowledgements.findIndex(
      (a) => a.policyId === policyId && (a.employeeId === employeeId || a.employeeName === employeeName)
    );

    let updatedAcks;
    if (existingIndex >= 0) {
      updatedAcks = state.acknowledgements.map((a, i) =>
        i === existingIndex
          ? { ...a, status: "Acknowledged", ackDate: nowStr, version: policy?.version || a.version }
          : a
      );
    } else {
      const newAck = {
        id: `ACK-${Date.now()}`,
        policyId,
        policyName: policy?.name || "Company Policy",
        version: policy?.version || "v1.0",
        employeeName,
        employeeId,
        dept,
        status: "Acknowledged",
        ackDate: nowStr,
      };
      updatedAcks = [newAck, ...state.acknowledgements];
    }

    set({ acknowledgements: updatedAcks });
    get().persistAcks(updatedAcks);
  },

  // Resets to initial sample fixtures if user clears or wants clean reset
  resetAll: () => {
    set({
      policies: INITIAL_POLICIES,
      categories: INITIAL_CATEGORIES,
      acknowledgements: INITIAL_ACKNOWLEDGEMENTS,
    });
    localStorage.removeItem(POLICIES_STORAGE_KEY);
    localStorage.removeItem(CATEGORIES_STORAGE_KEY);
    localStorage.removeItem(ACKS_STORAGE_KEY);
  },
}));
