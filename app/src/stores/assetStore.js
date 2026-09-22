import { create } from "zustand";
import { lazyStore } from "../services/lazyModules";
import { writeThrough, pullTracked } from "../services/hrmsSync";

const useAssetStoreBase = create((set, get) => ({
  /** Load this module's collections from the API. */
  hydrate: async () => {
    const rows = await Promise.all([
        pullTracked("assets"),
        pullTracked("assetRequests"),
    ]);
    set((s) => ({
        assets: rows[0] || s.assets,
        requests: rows[1] || s.requests,
    }));
    return rows;
  },

  /** Empty on sign-out so the next user sees nothing of the previous one. */
  clear: () => set({ assets: [], requests: [] }),

  assets: [],
  requests: [],

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
    writeThrough("assets", updated);
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
    writeThrough("assets", updated);
    set({ assets: updated });
  },

  deleteAsset: (id) => {
    const updated = get().assets.filter((item) => item.id !== id);
    writeThrough("assets", updated);
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
    writeThrough("assets", updated);
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
    writeThrough("assets", updated);
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
    writeThrough("assets", updated);
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
    writeThrough("assetRequests", updated);
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
    writeThrough("assetRequests", updated);
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
    writeThrough("assetRequests", updated);
    set({ requests: updated });
  },

  /** Discard anything local and re-read the register from the server. */
  resetDefaults: () => useAssetStore.getState().hydrate(),
}));


// Hydrated the first time a screen reads it, not at boot — services/lazyModules.
export const useAssetStore = lazyStore(useAssetStoreBase, "assets");
