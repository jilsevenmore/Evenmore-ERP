import { create } from "zustand";

const STORAGE_KEY = "hrms_documents_v2";

export const INITIAL_DOCUMENTS = [
  // --- Company Policies & Global Documents ---
  {
    id: "DOC-001",
    title: "Global Employee Handbook (2026)",
    category: "Policy",
    employee: "All Staff",
    employeeId: "ALL",
    version: "v3.2",
    expiry: "2027-01-01",
    status: "Valid",
    fileSize: "2.4 MB",
    fileType: "PDF",
    uploadedBy: "Sarah Mitchell (CEO)",
    updatedOn: "2026-08-15",
    tags: ["Handbook", "General", "Onboarding"],
    description: "Company vision, workplace policies, code of ethics, attendance regulations, and leave rules."
  },
  {
    id: "DOC-002",
    title: "Information Security & ISO 27001 Data Protocol",
    category: "Security",
    employee: "All Staff",
    employeeId: "ALL",
    version: "v2.1",
    expiry: "2026-12-31",
    status: "Valid",
    fileSize: "1.8 MB",
    fileType: "PDF",
    uploadedBy: "David Park (CTO)",
    updatedOn: "2026-07-20",
    tags: ["Infosec", "Compliance", "Security"],
    description: "Guidelines on credential safety, clean desk policy, cloud key management, and incident reporting."
  },
  {
    id: "DOC-003",
    title: "Health & Workplace Safety Guidelines (2026)",
    category: "Policy",
    employee: "All Staff",
    employeeId: "ALL",
    version: "v1.4",
    expiry: "2027-06-30",
    status: "Valid",
    fileSize: "950 KB",
    fileType: "PDF",
    uploadedBy: "Ayesha Khan (HR Director)",
    updatedOn: "2026-06-11",
    tags: ["Health", "Safety", "Facilities"],
    description: "Emergency exits, ergonomic support, first aid protocols, and building fire safety."
  },
  {
    id: "DOC-004",
    title: "Equal Opportunity & Anti-Harassment Policy",
    category: "Legal",
    employee: "All Staff",
    employeeId: "ALL",
    version: "v2.0",
    expiry: "—",
    status: "Valid",
    fileSize: "680 KB",
    fileType: "PDF",
    uploadedBy: "Ayesha Khan (HR Director)",
    updatedOn: "2026-05-01",
    tags: ["DEI", "Legal", "Conduct"],
    description: "Zero tolerance guidelines for discrimination, harassment resolution procedure, and ombudsman contacts."
  },

  // --- Priya Patel (Senior Engineer, Engineering) ---
  {
    id: "DOC-101",
    title: "Employment Agreement — Priya Patel",
    category: "Contract",
    employee: "Priya Patel",
    employeeId: "EMP1024",
    version: "v1.0",
    expiry: "—",
    status: "Valid",
    fileSize: "1.2 MB",
    fileType: "PDF",
    uploadedBy: "Ayesha Khan (HR)",
    updatedOn: "2024-01-10",
    tags: ["Contract", "Full Time", "Offer"],
    description: "Official executed permanent employment agreement outlining compensation, role, and terms."
  },
  {
    id: "DOC-102",
    title: "Non-Disclosure & IP Assignment Agreement",
    category: "Legal",
    employee: "Priya Patel",
    employeeId: "EMP1024",
    version: "v1.0",
    expiry: "—",
    status: "Valid",
    fileSize: "740 KB",
    fileType: "PDF",
    uploadedBy: "Legal Dept",
    updatedOn: "2024-01-10",
    tags: ["NDA", "IP", "Legal"],
    description: "Proprietary information protection and intellectual property assignment deed."
  },
  {
    id: "DOC-103",
    title: "Passport & Identity Verification",
    category: "Identity",
    employee: "Priya Patel",
    employeeId: "EMP1024",
    version: "v1.0",
    expiry: "2028-09-15",
    status: "Valid",
    fileSize: "3.1 MB",
    fileType: "PDF",
    uploadedBy: "Priya Patel",
    updatedOn: "2024-01-12",
    tags: ["KYC", "Passport", "Government ID"],
    description: "Notarized copy of international passport and national social identification."
  },
  {
    id: "DOC-104",
    title: "B.Tech Degree & Academic Transcripts",
    category: "Educational",
    employee: "Priya Patel",
    employeeId: "EMP1024",
    version: "v1.0",
    expiry: "—",
    status: "Valid",
    fileSize: "4.5 MB",
    fileType: "PDF",
    uploadedBy: "Priya Patel",
    updatedOn: "2024-01-15",
    tags: ["Degree", "Education", "Engineering"],
    description: "Bachelor of Technology in Computer Science degree certificate and consolidated transcripts."
  },
  {
    id: "DOC-105",
    title: "Salary Account Verification & Void Cheque",
    category: "Financial",
    employee: "Priya Patel",
    employeeId: "EMP1024",
    version: "v1.0",
    expiry: "—",
    status: "Valid",
    fileSize: "420 KB",
    fileType: "PDF",
    uploadedBy: "Priya Patel",
    updatedOn: "2024-01-18",
    tags: ["Banking", "Payroll", "Direct Deposit"],
    description: "Direct deposit authorization form with void bank cheque proof."
  },

  // --- Marcus Chen (Lead Designer, Design) ---
  {
    id: "DOC-201",
    title: "Employment Contract — Marcus Chen",
    category: "Contract",
    employee: "Marcus Chen",
    employeeId: "EMP1025",
    version: "v1.2",
    expiry: "—",
    status: "Valid",
    fileSize: "1.1 MB",
    fileType: "PDF",
    uploadedBy: "Ayesha Khan (HR)",
    updatedOn: "2021-01-05",
    tags: ["Contract", "Lead", "Design"],
    description: "Full-time senior design leadership contract and benefits schedule."
  },
  {
    id: "DOC-202",
    title: "UK Work Authorization & Biometric Residence Permit",
    category: "Compliance",
    employee: "Marcus Chen",
    employeeId: "EMP1025",
    version: "v2.0",
    expiry: "2026-10-30",
    status: "Expiring Soon",
    fileSize: "1.9 MB",
    fileType: "PDF",
    uploadedBy: "Marcus Chen",
    updatedOn: "2024-08-01",
    tags: ["Visa", "Immigration", "Permit"],
    description: "Tier-2 Skilled Worker sponsorship and biometric residence permit (BRP)."
  },
  {
    id: "DOC-203",
    title: "Master of Fine Arts Certificate",
    category: "Educational",
    employee: "Marcus Chen",
    employeeId: "EMP1025",
    version: "v1.0",
    expiry: "—",
    status: "Valid",
    fileSize: "2.8 MB",
    fileType: "PDF",
    uploadedBy: "Marcus Chen",
    updatedOn: "2021-01-08",
    tags: ["Education", "Design", "MFA"],
    description: "Royal College of Art Master of Arts in Design graduation certificate."
  },

  // --- Liam Cooper (DevOps Engineer, Engineering) ---
  {
    id: "DOC-301",
    title: "Offer Letter & Contract — Liam Cooper",
    category: "Contract",
    employee: "Liam Cooper",
    employeeId: "EMP1026",
    version: "v1.0",
    expiry: "—",
    status: "Valid",
    fileSize: "1.3 MB",
    fileType: "PDF",
    uploadedBy: "Ayesha Khan (HR)",
    updatedOn: "2023-06-18",
    tags: ["Contract", "DevOps"],
    description: "Employment agreement and standard DevOps position addendum."
  },
  {
    id: "DOC-302",
    title: "AWS Certified DevOps Professional Credential",
    category: "Compliance",
    employee: "Liam Cooper",
    employeeId: "EMP1026",
    version: "v3.0",
    expiry: "2026-09-25",
    status: "Expiring Soon",
    fileSize: "820 KB",
    fileType: "PDF",
    uploadedBy: "Liam Cooper",
    updatedOn: "2023-09-25",
    tags: ["AWS", "Cloud", "Certification"],
    description: "Active AWS DevOps Engineer Professional credential verification badge."
  },
  {
    id: "DOC-303",
    title: "Previous Employer Relieving & Experience Letter",
    category: "Compliance",
    employee: "Liam Cooper",
    employeeId: "EMP1026",
    version: "v1.0",
    expiry: "—",
    status: "Valid",
    fileSize: "610 KB",
    fileType: "PDF",
    uploadedBy: "Liam Cooper",
    updatedOn: "2023-06-20",
    tags: ["Relieving", "Background Check"],
    description: "Formal service certificate and exit clearance letter from previous tech employer."
  },

  // --- Elena Rostova (Brand Strategist, Marketing) ---
  {
    id: "DOC-401",
    title: "Employment Agreement — Elena Rostova",
    category: "Contract",
    employee: "Elena Rostova",
    employeeId: "EMP1027",
    version: "v1.1",
    expiry: "—",
    status: "Valid",
    fileSize: "1.0 MB",
    fileType: "PDF",
    uploadedBy: "Ayesha Khan (HR)",
    updatedOn: "2020-09-02",
    tags: ["Contract", "Marketing"],
    description: "Global marketing lead agreement including Dubai regional office terms."
  },
  {
    id: "DOC-402",
    title: "UAE Residence Visa & Emirates ID Card",
    category: "Identity",
    employee: "Elena Rostova",
    employeeId: "EMP1027",
    version: "v2.0",
    expiry: "2025-03-15",
    status: "Expired",
    fileSize: "2.3 MB",
    fileType: "PDF",
    uploadedBy: "Elena Rostova",
    updatedOn: "2022-03-10",
    tags: ["Visa", "Emirates ID", "Expired"],
    description: "UAE employment residency visa stamping and registered Emirates identity card."
  },

  // --- James Wilson (Finance Manager, Finance) ---
  {
    id: "DOC-501",
    title: "Employment Agreement — James Wilson",
    category: "Contract",
    employee: "James Wilson",
    employeeId: "EMP1028",
    version: "v1.0",
    expiry: "—",
    status: "Valid",
    fileSize: "1.4 MB",
    fileType: "PDF",
    uploadedBy: "Sarah Mitchell (CEO)",
    updatedOn: "2019-04-22",
    tags: ["Contract", "Finance"],
    description: "Finance department management contract and fiduciary responsibility annexure."
  },
  {
    id: "DOC-502",
    title: "Chartered Financial Analyst (CFA) Charter",
    category: "Educational",
    employee: "James Wilson",
    employeeId: "EMP1028",
    version: "v1.0",
    expiry: "—",
    status: "Valid",
    fileSize: "1.8 MB",
    fileType: "PDF",
    uploadedBy: "James Wilson",
    updatedOn: "2019-05-01",
    tags: ["CFA", "Finance", "Certification"],
    description: "Official CFA Institute Charter award document."
  },

  // --- Ayesha Khan (HR Director, HR) ---
  {
    id: "DOC-601",
    title: "Executive Director Contract — Ayesha Khan",
    category: "Contract",
    employee: "Ayesha Khan",
    employeeId: "EMP1029",
    version: "v2.0",
    expiry: "—",
    status: "Valid",
    fileSize: "1.5 MB",
    fileType: "PDF",
    uploadedBy: "Sarah Mitchell (CEO)",
    updatedOn: "2018-02-10",
    tags: ["Contract", "Executive", "HR"],
    description: "Director of Human Resources appointment letter and executive equity grant."
  },
  {
    id: "DOC-602",
    title: "SHRM-SCP Senior Certified Professional",
    category: "Compliance",
    employee: "Ayesha Khan",
    employeeId: "EMP1029",
    version: "v1.0",
    expiry: "2027-11-20",
    status: "Valid",
    fileSize: "920 KB",
    fileType: "PDF",
    uploadedBy: "Ayesha Khan",
    updatedOn: "2024-11-20",
    tags: ["SHRM", "HR", "Certification"],
    description: "Society for Human Resource Management Senior Certified Professional credential."
  },

  // --- Adarsh Gupta (Operations Admin - Current User) ---
  {
    id: "DOC-701",
    title: "Operations Admin Appointment Letter — Adarsh Gupta",
    category: "Contract",
    employee: "Adarsh Gupta",
    employeeId: "EMP1099",
    version: "v1.0",
    expiry: "—",
    status: "Valid",
    fileSize: "1.2 MB",
    fileType: "PDF",
    uploadedBy: "Ayesha Khan (HR)",
    updatedOn: "2025-01-15",
    tags: ["Appointment", "Operations", "Contract"],
    description: "Core operations management role agreement, confidentiality covenants, and reporting structure."
  },
  {
    id: "DOC-702",
    title: "National Identity Proof (Aadhaar / Passport)",
    category: "Identity",
    employee: "Adarsh Gupta",
    employeeId: "EMP1099",
    version: "v1.0",
    expiry: "2032-05-10",
    status: "Valid",
    fileSize: "2.1 MB",
    fileType: "PDF",
    uploadedBy: "Adarsh Gupta",
    updatedOn: "2025-01-16",
    tags: ["KYC", "Identity", "Verified"],
    description: "Verified government identification card and address verification proof."
  },
  {
    id: "DOC-703",
    title: "Non-Disclosure & Confidentiality Undertaking",
    category: "Legal",
    employee: "Adarsh Gupta",
    employeeId: "EMP1099",
    version: "v1.0",
    expiry: "—",
    status: "Valid",
    fileSize: "850 KB",
    fileType: "PDF",
    uploadedBy: "Legal Dept",
    updatedOn: "2025-01-15",
    tags: ["NDA", "Confidentiality"],
    description: "Standard corporate confidentiality and data non-disclosure undertaking."
  },
  {
    id: "DOC-704",
    title: "Form 16 / Tax Withholding Certificate (FY 2025-26)",
    category: "Financial",
    employee: "Adarsh Gupta",
    employeeId: "EMP1099",
    version: "v1.0",
    expiry: "2026-07-31",
    status: "Valid",
    fileSize: "1.4 MB",
    fileType: "PDF",
    uploadedBy: "Finance Dept",
    updatedOn: "2026-06-10",
    tags: ["Tax", "Form 16", "Payroll"],
    description: "Annual statement of salary paid and tax deducted at source under Income Tax regulations."
  },
  {
    id: "DOC-705",
    title: "Emergency Contact & Medical Declaration",
    category: "Compliance",
    employee: "Adarsh Gupta",
    employeeId: "EMP1099",
    version: "v1.0",
    expiry: "2026-10-15",
    status: "Expiring Soon",
    fileSize: "490 KB",
    fileType: "PDF",
    uploadedBy: "Adarsh Gupta",
    updatedOn: "2025-10-15",
    tags: ["Emergency", "Medical", "Annual Renewal"],
    description: "Designated emergency contacts, health declarations, and corporate medical insurance enrollment."
  }
];

function loadStoredDocs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to load documents from localStorage:", err);
  }
  return INITIAL_DOCUMENTS;
}

export const useDocumentStore = create((set, get) => ({
  documents: loadStoredDocs(),

  addDocument: (docData) => {
    const current = get().documents;
    const count = current.length + 1;
    const newDoc = {
      id: `DOC-${String(count).padStart(3, "0")}`,
      version: "v1.0",
      fileSize: "1.1 MB",
      fileType: "PDF",
      updatedOn: new Date().toISOString().slice(0, 10),
      status: "Valid",
      tags: [docData.category || "General"],
      ...docData,
    };
    const updated = [newDoc, ...current];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    set({ documents: updated });
    return newDoc;
  },

  updateDocument: (id, updates) => {
    const current = get().documents;
    const updated = current.map((d) =>
      d.id === id ? { ...d, ...updates, updatedOn: new Date().toISOString().slice(0, 10) } : d
    );
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    set({ documents: updated });
  },

  deleteDocument: (id) => {
    const current = get().documents;
    const updated = current.filter((d) => d.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    set({ documents: updated });
  },

  verifyDocument: (id) => {
    const current = get().documents;
    const updated = current.map((d) =>
      d.id === id ? { ...d, status: "Valid", verifiedAt: new Date().toISOString().slice(0, 10) } : d
    );
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    set({ documents: updated });
  },

  resetToDefault: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({ documents: INITIAL_DOCUMENTS });
  }
}));
