import { create } from "zustand";
import { lazyStore } from "../services/lazyModules";
import { writeThrough, pullTracked } from "../services/hrmsSync";
import { useAppStore } from "./appStore";
import { api } from "../services/api";

export function syncCandidateToEmployee(candidate, offers = [], jobs = []) {
  if (!candidate || candidate.stage !== "Hired") return;
  // If candidate is already linked to an employee record, no duplicate creation needed
  if (candidate.employee || candidate.employeeId) return;

  try {
    const appState = useAppStore.getState();
    const employees = appState?.employees || [];
    const alreadyExists = employees.some(
      (e) => (candidate.email && e.email?.toLowerCase().trim() === candidate.email.toLowerCase().trim()) ||
             (candidate.name && e.name?.toLowerCase().trim() === candidate.name.toLowerCase().trim())
    );
    if (!alreadyExists && employees.length > 0) {
      const matchingOffer = (offers || []).find((o) => o.candidateId === candidate.id);
      const matchedJob = (jobs || []).find((j) => j.id === candidate.jobId || j.title === candidate.position);
      const newEmp = {
        name: candidate.name,
        email: candidate.email || undefined,
        phone: candidate.phone || undefined,
        avatar: candidate.avatar || undefined,
        img: candidate.avatar || undefined,
        designation: candidate.position || matchedJob?.title || "Staff Member",
        department: matchingOffer?.dept || matchedJob?.department || "General",
        location: candidate.location || matchingOffer?.location || "",
        joining: matchingOffer?.joiningDate || new Date().toISOString().split("T")[0],
        joiningDate: matchingOffer?.joiningDate || new Date().toISOString().split("T")[0],
        status: "Active",
        createUserAccount: true,
      };
      appState.addEmployee(newEmp).catch(() => {});
    }

    if (candidate.id && typeof candidate.id === "string" && candidate.id.length === 36 && candidate.id.includes("-")) {
      api.post(`/hrms/candidates/${candidate.id}/hire/`).catch(() => {});
    }
  } catch (err) {
    console.warn("Could not sync candidate to employee:", err);
  }
}

/**
 * Every action hands the whole recruitment state here after changing part of
 * it. Each collection is written through to its own endpoint; `writeThrough`
 * works out which rows are new, changed or gone, so a change to jobs does not
 * touch candidates.
 */
function persist(state) {
  writeThrough("jobs", state.jobs);
  writeThrough("candidates", state.candidates);
  writeThrough("interviews", state.interviews);
  writeThrough("offers", state.offers);
  writeThrough("applications", state.applications);
  writeThrough("onboarding", state.onboarding);
  writeThrough("recruitmentQuestions", state.questions);
}

const useRecruitmentStoreBase = create((set) => ({
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
    const loadedOffers = rows[3] || [];
    const loadedJobs = rows[0] || [];

    set((s) => ({
      jobs: rows[0] || s.jobs,
      candidates: rows[1] || s.candidates,
      interviews: rows[2] || s.interviews,
      offers: rows[3] || s.offers,
      questions: rows[4] || s.questions,
      applications: rows[5] || s.applications,
      onboarding: rows[6] || s.onboarding,
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
  addJob: (j) =>
    set((st) => {
      const ns = [j, ...st.jobs];
      persist({ ...st, jobs: ns });
      return { jobs: ns };
    }),

  updateJob: (id, p) =>
    set((st) => {
      const ns = st.jobs.map((j) => (j.id === id ? { ...j, ...p } : j));
      persist({ ...st, jobs: ns });
      return { jobs: ns };
    }),

  deleteJob: (id) =>
    set((st) => {
      const ns = st.jobs.filter((j) => j.id !== id);
      persist({ ...st, jobs: ns });
      return { jobs: ns };
    }),

  // ─── CANDIDATES ────────────────────────────────────
  addCandidate: (c) =>
    set((st) => {
      // If no explicit jobId is provided, find matching job by title
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

      persist({ ...st, candidates: ns, jobs: updatedJobs });
      if (enrichedCand.stage === "Hired") {
        syncCandidateToEmployee(enrichedCand, st.offers, st.jobs);
      }
      return { candidates: ns, jobs: updatedJobs };
    }),

  updateCandidate: (id, p) =>
    set((st) => {
      const ns = st.candidates.map((c) => (c.id === id ? { ...c, ...p } : c));
      persist({ ...st, candidates: ns });
      const updated = ns.find((c) => c.id === id);
      if (updated && updated.stage === "Hired") {
        syncCandidateToEmployee(updated, st.offers, st.jobs);
      }
      return { candidates: ns };
    }),

  deleteCandidate: (id) =>
    set((st) => {
      const ns = st.candidates.filter((c) => c.id !== id);
      persist({ ...st, candidates: ns });
      return { candidates: ns };
    }),

  changeStage: (id, stage) =>
    set((st) => {
      const ns = st.candidates.map((c) => (c.id === id ? { ...c, stage } : c));
      persist({ ...st, candidates: ns });
      const target = ns.find((c) => c.id === id);
      if (target && stage === "Hired") {
        syncCandidateToEmployee(target, st.offers, st.jobs);
      }
      return { candidates: ns };
    }),

  // ─── INTERVIEWS ────────────────────────────────────
  addInterview: (i) =>
    set((st) => {
      const ns = [i, ...st.interviews];
      // Update candidate's interviewStatus if candidate exists
      const updatedCandidates = st.candidates.map((c) =>
        c.id === i.candidateId ? { ...c, interviewStatus: "Scheduled" } : c
      );
      persist({ ...st, interviews: ns, candidates: updatedCandidates });
      return { interviews: ns, candidates: updatedCandidates };
    }),

  updateInterview: (id, p) =>
    set((st) => {
      const ns = st.interviews.map((i) => (i.id === id ? { ...i, ...p } : i));
      const target = ns.find((i) => i.id === id);

      // If interview is marked completed with score, sync with candidate
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

      persist({ ...st, interviews: ns, candidates: updatedCandidates });
      return { interviews: ns, candidates: updatedCandidates };
    }),

  // ─── OFFERS ────────────────────────────────────────
  addOffer: (o) =>
    set((st) => {
      const ns = [o, ...st.offers];
      const isAccepted = o.status === "Accepted";
      // Advance candidate stage to "Offer" or "Hired" if accepted
      const updatedCandidates = st.candidates.map((c) =>
        c.id === o.candidateId ? { ...c, stage: isAccepted ? "Hired" : "Offer" } : c
      );
      persist({ ...st, offers: ns, candidates: updatedCandidates });
      if (isAccepted) {
        const hiredCand = updatedCandidates.find((c) => c.id === o.candidateId);
        if (hiredCand) {
          syncCandidateToEmployee(hiredCand, ns, st.jobs);
        }
      }
      return { offers: ns, candidates: updatedCandidates };
    }),

  updateOffer: (id, p) =>
    set((st) => {
      const ns = st.offers.map((o) => (o.id === id ? { ...o, ...p } : o));
      const target = ns.find((o) => o.id === id);

      // If offer is Accepted, promote candidate stage to "Hired" and sync to Employee Directory
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

      persist({ ...st, offers: ns, candidates: updatedCandidates });
      return { offers: ns, candidates: updatedCandidates };
    }),

  deleteOffer: (id) =>
    set((st) => {
      const ns = st.offers.filter((o) => o.id !== id);
      persist({ ...st, offers: ns });
      return { offers: ns };
    }),

  // ─── QUESTIONS ─────────────────────────────────────
  addQuestion: (q) =>
    set((st) => {
      const ns = [q, ...st.questions];
      persist({ ...st, questions: ns });
      return { questions: ns };
    }),

  updateQuestion: (id, p) =>
    set((st) => {
      const ns = st.questions.map((q) => (q.id === id ? { ...q, ...p } : q));
      persist({ ...st, questions: ns });
      return { questions: ns };
    }),

  deleteQuestion: (id) =>
    set((st) => {
      const ns = st.questions.filter((q) => q.id !== id);
      persist({ ...st, questions: ns });
      return { questions: ns };
    }),

  toggleQuestion: (id) =>
    set((st) => {
      const ns = st.questions.map((q) => (q.id === id ? { ...q, enabled: !q.enabled } : q));
      persist({ ...st, questions: ns });
      return { questions: ns };
    }),

  // ─── ONBOARDING ────────────────────────────────────
  completeOnboarding: (candidateId) =>
    set((st) => {
      const nextMap = { ...st.onboardedMap, [candidateId]: true };
      const cand = st.candidates.find((c) => c.id === candidateId);
      if (cand) {
        syncCandidateToEmployee(cand, st.offers, st.jobs);
      }
      persist({ ...st, onboardedMap: nextMap });
      return { onboardedMap: nextMap };
    }),

  verifyDocuments: (candidateId) =>
    set((st) => {
      const nextMap = { ...st.verifiedDocsMap, [candidateId]: true };
      persist({ ...st, verifiedDocsMap: nextMap });
      return { verifiedDocsMap: nextMap };
    }),

  // ─── APPLICATIONS CRUD ─────────────────────────────
  addApplication: (app) =>
    set((st) => {
      const ns = [app, ...st.applications];
      persist({ ...st, applications: ns });
      return { applications: ns };
    }),

  updateApplication: (id, patch) =>
    set((st) => {
      const ns = st.applications.map((a) => (a.id === id ? { ...a, ...patch } : a));
      persist({ ...st, applications: ns });
      return { applications: ns };
    }),

  deleteApplication: (id) =>
    set((st) => {
      const ns = st.applications.filter((a) => a.id !== id);
      persist({ ...st, applications: ns });
      return { applications: ns };
    }),

  // ─── ONBOARDING RECORDS CRUD ───────────────────────
  addOnboarding: (item) =>
    set((st) => {
      const ns = [item, ...st.onboarding];
      persist({ ...st, onboarding: ns });
      return { onboarding: ns };
    }),

  updateOnboarding: (id, patch) =>
    set((st) => {
      const ns = st.onboarding.map((item) => (item.id === id ? { ...item, ...patch } : item));
      persist({ ...st, onboarding: ns });
      return { onboarding: ns };
    }),

  deleteOnboarding: (id) =>
    set((st) => {
      const ns = st.onboarding.filter((item) => item.id !== id);
      persist({ ...st, onboarding: ns });
      return { onboarding: ns };
    }),
}));

// Hydrated the first time a screen reads it, not at boot — services/lazyModules.
export const useRecruitmentStore = lazyStore(useRecruitmentStoreBase, "recruitment");
