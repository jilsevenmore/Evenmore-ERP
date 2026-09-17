import { create } from "zustand";

const STORAGE_KEY = "hrms_calendar_events_v2";

export const INITIAL_HRMS_EVENTS = [
  // --- Meetings ---
  {
    id: "EV-01",
    title: "Quarterly Townhall & Growth Review",
    date: "2024-10-11",
    startDate: "2024-10-11",
    endDate: "2024-10-11",
    type: "Meeting",
    time: "10:00 AM - 11:30 AM",
    location: "Main Auditorium & Zoom",
    dept: "All Staff",
    organizer: "Sarah Mitchell (CEO)",
    description: "Company performance updates, Q3 wins, Q4 strategic roadmap, and open AMA session.",
    virtualLink: "https://zoom.us/j/townhall-q4",
  },
  {
    id: "EV-02",
    title: "Sprint Planning & Backlog Grooming",
    date: "2024-10-14",
    startDate: "2024-10-14",
    endDate: "2024-10-14",
    type: "Meeting",
    time: "11:00 AM - 12:30 PM",
    location: "Meeting Room Alpha",
    dept: "Engineering",
    organizer: "David Park (CTO)",
    description: "Bi-weekly sprint commitment, user story sizing, and architecture alignment.",
    virtualLink: "https://meet.google.com/eng-sprint",
  },
  {
    id: "EV-03",
    title: "Executive Board & Leadership Sync",
    date: "2024-10-23",
    startDate: "2024-10-23",
    endDate: "2024-10-23",
    type: "Meeting",
    time: "03:00 PM - 04:30 PM",
    location: "Executive Boardroom",
    dept: "Executive Leadership",
    organizer: "Sarah Mitchell (CEO)",
    description: "Budget allocation for upcoming financial year and investor update preparation.",
  },

  // --- Leaves & Vacations ---
  {
    id: "EV-04",
    title: "Annual Leave — Planned (Priya Patel)",
    date: "2024-10-01",
    startDate: "2024-10-01",
    endDate: "2024-10-01",
    type: "Leave",
    time: "Full Day",
    location: "Out of Office",
    dept: "Engineering",
    organizer: "Priya Patel",
    description: "Approved annual leave. Handover assigned to Marcus Chen.",
  },
  {
    id: "EV-05",
    title: "Family Vacation — Liam Cooper",
    date: "2024-10-20",
    startDate: "2024-10-20",
    endDate: "2024-10-24",
    type: "Leave",
    time: "Multi-Day",
    location: "Out of Office",
    dept: "Engineering",
    organizer: "Liam Cooper",
    description: "Approved annual leave for family travel. Delegate: Priya Patel.",
  },
  {
    id: "EV-06",
    title: "Sick Leave — Sophia Lindqvist",
    date: "2024-10-12",
    startDate: "2024-10-12",
    endDate: "2024-10-13",
    type: "Leave",
    time: "2 Days",
    location: "Out of Office",
    dept: "Design",
    organizer: "Sophia Lindqvist",
    description: "Medical rest and recovery. Delegate: Marcus Chen.",
  },

  // --- Public & Company Holidays ---
  {
    id: "EV-07",
    title: "Gandhi Jayanti (National Holiday)",
    date: "2024-10-02",
    startDate: "2024-10-02",
    endDate: "2024-10-02",
    type: "Holiday",
    time: "Public Holiday",
    location: "All Offices Closed",
    dept: "All Staff",
    organizer: "HR & People Ops",
    description: "National holiday commemorating Mahatma Gandhi. All offices closed.",
  },
  {
    id: "EV-08",
    title: "Dussehra / Vijayadashami",
    date: "2024-10-12",
    startDate: "2024-10-12",
    endDate: "2024-10-12",
    type: "Holiday",
    time: "Festival Holiday",
    location: "All Offices Closed",
    dept: "All Staff",
    organizer: "HR & People Ops",
    description: "Celebration of triumph of good over evil. Optional/Gazetted holiday.",
  },
  {
    id: "EV-09",
    title: "Diwali Festivities & Office Closure",
    date: "2024-10-31",
    startDate: "2024-10-31",
    endDate: "2024-10-31",
    type: "Holiday",
    time: "Public Holiday",
    location: "All Offices Closed",
    dept: "All Staff",
    organizer: "HR & People Ops",
    description: "Festival of Lights. Company holiday for all regional hubs.",
  },
  {
    id: "EV-10",
    title: "Guru Nanak Jayanti",
    date: "2024-11-15",
    startDate: "2024-11-15",
    endDate: "2024-11-15",
    type: "Holiday",
    time: "Gazetted Holiday",
    location: "All Offices Closed",
    dept: "All Staff",
    organizer: "HR & People Ops",
    description: "Gazetted holiday honoring Guru Nanak Gurpurab.",
  },
  {
    id: "EV-11",
    title: "Christmas Day Holiday",
    date: "2024-12-25",
    startDate: "2024-12-25",
    endDate: "2024-12-25",
    type: "Holiday",
    time: "Public Holiday",
    location: "All Offices Closed",
    dept: "All Staff",
    organizer: "HR & People Ops",
    description: "Worldwide Christmas celebration & year-end shutdown period.",
  },

  // --- Fun & Culture Activities ---
  {
    id: "EV-12",
    title: "Annual Hackathon 2024: AI & Future of Work",
    date: "2024-10-25",
    startDate: "2024-10-25",
    endDate: "2024-10-26",
    type: "Fun",
    time: "24 Hours (Starts 10:00 AM)",
    location: "Innovation Hub & Discord",
    dept: "All Staff",
    organizer: "Tech & People Culture Committee",
    description: "Cross-functional 24h hackathon with prizes, pizza, mentor sessions, and demo pitch showcase!",
    virtualLink: "https://discord.gg/evenmore-hackathon",
  },
  {
    id: "EV-13",
    title: "Diwali Rangoli & Ethnic Dress Day",
    date: "2024-10-30",
    startDate: "2024-10-30",
    endDate: "2024-10-30",
    type: "Fun",
    time: "03:30 PM - 06:00 PM",
    location: "Office Cafeteria & Lounge",
    dept: "All Staff",
    organizer: "Culture Club",
    description: "Traditional attire, rangoli contest, sweets distribution, music, and team fun activities.",
  },
  {
    id: "EV-14",
    title: "Team Bowling Night & Dinner Social",
    date: "2024-10-18",
    startDate: "2024-10-18",
    endDate: "2024-10-18",
    type: "Fun",
    time: "06:30 PM - 09:30 PM",
    location: "Strike City Bowling Alley",
    dept: "Engineering",
    organizer: "Marcus Chen",
    description: "Friendly department tournament, appetizers, and post-sprint celebration.",
  },
  {
    id: "EV-15",
    title: "Morning Mindfulness & Desk Yoga",
    date: "2024-10-09",
    startDate: "2024-10-09",
    endDate: "2024-10-09",
    type: "Fun",
    time: "08:30 AM - 09:15 AM",
    location: "Terrace Deck & Zoom",
    dept: "All Staff",
    organizer: "Wellness Committee",
    description: "Guided relaxation, breathing techniques, and posture correction session with expert instructor.",
    virtualLink: "https://zoom.us/j/desk-yoga-ev",
  },

  // --- Training & Workshops ---
  {
    id: "EV-16",
    title: "Secure Coding & InfoSec Workshop",
    date: "2024-10-08",
    startDate: "2024-10-08",
    endDate: "2024-10-08",
    type: "Training",
    time: "02:00 PM - 05:00 PM",
    location: "Training Hall B & Online",
    dept: "Engineering",
    organizer: "David Park (CTO)",
    description: "OWASP Top 10 mitigation, secret management, dependency scanning, and hands-on lab.",
    virtualLink: "https://meet.google.com/sec-training",
  },
  {
    id: "EV-17",
    title: "Leadership Essentials 101",
    date: "2024-10-18",
    startDate: "2024-10-18",
    endDate: "2024-10-18",
    type: "Training",
    time: "09:30 AM - 01:00 PM",
    location: "Conference Room 4",
    dept: "HR & People Ops",
    organizer: "Ayesha Khan (HR Director)",
    description: "Coaching fundamentals, difficult feedback conversations, and team motivation tactics.",
  },
  {
    id: "EV-18",
    title: "Q4 New Hire Onboarding Bootcamp",
    date: "2024-10-07",
    startDate: "2024-10-07",
    endDate: "2024-10-07",
    type: "Training",
    time: "10:00 AM - 04:00 PM",
    location: "Orientation Room 102",
    dept: "All Staff",
    organizer: "Ayesha Khan",
    description: "Welcome day for new joiners: company values, IT tooling, compliance sign-offs, and mentor meet.",
  },

  // --- HR & Payroll Milestones ---
  {
    id: "EV-19",
    title: "Monthly Payroll Cutoff & Overtime Signoff",
    date: "2024-10-25",
    startDate: "2024-10-25",
    endDate: "2024-10-25",
    type: "HRMilestone",
    time: "06:00 PM EOD",
    location: "HRMS Portal",
    dept: "Finance",
    organizer: "James Wilson (Finance Manager)",
    description: "Final deadline for managers to approve pending leaves, expense claims, and overtime hours for October payroll.",
  },
  {
    id: "EV-20",
    title: "Q3 Performance Self-Appraisal Submission Due",
    date: "2024-10-15",
    startDate: "2024-10-15",
    endDate: "2024-10-15",
    type: "HRMilestone",
    time: "11:59 PM EOD",
    location: "Performance Portal",
    dept: "All Staff",
    organizer: "Ayesha Khan (HR Director)",
    description: "All employees must complete self-appraisals and OKR ratings before peer feedback cycle begins.",
  },
  {
    id: "EV-21",
    title: "Benefits & Health Insurance Open Enrollment Closes",
    date: "2024-10-28",
    startDate: "2024-10-28",
    endDate: "2024-10-28",
    type: "HRMilestone",
    time: "05:00 PM EOD",
    location: "HR Portal",
    dept: "All Staff",
    organizer: "People Ops Benefits Team",
    description: "Last day to update family dependents, health coverage tiers, and flex spending accounts.",
  },

  // --- Company Milestones ---
  {
    id: "EV-22",
    title: "Evenmore ERP 2.0 Global Release",
    date: "2024-10-29",
    startDate: "2024-10-29",
    endDate: "2024-10-29",
    type: "Company",
    time: "01:00 PM - 02:00 PM",
    location: "Main Stage & Live Stream",
    dept: "All Staff",
    organizer: "Product & Engineering",
    description: "Company-wide celebration and release of our next-generation unified enterprise platform.",
    virtualLink: "https://zoom.us/j/release-stream",
  },
];

function loadEventsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to load calendar events from storage:", err);
  }
  return INITIAL_HRMS_EVENTS;
}

export const useCalendarStore = create((set, get) => ({
  events: loadEventsFromStorage(),

  addEvent: (eventData) => {
    const id = `EV-${Date.now()}`;
    const newEvent = {
      id,
      startDate: eventData.startDate || eventData.date,
      endDate: eventData.endDate || eventData.startDate || eventData.date,
      date: eventData.startDate || eventData.date,
      ...eventData,
    };

    set((state) => {
      const updated = [newEvent, ...state.events];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Storage error:", err);
      }
      return { events: updated };
    });

    return newEvent;
  },

  updateEvent: (id, updatedFields) => {
    set((state) => {
      const updated = state.events.map((ev) => {
        if (ev.id === id) {
          const startDate = updatedFields.startDate || updatedFields.date || ev.startDate || ev.date;
          const endDate = updatedFields.endDate || updatedFields.startDate || updatedFields.date || ev.endDate || ev.date;
          return {
            ...ev,
            ...updatedFields,
            startDate,
            endDate,
            date: startDate,
          };
        }
        return ev;
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Storage error:", err);
      }

      return { events: updated };
    });
  },

  deleteEvent: (id) => {
    set((state) => {
      const updated = state.events.filter((ev) => ev.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Storage error:", err);
      }
      return { events: updated };
    });
  },

  resetToDefaults: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HRMS_EVENTS));
    } catch {}
    set({ events: INITIAL_HRMS_EVENTS });
  },

  // Helper selectors
  getEventsForDate: (dateStr) => {
    const all = get().events;
    return all.filter((ev) => {
      const start = ev.startDate || ev.date;
      const end = ev.endDate || ev.startDate || ev.date;
      return dateStr >= start && dateStr <= end;
    });
  },

  getUpcomingHolidays: (fromDateStr, limit = 4) => {
    const all = get().events;
    return all
      .filter((ev) => ev.type === "Holiday" && (ev.startDate || ev.date) >= fromDateStr)
      .sort((a, b) => (a.startDate || a.date).localeCompare(b.startDate || b.date))
      .slice(0, limit);
  },

  getUpcomingFunEvents: (fromDateStr, limit = 3) => {
    const all = get().events;
    return all
      .filter((ev) => ev.type === "Fun" && (ev.startDate || ev.date) >= fromDateStr)
      .sort((a, b) => (a.startDate || a.date).localeCompare(b.startDate || b.date))
      .slice(0, limit);
  },
}));
