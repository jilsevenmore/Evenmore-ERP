import { CalendarDays, FileText, Plus, Pencil, Trash2 } from "lucide-react";
import InfoBanner from "../common/InfoBanner";

export default function LeadFormsManager({ forms, onCreateForm, onEditForm, onDeleteForm, onOpenGuide }) {
  return (
    <section className="w-full max-w-6xl mx-auto py-4">
      <InfoBanner
        storageKey="infoBannerLeadCreateFormV1"
        title="Why use Lead Create Forms?"
        text="These define which fields appear while creating a lead. You design the form once, then every new lead follows the same structure."
      />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Lead Create Forms</h1>
          <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-slate-700">Lead Create Form</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="inline-flex items-center gap-2 rounded-[12px] border-2 border-[#1d6bff] bg-[#f2f7ff] px-3 py-2 text-[13px] font-semibold text-[#1d6bff]"
              aria-label="How to create a lead form"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#1d6bff] text-[12px] font-bold text-white">?</span>
              <span>How to create a lead form?</span>
            </button>
          )}
          <button
            type="button"
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
            onClick={onCreateForm}
            aria-label="Create new lead form"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {forms.map((form) => {
          const fieldCount = form.fieldsCount ?? form.sections.reduce((total, section) => total + section.fields.length, 0);
          return (
            <article
              key={form.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">{form.name}</h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">{form.description}</p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 mb-4">
                  <span className="flex items-center gap-1.5">
                    <FileText size={13} /> {fieldCount} Fields
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={13} /> {form.createdOn}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                    ACTIVE
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 py-1.5 px-3.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
                    onClick={() => onEditForm(form.id)}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  {onDeleteForm && (
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      onClick={() => onDeleteForm(form.id)}
                      title={`Delete ${form.name}`}
                      aria-label={`Delete ${form.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
