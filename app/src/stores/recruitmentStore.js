import { create } from "zustand";
import { lazyStore } from "../services/lazyModules";
import {
  writeThrough,
  pullTracked,
  verifyCandidateDocuments,
  completeCandidateOnboarding,
} from "../services/hrmsSync";
import { useAppStore } from "./appStore";
import { api } from "../services/api";

export async function syncCandidateToEmployee(candidate, offers = [], jobs = []) {
  if (!candidate || candidate.stage !== "Hired") return;
  if (candidate.employee || candidate.employeeId) return;

  try {
    if (candidate.id && typeof candidate.id === "string" && candidate.id.length === 36 && candidate.id.includes("-")) {
      await api.post(`/hrms/candidates/${candidate.id}/hire/`);
      await useAppStore.getState().refreshHrms("employees");
    }
  } catch (err) {
    console.warn("Could not sync candidate to employee:", err);
  }
}

/** Sync a specific collection with backend and update store with fresh server IDs */
async function syncCollection(key, set, list) {
  try {
    const synced = await writeThrough(key, list);
    if (synced && Array.isArray(synced)) {
      set({ [key]: synced });
      return synced;
    }
  } catch (err) {
    console.warn(`[recruitmentStore] Error syncing ${key}:`, err);
  }
  return list;
}

const useRecruitmentStoreBase = create((set, get) => ({
  jobs: [],
  candidates: [],
  interviews: [],
  offers: [],
  questions: [],
  onboardedMap: {},
  verifiedDocsMap: {},
  applications: [],
  onboarding: [],
  toast: null,
  showToast: (msg) => set({ toast: { msg, id: Date.now().toString() } }),
  clear: () => set({ toast: null }),

  /** Load the recruitment pipeline from the API. */
  hydrate: async () => {
    const rows = await Promise.all([
      pullTracked("jobs"),
      pullTracked("candidates"),
      pullTracked("interviews"),
      pullTracked("offers"),
      pullTracked("recruitmentQuestions"),
      pullTracked("applications"),
      pullTracked("onboarding"),
    ]);

    const loadedCandidates = rows[1] || [];
    const onboardedMap = {};
    const verifiedDocsMap = {};
    loadedCandidates.forEach((c) => {
      if (c.isOnboarded) onboardedMap[c.id] = true;
      if (c.documentsVerified) verifiedDocsMap[c.id] = true;
    });

    set((s) => ({
      jobs: rows[0] || s.jobs,
      candidates: loadedCandidates.length ? loadedCandidates : s.candidates,
      interviews: rows[2] || s.interviews,
      offers: rows[3] || s.offers,
      questions: rows[4] || s.questions,
      applications: rows[5] || s.applications,
      onboarding: rows[6] || s.onboarding,
      onboardedMap: { ...s.onboardedMap, ...onboardedMap },
      verifiedDocsMap: { ...s.verifiedDocsMap, ...verifiedDocsMap },
    }));

    return rows;
  },

  /** Empty on sign-out so the next user sees nothing of the previous one. */
  clearData: () => set({
    jobs: [], candidates: [], interviews: [], offers: [], questions: [],
    applications: [], onboarding: [],
    onboardedMap: {}, verifiedDocsMap: {},
  }),

  // ─── JOBS ──────────────────────────────────────────
  addJob: async (j) => {
    const st = get();
    const ns = [j, ...st.jobs];
    set({ jobs: ns });
    await syncCollection("jobs", set, ns);
  },

  updateJob: async (id, p) => {
    const st = get();
    const ns = st.jobs.map((j) => (j.id === id ? { ...j, ...p } : j));
    set({ jobs: ns });
    await syncCollection("jobs", set, ns);
  },

  deleteJob: async (id) => {
    const st = get();
    const ns = st.jobs.filter((j) => j.id !== id);
    set({ jobs: ns });
    await syncCollection("jobs", set, ns);
  },

  // ─── CANDIDATES ────────────────────────────────────
  addCandidate: async (c) => {
    const st = get();
    const matchedJob = c.jobId
      ? st.jobs.find((j) => j.id === c.jobId)
      : st.jobs.find((j) => j.title?.toLowerCase() === c.position?.toLowerCase());

    const enrichedCand = {
      ...c,
      jobId: matchedJob?.id || c.jobId || "",
      position: matchedJob?.title || c.position || "",
    };

    const ns = [enrichedCand, ...st.candidates];
    const updatedJobs = st.jobs.map((j) =>
      j.id === enrichedCand.jobId ? { ...j, applicants: (j.applicants || 0) + 1 } : j
    );

    set({ candidates: ns, jobs: updatedJobs });
    await syncCollection("candidates", set, ns);

    if (enrichedCand.stage === "Hired") {
      syncCandidateToEmployee(enrichedCand, st.offers, st.jobs);
    }
  },

  updateCandidate: async (id, p) => {
    const st = get();
    const ns = st.candidates.map((c) => (c.id === id ? { ...c, ...p } : c));
    set({ candidates: ns });
    await syncCollection("candidates", set, ns);
    const updated = ns.find((c) => c.id === id);
    if (updated && updated.stage === "Hired") {
      syncCandidateToEmployee(updated, st.offers, st.jobs);
    }
  },

  deleteCandidate: async (id) => {
    const st = get();
    const ns = st.candidates.filter((c) => c.id !== id);
    set({ candidates: ns });
    await syncCollection("candidates", set, ns);
  },

  changeStage: async (id, stage) => {
    const st = get();
    const ns = st.candidates.map((c) => (c.id === id ? { ...c, stage } : c));
    set({ candidates: ns });
    await syncCollection("candidates", set, ns);
    const target = ns.find((c) => c.id === id);
    if (target && stage === "Hired") {
      syncCandidateToEmployee(target, st.offers, st.jobs);
    }
  },

  // ─── INTERVIEWS ────────────────────────────────────
  addInterview: async (i) => {
    const st = get();
    const ns = [i, ...st.interviews];
    const updatedCandidates = st.candidates.map((c) =>
      c.id === i.candidateId ? { ...c, interviewStatus: "Scheduled" } : c
    );
    set({ interviews: ns, candidates: updatedCandidates });
    await syncCollection("interviews", set, ns);
    await syncCollection("candidates", set, updatedCandidates);
  },

  updateInterview: async (id, p) => {
    const st = get();
    const ns = st.interviews.map((i) => (i.id === id ? { ...i, ...p } : i));
    const target = ns.find((i) => i.id === id);

    let updatedCandidates = st.candidates;
    if (target && p.score !== undefined) {
      updatedCandidates = st.candidates.map((c) =>
        c.id === target.candidateId
          ? {
              ...c,
              technicalScore: p.score,
              interviewStatus: target.status === "Completed" ? "Completed" : c.interviewStatus,
            }
          : c
      );
    }

    set({ interviews: ns, candidates: updatedCandidates });
    await syncCollection("interviews", set, ns);
    if (updatedCandidates !== st.candidates) {
      await syncCollection("candidates", set, updatedCandidates);
    }
  },

  // ─── OFFERS ────────────────────────────────────────
  addOffer: async (o) => {
    const st = get();
    const ns = [o, ...st.offers];
    const isAccepted = o.status === "Accepted";
    const updatedCandidates = st.candidates.map((c) =>
      c.id === o.candidateId ? { ...c, stage: isAccepted ? "Hired" : "Offer" } : c
    );
    set({ offers: ns, candidates: updatedCandidates });
    await syncCollection("offers", set, ns);
    await syncCollection("candidates", set, updatedCandidates);

    if (isAccepted) {
      const hiredCand = updatedCandidates.find((c) => c.id === o.candidateId);
      if (hiredCand) {
        syncCandidateToEmployee(hiredCand, ns, st.jobs);
      }
    }
  },

  updateOffer: async (id, p) => {
    const st = get();
    const ns = st.offers.map((o) => (o.id === id ? { ...o, ...p } : o));
    const target = ns.find((o) => o.id === id);

    let updatedCandidates = st.candidates;
    if (target && p.status === "Accepted") {
      updatedCandidates = st.candidates.map((c) =>
        c.id === target.candidateId ? { ...c, stage: "Hired" } : c
      );
      const hiredCand = updatedCandidates.find((c) => c.id === target.candidateId);
      if (hiredCand) {
        syncCandidateToEmployee(hiredCand, ns, st.jobs);
      }
    }

    set({ offers: ns, candidates: updatedCandidates });
    await syncCollection("offers", set, ns);
    if (updatedCandidates !== st.candidates) {
      await syncCollection("candidates", set, updatedCandidates);
    }
  },

  deleteOffer: async (id) => {
    const st = get();
    const ns = st.offers.filter((o) => o.id !== id);
    set({ offers: ns });
    await syncCollection("offers", set, ns);
  },

  // ─── QUESTIONS ─────────────────────────────────────
  addQuestion: async (q) => {
    const st = get();
    const ns = [q, ...st.questions];
    set({ questions: ns });
    await syncCollection("recruitmentQuestions", set, ns);
  },

  updateQuestion: async (id, p) => {
    const st = get();
    const ns = st.questions.map((q) => (q.id === id ? { ...q, ...p } : q));
    set({ questions: ns });
    await syncCollection("recruitmentQuestions", set, ns);
  },

  deleteQuestion: async (id) => {
    const st = get();
    const ns = st.questions.filter((q) => q.id !== id);
    set({ questions: ns });
    await syncCollection("recruitmentQuestions", set, ns);
  },

  toggleQuestion: async (id) => {
    const st = get();
    const ns = st.questions.map((q) => (q.id === id ? { ...q, enabled: !q.enabled, isActive: !q.enabled } : q));
    set({ questions: ns });
    await syncCollection("recruitmentQuestions", set, ns);
  },

  // ─── ONBOARDING ────────────────────────────────────
  completeOnboarding: async (candidateId) => {
    const st = get();
    const nextMap = { ...st.onboardedMap, [candidateId]: true };
    const cand = st.candidates.find((c) => c.id === candidateId);
    if (cand) {
      syncCandidateToEmployee(cand, st.offers, st.jobs);
    }
    const updatedCandidates = st.candidates.map((c) =>
      c.id === candidateId ? { ...c, isOnboarded: true } : c
    );
    set({ onboardedMap: nextMap, candidates: updatedCandidates });

    if (candidateId && typeof candidateId === "string" && candidateId.length === 36 && candidateId.includes("-")) {
      try {
        await completeCandidateOnboarding(candidateId);
      } catch (err) {
        console.warn("[recruitmentStore] completeOnboarding backend call:", err);
      }
    }
    await syncCollection("candidates", set, updatedCandidates);
  },

  verifyDocuments: async (candidateId) => {
    const st = get();
    const nextMap = { ...st.verifiedDocsMap, [candidateId]: true };
    const updatedCandidates = st.candidates.map((c) =>
      c.id === candidateId ? { ...c, documentsVerified: true } : c
    );
    set({ verifiedDocsMap: nextMap, candidates: updatedCandidates });

    if (candidateId && typeof candidateId === "string" && candidateId.length === 36 && candidateId.includes("-")) {
      try {
        await verifyCandidateDocuments(candidateId);
      } catch (err) {
        console.warn("[recruitmentStore] verifyDocuments backend call:", err);
      }
    }
    await syncCollection("candidates", set, updatedCandidates);
  },

  // ─── APPLICATIONS CRUD ─────────────────────────────
  addApplication: async (app) => {
    const st = get();
    const ns = [app, ...st.applications];
    set({ applications: ns });
    await syncCollection("applications", set, ns);
  },

  updateApplication: async (id, patch) => {
    const st = get();
    const ns = st.applications.map((a) => (a.id === id ? { ...a, ...patch } : a));
    set({ applications: ns });
    await syncCollection("applications", set, ns);
  },

  deleteApplication: async (id) => {
    const st = get();
    const ns = st.applications.filter((a) => a.id !== id);
    set({ applications: ns });
    await syncCollection("applications", set, ns);
  },

  // ─── ONBOARDING RECORDS CRUD ───────────────────────
  addOnboarding: async (item) => {
    const st = get();
    const ns = [item, ...st.onboarding];
    set({ onboarding: ns });
    await syncCollection("onboarding", set, ns);
  },

  updateOnboarding: async (id, patch) => {
    const st = get();
    const ns = st.onboarding.map((item) => (item.id === id ? { ...item, ...patch } : item));
    set({ onboarding: ns });
    await syncCollection("onboarding", set, ns);
  },

  deleteOnboarding: async (id) => {
    const st = get();
    const ns = st.onboarding.filter((item) => item.id !== id);
    set({ onboarding: ns });
    await syncCollection("onboarding", set, ns);
  },
}));

// Hydrated the first time a screen reads it, not at boot — services/lazyModules.
export const useRecruitmentStore = lazyStore(useRecruitmentStoreBase, "recruitment");

