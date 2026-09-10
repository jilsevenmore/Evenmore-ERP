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

export default function CreateLeadModal({ isOpen, onClose, onCreate, onEditLayout }) {
  const [products, setProducts] = useState([]);
  const [leadUsers, setLeadUsers] = useState([]);
  const [photoPreview, setPhotoPreview] = useState("");
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setProducts([]);
      setLeadUsers([]);
      setPhotoPreview("");
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
      products,
      leadUsers,
      photoPreview,
    });
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={handleClose}>
      <section
        className="lead-create-modal"
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

        <div className="lead-create-modal-body">
          <h3 className="lead-create-section-title">Lead Information</h3>
          <label className="lead-create-field">
            <span>Lead Name *</span>
            <select defaultValue="">
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
            <input type="text" placeholder="Enter company name" />
          </label>

          <label className="lead-create-field">
            <span>Email</span>
            <input type="email" placeholder="Enter email address" />
          </label>

          <label className="lead-create-field">
            <span>Phone</span>
            <input type="tel" placeholder="Enter phone number" />
          </label>

          <label className="lead-create-field">
            <span>Lead Source</span>
            <select defaultValue="">
              <option value="" disabled>Select source</option>
              <option>Cold Call</option>
              <option>Advertisement</option>
              <option>Partner</option>
            </select>
          </label>

          <label className="lead-create-field">
            <span>Title</span>
            <input type="text" placeholder="Enter title" />
          </label>

          <label className="lead-create-field">
            <span>Industry</span>
            <input type="text" placeholder="Enter industry" />
          </label>

          <label className="lead-create-field">
            <span>Lead Owner *</span>
            <select defaultValue="">
              <option value="" disabled>Select User</option>
              <option>David Patel</option>
              <option>Priya Mehta</option>
            </select>
          </label>

          <label className="lead-create-field">
            <span>Created On</span>
            <div className="input-icon-wrap">
              <input type="text" placeholder="dd-mm-yyyy" />
              <CalendarDays size={16} />
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
              <input type="text" placeholder="dd-mm-yyyy" />
              <CalendarDays size={16} />
            </div>
            <small>Leave blank to allocate the first form task immediately.</small>
          </label>

          <label className="lead-create-field">
            <span>Task Time (Optional)</span>
            <div className="input-icon-wrap">
              <input type="text" placeholder="--:--" />
              <Clock3 size={16} />
            </div>
            <small>No need to set time before calling.</small>
          </label>
        </div>

        <div className="lead-create-modal-actions">
          <button type="button" className="btn-outline" onClick={onEditLayout}>
            <Plus size={15} />
            Edit Page Layout
          </button>
          <div className="lead-create-action-right">
            <button type="button" className="btn-outline" onClick={handleClose}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleCreate}>Create</button>
          </div>
        </div>
      </section>
    </div>
  );
}
