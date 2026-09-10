import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, PencilLine, Trash2, PhoneCall, MapPinned, ChevronRight, X } from 'lucide-react';

const leadTaskForms = [
  {
    id: 1,
    title: 'Calling',
    description: 'No description provided',
    fields: [
      'Call', '2nd Call', '3rd Call', '4th Call', '5th Call', '6th Call', '7th Call', '8th Call', '9th Call', '10th Call', '11th Call', '12th Call', '13th Call', '14th Call',
    ],
    lastUpdated: '07/08/2026',
    status: 'ACTIVE',
    icon: PhoneCall,
  },
  {
    id: 2,
    title: 'Visit Data',
    description: 'No description provided',
    fields: ['Quotation', 'Demo', 'pending'],
    lastUpdated: '16/04/2026',
    status: 'ACTIVE',
    icon: MapPinned,
  },
];

export default function TaskFormPage() {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [forms, setForms] = useState(leadTaskForms);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  function openCreateModal() {
    setFormName('');
    setFormDescription('');
    setIsCreateOpen(true);
  }

  function closeCreateModal() {
    setIsCreateOpen(false);
    setFormName('');
    setFormDescription('');
  }

  function createForm() {
    const title = formName.trim();

    if (!title) {
      return;
    }

    setForms((currentForms) => [
      ...currentForms,
      {
        id: Date.now(),
        title,
        description: formDescription.trim() || 'No description provided',
        fields: [],
        lastUpdated: new Date().toLocaleDateString('en-GB'),
        status: 'ACTIVE',
        icon: PhoneCall,
      },
    ]);
    closeCreateModal();
  }

  return (
    <div className="lead-task-forms-page">
      <div className="lead-task-forms-header">
        <div className="lead-task-forms-breadcrumb">
          <button type="button" className="lead-task-forms-back" onClick={() => navigate('/crm/leads')}>
            Dashboard
          </button>
          <ChevronRight size={14} />
          <span>Lead Task Form</span>
        </div>

        <button type="button" className="lead-task-forms-add" aria-label="Add task form" onClick={openCreateModal}>
          <Plus size={18} />
        </button>
      </div>

      <div className="lead-task-forms-grid">
        {forms.map((form) => {
          const Icon = form.icon;
          const fieldText = form.fields.length > 0 ? form.fields.join(', ') : 'No fields defined';

          return (
            <article key={form.id} className="lead-task-form-card">
              <div className="lead-task-form-card-header">
                <div className="lead-task-form-card-title-wrap">
                  <span className="lead-task-form-icon">
                    <Icon size={16} />
                  </span>
                  <h3>{form.title}</h3>
                </div>
              </div>

              <p className="lead-task-form-description">{form.description}</p>

              <div className="lead-task-form-meta">
                <span className="lead-task-form-meta-label">{form.fields.length} Fields</span>
                <span className="lead-task-form-meta-value">{fieldText}</span>
              </div>

              <div className="lead-task-form-footer-row">
                <div className="lead-task-form-date-wrap">
                  <span className="lead-task-form-date">{form.lastUpdated}</span>
                  <span className="lead-task-form-status">{form.status}</span>
                </div>
              </div>

              <div className="lead-task-form-actions">
                <button type="button" className="lead-task-form-action edit">
                  <PencilLine size={14} />
                  Edit
                </button>
                <button type="button" className="lead-task-form-action delete">
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {isCreateOpen && (
        <div className="lead-task-form-modal-overlay" onClick={closeCreateModal}>
          <div className="lead-task-form-modal" onClick={(event) => event.stopPropagation()}>
            <div className="lead-task-form-modal-header">
              <h3>Create New Form</h3>
              <button type="button" className="lead-task-form-modal-close" aria-label="Close form modal" onClick={closeCreateModal}>
                <X size={16} />
              </button>
            </div>

            <div className="lead-task-form-modal-body">
              <label className="lead-task-form-field">
                <span>Form Name <em>*</em></span>
                <input
                  type="text"
                  placeholder="Enter form name (e.g. Website Inquiry Form)"
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  autoFocus
                />
              </label>

              <label className="lead-task-form-field">
                <span>Description</span>
                <input
                  type="text"
                  placeholder="Enter form description (optional)"
                  value={formDescription}
                  onChange={(event) => setFormDescription(event.target.value)}
                />
              </label>
            </div>

            <div className="lead-task-form-modal-actions">
              <button type="button" className="lead-task-form-modal-cancel" onClick={closeCreateModal}>
                Cancel
              </button>
              <button type="button" className="lead-task-form-modal-submit" onClick={createForm} disabled={!formName.trim()}>
                Create Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
