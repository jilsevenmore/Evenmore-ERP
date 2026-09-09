import { create } from "zustand";
import { jobsMock, candidatesMock, interviewsMock, offersMock } from "../data/hrms/data/recruitmentData";
const LS = "hrms_recruitment_v1";
function load() {
  try {
    const v = localStorage.getItem(LS);
    if (v) return JSON.parse(v);
  } catch {
  }
  return null;
}
const s = load();
export const useRecruitmentStore = create((set) => ({
  jobs: s?.jobs ?? jobsMock,
  candidates: s?.candidates ?? candidatesMock,
  interviews: s?.interviews ?? interviewsMock,
  offers: s?.offers ?? offersMock,
  toast: null,
  showToast: (msg) => set({ toast: { msg, id: Date.now().toString() } }),
  clear: () => set({ toast: null }),
  addJob: (j) => set((st) => {
    const ns = [j, ...st.jobs];
    localStorage.setItem(
      LS,
      JSON.stringify({ jobs: ns, candidates: st.candidates, interviews: st.interviews, offers: st.offers })
    );
    return { jobs: ns };
  }),
  updateJob: (id, p) => set((st) => {
    const ns = st.jobs.map((j) => j.id === id ? { ...j, ...p } : j);
    localStorage.setItem(
      LS,
      JSON.stringify({ jobs: ns, candidates: st.candidates, interviews: st.interviews, offers: st.offers })
    );
    return { jobs: ns };
  }),
  deleteJob: (id) => set((st) => {
    const ns = st.jobs.filter((j) => j.id !== id);
    localStorage.setItem(
      LS,
      JSON.stringify({ jobs: ns, candidates: st.candidates, interviews: st.interviews, offers: st.offers })
    );
    return { jobs: ns };
  }),
  addCandidate: (c) => set((st) => {
    const ns = [c, ...st.candidates];
    const jobs = st.jobs.map((j) => j.id === c.jobId ? { ...j, applicants: (j.applicants || 0) + 1 } : j);
    localStorage.setItem(
      LS,
      JSON.stringify({ jobs, candidates: ns, interviews: st.interviews, offers: st.offers })
    );
    return { candidates: ns, jobs };
  }),
  updateCandidate: (id, p) => set((st) => {
    const ns = st.candidates.map((c) => c.id === id ? { ...c, ...p } : c);
    localStorage.setItem(
      LS,
      JSON.stringify({ jobs: st.jobs, candidates: ns, interviews: st.interviews, offers: st.offers })
    );
    return { candidates: ns };
  }),
  deleteCandidate: (id) => set((st) => {
    const ns = st.candidates.filter((c) => c.id !== id);
    localStorage.setItem(
      LS,
      JSON.stringify({ jobs: st.jobs, candidates: ns, interviews: st.interviews, offers: st.offers })
    );
    return { candidates: ns };
  }),
  changeStage: (id, stage) => set((st) => {
    const ns = st.candidates.map((c) => c.id === id ? { ...c, stage } : c);
    localStorage.setItem(
      LS,
      JSON.stringify({ jobs: st.jobs, candidates: ns, interviews: st.interviews, offers: st.offers })
    );
    return { candidates: ns };
  }),
  addInterview: (i) => set((st) => {
    const ns = [i, ...st.interviews];
    localStorage.setItem(
      LS,
      JSON.stringify({ jobs: st.jobs, candidates: st.candidates, interviews: ns, offers: st.offers })
    );
    return { interviews: ns };
  }),
  updateInterview: (id, p) => set((st) => {
    const ns = st.interviews.map((i) => i.id === id ? { ...i, ...p } : i);
    localStorage.setItem(
      LS,
      JSON.stringify({ jobs: st.jobs, candidates: st.candidates, interviews: ns, offers: st.offers })
    );
    return { interviews: ns };
  }),
  addOffer: (o) => set((st) => {
    const ns = [o, ...st.offers];
    localStorage.setItem(
      LS,
      JSON.stringify({ jobs: st.jobs, candidates: st.candidates, interviews: st.interviews, offers: ns })
    );
    return { offers: ns };
  }),
  updateOffer: (id, p) => set((st) => {
    const ns = st.offers.map((o) => o.id === id ? { ...o, ...p } : o);
    localStorage.setItem(
      LS,
      JSON.stringify({ jobs: st.jobs, candidates: st.candidates, interviews: st.interviews, offers: ns })
    );
    return { offers: ns };
  })
}));
