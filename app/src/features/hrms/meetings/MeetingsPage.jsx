import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  List,
  Monitor,
  Wifi,
  Tv,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { useERP } from '../../../context/ERPContext';
import {
  fetchMeetingRooms,
  createMeetingRoom,
  fetchCompanyMeetings,
  createCompanyMeeting,
  saveMeetingMinutes,
} from '../../../services/upgradeService';

const meetingsGuide = {
  title: 'Universal Meetings & Conference Room Booking',
  subtitle: 'Organize team syncs, executive board reviews, and book conference spaces with collision prevention.',
  purpose: 'The Meetings module manages internal staff synchronization, virtual meetings (Google Meet/Zoom), and physical boardroom scheduling across all branches.',
  keyTerms: [
    { term: 'Room Collision Prevention', definition: 'The system validates that no two meetings occupy the same physical room simultaneously.' },
    { term: 'Hybrid Sync', definition: 'A meeting with both an allocated physical room and a Google Meet or Zoom link.' },
    { term: 'Minutes of Meeting (MoM)', definition: 'Post-meeting documentation with delegated action items.' },
  ],
  tips: [
    'Toggle between Calendar view and Agenda table view as needed.',
    'Click "Capture MoM" to document decisions and action items after the call.',
  ],
  workflow: ['Schedule Meeting & Book Room', 'Auto-Generate Zoom/Meet Link', 'Host Meeting', 'Capture MoM & Action Items'],
};

export function MeetingsPage() {
  const { employees } = useERP() || {};

  const [rooms, setRooms] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('agenda'); // 'agenda' | 'rooms'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isMoMModalOpen, setIsMoMModalOpen] = useState(false);
  const [activeMeetingForMoM, setActiveMeetingForMoM] = useState(null);

  // Scheduling Form
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingType, setMeetingType] = useState('hybrid'); // in_person | virtual | hybrid
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [videoProvider, setVideoProvider] = useState('google_meet'); // none | zoom | google_meet
  const [joinUrl, setJoinUrl] = useState('');
  const [agenda, setAgenda] = useState('');
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // New Room Form
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomCapacity, setRoomCapacity] = useState(8);
  const [roomLocation, setRoomLocation] = useState('Main Office, 2nd Floor');

  // MoM Form
  const [momNotes, setMomNotes] = useState('');
  const [actionItems, setActionItems] = useState([
    { title: 'Prepare Q4 projections deck', assignee: 'Team Lead', dueDate: '2026-10-15' },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roomsRes, meetingsRes] = await Promise.all([
        fetchMeetingRooms(),
        fetchCompanyMeetings(),
      ]);
      setRooms(Array.isArray(roomsRes) ? roomsRes : roomsRes?.results || []);
      setMeetings(Array.isArray(meetingsRes) ? meetingsRes : meetingsRes?.results || []);
    } catch (err) {
      console.error('Failed to load meetings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayMeetings = meetings.filter((m) => m.start_time?.startsWith(todayStr));
    const activeRooms = rooms.length;
    const virtualCount = meetings.filter((m) => m.video_provider !== 'none').length;
    const completedMoM = meetings.filter((m) => m.minutes_of_meeting && m.minutes_of_meeting.trim() !== '').length;

    return {
      todayCount: todayMeetings.length,
      activeRooms,
      virtualCount,
      completedMoM,
    };
  }, [meetings, rooms]);

  // Check live room availability (is any scheduled meeting currently in the room)
  const roomStatuses = useMemo(() => {
    const now = new Date();
    const map = {};
    rooms.forEach((r) => {
      const ongoing = meetings.find((m) => {
        if (m.roomId !== r.id && m.room !== r.id) return false;
        if (m.status === 'cancelled') return false;
        const start = new Date(m.start_time);
        const end = new Date(m.end_time);
        return now >= start && now <= end;
      });
      map[r.id] = {
        isOccupied: Boolean(ongoing),
        currentMeeting: ongoing,
      };
    });
    return map;
  }, [rooms, meetings]);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      setSubmitting(true);
      const startDateTime = `${startDate}T${startTime}:00Z`;
      const endDateTime = `${startDate}T${endTime}:00Z`;

      await createCompanyMeeting({
        title: meetingTitle,
        meeting_type: meetingType,
        roomId: meetingType !== 'virtual' && selectedRoomId ? selectedRoomId : null,
        start_time: startDateTime,
        end_time: endDateTime,
        video_provider: meetingType !== 'in_person' ? videoProvider : 'none',
        join_url: joinUrl,
        agenda,
        attendeeIds: selectedAttendeeIds,
      });

      setIsScheduleModalOpen(false);
      setMeetingTitle('');
      setAgenda('');
      await loadData();
    } catch (err) {
      setFormError(
        err?.response?.data?.room?.[0] ||
        err?.response?.data?.detail ||
        err.message ||
        'Room collision detected or validation failed.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createMeetingRoom({
        name: roomName,
        code: roomCode,
        capacity: Number(roomCapacity),
        location: roomLocation,
        amenities: ['4K Display', 'Video Bar', 'High-Speed Wi-Fi', 'Whiteboard'],
      });
      setIsRoomModalOpen(false);
      setRoomName('');
      setRoomCode('');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to create room.');
    } finally {
      setSubmitting(false);
    }
  };

  const openMoMModal = (meeting) => {
    setActiveMeetingForMoM(meeting);
    setMomNotes(meeting.minutes_of_meeting || '');
    setActionItems(
      meeting.action_items && meeting.action_items.length > 0
        ? meeting.action_items
        : [{ title: 'Follow-up on discussion items', assignee: 'Host', dueDate: new Date().toISOString().slice(0, 10) }]
    );
    setIsMoMModalOpen(true);
  };

  const handleSaveMoM = async (e) => {
    e.preventDefault();
    if (!activeMeetingForMoM) return;
    try {
      setSubmitting(true);
      await saveMeetingMinutes(activeMeetingForMoM.id, {
        minutes_of_meeting: momNotes,
        action_items: actionItems,
        status: 'completed',
      });
      setIsMoMModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to save MoM.');
    } finally {
      setSubmitting(false);
    }
  };

  const addActionItem = () => {
    setActionItems([...actionItems, { title: '', assignee: '', dueDate: '' }]);
  };

  const updateActionItem = (index, key, val) => {
    const updated = [...actionItems];
    updated[index][key] = val;
    setActionItems(updated);
  };

  const removeActionItem = (index) => {
    setActionItems(actionItems.filter((_, idx) => idx !== index));
  };

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        m.title?.toLowerCase().includes(q) ||
        m.roomName?.toLowerCase().includes(q) ||
        m.hostUserName?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'scheduled' && m.status === 'scheduled') ||
        (statusFilter === 'completed' && m.status === 'completed') ||
        (statusFilter === 'virtual' && m.video_provider !== 'none');

      return matchesSearch && matchesStatus;
    });
  }, [meetings, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Meetings & Conference Rooms"
          subtitle="Enterprise scheduling, video room generation, physical boardroom collision avoidance, and MoM action tracking."
          guide={meetingsGuide}
        />
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsRoomModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <MapPin size={15} /> Add Room
          </button>
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm shadow-blue-500/20"
          >
            <Plus size={15} /> Schedule Meeting
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Meetings"
          value={`${stats.todayCount} Sessions`}
          icon={CalendarIcon}
          highlight={stats.todayCount > 0}
          subtext="Internal & hybrid syncs"
        />
        <StatCard
          label="Conference Rooms"
          value={`${stats.activeRooms} Spaces`}
          icon={MapPin}
          subtext="Monitored for collision"
        />
        <StatCard
          label="Virtual / Video Enabled"
          value={`${stats.virtualCount} Calls`}
          icon={Video}
          subtext="Zoom / Google Meet integrated"
        />
        <StatCard
          label="MoM Documented"
          value={`${stats.completedMoM} Minutes`}
          icon={FileText}
          trend={{ positive: true, text: 'Action items tracked' }}
          subtext="Action items assigned"
        />
      </div>

      {/* Room Availability Ribbon */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <MapPin size={14} className="text-blue-600" /> Physical Conference Room Availability
          </h3>
          <span className="text-[11px] text-slate-400">Live Space Telemetry</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {rooms.length === 0 ? (
            <div className="col-span-full py-4 text-center text-xs text-slate-400">
              No conference rooms configured yet. Click "Add Room" to create boardroom spaces.
            </div>
          ) : (
            rooms.map((room) => {
              const statusInfo = roomStatuses[room.id] || {};
              const isOccupied = statusInfo.isOccupied;

              return (
                <div
                  key={room.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isOccupied
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-emerald-200 bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{room.name}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isOccupied
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isOccupied ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      {isOccupied ? 'Occupied' : 'Free Now'}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Cap: {room.capacity} seats</span>
                    <span>•</span>
                    <span className="truncate">{room.location || room.code}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Tv size={12} /> Display • <Wifi size={12} /> Wi-Fi • <Video size={12} /> Video Bar
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Agenda & Meeting Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'All Scheduled' },
              { id: 'virtual', label: 'Virtual Only' },
              { id: 'completed', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings, room, host..."
              className="w-full h-8.5 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Meeting Cards List */}
        <div className="p-4 divide-y divide-slate-100 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading meeting roster...</div>
          ) : filteredMeetings.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarIcon size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No meetings found</p>
              <p className="text-xs text-slate-400 mt-1">
                Schedule a session to coordinate room booking and conference links.
              </p>
            </div>
          ) : (
            filteredMeetings.map((mtg) => {
              const startDateObj = new Date(mtg.start_time);
              const endDateObj = new Date(mtg.end_time);
              const timeDisplay = `${startDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
              const dateDisplay = startDateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

              return (
                <div key={mtg.id} className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{mtg.title}</span>
                      {mtg.roomName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                          <MapPin size={11} className="text-blue-500" /> {mtg.roomName}
                        </span>
                      )}
                      {mtg.video_provider !== 'none' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Video size={11} /> {mtg.video_provider === 'google_meet' ? 'Google Meet' : 'Zoom'}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${mtg.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {mtg.status === 'completed' ? 'Completed' : 'Scheduled'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <CalendarIcon size={13} /> {dateDisplay}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock size={13} /> {timeDisplay}
                      </span>
                      <span>Hosted by: <strong className="text-slate-800">{mtg.hostUserName || 'Admin'}</strong></span>
                      {mtg.agenda && (
                        <span className="truncate max-w-xs italic text-slate-400">"{mtg.agenda}"</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    {mtg.join_url && (
                      <a
                        href={mtg.join_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 inline-flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Video size={13} /> Join Call
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => openMoMModal(mtg)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <FileText size={13} /> {mtg.minutes_of_meeting ? 'View MoM' : 'Capture MoM'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Schedule Meeting Drawer / Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Schedule Universal Meeting</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Weekly Operations Sync & Safety Review"
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'hybrid', label: 'Hybrid (Room + Video)' },
                    { id: 'in_person', label: 'In-Person Room' },
                    { id: 'virtual', label: 'Virtual Only' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setMeetingType(mode.id)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                        meetingType === mode.id
                          ? 'border-blue-500 bg-blue-50/70 text-blue-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {meetingType !== 'virtual' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Conference Room Booking <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required={meetingType === 'in_person'}
                  >
                    <option value="">Select Conference Space...</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.capacity} seats - {r.location})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-9 px-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full h-9 px-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full h-9 px-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {meetingType !== 'in_person' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Video Provider (Auto-generates meeting URL)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVideoProvider('google_meet')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                        videoProvider === 'google_meet'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      <Video size={14} /> Google Meet
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoProvider('zoom')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                        videoProvider === 'zoom'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      <Video size={14} /> Zoom
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Agenda Points</label>
                <textarea
                  rows={2}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="Outline key discussion topics..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Booking...' : 'Confirm & Send Invites'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Conference Room Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Add Conference Room</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsRoomModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Room Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Executive Boardroom Alpha"
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Room Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="e.g. CR-01"
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Floor</label>
                <input
                  type="text"
                  value={roomLocation}
                  onChange={(e) => setRoomLocation(e.target.value)}
                  placeholder="e.g. Tower B, 3rd Floor"
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Register Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MoM (Minutes of Meeting) Modal */}
      {isMoMModalOpen && activeMeetingForMoM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Minutes of Meeting (MoM): {activeMeetingForMoM.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMoMModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMoM} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Key Discussion Points & Decisions
                </label>
                <textarea
                  rows={4}
                  value={momNotes}
                  onChange={(e) => setMomNotes(e.target.value)}
                  placeholder="Record summary of decisions made, roadblocks discussed, and agreements..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Action Items & Deliverables</label>
                  <button
                    type="button"
                    onClick={addActionItem}
                    className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {actionItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateActionItem(index, 'title', e.target.value)}
                        placeholder="Action item task description..."
                        className="flex-1 h-8 px-2.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                        required
                      />
                      <input
                        type="text"
                        value={item.assignee}
                        onChange={(e) => updateActionItem(index, 'assignee', e.target.value)}
                        placeholder="Assignee name..."
                        className="w-32 h-8 px-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) => updateActionItem(index, 'dueDate', e.target.value)}
                        className="w-32 h-8 px-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeActionItem(index)}
                        className="p-1 rounded text-slate-400 hover:text-red-600"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMoMModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save MoM & Complete Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeetingsPage;
