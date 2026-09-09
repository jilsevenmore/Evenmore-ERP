import { Search, Plus, Bell, CalendarDays, Settings, ChevronDown, Command } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export default function Topbar() {
  const currentUser = useAppStore((s) => s.currentUser);
  const globalSearch = useAppStore((s) => s.globalSearch);
  const setGlobalSearch = useAppStore((s) => s.setGlobalSearch);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);

  return (
    <header className="topbar">
      <label className="top-search">
        <Search size={17} className="top-search-ico" />
        <input
          type="text"
          placeholder="Search records, contacts, deals... (Ctrl+K)"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          onFocus={() => setCommandPaletteOpen(true)}
          readOnly
          style={{ cursor: 'pointer' }}
        />
      </label>

      <div className="top-right">
        <button type="button" className="add-btn" aria-label="Quick add">
          <Plus size={18} strokeWidth={2.4} />
        </button>
        <button type="button" className="top-icon" aria-label="Notifications">
          <Bell size={19} strokeWidth={1.9} />
          <span className="notif-dot" />
        </button>
        <button type="button" className="top-icon" aria-label="Calendar">
          <CalendarDays size={19} strokeWidth={1.9} />
        </button>
        <button
          type="button"
          className="top-icon"
          aria-label="Command palette (Ctrl+K)"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Command size={18} strokeWidth={1.9} />
        </button>
        <button type="button" className="top-icon" aria-label="Settings">
          <Settings size={18} strokeWidth={1.9} />
        </button>

        <span className="top-divider" />

        <button type="button" className="profile-chip">
          <span className="profile-avatar">{currentUser?.initials || 'EM'}</span>
          <span className="profile-text">
            <strong>{currentUser?.name || 'Administrator'}</strong>
            <small>{currentUser?.role || 'Admin'}</small>
          </span>
          <ChevronDown size={15} className="profile-chev" />
        </button>
      </div>
    </header>
  );
}
