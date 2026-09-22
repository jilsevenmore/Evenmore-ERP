import { create } from "zustand";
<<<<<<< Updated upstream
import { lazyStore } from "../services/lazyModules";
=======
>>>>>>> Stashed changes
import { writeThrough, pullTracked } from "../services/hrmsSync";

const STORAGE_KEY = "hrms_documents_v2";


<<<<<<< Updated upstream
const useDocumentStoreBase = create((set, get) => ({
=======
export const useDocumentStore = create((set, get) => ({
>>>>>>> Stashed changes
  /** Load this module's collections from the API. */
  hydrate: async () => {
    const rows = await Promise.all([
      pullTracked("documents"),
    ]);
    set((s) => ({
      documents: rows[0] || s.documents,
    }));
    return rows;
  },

  /** Empty on sign-out so the next user sees nothing of the previous one. */
  clear: () => set({ documents: [] }),

  documents: [],

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
      writeThrough("documents", updated);
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
      writeThrough("documents", updated);
    } catch {}
    set({ documents: updated });
  },

  deleteDocument: (id) => {
    const current = get().documents;
    const updated = current.filter((d) => d.id !== id);
    try {
      writeThrough("documents", updated);
    } catch {}
    set({ documents: updated });
  },

  verifyDocument: (id) => {
    const current = get().documents;
    const updated = current.map((d) =>
      d.id === id ? { ...d, status: "Valid", verifiedAt: new Date().toISOString().slice(0, 10) } : d
    );
    try {
      writeThrough("documents", updated);
    } catch {}
    set({ documents: updated });
  },

  /** Discard anything local and re-read the documents from the server. */
  resetToDefault: () => useDocumentStore.getState().hydrate()
}));

// Hydrated the first time a screen reads it, not at boot — services/lazyModules.
export const useDocumentStore = lazyStore(useDocumentStoreBase, "documents");
