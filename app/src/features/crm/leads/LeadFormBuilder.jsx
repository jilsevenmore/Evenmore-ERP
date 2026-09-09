import { useMemo, useState } from "react";
import {
  CheckSquare,
  ChevronDown,
  Copy,
  Eye,
  FileText,
  GripVertical,
  ImagePlus,
  List,
  Mail,
  MapPinPlus,
  Phone,
  Plus,
  Save,
  Trash2,
  Type,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { FIELD_LIBRARY } from '../../../data/crm/leadFormSchema';

const FIELD_ICONS = {
  "Single Line": Type,
  "Multi Line": FileText,
  Number: List,
  Email: Mail,
  Phone,
  Date: CheckSquare,
  Dropdown: ChevronDown,
  "Multi Select": List,
  Checkbox: CheckSquare,
  Radio: CheckSquare,
  "File Upload": Upload,
  Currency: List,
  User: UserRound,
  Lookup: MapPinPlus,
  "Lead Image": ImagePlus,
};

function readDragPayload(event) {
  const raw = event.dataTransfer.getData("application/json");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function FieldPreview({ field, sectionId, selected, onSelect, onRemove, onDropField, onDragStart }) {
  const Icon = FIELD_ICONS[field.type] ?? Type;
  const isTextArea = field.type === "Multi Line";
  const isSelect = field.type === "Dropdown";
  const isLeadImage = field.type === "Lead Image";

  function handleDrop(event, position) {
    event.preventDefault();
    onDropField(readDragPayload(event), sectionId, position);
  }

  return (
    <div
      className={`builder-field-wrap${selected ? " selected" : ""}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => handleDrop(event, "before")}
    >
      <div
        className={`builder-field-card${selected ? " selected" : ""}`}
        onClick={onSelect}
        draggable
        onDragStart={(event) => onDragStart(event, { kind: "field", fieldId: field.id, sectionId })}
      >
        <span className="builder-field-grip">
          <GripVertical size={15} />
        </span>
        <div className="builder-field-content">
          <div className="builder-field-top">
            <strong>
              {field.label}
              {field.required ? " *" : ""}
            </strong>
            <button
              type="button"
              className="builder-field-remove"
              onClick={(event) => {
                event.stopPropagation();
                onRemove(field.id);
              }}
              aria-label={`Remove ${field.label}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
          {isLeadImage ? (
            <div className="builder-image-field">
              <div className="builder-image-toggle">
                <span>{field.label}</span>
                <span className="builder-toggle-pill">
                  <span className="builder-toggle-dot" />
                </span>
              </div>
              <div className="builder-image-box">
                <ImagePlus size={28} />
              </div>
            </div>
          ) : isTextArea ? (
            <textarea rows={2} placeholder={field.placeholder} readOnly />
          ) : isSelect ? (
            <div className="builder-fake-select">
              <span>{field.placeholder}</span>
              <ChevronDown size={14} />
            </div>
          ) : (
            <div className="builder-fake-input">
              <span>{field.placeholder}</span>
              <Icon size={14} />
            </div>
          )}
        </div>
      </div>
      <div className="builder-drop-slot" onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, "after")} />
    </div>
  );
}

export default function LeadFormBuilder({
  sections,
  selectedFieldId,
  onSelectField,
  selectedField,
  onUpdateField,
  onAddField,
  onRemoveField,
  onMoveField,
  onAddSection,
  onSaveAndOpen,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const SelectedTypeIcon = FIELD_ICONS[selectedField?.type] ?? Type;

  const libraryItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return FIELD_LIBRARY;
    return FIELD_LIBRARY.filter((item) => item.toLowerCase().includes(query));
  }, [searchQuery]);

  function handleDragStart(event, payload) {
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(payload, sectionId, position, anchorFieldId) {
    if (!payload) return;

    const section = sections.find((item) => item.id === sectionId);
    if (!section) return;

    let targetIndex = section.fields.length;

    if (anchorFieldId) {
      const anchorIndex = section.fields.findIndex((field) => field.id === anchorFieldId);
      if (anchorIndex >= 0) {
        targetIndex = position === "before" ? anchorIndex : anchorIndex + 1;
      }
    }

    if (payload.kind === "library") {
      onAddField(sectionId, payload.type, targetIndex);
      return;
    }

    if (payload.kind === "field") {
      if (payload.sectionId === sectionId) {
        const sourceIndex = section.fields.findIndex((field) => field.id === payload.fieldId);
        if (sourceIndex >= 0 && sourceIndex < targetIndex) {
          targetIndex -= 1;
        }
      }
      onMoveField(payload.fieldId, sectionId, targetIndex);
    }
  }

  return (
    <section className="form-builder-shell">
      <div className="form-builder-top">
        <div>
          <div className="builder-breadcrumb">CRM &gt; Leads &gt; Form Builder</div>
          <h1>Lead Form Builder</h1>
          <p>Create and manage your lead form with custom fields. Drag, drop and configure fields easily.</p>
        </div>
        <div className="form-builder-actions">
          <button type="button" className="btn-outline" onClick={onSaveAndOpen}>
            <Eye size={16} />
            Preview
          </button>
          <button type="button" className="btn-primary" onClick={onSaveAndOpen}>
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>

      <div className="form-builder-grid">
        <aside className="builder-panel">
          <h3>Fields</h3>
          <label className="builder-search">
            <Type size={15} />
            <input
              type="text"
              placeholder="Search field types..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <div className="builder-library">
            {libraryItems.map((type) => {
              const Icon = FIELD_ICONS[type] ?? Type;
              return (
                <button
                  key={type}
                  type="button"
                  className="builder-library-item"
                  draggable
                  onDragStart={(event) => handleDragStart(event, { kind: "library", type })}
                >
                  <Icon size={16} />
                  <span>{type}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="builder-center">
          <div className="builder-panel builder-panel-main">
            <div className="builder-main-head">
              <div>
                <h3>Lead Form</h3>
                <p>Drag a field from the left panel and drop it inside any section. You can also remove or rearrange fields.</p>
              </div>
              <div className="builder-main-actions">
                <button type="button" className="btn-outline" onClick={onAddSection}>
                  <Plus size={15} />
                  Add Section
                </button>
                <button type="button" className="btn-primary" onClick={() => onAddField(sections[0]?.id, "Single Line")}>
                  <Plus size={15} />
                  Add Field
                </button>
              </div>
            </div>

            <div className="builder-sections">
              {sections.map((section) => (
                <section key={section.id} className="builder-section-card">
                  <div className="builder-section-head">
                    <div className="builder-section-title">
                      <ChevronDown size={16} />
                      <strong>{section.title}</strong>
                    </div>
                    <div className="builder-section-tools">
                      <button type="button" className="icon-lite"><Copy size={15} /></button>
                      <button type="button" className="icon-lite"><Trash2 size={15} /></button>
                    </div>
                  </div>

                  <div
                    className={`builder-fields-grid${section.fields.length === 0 ? " empty" : ""}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(readDragPayload(event), section.id)}
                  >
                    {section.fields.length === 0 && (
                      <div className="builder-empty-dropzone">Drop a field here</div>
                    )}
                    {section.fields.map((field) => (
                      <FieldPreview
                        key={field.id}
                        field={field}
                        sectionId={section.id}
                        selected={field.id === selectedFieldId}
                        onSelect={() => onSelectField(field.id)}
                        onRemove={onRemoveField}
                        onDragStart={handleDragStart}
                        onDropField={(payload, targetSectionId, position) =>
                          handleDrop(payload, targetSectionId, position, field.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>

        <aside className="builder-panel">
          <div className="builder-properties-head">
            <h3>Field Properties</h3>
            <button type="button" className="modal-close" aria-label="Close properties">
              <X size={18} />
            </button>
          </div>

          {selectedField ? (
            <>
              <div className="builder-property-type">
                <span className="builder-property-icon">
                  <SelectedTypeIcon size={20} />
                </span>
                <strong>{selectedField.type}</strong>
              </div>

              <div className="builder-property-tabs">
                <button type="button" className="active">General</button>
                <button type="button">Validation</button>
                <button type="button">Advanced</button>
              </div>

              <div className="builder-property-form">
                <label className="builder-property-field">
                  <span>Label *</span>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(event) => onUpdateField(selectedField.id, { label: event.target.value })}
                  />
                </label>

                <label className="builder-property-field">
                  <span>Placeholder</span>
                  <input
                    type="text"
                    value={selectedField.placeholder}
                    onChange={(event) => onUpdateField(selectedField.id, { placeholder: event.target.value })}
                  />
                </label>

                <label className="builder-property-field">
                  <span>Field Type</span>
                  <select
                    value={selectedField.type}
                    onChange={(event) => onUpdateField(selectedField.id, { type: event.target.value })}
                  >
                    {FIELD_LIBRARY.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label className="builder-toggle-row">
                  <span>Required</span>
                  <input
                    type="checkbox"
                    checked={selectedField.required}
                    onChange={(event) => onUpdateField(selectedField.id, { required: event.target.checked })}
                  />
                </label>

                <label className="builder-toggle-row">
                  <span>Show in List View</span>
                  <input
                    type="checkbox"
                    checked={selectedField.showInList}
                    onChange={(event) => onUpdateField(selectedField.id, { showInList: event.target.checked })}
                  />
                </label>

                <label className="builder-toggle-row">
                  <span>Unique Value</span>
                  <input
                    type="checkbox"
                    checked={selectedField.uniqueValue}
                    onChange={(event) => onUpdateField(selectedField.id, { uniqueValue: event.target.checked })}
                  />
                </label>

                <label className="builder-property-field">
                  <span>Default Value</span>
                  <select
                    value={selectedField.defaultValue}
                    onChange={(event) => onUpdateField(selectedField.id, { defaultValue: event.target.value })}
                  >
                    <option>None</option>
                    <option>Auto</option>
                    <option>Manual</option>
                  </select>
                </label>

                <label className="builder-property-field">
                  <span>Help Text</span>
                  <textarea
                    rows={4}
                    value={selectedField.helpText}
                    onChange={(event) => onUpdateField(selectedField.id, { helpText: event.target.value })}
                    placeholder="Enter help text (optional)"
                  />
                </label>
              </div>

              <div className="builder-property-actions">
                <button type="button" className="btn-outline" onClick={() => onRemoveField(selectedField.id)}>
                  Remove Field
                </button>
                <button type="button" className="btn-primary" onClick={onSaveAndOpen}>Save Field</button>
              </div>
            </>
          ) : (
            <div className="builder-empty-state">Select any field from the form to edit its properties.</div>
          )}
        </aside>
      </div>
    </section>
  );
}
