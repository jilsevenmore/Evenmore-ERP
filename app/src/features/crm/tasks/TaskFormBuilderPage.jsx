import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import LeadFormBuilder from '../leads/LeadFormBuilder';
import { createFieldFromType } from '../../../data/crm/leadFormSchema';

const STORAGE_KEY = 'leadTaskFormsV1';

function getStoredTaskForms() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function taskFormToSections(form) {
  if (form?.sections && Array.isArray(form.sections) && form.sections.length > 0) return form.sections;
  const names = Array.isArray(form?.fields) ? form.fields : [];
  return [
    {
      id: 'task-information',
      title: 'Task Information',
      fields: names.map((name, i) => ({
        ...createFieldFromType('Single Line', Date.now() + i),
        label: String(name),
        placeholder: `Enter ${String(name).toLowerCase()}`,
      })),
    },
  ];
}

export default function TaskFormBuilderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formId = searchParams.get('formId') || '';

  const [currentForm] = useState(() => {
    const forms = getStoredTaskForms();
    return forms.find((f) => f.id === formId) || forms[0] || null;
  });

  const [sections, setSections] = useState(() => {
    if (!currentForm) return [{ id: 'task-information', title: 'Task Information', fields: [] }];
    return taskFormToSections(currentForm);
  });

  const [selectedFieldId, setSelectedFieldId] = useState(() => sections[0]?.fields?.[0]?.id ?? null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const selectedField = sections.flatMap((s) => s.fields).find((f) => f.id === selectedFieldId) ?? null;

  // Single source of truth: persist every sections change (add/edit/delete/reorder)
  useEffect(() => {
    if (!currentForm?.id) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const forms = raw !== null ? JSON.parse(raw) : [];
      if (!Array.isArray(forms)) return;
      const fieldNames = sections.flatMap((s) => (s.fields || []).map((f) => f.label));
      const updated = forms.map((f) =>
        f.id === currentForm.id
          ? { ...f, sections, fields: fieldNames, lastUpdated: new Date().toLocaleDateString('en-GB') }
          : f
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch { /* ignore */ }
  }, [sections, currentForm?.id]);

  function updateField(fieldId, updates) {
    setSections((cur) =>
      cur.map((s) => ({
        ...s,
        fields: s.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
      }))
    );
  }

  function addField(sectionId, type, index) {
    const targetId = sectionId || sections[0]?.id;
    const nextField = createFieldFromType(type, Date.now());
    setSections((cur) =>
      cur.map((s) => {
        if (s.id !== targetId) return s;
        const arr = [...s.fields];
        arr.splice(typeof index === 'number' ? index : arr.length, 0, nextField);
        return { ...s, fields: arr };
      })
    );
    setSelectedFieldId(nextField.id);
  }

  function removeField(fieldId) {
    setSections((cur) => cur.map((s) => ({ ...s, fields: s.fields.filter((f) => f.id !== fieldId) })));
    setSelectedFieldId((prev) => {
      if (prev !== fieldId) return prev;
      return sections.flatMap((s) => s.fields).filter((f) => f.id !== fieldId)[0]?.id ?? null;
    });
  }

  function moveField(fieldId, targetSectionId, targetIndex) {
    setSections((cur) => {
      let moving = null;
      const stripped = cur.map((s) => ({
        ...s,
        fields: s.fields.filter((f) => {
          if (f.id === fieldId) { moving = f; return false; }
          return true;
        }),
      }));
      if (!moving) return cur;
      return stripped.map((s) => {
        if (s.id !== targetSectionId) return s;
        const arr = [...s.fields];
        arr.splice(typeof targetIndex === 'number' ? targetIndex : arr.length, 0, moving);
        return { ...s, fields: arr };
      });
    });
    setSelectedFieldId(fieldId);
  }

  function addSection() {
    const id = `task-section-${Date.now()}`;
    setSections((cur) => [...cur, { id, title: `New Section ${cur.length + 1}`, fields: [] }]);
  }

  function removeSection(sectionId) {
    setSections((cur) => (cur.length <= 1 ? cur : cur.filter((s) => s.id !== sectionId)));
  }

  function updateSectionTitle(sectionId, newTitle) {
    setSections((cur) =>
      cur.map((s) => (s.id === sectionId ? { ...s, title: newTitle } : s))
    );
  }

  function duplicateSection(sectionId) {
    setSections((cur) => {
      const targetSec = cur.find((s) => s.id === sectionId);
      if (!targetSec) return cur;
      const newSecId = `task-section-${Date.now()}`;
      const clonedFields = (targetSec.fields || []).map((f, i) => ({
        ...f,
        id: Date.now() + i,
      }));
      const newSec = {
        ...targetSec,
        id: newSecId,
        title: `${targetSec.title} (Copy)`,
        fields: clonedFields,
      };
      const idx = cur.findIndex((s) => s.id === sectionId);
      const next = [...cur];
      next.splice(idx + 1, 0, newSec);
      return next;
    });
  }

  function handlePreview() {
    setPreviewOpen(true);
  }

  function handleSave() {
    if (currentForm?.id) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const forms = raw !== null ? JSON.parse(raw) : [];
        if (Array.isArray(forms)) {
          const fieldNames = sections.flatMap((s) => (s.fields || []).map((f) => f.label));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(forms.map((f) => f.id === currentForm.id ? { ...f, sections, fields: fieldNames, lastUpdated: new Date().toLocaleDateString('en-GB') } : f)));
        }
      } catch { }
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      navigate('/crm/leads/task-form');
    }, 600);
  }

  if (!currentForm) {
    return (
      <div className="w-full max-w-3xl mx-auto py-10 text-center">
        <p className="text-sm font-semibold text-slate-700">No task form found</p>
        <button
          type="button"
          onClick={() => navigate('/crm/leads/task-form')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
        >
          Back to Task Forms
        </button>
      </div>
    );
  }

  return (
    <>
      <LeadFormBuilder
        sections={sections}
        selectedFieldId={selectedFieldId}
        selectedField={selectedField}
        onSelectField={setSelectedFieldId}
        onUpdateField={updateField}
        onAddField={addField}
        onRemoveField={removeField}
        onMoveField={moveField}
        onAddSection={addSection}
        onRemoveSection={removeSection}
        onUpdateSectionTitle={updateSectionTitle}
        onDuplicateSection={duplicateSection}
        onPreview={handlePreview}
        onSaveAndOpen={handleSave}
        saveSuccess={saveSuccess}
        formTitle={currentForm.title || 'TASK FORM BUILDER'}
      />

      {previewOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          role="presentation"
          onMouseDown={() => setPreviewOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">{currentForm.title} — Preview</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">How this task form will look while filling.</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition p-1"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {sections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-xs font-bold text-slate-900 mb-2">{section.title}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {section.fields.map((f) => (
                      <label key={f.id} className="block">
                        <span className="block text-[11px] font-semibold text-slate-700 mb-1">
                          {f.label} {f.required && <span className="text-rose-500">*</span>}
                        </span>
                        <input
                          type="text"
                          placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}`}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500"
                        />
                      </label>
                    ))}
                    {section.fields.length === 0 && (
                      <p className="text-[11px] text-slate-400 col-span-2">No fields in this section yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50/70 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewOpen(false);
                  handleSave();
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
