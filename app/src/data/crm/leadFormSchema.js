export const FIELD_LIBRARY = [
  "Single Line",
  "Multi Line",
  "Number",
  "Email",
  "Phone",
  "Date",
  "Dropdown",
  "Multi Select",
  "Checkbox",
  "Radio",
  "File Upload",
  "Currency",
  "User",
  "Lookup",
  "Lead Image",
];

const FIELD_TEMPLATES = {
  "Single Line": { label: "Single Line", placeholder: "Enter value" },
  "Multi Line": { label: "Multi Line", placeholder: "Enter details here..." },
  Number: { label: "Number", placeholder: "Enter number" },
  Email: { label: "Email", placeholder: "Enter email address" },
  Phone: { label: "Phone", placeholder: "Enter phone number" },
  Date: { label: "Date", placeholder: "Select date" },
  Dropdown: { label: "Dropdown", placeholder: "Select option" },
  "Multi Select": { label: "Multi Select", placeholder: "Select one or more options" },
  Checkbox: { label: "Checkbox", placeholder: "Enable this field" },
  Radio: { label: "Radio", placeholder: "Select one option" },
  "File Upload": { label: "File Upload", placeholder: "Upload file" },
  Currency: { label: "Currency", placeholder: "Enter amount" },
  User: { label: "User", placeholder: "Select user" },
  Lookup: { label: "Lookup", placeholder: "Search related record" },
  "Lead Image": { label: "Lead Image", placeholder: "Upload lead photo" },
};

function createField(id, type, overrides = {}) {
  return {
    id,
    type,
    label: FIELD_TEMPLATES[type]?.label ?? type,
    placeholder: FIELD_TEMPLATES[type]?.placeholder ?? "Enter value",
    required: false,
    showInList: false,
    uniqueValue: false,
    defaultValue: "None",
    helpText: "",
    ...overrides,
  };
}

export function createFieldFromType(type, seed = Date.now()) {
  const normalized = type.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return createField(`${normalized}-${seed}`, type);
}

// The lead's own inputs, which the Create Lead modal always renders. They are
// locked in the builder: removing one there would not remove it from the modal.
const STANDARD_LEAD_FIELDS = [
  createField("lead-name", "Single Line", { label: "Lead Name", placeholder: "Enter lead name", required: true, showInList: true, locked: true }),
  createField("lead-photo", "Lead Image", { label: "Lead Photo", placeholder: "Upload lead photo", locked: true }),
  createField("company", "Single Line", { label: "Company", placeholder: "Enter company name", required: true, showInList: true, locked: true }),
  createField("email", "Email", { label: "Email", placeholder: "Enter email address", showInList: true, uniqueValue: true, locked: true }),
  createField("phone", "Phone", { label: "Phone", placeholder: "Enter phone number", showInList: true, locked: true }),
  createField("lead-source", "Dropdown", { label: "Lead Source", placeholder: "Select source", showInList: true, locked: true }),
  createField("title", "Single Line", { label: "Title", placeholder: "Enter title", locked: true }),
  createField("industry", "Single Line", { label: "Industry", placeholder: "Enter industry", locked: true }),
  createField("lead-owner", "User", { label: "Lead Owner", placeholder: "Select User", required: true, showInList: true, locked: true }),
  createField("created-on", "Date", { label: "Created On", placeholder: "Select created date", locked: true }),
  createField("products", "Multi Select", { label: "Products", placeholder: "Select Products", locked: true }),
  createField("lead-users", "User", { label: "Lead Users", placeholder: "Select Users", locked: true }),
  createField("task-date", "Date", { label: "Task Date (Optional)", placeholder: "Select task date", locked: true }),
  createField("task-time", "Single Line", { label: "Task Time (Optional)", placeholder: "Select task time", locked: true }),
];

export const STANDARD_LEAD_FIELD_IDS = new Set(STANDARD_LEAD_FIELDS.map((field) => field.id));

export const defaultLeadFormSections = [
  {
    id: "lead-information",
    title: "Lead Information",
    fields: STANDARD_LEAD_FIELDS,
  },
];

/**
 * A saved form's sections with every standard lead field present and locked.
 * Forms created with an empty section, or saved before a standard field
 * existed, get the missing ones added to the first section in their default
 * order; fields already placed keep their position and edits.
 */
export function withStandardLeadFields(sections) {
  const source = Array.isArray(sections) && sections.length > 0 ? sections : defaultLeadFormSections;
  const present = new Set(source.flatMap((section) => (section.fields || []).map((field) => field.id)));
  const missing = STANDARD_LEAD_FIELDS.filter((field) => !present.has(field.id));
  if (missing.length === 0 && source.every((section) => (section.fields || []).every(
    (field) => !STANDARD_LEAD_FIELD_IDS.has(field.id) || field.locked,
  ))) {
    return source;
  }

  return source.map((section, index) => {
    const fields = (section.fields || []).map((field) =>
      STANDARD_LEAD_FIELD_IDS.has(field.id) && !field.locked ? { ...field, locked: true } : field,
    );
    if (index !== 0 || missing.length === 0) return { ...section, fields };

    // Insert each missing field after the nearest standard field that precedes it.
    const next = [...fields];
    missing.forEach((field) => {
      const order = STANDARD_LEAD_FIELDS.findIndex((item) => item.id === field.id);
      let insertAt = 0;
      for (let i = order - 1; i >= 0; i -= 1) {
        const anchor = next.findIndex((item) => item.id === STANDARD_LEAD_FIELDS[i].id);
        if (anchor >= 0) {
          insertAt = anchor + 1;
          break;
        }
      }
      next.splice(insertAt, 0, { ...field });
    });
    return { ...section, fields: next };
  });
}
