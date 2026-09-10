import { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Filter,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const INITIAL_EVENTS = [
  { id: "EV-01", title: "Quarterly Townhall & Growth Review", date: "2024-10-11", type: "Meeting", time: "10:00 AM - 11:30 AM", location: "Main Auditorium & Zoom", dept: "All Staff" },
  { id: "EV-02", title: "Annual Leave — Planned", date: "2024-10-01", type: "Leave", time: "Full Day", location: "Out of Office", dept: "Engineering" },
  { id: "EV-03", title: "Gandhi Jayanti (National Holiday)", date: "2024-10-02", type: "Holiday", time: "Public Holiday", location: "All Offices Closed", dept: "All Staff" },
  { id: "EV-04", title: "Secure Coding & InfoSec Workshop", date: "2024-10-08", type: "Training", time: "02:00 PM - 05:00 PM", location: "Training Hall B", dept: "Engineering" },
  { id: "EV-05", title: "Leadership Essentials 101", date: "2024-10-18", type: "Training", time: "09:30 AM - 01:00 PM", location: "Conference Room 4", dept: "People Ops" },
  { id: "EV-06", title: "Diwali Festivities & Office Closure", date: "2024-10-31", type: "Holiday", time: "Public Holiday", location: "All Offices Closed", dept: "All Staff" },
];

export function CalendarPage() {
  const showToast = useAppStore((s) => s.showToast);
  const [view, setView] = useState("Month");
  const [typeFilter, setTypeFilter] = useState("All");
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [selectedDay, setSelectedDay] = useState(11);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "2024-10-11",
    type: "Meeting",
    time: "10:00 AM - 11:00 AM",
    location: "Conference Room 1",
  });

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title) return;
    const created = {
      id: `EV-0${events.length + 1}`,
      ...newEvent,
      dept: "My Schedule",
    };
    setEvents([...events, created]);
    setIsModalOpen(false);
    setNewEvent({ title: "", date: "2024-10-11", type: "Meeting", time: "10:00 AM - 11:00 AM", location: "Conference Room 1" });
    showToast(`Event "${created.title}" scheduled`);
  };

  const getEventBadge = (type) => {
    switch (type) {
      case "Holiday":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Leave":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Training":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900">Personal &amp; Team Calendar</h1>
          <p className="text-[13px] text-muted">
            Track leaves, company public holidays, scheduled training sessions, and key milestones.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex p-1 bg-white border border-bdr rounded-xl shadow-xs">
            {["Month", "Week", "Schedule List"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium transition ${
                  view === v ? "bg-navy text-white shadow-xs" : "text-muted hover:text-slate-900"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2 bg-navy text-white rounded-xl text-[13.5px] font-medium hover:bg-navy/90 transition shadow-xs"
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-8 bg-white border border-bdr rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-bdr">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[18px] text-slate-900">October 2024</span>
                <span className="px-2.5 py-0.5 bg-off border border-bdr rounded-full text-[11.5px] text-muted">
                  Q4 Active Period
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => showToast("Previous month")}
                  className="w-8 h-8 rounded-lg border border-bdr hover:bg-off grid place-items-center text-slate-600"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDay(11)}
                  className="px-3 py-1 rounded-lg border border-bdr text-[12px] font-medium hover:bg-off text-slate-700"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => showToast("Next month")}
                  className="w-8 h-8 rounded-lg border border-bdr hover:bg-off grid place-items-center text-slate-600"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 text-center text-[12px] font-semibold text-muted mb-2">
              {DAYS.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Cells (31 days) */}
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 31 }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = selectedDay === dayNum;
                const isToday = dayNum === 11;

                // Match events for this day
                const dayString = `2024-10-${dayNum.toString().padStart(2, "0")}`;
                const dayEvents = events.filter((e) => e.date === dayString);

                return (
                  <div
                    key={dayNum}
                    onClick={() => setSelectedDay(dayNum)}
                    className={`min-h-[84px] p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-navy bg-navy/5 shadow-xs"
                        : isToday
                        ? "border-navy/50 bg-off"
                        : "border-bdr/60 hover:bg-off/50 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-[12px] font-bold ${
                          isToday
                            ? "w-6 h-6 rounded-full bg-navy text-white grid place-items-center"
                            : isSelected
                            ? "text-navy"
                            : "text-slate-700"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a]" />
                      )}
                    </div>

                    <div className="flex flex-col gap-1 mt-1">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate border ${getEventBadge(
                            ev.type
                          )}`}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[9.5px] text-muted font-medium">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="pt-4 mt-4 border-t border-bdr flex flex-wrap items-center gap-4 text-[12px] text-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Meeting / Townhall</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Planned Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Training Session</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Public Holiday</span>
            </div>
          </div>
        </div>

        {/* Selected Date Agenda */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white border border-bdr rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-bdr">
              <h3 className="font-bold text-[15px] text-slate-900">
                Agenda for Oct {selectedDay}, 2024
              </h3>
              <span className="text-[12px] text-muted font-mono">
                {events.filter((e) => e.date === `2024-10-${selectedDay.toString().padStart(2, "0")}`).length} items
              </span>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              {events
                .filter((e) => e.date === `2024-10-${selectedDay.toString().padStart(2, "0")}`)
                .map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 bg-off border border-bdr rounded-xl flex flex-col gap-1.5 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-[13.5px] text-slate-900">{ev.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] border ${getEventBadge(ev.type)}`}>
                        {ev.type}
                      </span>
                    </div>
                    <div className="text-[12px] text-slate-500 flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      <span>{ev.time}</span>
                    </div>
                    <div className="text-[12px] text-slate-500 flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400" />
                      <span>{ev.location}</span>
                    </div>
                  </div>
                ))}

              {events.filter((e) => e.date === `2024-10-${selectedDay.toString().padStart(2, "0")}`).length === 0 && (
                <div className="py-8 text-center text-muted text-[13px]">
                  No scheduled meetings or leaves on this date.
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#f8fafc] border border-bdr rounded-2xl p-5 shadow-xs">
            <h4 className="font-bold text-[13.5px] text-slate-900 mb-2">Upcoming Public Holidays</h4>
            <div className="space-y-2 text-[12.5px]">
              <div className="p-2.5 bg-white border border-bdr rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-semibold text-slate-800">Diwali / Deepavali</div>
                  <div className="text-[11px] text-muted">Thursday, Oct 31 • National Holiday</div>
                </div>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[11px]">
                  Holiday
                </span>
              </div>
              <div className="p-2.5 bg-white border border-bdr rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-semibold text-slate-800">Guru Nanak Jayanti</div>
                  <div className="text-[11px] text-muted">Friday, Nov 15 • Gazetted Holiday</div>
                </div>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[11px]">
                  Holiday
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Event */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-bdr">
              <h3 className="font-bold text-[16px] text-slate-900">Add Calendar Entry</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-off grid place-items-center text-muted hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Sprint Retrospective"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Event Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer"
                  >
                    <option>Meeting</option>
                    <option>Leave</option>
                    <option>Training</option>
                    <option>Holiday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Time Range</label>
                <input
                  type="text"
                  placeholder="e.g. 11:00 AM - 12:00 PM"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Location / Link</label>
                <input
                  type="text"
                  placeholder="e.g. Zoom or Conference Room 2"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-bdr rounded-xl text-[13px] hover:bg-off font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy text-white rounded-xl text-[13px] font-medium hover:bg-navy/90"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export const Calendar = CalendarPage;
export default CalendarPage;
