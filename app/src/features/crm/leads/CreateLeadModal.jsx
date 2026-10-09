import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useCrmStore } from '../../../stores/crmStore';
import { useERP } from '../../../context/ERPContext';
import { CalendarDays, ChevronDown, Clock3, ImagePlus, Plus, X } from "lucide-react";
import { customLeadFields, isBlankValue, isSupportedCustomField, leadFormLayout, missingRequiredField } from '../../../services/leadFormFields';
import { PERMANENT_LEAD_FIELD_ID } from '../../../data/crm/leadFormSchema';
import { CustomLeadFieldInput } from './CustomLeadFieldInput';

/** Who a lead can be assigned to, from `/crm/team-roster/` (one row per person). */
function useUserOptions() {
  const members = useCrmStore((s) => s.teamMembers);
  return useMemo(() => {
    const seen = new Set();
    return (members || []).filter((member) => {
      if (!member?.id || seen.has(member.id)) return false;
      seen.add(member.id);
      return true;
    });
  }, [members]);
}

/** Product names from the item master. */
function useProductOptions() {
  const { items } = useERP() || {};
  return useMemo(
    () => [...new Set((items || []).map((item) => item?.name).filter(Boolean))],
    [items],
  );
}

function MultiValueSelect({ label, required = false, placeholder, options, values, onChange, helpText }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  const filteredOptions = useMemo(() => {
    const search = query.trim().toLowerCase();
    return options.filter(
      (option) =>
        option.toLowerCase().includes(search) &&
        !values.includes(option),
    );
  }, [options, query, values]);

  useEffect(() => {
    function handleOutside(event) {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function addValue(value) {
    onChange([...values, value]);
    setQuery("");
    setIsOpen(false);
  }

  function removeValue(value) {
    onChange(values.filter((item) => item !== value));
  }

  return (
    <div className="lead-create-field lead-create-field-wide">
      <span>{label}{required ? ' *' : ''}</span>
      <div className="multi-value-select" ref={rootRef}>
        <div
          className={`token-field token-field-button${isOpen ? " open" : ""}`}
          onClick={() => setIsOpen((open) => !open)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setIsOpen((open) => !open);
            }
          }}
        >
          <div className="token-field-values">
            {values.map((value) => (
              <span
                key={value}
                className="token-chip"
                onClick={(event) => {
                  event.stopPropagation();
                  removeValue(value);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    removeValue(value);
                  }
                }}
              >
                {value}
                <X size={12} />
              </span>
            ))}
            {values.length === 0 && <span className="token-placeholder">{placeholder}</span>}
          </div>
          <ChevronDown size={16} className="token-chevron" />
        </div>

        {isOpen && (
          <div className="token-dropdown">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              className="token-dropdown-search"
              autoFocus
            />
            <div className="token-dropdown-list">
              {filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="token-dropdown-item"
                  onClick={() => addValue(option)}
                >
                  {option}
                </button>
              ))}
              {filteredOptions.length === 0 && (
                <div className="token-dropdown-empty">No more options available.</div>
              )}
            </div>
          </div>
        )}
      </div>
      {helpText && <small>{helpText}</small>}
    </div>
  );
}

export default function CreateLeadModal({ isOpen, onClose, onCreate, onEditLayout, showTour }) {
  const [products, setProducts] = useState([]);
  const [leadUsers, setLeadUsers] = useState([]);
  const [photoPreview, setPhotoPreview] = useState("");
  const [leadName, setLeadName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [titleValue, setTitleValue] = useState("");
  const [industry, setIndustry] = useState("");

  // The lookups the form offers, as configured on the server.
  const sources = useCrmStore((s) => s.sources);
  const userOptions = useUserOptions();
  const productOptions = useProductOptions();
  const [ownerId, setOwnerId] = useState("");
  const [createdOn, setCreatedOn] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskTime, setTaskTime] = useState("");
  // Fields added in the Lead Create Form builder, saved as lead.customValues.
  const storeForms = useCrmStore((s) => s.forms);
  // storeForms: re-read the fields when a form is saved or arrives.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const customFields = useMemo(() => customLeadFields(), [storeForms]);
  // Replaced: the standard inputs were hard-coded here in a fixed order with
  // fixed labels. They now follow the builder: order, label, placeholder,
  // required, and whether they appear at all.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const layout = useMemo(() => leadFormLayout(), [storeForms]);
  const [customValues, setCustomValues] = useState({});
  const photoInputRef = useRef(null);
  const createdOnRef = useRef(null);
  const taskDateRef = useRef(null);
  const taskTimeRef = useRef(null);

  // Replaced: every standard input except the photo and dates was mandatory,
  // asterisk or not. Now the builder's Required flag decides (Lead Name always).
  const standardValues = {
    "lead-name": leadName.trim(),
    "lead-photo": photoPreview,
    company: company.trim(),
    email: email.trim(),
    phone: phone.trim(),
    "lead-source": sourceId,
    title: titleValue.trim(),
    industry: industry.trim(),
    "lead-owner": ownerId,
    "created-on": createdOn,
    products,
    "lead-users": leadUsers,
    "task-date": taskDate,
    "task-time": taskTime,
  };
  const isRequired = (field) => field.id === PERMANENT_LEAD_FIELD_ID || Boolean(field.required);
  const isFormComplete =
    leadName.trim() !== "" &&
    layout.every((section) => section.fields.every(
      (field) => !(field.id in standardValues) || !isRequired(field) || !isBlankValue(standardValues[field.id]),
    )) &&
    !missingRequiredField(customFields, customValues);

  const isNavigatingToLayoutRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      isNavigatingToLayoutRef.current = false;
      try {
        const saved = sessionStorage.getItem('crm_lead_create_draft');
        if (saved) {
          const draft = JSON.parse(saved);
          if (draft.leadName !== undefined) setLeadName(draft.leadName);
          if (draft.company !== undefined) setCompany(draft.company);
          if (draft.email !== undefined) setEmail(draft.email);
          if (draft.phone !== undefined) setPhone(draft.phone);
          if (draft.sourceId !== undefined) setSourceId(draft.sourceId);
          if (draft.titleValue !== undefined) setTitleValue(draft.titleValue);
          if (draft.industry !== undefined) setIndustry(draft.industry);
          if (draft.ownerId !== undefined) setOwnerId(draft.ownerId);
          if (draft.createdOn !== undefined) setCreatedOn(draft.createdOn);
          if (Array.isArray(draft.products)) setProducts(draft.products);
          if (Array.isArray(draft.leadUsers)) setLeadUsers(draft.leadUsers);
          if (draft.taskDate !== undefined) setTaskDate(draft.taskDate);
          if (draft.taskTime !== undefined) setTaskTime(draft.taskTime);
          if (draft.photoPreview !== undefined) setPhotoPreview(draft.photoPreview);
          if (draft.customValues && typeof draft.customValues === 'object') setCustomValues(draft.customValues);
        }
      } catch (err) {
        console.error("Failed to restore lead draft", err);
      }
    } else if (!isNavigatingToLayoutRef.current) {
      setProducts([]);
      setLeadUsers([]);
      setPhotoPreview("");
      setLeadName("");
      setCompany("");
      setEmail("");
      setPhone("");
      setSourceId("");
      setTitleValue("");
      setIndustry("");
      setOwnerId("");
      setCreatedOn("");
      setTaskDate("");
      setTaskTime("");
      setCustomValues({});
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (photoPreview && !isNavigatingToLayoutRef.current) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  if (!isOpen) return null;

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextPreview = URL.createObjectURL(file);
    setPhotoPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return nextPreview;
    });
  }

  function handleClose() {
    isNavigatingToLayoutRef.current = false;
    try {
      sessionStorage.removeItem('crm_lead_create_draft');
    } catch {}
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setProducts([]);
    setLeadUsers([]);
    setPhotoPreview("");
    setLeadName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setSourceId("");
    setTitleValue("");
    setIndustry("");
    setOwnerId("");
    setCreatedOn("");
    setTaskDate("");
    setTaskTime("");
    setCustomValues({});
    onClose();
  }

  function handleEditPageLayout() {
    isNavigatingToLayoutRef.current = true;
    const draft = {
      leadName,
      company,
      email,
      phone,
      sourceId,
      source: sources.find((option) => option.id === sourceId)?.name || "",
      titleValue,
      industry,
      ownerId,
      owner: userOptions.find((member) => member.id === ownerId)?.name || "",
      createdOn,
      taskDate,
      taskTime,
      products,
      leadUsers,
      photoPreview,
      customValues,
    };
    try {
      sessionStorage.setItem('crm_lead_create_draft', JSON.stringify(draft));
    } catch (e) {
      console.error("Failed to save lead draft", e);
    }
    onEditLayout?.(draft);
  }

  function handleCreate() {
    isNavigatingToLayoutRef.current = false;
    try {
      sessionStorage.removeItem('crm_lead_create_draft');
    } catch {}
    onCreate({
      leadName,
      company,
      email,
      phone,
      // The API records the lookup ids; the labels are only for display.
      sourceId,
      source: sources.find((option) => option.id === sourceId)?.name || "",
      titleValue,
      industry,
      ownerId,
      owner: userOptions.find((member) => member.id === ownerId)?.name || "",
      createdOn,
      taskDate,
      taskTime,
      products,
      leadUsers,
      photoPreview,
      customValues,
    });
  }

  function labelOf(field) {
    return `${field.label}${isRequired(field) ? " *" : ""}`;
  }

  function dateInput(ref, value, setValue, type = "date") {
    const openPicker = () => { try { ref.current?.showPicker?.(); } catch { ref.current?.focus(); } };
    return (
      <div className="input-icon-wrap">
        <input ref={ref} type={type} value={value} onChange={(event) => setValue(event.target.value)} />
        <span role="button" tabIndex={0} aria-label={type === "time" ? "Open time picker" : "Open calendar"} style={{ position: "absolute", top: 0, right: 0, width: 34, height: "100%", display: "grid", placeItems: "center", cursor: "pointer" }} onClick={openPicker} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openPicker(); } }}>
          {type === "time" ? <Clock3 size={16} /> : <CalendarDays size={16} />}
        </span>
      </div>
    );
  }

  function textField(field, type, value, setValue, fallbackPlaceholder) {
    return (
      <label key={field.id} className="lead-create-field">
        <span>{labelOf(field)}</span>
        <input type={type} placeholder={field.placeholder || fallbackPlaceholder} value={value} onChange={(event) => setValue(event.target.value)} />
        {field.helpText && <small>{field.helpText}</small>}
      </label>
    );
  }

  function selectField(field, value, setValue, options, fallbackPlaceholder) {
    return (
      <label key={field.id} className="lead-create-field">
        <span>{labelOf(field)}</span>
        <select value={value} onChange={(event) => setValue(event.target.value)}>
          <option value="">{field.placeholder || fallbackPlaceholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
        {field.helpText && <small>{field.helpText}</small>}
      </label>
    );
  }

  // One input per builder field, in builder order.
  function renderField(field) {
    switch (field.id) {
      case "lead-name": return textField(field, "text", leadName, setLeadName, "Enter lead name");
      case "company": return textField(field, "text", company, setCompany, "Enter company name");
      case "email": return textField(field, "email", email, setEmail, "Enter email address");
      case "phone": return textField(field, "tel", phone, setPhone, "Enter phone number");
      case "title": return textField(field, "text", titleValue, setTitleValue, "Enter title");
      case "industry": return textField(field, "text", industry, setIndustry, "Enter industry");
      case "lead-source": return selectField(field, sourceId, setSourceId, sources, "Select source");
      case "lead-owner": return selectField(field, ownerId, setOwnerId, userOptions, "Select User");
      case "lead-photo":
        return (
          <div key={field.id} className="lead-create-field lead-create-photo-field">
            <span>{labelOf(field)}</span>
            <input ref={photoInputRef} type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
            <button type="button" className="lead-photo-upload" onClick={() => photoInputRef.current?.click()}>
              {photoPreview ? (
                <img src={photoPreview} alt="Client preview" className="lead-photo-preview" />
              ) : (
                <>
                  <span className="lead-photo-placeholder">
                    <ImagePlus size={24} />
                  </span>
                  <strong>Upload Image</strong>
                  <small>JPG, PNG or WebP</small>
                </>
              )}
            </button>
            {field.helpText && <small>{field.helpText}</small>}
          </div>
        );
      case "created-on":
        return (
          <label key={field.id} className="lead-create-field">
            <span>{labelOf(field)}</span>
            {dateInput(createdOnRef, createdOn, setCreatedOn)}
            {field.helpText && <small>{field.helpText}</small>}
          </label>
        );
      case "products":
        return (
          <MultiValueSelect key={field.id} label={field.label} required={isRequired(field)} placeholder={field.placeholder || "Select Products"} options={productOptions} values={products} onChange={setProducts} helpText={field.helpText} />
        );
      case "lead-users":
        return (
          <MultiValueSelect key={field.id} label={field.label} required={isRequired(field)} placeholder={field.placeholder || "Select Users"} options={userOptions.map((member) => member.name)} values={leadUsers} onChange={setLeadUsers} helpText={field.helpText} />
        );
      case "task-date":
        return (
          <label key={field.id} className="lead-create-field">
            <span>{labelOf(field)}</span>
            {dateInput(taskDateRef, taskDate, setTaskDate)}
            <small>{field.helpText || "Leave blank to allocate the first form task immediately."}</small>
          </label>
        );
      case "task-time":
        return (
          <label key={field.id} className="lead-create-field">
            <span>{labelOf(field)}</span>
            {dateInput(taskTimeRef, taskTime, setTaskTime, "time")}
            <small>{field.helpText || "No need to set time before calling."}</small>
          </label>
        );
      default:
        if (!isSupportedCustomField(field)) return null;
        return (
          <label key={field.id} className="lead-create-field" htmlFor={`custom-${field.id}`}>
            <span>{labelOf(field)}</span>
            <CustomLeadFieldInput
              field={field}
              value={customValues[field.id]}
              users={userOptions}
              onChange={(value) => setCustomValues((current) => ({ ...current, [field.id]: value }))}
            />
            {field.helpText && <small>{field.helpText}</small>}
          </label>
        );
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={handleClose}>
      <section
        className="lead-create-modal relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-lead-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="lead-create-modal-head">
          <h2 id="create-lead-title">Create Lead</h2>
          <button type="button" className="modal-close" onClick={handleClose} aria-label="Close create lead form">
            <X size={18} />
          </button>
        </div>

        {showTour && (
        <div className="pointer-events-none absolute left-[22%] top-[58px] z-30 flex flex-col items-center">
          <div className="inline-flex w-max max-w-[280px] items-center gap-2.5 rounded-[16px] bg-[#1d6bff] px-4 py-2.5 text-left text-[14px] font-medium leading-snug text-white shadow-[0_4px_14px_rgba(29,107,255,0.35)]">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-bold text-[#1d6bff]">3</span>
            <span>Fill in the lead details here</span>
          </div>
          <svg width="56" height="48" viewBox="0 0 56 48" fill="none" className="-mt-1" aria-hidden="true">
            <path d="M28 2 C 28 26, 24 36, 14 42" stroke="#1d6bff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M6 34 L13 43 L23 35" stroke="#1d6bff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        )}

        <div className="lead-create-modal-body">
          {layout.map((section) => section.fields.length > 0 && (
            <Fragment key={section.id}>
              <h3 className="lead-create-section-title">{section.title}</h3>
              {section.fields.map(renderField)}
            </Fragment>
          ))}
        </div>

        <div className="lead-create-modal-actions">
          <div className="relative inline-block">
            {showTour && isFormComplete && (
            <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-0 z-30 flex flex-col items-start">
              <div className="inline-flex w-max max-w-[280px] items-start gap-2.5 rounded-[16px] bg-[#1d6bff] px-4 py-3 text-left text-[14px] font-medium leading-snug text-white shadow-[0_4px_14px_rgba(29,107,255,0.35)]">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-bold text-[#1d6bff]">4</span>
                <span>Click here to edit the form layout<br />(if needed)</span>
              </div>
              <svg width="64" height="42" viewBox="0 0 64 42" fill="none" className="mb-[-6px] ml-[24px] mt-[-4px]" aria-hidden="true">
                <path d="M54 2 C 36 10, 22 20, 16 34" stroke="#1d6bff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M8 26 L15 35 L25 28" stroke="#1d6bff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            )}
            <button type="button" className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer" onClick={handleEditPageLayout}>
              <Plus size={15} />
              Edit Page Layout
            </button>
          </div>
          <div className="lead-create-action-right">
            <button type="button" className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer" onClick={handleClose}>Cancel</button>
            <div className="relative inline-block">
              {showTour && isFormComplete && (
              <div className="pointer-events-none absolute bottom-[calc(100%+6px)] right-0 z-30 flex flex-col items-end">
                <div className="inline-flex w-max max-w-[280px] items-center gap-2.5 rounded-[16px] bg-[#1d6bff] px-4 py-3 text-left text-[14px] font-medium leading-snug text-white shadow-[0_4px_14px_rgba(29,107,255,0.35)]">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-bold text-[#1d6bff]">5</span>
                  <span>Click Submit to create the lead</span>
                </div>
                <svg width="56" height="48" viewBox="0 0 56 48" fill="none" className="mb-[-6px] mr-[52px] mt-[-4px]" aria-hidden="true">
                  <path d="M28 2 C 28 26, 26 36, 20 42" stroke="#1d6bff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  <path d="M12 34 L19 43 L29 35" stroke="#1d6bff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              )}
              <button type="button" className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold shadow-xs cursor-pointer" onClick={handleCreate} disabled={!isFormComplete} style={!isFormComplete ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>Create</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
