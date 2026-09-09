import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { defaultLeadFormSections } from "../../../data/crm/leadFormSchema";

function renderInput(field) {
  if (field.type === "Lead Image") {
    return (
      <div className="dynamic-image-field">
        <div className="dynamic-image-placeholder">Lead Photo</div>
        <button type="button" className="btn-outline">Upload Image</button>
      </div>
    );
  }

  if (field.type === "Multi Line") {
    return <textarea rows={4} placeholder={field.placeholder} />;
  }

  if (field.type === "Dropdown") {
    return (
      <select defaultValue="">
        <option value="" disabled>{field.placeholder}</option>
        <option>Option 1</option>
        <option>Option 2</option>
      </select>
    );
  }

  if (field.type === "Checkbox") {
    return (
      <label className="dynamic-checkbox">
        <input type="checkbox" />
        <span>{field.placeholder || field.label}</span>
      </label>
    );
  }

  if (field.type === "Date") {
    return <input type="date" />;
  }

  if (field.type === "Email") {
    return <input type="email" placeholder={field.placeholder} />;
  }

  if (field.type === "Phone") {
    return <input type="tel" placeholder={field.placeholder} />;
  }

  if (field.type === "Number" || field.type === "Currency") {
    return <input type="number" placeholder={field.placeholder} />;
  }

  return <input type="text" placeholder={field.placeholder} />;
}

export default function DynamicLeadFormPage({ sections = defaultLeadFormSections, onBackToLeads, onEditLayout }) {
  const navigate = useNavigate();
  const handleBack = onBackToLeads || (() => navigate('/crm/leads'));
  const handleEdit = onEditLayout || (() => navigate('/crm/leads/form-builder'));

  const safeSections = Array.isArray(sections) && sections.length > 0 ? sections : defaultLeadFormSections;

  return (
    <section className="dynamic-form-shell">
      <div className="dynamic-form-top">
        <button type="button" className="back-link" onClick={handleBack}>
          <ArrowLeft size={16} />
          Back to Leads
        </button>
        <div className="dynamic-form-actions">
          <button type="button" className="btn-outline" onClick={handleEdit}>Edit Page Layout</button>
          <button type="button" className="btn-primary">
            <Save size={16} />
            Save Lead
          </button>
        </div>
      </div>

      <div className="dynamic-form-card">
        <div className="dynamic-form-head">
          <div>
            <div className="task-form-kicker">Dynamic Lead Form</div>
            <h2>Create Lead Using Current Page Layout</h2>
            <p>The fields below are generated from your latest lead form builder configuration.</p>
          </div>
        </div>

        <div className="dynamic-form-sections">
          {safeSections.map((section) => (
            <section key={section.id} className="dynamic-form-section">
              <div className="dynamic-form-section-head">
                <strong>{section.title}</strong>
              </div>
              <div className="dynamic-form-grid">
                {(section.fields || []).map((field) => (
                  <label
                    key={field.id}
                    className={`dynamic-form-field${field.type === "Multi Line" ? " full" : ""}`}
                  >
                    <span>
                      {field.label}
                      {field.required ? " *" : ""}
                    </span>
                    {renderInput(field)}
                    {field.helpText && <small>{field.helpText}</small>}
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
