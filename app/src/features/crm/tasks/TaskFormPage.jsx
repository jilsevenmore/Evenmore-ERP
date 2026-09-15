import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, FileText, CalendarDays, PhoneCall, MapPinned, X, Search } from 'lucide-react';
import InfoBanner from '../common/InfoBanner';

const STORAGE_KEY = 'leadTaskFormsV1';

const DEFAULT_FORMS = [
  {
    id: 'task-form-calling',
    title: 'Calling',
    description: 'No description provided',
    fields: [
      'Call', '2nd Call', '3rd Call', '4th Call', '5th Call', '6th Call', '7th Call', '8th Call', '9th Call', '10th Call', '11th Call', '12th Call', '13th Call', '14th Call',
    ],
    lastUpdated: '07/08/2026',
    status: 'ACTIVE',
    iconName: 'call',
  },
  {
    id: 'task-form-visit',
    title: 'Visit Data',
    description: 'No description provided',
    fields: ['Quotation', 'Demo', 'pending'],
    lastUpdated: '16/04/2026',
    status: 'ACTIVE',
    iconName: 'visit',
  },
];

function getStoredForms() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_FORMS;
}

function iconFor(name) {
  return name === 'visit' ? MapPinned : PhoneCall;
}

export default function TaskFormPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState(getStoredForms);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [query, setQuery] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
    } catch { /* ignore */ }
  }, [forms]);

  function openCreateModal() {
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setIsModalOpen(true);
  }

  function openEditModal(form) {
    try {
      localStorage.setItem('activeTaskFormId', form.id);
    } catch { /* ignore */ }
    navigate(`/crm/leads/task-form/builder?formId=${form.id}`);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setFormName('');
    setFormDescription('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const title = formName.trim();
    if (!title) return;
    const desc = formDescription.trim() || 'No description provided';
    const today = new Date().toLocaleDateString('en-GB');

    if (editingId) {
      setForms((prev) => prev.map((f) => (f.id === editingId ? { ...f, title, description: desc, lastUpdated: today } : f)));
      closeModal();
    } else {
      const newId = `task-form-${Date.now()}`;
      const newForm = {
        id: newId,
        title,
        description: desc,
        fields: [],
        sections: [{ id: 'task-information', title: 'Task Information', fields: [] }],
        lastUpdated: today,
        status: 'ACTIVE',
        iconName: 'call',
      };
      setForms((prev) => [...prev, newForm]);
      closeModal();
      try {
        localStorage.setItem('activeTaskFormId', newId);
      } catch { /* ignore */ }
      navigate(`/crm/leads/task-form/builder?formId=${newId}`);
    }
  }

  function confirmDelete() {
    if (!deleteId) return;
    setForms((prev) => prev.filter((f) => f.id !== deleteId));
    setDeleteId(null);
  }

  const q = query.trim().toLowerCase();
  const visible = forms.filter((f) => {
    if (!q) return true;
    const names = f.sections
      ? f.sections.flatMap((s) => s.fields.map((fl) => fl.label)).join(' ')
      : (f.fields || []).join(' ');
    return (
      f.title.toLowerCase().includes(q) ||
      (f.description || '').toLowerCase().includes(q) ||
      names.toLowerCase().includes(q)
    );
  });

  function fieldInfo(form) {
    if (form.sections && Array.isArray(form.sections)) {
      const labels = form.sections.flatMap((s) => s.fields.map((fl) => fl.label));
      return {
        count: labels.length,
        text: labels.length > 0 ? labels.join(', ') : 'No fields defined',
      };
    }
    const arr = form.fields || [];
    return { count: arr.length, text: arr.length > 0 ? arr.join(', ') : 'No fields defined' };
  }

  return (
    <section className="w-full max-w-6xl mx-auto py-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Lead Task Forms</h1>
          <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-slate-700">Lead Task Form</span>
          </div>
        </div>
        <button
          type="button"
          className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
          onClick={openCreateModal}
          aria-label="Create new task form"
        >
          <Plus size={18} />
        </button>
      </div>

      <InfoBanner
        storageKey="infoBannerLeadTaskFormV1"
        title="Why use Lead Task Forms?"
        text="These define the fields collected while doing a task. You design the form once, then every call, visit or follow-up follows the same checklist."
      />

      <div className="flex items-center justify-between mb-5">
        <span className="text-xs text-slate-500 font-medium">{visible.length} Forms</span>
      </div>

      {visible.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
          <p className="text-sm font-semibold text-slate-700">No forms found</p>
          <p className="text-xs text-slate-500 mt-1">Try a different search or create a new form.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
          >
            Create Form
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((form) => {
            const Icon = iconFor(form.iconName);
            const { count, text: fieldText } = fieldInfo(form);
            return (
              <article
                key={form.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 grid place-items-center shrink-0">
                      <Icon size={16} />
                    </span>
                    <h2 className="text-sm font-bold text-slate-900 truncate">{form.title}</h2>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2 min-h-[28px]">{form.description}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-1" title={fieldText}>
                    {fieldText}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 mt-3 mb-4">
                    <span className="flex items-center gap-1.5 font-medium">
                      <FileText size={13} /> {count} Fields
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={13} /> {form.lastUpdated}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                      {form.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
                      onClick={() => openEditModal(form)}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3.5 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg border border-rose-200 transition cursor-pointer"
                      onClick={() => setDeleteId(form.id)}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          role="presentation"
          onMouseDown={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">{editingId ? 'Edit Form' : 'Create New Form'}</h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Form Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter form name (e.g. Website Inquiry Form)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 shadow-2xs text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Enter form description (optional)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 shadow-2xs text-slate-800 text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 shadow-2xs transition cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition cursor-pointer text-xs"
                >
                  {editingId ? 'Save Changes' : 'Create Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          role="presentation"
          onMouseDown={() => setDeleteId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 p-5"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-bold text-slate-900">Delete this form?</h2>
            <p className="text-xs text-slate-500 mt-1">This action cannot be undone. The form will be removed permanently.</p>
            <div className="flex items-center justify-end gap-2.5 mt-4">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
