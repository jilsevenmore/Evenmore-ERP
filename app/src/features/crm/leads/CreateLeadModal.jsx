import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Clock3, ImagePlus, Plus, X } from "lucide-react";

const PRODUCT_OPTIONS = [
  "Endoscopy System",
  "OT Light",
  "Patient Monitor",
  "X-Ray Machine",
  "Ventilator",
];

const USER_OPTIONS = [
  "Drashti Evenmore",
  "Amit Shah",
  "Rohit Sharma",
  "Priya Mehta",
  "Vanshi Rao",
];

function MultiValueSelect({ label, placeholder, options, values, onChange }) {
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
      <span>{label}</span>
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
  const [source, setSource] = useState("");
  const [titleValue, setTitleValue] = useState("");
  const [industry, setIndustry] = useState("");
  const [owner, setOwner] = useState("");
  const [createdOn, setCreatedOn] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskTime, setTaskTime] = useState("");
  const photoInputRef = useRef(null);
  const createdOnRef = useRef(null);
  const taskDateRef = useRef(null);
  const taskTimeRef = useRef(null);

  const isFormComplete =
    leadName.trim() !== "" &&
    company.trim() !== "" &&
    email.trim() !== "" &&
    phone.trim() !== "" &&
    source.trim() !== "" &&
    titleValue.trim() !== "" &&
    industry.trim() !== "" &&
    owner.trim() !== "";

  useEffect(() => {
    if (!isOpen) {
      setProducts([]);
      setLeadUsers([]);
      setPhotoPreview("");
      setLeadName("");
      setCompany("");
      setEmail("");
      setPhone("");
      setSource("");
      setTitleValue("");
      setIndustry("");
      setOwner("");
      setCreatedOn("");
      setTaskDate("");
      setTaskTime("");
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
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
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    onClose();
  }

  function handleCreate() {
    onCreate({
      leadName,
      company,
      email,
      phone,
      source,
      titleValue,
      industry,
      owner,
      createdOn,
      taskDate,
      taskTime,
      products,
      leadUsers,
      photoPreview,
    });
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
          <h3 className="lead-create-section-title">Lead Information</h3>
          <label className="lead-create-field">
            <span>Lead Name *</span>
            <select value={leadName} onChange={(event) => setLeadName(event.target.value)}>
              <option value="" disabled>Enter lead name</option>
              <option>Christopher Maclead</option>
              <option>Carissa Kidman</option>
              <option>James Merced</option>
            </select>
          </label>

          <div className="lead-create-field lead-create-photo-field">
            <span>Lead Photo</span>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              className="lead-photo-upload"
              onClick={() => photoInputRef.current?.click()}
            >
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
          </div>

          <label className="lead-create-field">
            <span>Company *</span>
            <input type="text" placeholder="Enter company name" value={company} onChange={(event) => setCompany(event.target.value)} />
          </label>

          <label className="lead-create-field">
            <span>Email</span>
            <input type="email" placeholder="Enter email address" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>

          <label className="lead-create-field">
            <span>Phone</span>
            <input type="tel" placeholder="Enter phone number" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>

          <label className="lead-create-field">
            <span>Lead Source</span>
            <select value={source} onChange={(event) => setSource(event.target.value)}>
              <option value="" disabled>Select source</option>
              <option>Cold Call</option>
              <option>Advertisement</option>
              <option>Partner</option>
            </select>
          </label>

          <label className="lead-create-field">
            <span>Title</span>
            <input type="text" placeholder="Enter title" value={titleValue} onChange={(event) => setTitleValue(event.target.value)} />
          </label>

          <label className="lead-create-field">
            <span>Industry</span>
            <input type="text" placeholder="Enter industry" value={industry} onChange={(event) => setIndustry(event.target.value)} />
          </label>

          <label className="lead-create-field">
            <span>Lead Owner *</span>
            <select value={owner} onChange={(event) => setOwner(event.target.value)}>
              <option value="" disabled>Select User</option>
              <option>David Patel</option>
              <option>Priya Mehta</option>
            </select>
          </label>

          <label className="lead-create-field">
            <span>Created On</span>
            <div className="input-icon-wrap">
              <input ref={createdOnRef} type="date" value={createdOn} onChange={(event) => setCreatedOn(event.target.value)} />
              <span role="button" tabIndex={0} aria-label="Open calendar" style={{ position: "absolute", top: 0, right: 0, width: 34, height: "100%", display: "grid", placeItems: "center", cursor: "pointer" }} onClick={() => { try { createdOnRef.current?.showPicker?.(); } catch { createdOnRef.current?.focus(); } }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); try { createdOnRef.current?.showPicker?.(); } catch { createdOnRef.current?.focus(); } } }}>
                <CalendarDays size={16} />
              </span>
            </div>
          </label>

          <MultiValueSelect
            label="Products"
            placeholder="Select Products"
            options={PRODUCT_OPTIONS}
            values={products}
            onChange={setProducts}
          />

          <MultiValueSelect
            label="Lead Users"
            placeholder="Select Users"
            options={USER_OPTIONS}
            values={leadUsers}
            onChange={setLeadUsers}
          />

          <label className="lead-create-field">
            <span>Task Date (Optional)</span>
            <div className="input-icon-wrap">
              <input ref={taskDateRef} type="date" value={taskDate} onChange={(event) => setTaskDate(event.target.value)} />
              <span role="button" tabIndex={0} aria-label="Open calendar" style={{ position: "absolute", top: 0, right: 0, width: 34, height: "100%", display: "grid", placeItems: "center", cursor: "pointer" }} onClick={() => { try { taskDateRef.current?.showPicker?.(); } catch { taskDateRef.current?.focus(); } }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); try { taskDateRef.current?.showPicker?.(); } catch { taskDateRef.current?.focus(); } } }}>
                <CalendarDays size={16} />
              </span>
            </div>
            <small>Leave blank to allocate the first form task immediately.</small>
          </label>

          <label className="lead-create-field">
            <span>Task Time (Optional)</span>
            <div className="input-icon-wrap">
              <input ref={taskTimeRef} type="time" value={taskTime} onChange={(event) => setTaskTime(event.target.value)} />
              <span role="button" tabIndex={0} aria-label="Open time picker" style={{ position: "absolute", top: 0, right: 0, width: 34, height: "100%", display: "grid", placeItems: "center", cursor: "pointer" }} onClick={() => { try { taskTimeRef.current?.showPicker?.(); } catch { taskTimeRef.current?.focus(); } }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); try { taskTimeRef.current?.showPicker?.(); } catch { taskTimeRef.current?.focus(); } } }}>
                <Clock3 size={16} />
              </span>
            </div>
            <small>No need to set time before calling.</small>
          </label>
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
            <button type="button" className="btn-outline" onClick={onEditLayout}>
              <Plus size={15} />
              Edit Page Layout
            </button>
          </div>
          <div className="lead-create-action-right">
            <button type="button" className="btn-outline" onClick={handleClose}>Cancel</button>
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
              <button type="button" className="btn-primary" onClick={handleCreate} disabled={!isFormComplete} style={!isFormComplete ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>Create</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
