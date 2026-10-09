import { useMemo } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Globe,
  ImagePlus,
  Mail,
  Phone,
  Save,
  Type,
  UserRound,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { defaultLeadFormSections, visibleLeadFormSections } from "../../../data/crm/leadFormSchema";
import { useCrmStore } from "../../../stores/crmStore";
import { activeLeadForm } from "../../../services/leadFormFields";

function resolveFieldDraftValue(field, draftData) {
  if (!draftData || typeof draftData !== 'object') return null;
  const fid = String(field.id || '').toLowerCase().trim();
  const flabel = String(field.label || '').toLowerCase().trim();

  if (draftData.customValues && draftData.customValues[field.id] !== undefined) {
    const cv = draftData.customValues[field.id];
    if (cv !== null && cv !== undefined && cv !== '') return String(cv);
  }

  if (fid === 'lead-name' || flabel === 'lead name') return draftData.leadName;
  if (fid === 'company' || flabel === 'company') return draftData.company;
  if (fid === 'email' || flabel === 'email') return draftData.email;
  if (fid === 'phone' || flabel === 'phone') return draftData.phone;
  if (fid === 'lead-source' || flabel === 'lead source') return draftData.source || draftData.sourceId;
  if (fid === 'title' || flabel === 'title') return draftData.titleValue || draftData.title;
  if (fid === 'industry' || flabel === 'industry') return draftData.industry;
  if (fid === 'lead-owner' || flabel === 'lead owner') return draftData.owner || draftData.ownerId;
  if (fid === 'created-on' || flabel === 'created on') return draftData.createdOn;
  if (fid === 'lead-photo' || flabel === 'lead photo' || field.type === 'Lead Image') return draftData.photoPreview;
  if (fid.includes('product') || flabel.includes('product')) {
    if (Array.isArray(draftData.products) && draftData.products.length > 0) return draftData.products.join(', ');
    return draftData.products;
  }
  if (fid.includes('user') || flabel.includes('user')) {
    if (Array.isArray(draftData.leadUsers) && draftData.leadUsers.length > 0) return draftData.leadUsers.join(', ');
    return draftData.leadUsers;
  }
  if (fid.includes('task-date') || flabel.includes('task date')) return draftData.taskDate;
  if (fid.includes('task-time') || flabel.includes('task time')) return draftData.taskTime;

  return null;
}

function getFieldIcon(field) {
  if (field.type === "Email") return Mail;
  if (field.type === "Phone") return Phone;
  if (field.type === "Date") return CalendarDays;
  if (field.type === "Dropdown") return ChevronDown;
  if (field.type === "User") return UserRound;
  if (field.type === "Lookup") return Globe;
  return Type;
}

function renderInput(field, draftData) {
  const draftVal = resolveFieldDraftValue(field, draftData);
  const hasDraftVal = draftVal !== null && draftVal !== undefined && String(draftVal).trim() !== '';

  if (field.type === "Lead Image") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800">{field.label}</span>
          <div className="w-8 h-4.5 bg-emerald-500 rounded-full flex items-center p-0.5 justify-end cursor-pointer">
            <div className="w-3.5 h-3.5 bg-white rounded-full shadow-xs" />
          </div>
        </div>
        {hasDraftVal ? (
          <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden mt-2.5 shadow-2xs">
            <img src={draftVal} alt="Lead preview" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-center text-slate-400 mt-2.5">
            <ImagePlus size={24} strokeWidth={1.5} />
          </div>
        )}
      </div>
    );
  }

  if (field.type === "Multi Line") {
    return (
      <textarea
        rows={3}
        defaultValue={hasDraftVal ? draftVal : ""}
        placeholder={field.placeholder}
        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
      />
    );
  }

  if (field.type === "Dropdown") {
    return (
      <div className="relative flex items-center">
        <select
          defaultValue={hasDraftVal ? draftVal : ""}
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer"
        >
          {hasDraftVal && <option value={draftVal}>{draftVal}</option>}
          <option value="" disabled>
            {field.placeholder}
          </option>
          <option>Option 1</option>
          <option>Option 2</option>
        </select>
        <ChevronDown size={15} className="absolute right-3 text-slate-400 pointer-events-none" />
      </div>
    );
  }

  if (field.type === "Checkbox") {
    return (
      <label className="flex items-center gap-2 py-1 cursor-pointer">
        <input type="checkbox" defaultChecked={Boolean(hasDraftVal && draftVal !== 'false')} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
        <span className="text-xs font-medium text-slate-700">{field.placeholder || field.label}</span>
      </label>
    );
  }

  if (field.type === "Date") {
    return (
      <div className="relative flex items-center">
        <input
          type="text"
          defaultValue={hasDraftVal ? draftVal : ""}
          placeholder={field.placeholder || "Select date"}
          className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <CalendarDays size={15} className="absolute right-3 text-slate-400 pointer-events-none" />
      </div>
    );
  }

  const Icon = getFieldIcon(field);
  const inputType =
    field.type === "Email"
      ? "email"
      : field.type === "Phone"
      ? "tel"
      : field.type === "Number" || field.type === "Currency"
      ? "number"
      : "text";

  return (
    <div className="relative flex items-center">
      <input
        type={inputType}
        defaultValue={hasDraftVal ? draftVal : ""}
        placeholder={field.placeholder}
        className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <Icon size={15} className="absolute right-3 text-slate-400 pointer-events-none" />
    </div>
  );
}

export default function DynamicLeadFormPage({
  sections = defaultLeadFormSections,
  onBackToLeads,
  onEditLayout,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const draftData = useMemo(() => {
    if (location.state?.draftData) return location.state.draftData;
    try {
      const saved = sessionStorage.getItem('crm_lead_create_draft');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [location.state]);

  const handleBack = onBackToLeads || (() => {
    if (draftData) {
      navigate("/crm/leads?openCreate=true");
    } else {
      navigate("/crm/leads");
    }
  });
  const handleEdit = onEditLayout || (() => navigate("/crm/leads/form-builder", { state: { draftData, returnTo: "/crm/leads/create-form" } }));

  // The published lead form, from `/crm/forms/` — the same one the builder saves.
  const storeForms = useCrmStore((s) => s.forms);
  const safeSections = useMemo(() => {
    if (Array.isArray(sections) && sections.length > 0 && sections !== defaultLeadFormSections) {
      return sections;
    }

    // The same form the Create Lead modal uses (resolves pre-save ids too).
    const savedForm = activeLeadForm();
    if (Array.isArray(savedForm?.sections) && savedForm.sections.length > 0) {
      return visibleLeadFormSections(savedForm.sections);
    }

    return Array.isArray(sections) && sections.length > 0 ? sections : defaultLeadFormSections;
  // storeForms: re-read the form when it is saved or arrives.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, storeForms]);

  return (
    <section className="w-full">
      {/* Top Bar */}
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 lg:gap-0 mb-6">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft size={15} />
          Back to Leads
        </button>
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleEdit}
            className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Edit Page Layout
          </button>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Save size={15} />
            Save Lead
          </button>
        </div>
      </div>

      {draftData && (
        <div className="mb-5 flex items-center justify-between p-3.5 bg-blue-50/90 border border-blue-200/90 rounded-2xl text-xs text-blue-950 shadow-2xs">
          <span>
            Displaying present form data for: <strong>{draftData.leadName || draftData.company || "Current Lead"}</strong>
          </span>
          <button
            type="button"
            onClick={handleBack}
            className="btn-primary h-7 px-3 text-[11px] font-semibold rounded-lg cursor-pointer"
          >
            Back to Form
          </button>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-6">
        {safeSections.map((section) => (
          <section
            key={section.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs"
          >
            <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
              <ChevronDown size={16} className="text-slate-600" />
              <strong className="text-sm font-bold text-slate-900">{section.title}</strong>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(section.fields || []).map((field) => (
                <div
                  key={field.id}
                  className={`flex flex-col gap-1.5 ${
                    field.type === "Multi Line" ? "md:col-span-2" : ""
                  }`}
                >
                  {field.type !== "Lead Image" && (
                    <span className="text-xs font-medium text-slate-700">
                      {field.label}
                      {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                    </span>
                  )}
                  {renderInput(field, draftData)}
                  {field.helpText && (
                    <small className="text-[11px] text-slate-400">{field.helpText}</small>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
