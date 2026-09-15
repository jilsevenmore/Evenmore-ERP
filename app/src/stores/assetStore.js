import { create } from "zustand";

const STORAGE_KEY = "hrms_assets_v1";

export const INITIAL_ASSETS = [
  {
    id: "AST-1001",
    name: 'Apple MacBook Pro 16" (M3 Max, 36GB / 1TB)',
    category: "Laptop",
    serialNumber: "C02G41ABMD6M",
    assignedTo: "Priya Patel",
    employeeId: "EMP1024",
    dept: "Engineering",
    status: "Assigned",
    condition: "Excellent",
    purchaseDate: "2024-03-12",
    purchaseCost: "₹2,49,900",
    warrantyExpiry: "2027-03-12",
    notes: "Primary engineering development machine with AppleCare+ active.",
    history: [
      { date: "2024-03-12", action: "Procured & Added", by: "IT Support", notes: "Brand new device received from Apple Authorised Reseller." },
      { date: "2024-03-15", action: "Assigned", by: "IT Support", notes: "Assigned to Priya Patel for senior engineering workstation." },
    ],
  },
  {
    id: "AST-1002",
    name: "Dell XPS 15 9530 (i9 13th Gen, 32GB / 1TB RTX 4060)",
    category: "Laptop",
    serialNumber: "8G92XN3",
    assignedTo: "David Park",
    employeeId: "EMP1030",
    dept: "Engineering",
    status: "Assigned",
    condition: "Good",
    purchaseDate: "2023-11-20",
    purchaseCost: "₹1,98,000",
    warrantyExpiry: "2026-11-20",
    notes: "Allocated for architecture benchmarks and executive duties.",
    history: [
      { date: "2023-11-20", action: "Procured & Added", by: "Admin Operations", notes: "Initial procurement batch." },
      { date: "2023-11-22", action: "Assigned", by: "Admin Operations", notes: "Assigned to David Park (CTO)." },
    ],
  },
  {
    id: "AST-1003",
    name: 'LG UltraFine 27" 4K IPS Ergonomic Monitor',
    category: "Monitor",
    serialNumber: "304NTBK7P120",
    assignedTo: "Marcus Chen",
    employeeId: "EMP1025",
    dept: "Design",
    status: "Assigned",
    condition: "Excellent",
    purchaseDate: "2023-08-10",
    purchaseCost: "₹42,500",
    warrantyExpiry: "2026-08-10",
    notes: "Calibrated for DCI-P3 color fidelity for UI/UX product mockups.",
    history: [
      { date: "2023-08-10", action: "Procured & Added", by: "Facilities Team", notes: "Studio display setup." },
      { date: "2023-08-14", action: "Assigned", by: "Facilities Team", notes: "Handed over to Marcus Chen." },
    ],
  },
  {
    id: "AST-1004",
    name: "Apple iPhone 15 Pro (256GB Titanium Test Device)",
    category: "Mobile",
    serialNumber: "K9W72PQX4Y",
    assignedTo: "IT Stock Reserve",
    employeeId: "",
    dept: "Engineering",
    status: "Available",
    condition: "Good",
    purchaseDate: "2024-01-18",
    purchaseCost: "₹1,24,900",
    warrantyExpiry: "2025-01-18",
    notes: "Shared QA pool device for mobile web and responsive audit runs.",
    history: [
      { date: "2024-01-18", action: "Procured & Added", by: "QA Dept", notes: "Registered for device testing lab." },
      { date: "2024-09-01", action: "Returned to Stock", by: "QA Lab", notes: "Returned from testing sprint to reserve pool." },
    ],
  },
  {
    id: "AST-1005",
    name: 'Apple MacBook Air 15" (M2, 16GB / 512GB)',
    category: "Laptop",
    serialNumber: "C02N981KP3LM",
    assignedTo: "IT Stock Reserve",
    employeeId: "",
    dept: "IT Support",
    status: "Available",
    condition: "Excellent",
    purchaseDate: "2024-05-02",
    purchaseCost: "₹1,34,900",
    warrantyExpiry: "2027-05-02",
    notes: "Ready in stock for upcoming engineering onboardings.",
    history: [
      { date: "2024-05-02", action: "Procured & Added", by: "IT Support", notes: "Buffer stock reserve." },
    ],
  },
  {
    id: "AST-1006",
    name: "Dell Precision 5820 Tower Workstation (Xeon 64GB)",
    category: "Workstation",
    serialNumber: "9XYL702A",
    assignedTo: "Hardware Lab",
    employeeId: "",
    dept: "Engineering",
    status: "Under Maintenance",
    condition: "Needs Repair",
    purchaseDate: "2022-09-14",
    purchaseCost: "₹3,40,000",
    warrantyExpiry: "2025-09-14",
    notes: "Power supply diagnostic in progress; expected back next week.",
    history: [
      { date: "2022-09-14", action: "Procured & Added", by: "Infra Team", notes: "CAD and local build server." },
      { date: "2026-09-02", action: "Sent to Maintenance", by: "IT Support", notes: "SMPS fan failure diagnosed." },
    ],
  },
  {
    id: "AST-1007",
    name: "iPad Pro 12.9 (5th Gen, 256GB Wi-Fi)",
    category: "Tablet",
    serialNumber: "DMPZQ319N9",
    assignedTo: "Operations Dept",
    employeeId: "",
    dept: "Operations",
    status: "Lost/Damaged",
    condition: "Needs Repair",
    purchaseDate: "2023-04-10",
    purchaseCost: "₹89,000",
    warrantyExpiry: "2024-04-10",
    notes: "Screen glass cracked during warehouse inventory dispatch.",
    history: [
      { date: "2023-04-10", action: "Procured & Added", by: "Warehouse Ops", notes: "Field scanning tablet." },
      { date: "2026-08-19", action: "Reported Damaged", by: "Chen Li", notes: "Dropped at packing dock." },
    ],
  },
  {
    id: "AST-1008",
    name: "Sony WH-1000XM5 Noise Canceling Headphones",
    category: "Audio / Peripherals",
    serialNumber: "SN89012354A",
    assignedTo: "Elena Rostova",
    employeeId: "EMP1027",
    dept: "Marketing",
    status: "Assigned",
    condition: "Good",
    purchaseDate: "2024-02-11",
    purchaseCost: "₹26,990",
    warrantyExpiry: "2025-02-11",
    notes: "Allocated for video production and media relations.",
    history: [
      { date: "2024-02-11", action: "Procured & Added", by: "Marketing Lead", notes: "Multimedia gear setup." },
      { date: "2024-02-12", action: "Assigned", by: "IT Support", notes: "Assigned to Elena Rostova." },
    ],
  },
];

function loadAssets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed loading assets from localStorage:", err);
  }
  return INITIAL_ASSETS;
}

function persistAssets(assets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  } catch (err) {
    console.error("Failed saving assets to localStorage:", err);
  }
}

const REQUESTS_STORAGE_KEY = "hrms_asset_requests_v1";

export const INITIAL_REQUESTS = [
  {
    id: "REQ-AST-101",
    employeeName: "Liam Cooper",
    employeeId: "EMP1026",
    dept: "Engineering",
    category: "Laptop",
    assetName: "Dell Precision Mobile Workstation 16",
    reason: "Current laptop heating excessively while running Docker microservices stack.",
    priority: "High",
    requestedDate: "2026-09-08",
    status: "Pending",
    notes: "Requires at least 32GB RAM for Kubernetes cluster simulation.",
    allocatedAssetId: null,
  },
  {
    id: "REQ-AST-102",
    employeeName: "Ayesha Khan",
    employeeId: "EMP1029",
    dept: "HR",
    category: "Monitor",
    assetName: "LG 27\" UltraFine Display",
    reason: "Dual display required for managing compensation spreadsheets and compliance review.",
    priority: "Medium",
    requestedDate: "2026-09-05",
    status: "Approved",
    notes: "Approved by Facilities team. Waiting for next batch delivery.",
    allocatedAssetId: null,
  },
  {
    id: "REQ-AST-103",
    employeeName: "Elena Rostova",
    employeeId: "EMP1027",
    dept: "Marketing",
    category: "Tablet",
    assetName: "iPad Air 11\" M2 with Apple Pencil",
    reason: "Needed for campaign creative reviews, storyboards, and client presentations.",
    priority: "Medium",
    requestedDate: "2026-08-28",
    status: "Fulfilled",
    notes: "Allocated and handed over.",
    allocatedAssetId: "AST-1007",
  },
  {
    id: "REQ-AST-104",
    employeeName: "James Wilson",
    employeeId: "EMP1028",
    dept: "Finance",
    category: "Audio / Peripherals",
    assetName: "Wireless Ergonomic Mouse & Mechanical Numpad",
    reason: "Ergonomic equipment requested due to repetitive strain during audit reconciliation.",
    priority: "Low",
    requestedDate: "2026-09-09",
    status: "Pending",
    notes: "Requested ergonomic set.",
    allocatedAssetId: null,
  },
];

function loadRequests() {
  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed loading asset requests:", err);
  }
  return INITIAL_REQUESTS;
}

function persistRequests(reqs) {
  try {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(reqs));
  } catch (err) {
    console.error("Failed saving asset requests:", err);
  }
}

export const useAssetStore = create((set, get) => ({
  assets: loadAssets(),
  requests: loadRequests(),

  addAsset: (assetData) => {
    const newId = `AST-${1000 + get().assets.length + 1}`;
    const today = new Date().toISOString().slice(0, 10);
    const newAsset = {
      id: newId,
      name: assetData.name || "Unnamed Asset",
      category: assetData.category || "Laptop",
      serialNumber: assetData.serialNumber || `SN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      assignedTo: assetData.assignedTo || "IT Stock Reserve",
      employeeId: assetData.employeeId || "",
      dept: assetData.dept || "General",
      status: assetData.status || (assetData.assignedTo && assetData.assignedTo !== "IT Stock Reserve" ? "Assigned" : "Available"),
      condition: assetData.condition || "Excellent",
      purchaseDate: assetData.purchaseDate || today,
      purchaseCost: assetData.purchaseCost || "—",
      warrantyExpiry: assetData.warrantyExpiry || "—",
      notes: assetData.notes || "",
      history: [
        {
          date: today,
          action: "Asset Registered",
          by: "System Admin",
          notes: `Added with status: ${assetData.status || "Available"}.`,
        },
        ...(assetData.assignedTo && assetData.assignedTo !== "IT Stock Reserve"
          ? [
              {
                date: today,
                action: "Assigned",
                by: "System Admin",
                notes: `Assigned upon registration to ${assetData.assignedTo}.`,
              },
            ]
          : []),
      ],
    };

    const updated = [newAsset, ...get().assets];
    persistAssets(updated);
    set({ assets: updated });
    return newAsset;
  },

  updateAsset: (id, updates) => {
    const today = new Date().toISOString().slice(0, 10);
    const updated = get().assets.map((item) => {
      if (item.id !== id) return item;
      const historyItem = {
        date: today,
        action: "Asset Details Updated",
        by: "System Admin",
        notes: updates.notes || "Specifications or metadata modified.",
      };
      return {
        ...item,
        ...updates,
        history: [historyItem, ...(item.history || [])],
      };
    });
    persistAssets(updated);
    set({ assets: updated });
  },

  deleteAsset: (id) => {
    const updated = get().assets.filter((item) => item.id !== id);
    persistAssets(updated);
    set({ assets: updated });
  },

  assignAsset: (id, { employeeName, employeeId, dept, notes }) => {
    const today = new Date().toISOString().slice(0, 10);
    const updated = get().assets.map((item) => {
      if (item.id !== id) return item;
      const historyEntry = {
        date: today,
        action: "Assigned",
        by: "IT Administration",
        notes: notes ? `Assigned to ${employeeName}. Notes: ${notes}` : `Assigned to ${employeeName}.`,
      };
      return {
        ...item,
        status: "Assigned",
        assignedTo: employeeName,
        employeeId: employeeId || item.employeeId || "",
        dept: dept || item.dept,
        history: [historyEntry, ...(item.history || [])],
      };
    });
    persistAssets(updated);
    set({ assets: updated });
  },

  returnAsset: (id, { condition = "Good", notes = "" }) => {
    const today = new Date().toISOString().slice(0, 10);
    const updated = get().assets.map((item) => {
      if (item.id !== id) return item;
      const prevOwner = item.assignedTo;
      const newStatus = condition === "Needs Repair" ? "Under Maintenance" : "Available";
      const historyEntry = {
        date: today,
        action: "Returned to Inventory",
        by: "IT Administration",
        notes: `Returned from ${prevOwner}. Condition: ${condition}.${notes ? " " + notes : ""}`,
      };
      return {
        ...item,
        status: newStatus,
        condition,
        assignedTo: newStatus === "Available" ? "IT Stock Reserve" : "Hardware Lab",
        employeeId: "",
        history: [historyEntry, ...(item.history || [])],
      };
    });
    persistAssets(updated);
    set({ assets: updated });
  },

  setAssetStatus: (id, newStatus, reason = "") => {
    const today = new Date().toISOString().slice(0, 10);
    const updated = get().assets.map((item) => {
      if (item.id !== id) return item;
      const historyEntry = {
        date: today,
        action: `Status changed to ${newStatus}`,
        by: "System Admin",
        notes: reason || `Asset status transitioned to ${newStatus}.`,
      };
      return {
        ...item,
        status: newStatus,
        history: [historyEntry, ...(item.history || [])],
      };
    });
    persistAssets(updated);
    set({ assets: updated });
  },

  // Request Actions
  addRequest: (reqData) => {
    const today = new Date().toISOString().slice(0, 10);
    const newReq = {
      id: `REQ-AST-${100 + get().requests.length + 1}`,
      employeeName: reqData.employeeName || "Staff Member",
      employeeId: reqData.employeeId || "",
      dept: reqData.dept || "General",
      category: reqData.category || "Laptop",
      assetName: reqData.assetName || "Requested Hardware",
      reason: reqData.reason || "",
      priority: reqData.priority || "Medium",
      requestedDate: reqData.requestedDate || today,
      status: "Pending",
      notes: reqData.notes || "",
      source: reqData.source || "Asset Portal",
      allocatedAssetId: null,
    };
    const updated = [newReq, ...get().requests];
    persistRequests(updated);
    set({ requests: updated });
    return newReq;
  },

  updateRequestStatus: (id, newStatus, extra = {}) => {
    const updated = get().requests.map((r) => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: newStatus,
        ...extra,
      };
    });
    persistRequests(updated);
    set({ requests: updated });
  },

  fulfillRequestWithAsset: (reqId, assetId) => {
    const req = get().requests.find((r) => r.id === reqId);
    if (!req) return;

    // Assign the asset to the employee
    get().assignAsset(assetId, {
      employeeName: req.employeeName,
      employeeId: req.employeeId,
      dept: req.dept,
      notes: `Allocated to fulfill request ${req.id} (${req.assetName}).`,
    });

    // Mark request as fulfilled
    get().updateRequestStatus(reqId, "Fulfilled", { allocatedAssetId: assetId });
  },

  deleteRequest: (id) => {
    const updated = get().requests.filter((r) => r.id !== id);
    persistRequests(updated);
    set({ requests: updated });
  },

  resetDefaults: () => {
    persistAssets(INITIAL_ASSETS);
    persistRequests(INITIAL_REQUESTS);
    set({ assets: INITIAL_ASSETS, requests: INITIAL_REQUESTS });
  },
}));

