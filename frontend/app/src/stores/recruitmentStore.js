import { create } from "zustand";
import {
  jobsMock,
  candidatesMock,
  interviewsMock,
  offersMock,
  questionsMock,
} from "../data/hrms/data/recruitmentData";

const LS = "hrms_recruitment_v1";

function load() {
  try {
    const v = localStorage.getItem(LS);
    if (v) return JSON.parse(v);
  } catch {}
  return null;
}

const s = load();

function persist(state) {
  try {
    localStorage.setItem(
      LS,
      JSON.stringify({
        jobs: state.jobs,
        candidates: state.candidates,
        interviews: state.interviews,
        offers: state.offers,
        questions: state.questions,
        onboardedMap: state.onboardedMap,
        verifiedDocsMap: state.verifiedDocsMap,
      })
    );
  } catch {}
}

export const useRecruitmentStore = create((set) => ({
  jobs: s?.jobs ?? jobsMock,
  candidates: s?.candidates ?? candidatesMock,
  interviews: s?.interviews ?? interviewsMock,
  offers: s?.offers ?? offersMock,
  questions: s?.questions ?? questionsMock,
  onboardedMap: s?.onboardedMap ?? { "CAND-008": true },
  verifiedDocsMap: s?.verifiedDocsMap ?? { "CAND-008": true },

  toast: null,
  showToast: (msg) => set({ toast: { msg, id: Date.now().toString() } }),
  clear: () => set({ toast: null }),

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
        jobId: matchedJob?.id || c.jobId || "JOB-001",
        position: matchedJob?.title || c.position || "Senior Backend Developer",
      };

      const ns = [enrichedCand, ...st.candidates];
      const updatedJobs = st.jobs.map((j) =>
        j.id === enrichedCand.jobId ? { ...j, applicants: (j.applicants || 0) + 1 } : j
      );

      persist({ ...st, candidates: ns, jobs: updatedJobs });
      return { candidates: ns, jobs: updatedJobs };
    }),

  updateCandidate: (id, p) =>
    set((st) => {
      const ns = st.candidates.map((c) => (c.id === id ? { ...c, ...p } : c));
      persist({ ...st, candidates: ns });
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
      // Automatically advance candidate stage to "Offer"
      const updatedCandidates = st.candidates.map((c) =>
        c.id === o.candidateId ? { ...c, stage: "Offer" } : c
      );
      persist({ ...st, offers: ns, candidates: updatedCandidates });
      return { offers: ns, candidates: updatedCandidates };
    }),

  updateOffer: (id, p) =>
    set((st) => {
      const ns = st.offers.map((o) => (o.id === id ? { ...o, ...p } : o));
      const target = ns.find((o) => o.id === id);

      // If offer is Accepted, promote candidate stage to "Hired"
      let updatedCandidates = st.candidates;
      if (target && p.status === "Accepted") {
        updatedCandidates = st.candidates.map((c) =>
          c.id === target.candidateId ? { ...c, stage: "Hired" } : c
        );
      }

      persist({ ...st, offers: ns, candidates: updatedCandidates });
      return { offers: ns, candidates: updatedCandidates };
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
      persist({ ...st, onboardedMap: nextMap });
      return { onboardedMap: nextMap };
    }),

  verifyDocuments: (candidateId) =>
    set((st) => {
      const nextMap = { ...st.verifiedDocsMap, [candidateId]: true };
      persist({ ...st, verifiedDocsMap: nextMap });
      return { verifiedDocsMap: nextMap };
    }),
}));
