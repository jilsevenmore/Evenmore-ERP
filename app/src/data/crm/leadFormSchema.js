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

export const defaultLeadFormSections = [
  {
    id: "lead-information",
    title: "Lead Information",
    fields: [
      createField("lead-owner", "User", { label: "Lead Owner", placeholder: "Select User", required: true, showInList: true }),
      createField("company", "Single Line", { label: "Company", placeholder: "Enter company name", required: true, showInList: true }),
      createField("first-name", "Single Line", { label: "First Name", placeholder: "Enter first name", showInList: true }),
      createField("last-name", "Single Line", { label: "Last Name", placeholder: "Enter last name", showInList: true }),
      createField("title", "Single Line", { label: "Title", placeholder: "Enter title" }),
      createField("email", "Email", { label: "Email", placeholder: "Enter email address", showInList: true, uniqueValue: true }),
      createField("phone", "Phone", { label: "Phone", placeholder: "Enter phone number", showInList: true }),
      createField("fax", "Phone", { label: "Fax", placeholder: "Enter fax number" }),
      createField("mobile", "Phone", { label: "Mobile", placeholder: "Enter mobile number", showInList: true }),
      createField("website", "Lookup", { label: "Website", placeholder: "Enter website" }),
      createField("lead-source", "Dropdown", { label: "Lead Source", placeholder: "Select source", showInList: true }),
      createField("lead-status", "Dropdown", { label: "Lead Status", placeholder: "Select status", showInList: true }),
      createField("lead-image", "Lead Image", { label: "Lead Image", placeholder: "Upload lead photo" }),
    ],
  },
  {
    id: "address-information",
    title: "Address Information",
    fields: [
      createField("country-region", "Dropdown", { label: "Country / Region", placeholder: "Select country" }),
      createField("flat-house", "Single Line", { label: "Flat / House No. / Building / Apartment Name", placeholder: "Enter address" }),
      createField("street-address", "Single Line", { label: "Street Address", placeholder: "Enter street address" }),
      createField("city", "Single Line", { label: "City", placeholder: "Enter city", showInList: true }),
      createField("state-province", "Dropdown", { label: "State / Province", placeholder: "Select state", showInList: true }),
      createField("zip-postal", "Number", { label: "Zip / Postal Code", placeholder: "Enter postal code" }),
    ],
  },
  {
    id: "description-information",
    title: "Description Information",
    fields: [
      createField("description", "Multi Line", {
        label: "Description",
        placeholder: "Enter description here...",
        helpText: "Capture lead context, business need, and the next action.",
      }),
    ],
  },
];
