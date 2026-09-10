import { CalendarDays, FileText, Plus, Pencil } from "lucide-react";

export default function LeadFormsManager({ forms, onCreateForm, onEditForm }) {
  return (
    <section className="lead-forms-manager">
      <div className="lead-forms-manager-head">
        <div>
          <h1>Manage Lead Create Forms</h1>
          <div className="lead-forms-breadcrumb">Dashboard <span>&gt;</span> Lead Create Form</div>
        </div>
        <button type="button" className="lead-forms-add" onClick={onCreateForm} aria-label="Create new lead form">
          <Plus size={18} />
        </button>
      </div>

      <div className="lead-forms-card-grid">
        {forms.map((form) => {
          const fieldCount = form.sections.reduce((total, section) => total + section.fields.length, 0);
          return (
            <article key={form.id} className="lead-form-template-card">
              <h2><FileText size={16} /> {form.name}</h2>
              <p>{form.description}</p>
              <div className="lead-form-template-meta">
                <span><FileText size={13} /> {fieldCount} Fields</span>
                <span><CalendarDays size={13} /> {form.createdOn}</span>
                <b>ACTIVE</b>
              </div>
              <button type="button" className="lead-form-edit-button" onClick={() => onEditForm(form.id)}>
                <Pencil size={13} /> Edit
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
