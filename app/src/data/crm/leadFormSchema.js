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

// The lead's own inputs (real lead columns, not customValues). Replaced: these
// used to be `locked: true` — always rendered by the Create Lead modal and not
// removable in the builder. The modal now follows the builder for them too:
// label, placeholder, required, position and whether they appear at all.
const STANDARD_LEAD_FIELDS = [
  createField("lead-name", "Single Line", { label: "Lead Name", placeholder: "Enter lead name", required: true, showInList: true }),
  createField("lead-photo", "Lead Image", { label: "Lead Photo", placeholder: "Upload lead photo" }),
  createField("company", "Single Line", { label: "Company", placeholder: "Enter company name", required: true, showInList: true }),
  createField("email", "Email", { label: "Email", placeholder: "Enter email address", showInList: true, uniqueValue: true }),
  createField("phone", "Phone", { label: "Phone", placeholder: "Enter phone number", showInList: true }),
  createField("lead-source", "Dropdown", { label: "Lead Source", placeholder: "Select source", showInList: true }),
  createField("title", "Single Line", { label: "Title", placeholder: "Enter title" }),
  createField("industry", "Single Line", { label: "Industry", placeholder: "Enter industry" }),
  createField("lead-owner", "User", { label: "Lead Owner", placeholder: "Select User", required: true, showInList: true }),
  createField("created-on", "Date", { label: "Created On", placeholder: "Select created date" }),
  createField("products", "Multi Select", { label: "Products", placeholder: "Select Products" }),
  createField("lead-users", "User", { label: "Lead Users", placeholder: "Select Users" }),
  createField("task-date", "Date", { label: "Task Date (Optional)", placeholder: "Select task date" }),
  createField("task-time", "Single Line", { label: "Task Time (Optional)", placeholder: "Select task time" }),
];

export const STANDARD_LEAD_FIELD_IDS = new Set(STANDARD_LEAD_FIELDS.map((field) => field.id));

/** Every lead needs a name (the only NOT NULL lead column), so this one stays on the form. */
export const PERMANENT_LEAD_FIELD_ID = "lead-name";

/**
 * Standard fields map to fixed inputs (a lookup select, a date picker …), so
 * their type cannot change and their options come from the server, not the
 * builder. Everything else about them is configurable.
 */
export function isStandardLeadField(field) {
  return Boolean(field?.id && STANDARD_LEAD_FIELD_IDS.has(field.id));
}

export const defaultLeadFormSections = [
  {
    id: "lead-information",
    title: "Lead Information",
    fields: STANDARD_LEAD_FIELDS,
  },
];

/**
 * A saved form's sections with every standard lead field accounted for.
 * A standard field removed in the builder stays in the saved layout as
 * `hidden: true`, so it is not added back here. Forms created with an empty
 * section, or saved before a standard field existed, get the missing ones
 * added to the first section in their default order; fields already placed
 * keep their position and edits.
 */
export function withStandardLeadFields(sections) {
  const source = Array.isArray(sections) && sections.length > 0 ? sections : defaultLeadFormSections;
  const present = new Set(source.flatMap((section) => (section.fields || []).map((field) => field.id)));
  const missing = STANDARD_LEAD_FIELDS.filter((field) => !present.has(field.id));
  if (missing.length === 0) return source;

  return source.map((section, index) => {
    const fields = section.fields || [];
    if (index !== 0) return section;

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

/** The sections as the Create Lead form shows them: removed standard fields left out. */
export function visibleLeadFormSections(sections) {
  return withStandardLeadFields(sections).map((section) => ({
    ...section,
    fields: (section.fields || []).filter((field) => !field.hidden),
  }));
}
