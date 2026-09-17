import { create } from "zustand";
import { useCalendarStore } from "./calendarStore";

const STORAGE_KEY = "hrms_trainings_v2";
const TRAINERS_KEY = "hrms_trainers_v2";

export const TRAINING_FUNNEL_STAGES = [
  {
    key: "Requested",
    label: "Requested",
    badgeClass: "bg-[#334155] text-white border-[#1e293b]",
    subtitle: "Need identified, trainer not fixed.",
    dotClass: "bg-slate-600",
  },
  {
    key: "Trainer Assigned",
    label: "Trainer Assigned",
    badgeClass: "bg-[#06b6d4] text-white border-[#0891b2]",
    subtitle: "Internal or external trainer confirmed.",
    dotClass: "bg-cyan-500",
  },
  {
    key: "Scheduled",
    label: "Scheduled",
    badgeClass: "bg-[#1d4ed8] text-white border-[#1e40af]",
    subtitle: "Dates locked and communicated.",
    dotClass: "bg-blue-600",
  },
  {
    key: "Ongoing",
    label: "Ongoing",
    badgeClass: "bg-[#f59e0b] text-white border-[#d97706]",
    subtitle: "Training in progress.",
    dotClass: "bg-amber-500",
  },
  {
    key: "Completed",
    label: "Completed",
    badgeClass: "bg-[#22c55e] text-white border-[#16a34a]",
    subtitle: "Delivered, awaiting evaluation.",
    dotClass: "bg-green-500",
  },
  {
    key: "Evaluated",
    label: "Evaluated",
    badgeClass: "bg-[#84cc16] text-white border-[#65a30d]",
    subtitle: "Performance rated and closed.",
    dotClass: "bg-lime-500",
  },
  {
    key: "Cancelled",
    label: "Cancelled",
    badgeClass: "bg-[#f43f5e] text-white border-[#e11d48]",
    subtitle: "Dropped or terminated.",
    dotClass: "bg-rose-500",
  },
];

export const INITIAL_TRAININGS = [
  // 1. Requested
  {
    id: "TRN-101",
    name: "AI-Assisted Workflow & Prompt Engineering",
    trainer: "Unassigned",
    avatar: null,
    trainerType: "External",
    department: "Engineering",
    type: "Technical",
    participants: 16,
    start: "05 Nov 2024",
    end: "06 Nov 2024",
    stage: "Requested",
    status: "Requested",
    cost: 25000,
    location: "Training Hall B",
    description: "Hands-on generative AI integration for developers and product designers.",
  },
  {
    id: "TRN-102",
    name: "Negotiation & Enterprise Objection Handling",
    trainer: "Unassigned",
    avatar: null,
    trainerType: "External",
    department: "Marketing",
    type: "Leadership",
    participants: 12,
    start: "12 Nov 2024",
    end: "13 Nov 2024",
    stage: "Requested",
    status: "Requested",
    cost: 18000,
    location: "Online / Zoom",
    description: "Enterprise deal closing and consultative negotiation playbooks.",
  },

  // 2. Trainer Assigned
  {
    id: "TRN-103",
    name: "Financial Modeling & SaaS Unit Economics",
    trainer: "James Wilson",
    avatar: "https://i.pravatar.cc/100?img=12",
    trainerType: "Internal",
    department: "Finance",
    type: "Technical",
    participants: 10,
    start: "28 Oct 2024",
    end: "29 Oct 2024",
    stage: "Trainer Assigned",
    status: "Trainer Assigned",
    cost: 35000,
    location: "Conference Room 2",
    description: "CAC/LTV metrics, revenue recognition, and runway modeling.",
  },
  {
    id: "TRN-104",
    name: "Design System & Figma Variables Deep Dive",
    trainer: "Marcus Chen",
    avatar: "https://i.pravatar.cc/100?img=16",
    trainerType: "Internal",
    department: "Design",
    type: "Design",
    participants: 14,
    start: "30 Oct 2024",
    end: "31 Oct 2024",
    stage: "Trainer Assigned",
    status: "Trainer Assigned",
    cost: 22000,
    location: "Studio 1",
    description: "Multi-brand token governance and atomic component documentation.",
  },

  // 3. Scheduled
  {
    id: "TRN-105",
    name: "Leadership Essentials & Coaching 101",
    trainer: "Sarah Mitchell",
    avatar: "https://i.pravatar.cc/100?img=8",
    trainerType: "Internal",
    department: "HR",
    type: "Leadership",
    participants: 24,
    start: "18 Oct 2024",
    end: "19 Oct 2024",
    stage: "Scheduled",
    status: "Scheduled",
    cost: 45000,
    location: "Auditorium & Zoom",
    description: "Management foundations, psychological safety, and delegation mastery.",
  },
  {
    id: "TRN-106",
    name: "Cloud Architecture & Kubernetes Security",
    trainer: "David Park",
    avatar: "https://i.pravatar.cc/100?img=11",
    trainerType: "Internal",
    department: "Engineering",
    type: "Technical",
    participants: 20,
    start: "25 Oct 2024",
    end: "26 Oct 2024",
    stage: "Scheduled",
    status: "Scheduled",
    cost: 55000,
    location: "Lab Room Alpha",
    description: "Container security policies, zero-trust clusters, and ingress hardening.",
  },

  // 4. Ongoing
  {
    id: "TRN-107",
    name: "Agile Sprint Delivery & Scrum Masterclass",
    trainer: "Chen Li",
    avatar: "https://i.pravatar.cc/100?img=34",
    trainerType: "Internal",
    department: "Operations",
    type: "Operations",
    participants: 18,
    start: "10 Oct 2024",
    end: "14 Oct 2024",
    stage: "Ongoing",
    status: "Ongoing",
    cost: 30000,
    location: "Meeting Room 3",
    description: "Active sprint cycle simulations, velocity stabilization, and unblocking habits.",
  },
  {
    id: "TRN-108",
    name: "Advanced React & Next.js Architecture",
    trainer: "Priya Patel",
    avatar: "https://i.pravatar.cc/100?img=15",
    trainerType: "Internal",
    department: "Engineering",
    type: "Technical",
    participants: 22,
    start: "09 Oct 2024",
    end: "12 Oct 2024",
    stage: "Ongoing",
    status: "Ongoing",
    cost: 48000,
    location: "Dev Lounge",
    description: "Server actions, edge rendering, bundle optimization, and streaming SSR.",
  },

  // 5. Completed
  {
    id: "TRN-109",
    name: "Secure Coding 101 & OWASP Top 10",
    trainer: "David Park",
    avatar: "https://i.pravatar.cc/100?img=11",
    trainerType: "Internal",
    department: "Engineering",
    type: "Technical",
    participants: 32,
    start: "08 Oct 2024",
    end: "08 Oct 2024",
    stage: "Completed",
    status: "Completed",
    cost: 35000,
    location: "Training Hall A",
    description: "Sanitization, authorization flaws, and secrets management in CI pipelines.",
  },
  {
    id: "TRN-110",
    name: "Effective Workplace Communication & PoSH",
    trainer: "Ayesha Khan",
    avatar: "https://i.pravatar.cc/100?img=5",
    trainerType: "Internal",
    department: "HR",
    type: "Leadership",
    participants: 50,
    start: "05 Oct 2024",
    end: "05 Oct 2024",
    stage: "Completed",
    status: "Completed",
    cost: 20000,
    location: "Main Auditorium",
    description: "Annual mandatory compliance, active listening, and conflict de-escalation.",
  },

  // 6. Evaluated
  {
    id: "TRN-111",
    name: "Data Analytics & SQL Mastery",
    trainer: "Priya Patel",
    avatar: "https://i.pravatar.cc/100?img=15",
    trainerType: "Internal",
    department: "Product",
    type: "Technical",
    participants: 15,
    start: "28 Sep 2024",
    end: "29 Sep 2024",
    stage: "Evaluated",
    status: "Evaluated",
    cost: 42000,
    location: "Room 101",
    description: "Window functions, cohorts, and warehouse schema optimization.",
    rating: 4.9,
  },
  {
    id: "TRN-112",
    name: "Brand Storytelling & Growth Marketing",
    trainer: "Elena Rostova",
    avatar: "https://i.pravatar.cc/100?img=21",
    trainerType: "Internal",
    department: "Marketing",
    type: "Workshop",
    participants: 16,
    start: "22 Sep 2024",
    end: "23 Sep 2024",
    stage: "Evaluated",
    status: "Evaluated",
    cost: 28000,
    location: "Creative Suite",
    description: "Multichannel narrative, organic acquisition hooks, and retention loops.",
    rating: 4.7,
  },

  // 7. Cancelled
  {
    id: "TRN-113",
    name: "Legacy Monolith to Go Migration Workshop",
    trainer: "External Agency",
    avatar: null,
    trainerType: "External",
    department: "Engineering",
    type: "Technical",
    participants: 8,
    start: "15 Sep 2024",
    end: "16 Sep 2024",
    stage: "Cancelled",
    status: "Cancelled",
    cost: 15000,
    location: "Cancelled",
    description: "Postponed due to Q4 microservice roadmap reprioritization.",
  },
];

export const INITIAL_TRAINERS = [
  { id: "TRNR-01", name: "Sarah Mitchell", avatar: "https://i.pravatar.cc/100?img=8", specialization: "Leadership", email: "sarah.m@company.com", phone: "+1 212-555-0141", programs: 4, status: "Active" },
  { id: "TRNR-02", name: "David Park", avatar: "https://i.pravatar.cc/100?img=11", specialization: "Engineering", email: "david.p@company.com", phone: "+44 20-7946-0958", programs: 5, status: "Active" },
  { id: "TRNR-03", name: "Marcus Chen", avatar: "https://i.pravatar.cc/100?img=16", specialization: "Design", email: "marcus.c@company.com", phone: "+44 20-7946-0123", programs: 3, status: "Active" },
  { id: "TRNR-04", name: "Elena Rostova", avatar: "https://i.pravatar.cc/100?img=21", specialization: "Marketing", email: "elena.r@company.com", phone: "+1 212-555-0188", programs: 2, status: "On Leave" },
  { id: "TRNR-05", name: "James Wilson", avatar: "https://i.pravatar.cc/100?img=12", specialization: "Finance", email: "james.w@company.com", phone: "+1 212-555-0199", programs: 2, status: "Active" },
  { id: "TRNR-06", name: "Chen Li", avatar: "https://i.pravatar.cc/100?img=34", specialization: "Operations", email: "chen.l@company.com", phone: "+971 4-555-0144", programs: 3, status: "Active" },
  { id: "TRNR-07", name: "Priya Patel", avatar: "https://i.pravatar.cc/100?img=15", specialization: "Engineering", email: "priya.p@company.com", phone: "+1 212-555-0160", programs: 3, status: "Active" },
  { id: "TRNR-08", name: "Ayesha Khan", avatar: "https://i.pravatar.cc/100?img=5", specialization: "Leadership", email: "ayesha.k@company.com", phone: "+1 212-555-0145", programs: 3, status: "Active" },
];

function loadTrainings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_TRAININGS;
}

function loadTrainers() {
  try {
    const raw = localStorage.getItem(TRAINERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_TRAINERS;
}

export const useTrainingStore = create((set, get) => ({
  trainings: loadTrainings(),
  trainers: loadTrainers(),

  addTraining: (item) => {
    const newId = `TRN-${Date.now().toString().slice(-4)}`;
    const created = {
      id: newId,
      stage: item.stage || "Requested",
      status: item.stage || "Requested",
      cost: Number(item.cost) || 0,
      participants: Number(item.participants) || 1,
      start: item.start || "18 Oct 2024",
      end: item.end || item.start || "19 Oct 2024",
      department: item.department || "General",
      type: item.type || "Technical",
      trainer: item.trainer || "Unassigned",
      avatar: item.avatar || (item.trainer && item.trainer !== "Unassigned" ? "https://i.pravatar.cc/100?img=11" : null),
      ...item,
    };

    set((state) => {
      const updated = [created, ...state.trainings];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return { trainings: updated };
    });

    // Synchronize to Calendar if scheduled
    if (created.startDate) {
      try {
        useCalendarStore.getState().addEvent({
          id: `EV-TRN-${created.id}`,
          title: `Training: ${created.title}`,
          date: created.startDate,
          startDate: created.startDate,
          endDate: created.endDate || created.startDate,
          type: "Training",
          category: "Training Program",
          time: created.time || "10:00 AM - 01:00 PM",
          location: created.mode === "Online" ? "Zoom Webinar" : "Training Room 2",
          dept: created.department || "All Staff",
          organizer: created.trainer || "L&D Lead",
          description: `${created.type} workshop. Enrolled: ${created.participants || 12} participants.`,
        });
      } catch (err) {
        console.error("Calendar sync error:", err);
      }
    }

    return created;
  },

  updateTraining: (id, updates) => {
    set((state) => {
      const updated = state.trainings.map((t) => {
        if (t.id === id) {
          const next = { ...t, ...updates };
          if (updates.stage) next.status = updates.stage;
          if (updates.status && !updates.stage) next.stage = updates.status;

          // If stage changed to Scheduled or has startDate, sync calendar
          if (next.startDate && (next.stage === "Scheduled" || next.stage === "Ongoing")) {
            try {
              useCalendarStore.getState().addEvent({
                id: `EV-TRN-${next.id}`,
                title: `Training: ${next.title}`,
                date: next.startDate,
                startDate: next.startDate,
                endDate: next.endDate || next.startDate,
                type: "Training",
                category: "Training Program",
                time: next.time || "10:00 AM - 01:00 PM",
                location: next.mode === "Online" ? "Zoom Webinar" : "Training Room 2",
                dept: next.department || "All Staff",
                organizer: next.trainer || "L&D Lead",
                description: `${next.type} workshop. Enrolled: ${next.participants || 12} participants.`,
              });
            } catch {}
          }

          return next;
        }
        return t;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return { trainings: updated };
    });
  },

  moveTrainingStage: (id, newStage) => {
    set((state) => {
      const updated = state.trainings.map((t) => {
        if (t.id === id) {
          return { ...t, stage: newStage, status: newStage };
        }
        return t;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return { trainings: updated };
    });
  },

  deleteTraining: (id) => {
    set((state) => {
      const updated = state.trainings.filter((t) => t.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return { trainings: updated };
    });
  },

  addTrainer: (trainer) => {
    const id = `TRNR-${Date.now().toString().slice(-3)}`;
    const newTrainer = {
      id,
      avatar: `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 40) + 5}`,
      programs: 0,
      status: "Active",
      ...trainer,
    };
    set((state) => {
      const updated = [newTrainer, ...state.trainers];
      try {
        localStorage.setItem(TRAINERS_KEY, JSON.stringify(updated));
      } catch {}
      return { trainers: updated };
    });
    return newTrainer;
  },

  updateTrainer: (id, updates) => {
    set((state) => {
      const updated = state.trainers.map((tr) => (tr.id === id ? { ...tr, ...updates } : tr));
      try {
        localStorage.setItem(TRAINERS_KEY, JSON.stringify(updated));
      } catch {}
      return { trainers: updated };
    });
  },

  deleteTrainer: (id) => {
    set((state) => {
      const updated = state.trainers.filter((tr) => tr.id !== id);
      try {
        localStorage.setItem(TRAINERS_KEY, JSON.stringify(updated));
      } catch {}
      return { trainers: updated };
    });
  },

  resetToDefaults: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TRAININGS));
      localStorage.setItem(TRAINERS_KEY, JSON.stringify(INITIAL_TRAINERS));
    } catch {}
    set({ trainings: INITIAL_TRAININGS, trainers: INITIAL_TRAINERS });
  },
}));
