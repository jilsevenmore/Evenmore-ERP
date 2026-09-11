import { useEffect, useMemo, useState } from "react";
import { X, Crosshair, Clock3, Pencil, Trash2 } from "lucide-react";
import LeadAvatar from "./LeadAvatar";

const STORAGE_KEY = "evenmore-crm-lead-notes-v1";

function loadAll() {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function formatDay(value) {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Just now";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Just now";
  }
}

export default function NotesDrawer({ lead, isOpen, onClose }) {
  const [store, setStore] = useState(loadAll);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [sortMode, setSortMode] = useState("last");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      return;
    }
  }, [store]);

  useEffect(() => {
    setDraft("");
    setEditing(false);
    setEditId(null);
    setEditText("");
  }, [lead?.id, isOpen]);

  const notes = useMemo(() => {
    if (!lead) return [];
    const list = Array.isArray(store[String(lead.id)]) ? store[String(lead.id)] : [];
    const sorted = [...list].sort((a, b) => {
      const at = new Date(a.createdAt).getTime() || 0;
      const bt = new Date(b.createdAt).getTime() || 0;
      return sortMode === "first" ? bt - at : at - bt;
    });
    return sorted;
  }, [store, lead, sortMode]);

  if (!isOpen || !lead) return null;

  function saveNote() {
    const text = draft.trim();
    if (!text) return;
    const item = {
      id: `n-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      by: lead.owner || "You"
    };
    setStore((prev) => ({
      ...prev,
      [String(lead.id)]: [...(Array.isArray(prev[String(lead.id)]) ? prev[String(lead.id)] : []), item]
    }));
    setDraft("");
    setEditing(false);
  }

  function removeNote(id) {
    setStore((prev) => ({
      ...prev,
      [String(lead.id)]: (Array.isArray(prev[String(lead.id)]) ? prev[String(lead.id)] : []).filter((n) => n.id !== id)
    }));
  }

  function startEdit(note) {
    setEditId(note.id);
    setEditText(note.text);
  }

  function saveEdit() {
    const text = editText.trim();
    if (!text) return;
    setStore((prev) => ({
      ...prev,
      [String(lead.id)]: (Array.isArray(prev[String(lead.id)]) ? prev[String(lead.id)] : []).map((n) =>
        n.id === editId ? { ...n, text } : n
      )
    }));
    setEditId(null);
    setEditText("");
  }

  const shortName = lead.name && lead.name.length > 22 ? `${lead.name.slice(0, 22)}...` : lead.name;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/40" onClick={onClose}>
      <aside
        className="relative w-full max-w-[560px] h-full bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Lead notes"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notes"
          className="absolute -left-4 top-5 w-9 h-9 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900"
        >
          <X size={16} />
        </button>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[18px] font-semibold text-slate-900">Notes</span>
            <span className="min-w-[22px] h-[22px] px-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center">
              {notes.length}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
            <Crosshair size={16} className="text-slate-700 shrink-0" />
            <span className="text-[13px] font-semibold text-slate-800 truncate">{lead.name}</span>
          </div>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className="h-8 border border-slate-300 rounded-md px-2 text-xs text-slate-600 bg-white outline-none shrink-0"
          >
            <option value="last">Recent Last</option>
            <option value="first">Recent First</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {notes.map((n) => (
            <div key={n.id} className="flex gap-3 group">
              <LeadAvatar lead={lead} className="shrink-0" />
              <div className="flex-1 min-w-0">
                {editId === n.id ? (
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      autoFocus
                      className="w-full px-3 py-2.5 text-sm outline-none resize-y"
                    />
                    <div className="flex justify-end gap-2 px-2.5 py-2 border-t border-slate-100 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => { setEditId(null); setEditText(""); }}
                        className="h-8 px-3 rounded-md border border-slate-300 text-xs font-semibold text-slate-600 bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="h-8 px-4 rounded-md bg-blue-600 text-white text-xs font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-slate-800 leading-snug break-words">{n.text}</p>
                )}
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>Lead</span>
                  <span className="text-slate-300">-</span>
                  <span className="text-blue-600 font-medium truncate max-w-[140px]">{shortName}</span>
                  <span className="text-slate-300">•</span>
                  <span>Add Note</span>
                  <span className="text-slate-300">•</span>
                  <Clock3 size={11} className="text-slate-500" />
                  <span>{formatDay(n.createdAt)} by {n.by}</span>
                </p>
                {editId !== n.id && (
                  <div className="hidden group-hover:flex items-center gap-1 mt-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(n)}
                      className="h-7 px-2 rounded-md text-[11px] font-semibold text-slate-500 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Pencil size={11} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNote(n.id)}
                      className="h-7 px-2 rounded-md text-[11px] font-semibold text-red-500 hover:bg-red-50 flex items-center gap-1"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {notes.length === 0 && !editing && (
            <p className="text-xs text-slate-400 text-center py-6">No notes yet. Add the first note below.</p>
          )}

          <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full text-left px-3.5 py-3 text-sm text-slate-400 hover:bg-slate-50"
              >
                Add a note
              </button>
            ) : (
              <div>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  autoFocus
                  placeholder="Add a note"
                  className="w-full px-3.5 py-3 text-sm outline-none resize-y placeholder:text-slate-400"
                />
                <div className="flex justify-end gap-2 px-2.5 py-2 border-t border-slate-100 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setDraft(""); }}
                    className="h-8 px-3 rounded-md border border-slate-300 text-xs font-semibold text-slate-600 bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveNote}
                    disabled={!draft.trim()}
                    className="h-8 px-4 rounded-md bg-blue-600 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
