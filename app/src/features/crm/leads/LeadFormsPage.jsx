import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import LeadFormsManager from '../leads/LeadFormsManager';
import LeadGuideModal from '../leads/LeadGuideModal';
import { defaultLeadFormSections } from '../../../data/crm/leadFormSchema';

function getStoredForms() {
  try {
    const raw = localStorage.getItem('dynamicLeadForms');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
  }
  return [
    {
      id: 'lead-form-default',
      name: 'LEAD CREATE FORM',
      description: 'No description provided',
      createdOn: '13/04/2026',
      sections: defaultLeadFormSections,
    },
  ];
}

export default function LeadFormsPage() {
  const navigate = useNavigate();
  const [leadForms, setLeadForms] = useState(getStoredForms);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');

  function openCreateModal() {
    setFormName('');
    setFormDesc('');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleCreateSubmit(e) {
    e.preventDefault();
    if (!formName.trim()) return;

    const newId = `lead-form-${Date.now()}`;
    const newForm = {
      id: newId,
      name: formName.trim(),
      description: formDesc.trim() || 'Custom lead capture form',
      createdOn: new Date().toLocaleDateString('en-GB'),
      sections: [{ id: 'lead-information', title: 'Lead Information', fields: [] }],
    };

    const updated = [...leadForms, newForm];
    try {
      localStorage.setItem('dynamicLeadForms', JSON.stringify(updated));
      localStorage.setItem('activeLeadFormId', newId);
    } catch {
    }

    setLeadForms(updated);
    setIsModalOpen(false);
    navigate(`/crm/leads/form-builder?formId=${newId}`);
  }

  function handleEditForm(formId) {
    try {
      localStorage.setItem('activeLeadFormId', formId);
    } catch {
    }
    navigate(`/crm/leads/form-builder?formId=${formId}`);
  }

  function handleDeleteForm(formId) {
    const updated = leadForms.filter((f) => f.id !== formId);
    try {
      localStorage.setItem('dynamicLeadForms', JSON.stringify(updated));
      const activeId = localStorage.getItem('activeLeadFormId');
      if (activeId === formId) {
        localStorage.removeItem('activeLeadFormId');
      }
    } catch {
    }
    setLeadForms(updated);
  }

  return (
    <>
      <LeadFormsManager
        forms={leadForms}
        onCreateForm={openCreateModal}
        onEditForm={handleEditForm}
        onDeleteForm={handleDeleteForm}
        onOpenGuide={() => setIsGuideOpen(true)}
      />
      <LeadGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} variant="form" />

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
              <h2 className="text-sm font-bold text-slate-900">Create New Form</h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition cursor-pointer text-xs"
                >
                  Create Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
