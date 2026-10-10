/**
 * leadFormFields — what the Lead Create Form builder means for a lead record.
 *
 * The builder's default section holds the lead's own columns under fixed field
 * ids (`lead-name`, `company`, `email`, …). Every other field a user adds is a
 * custom field: its value is saved on the lead as `customValues[field.id]`.
 * Keyed by id, not label, so renaming a field in the builder keeps its data.
 *
 * Which form applies: the one open in the builder (`activeLeadFormId`), else the
 * published one, else the first. `findForm` also resolves the id a form had
 * before the server assigned one, so a builder link made then still works.
 */
import { findForm, getActiveFormId, loadForms, LEAD_FORM } from './crmForms';
import { STANDARD_LEAD_FIELD_IDS, visibleLeadFormSections } from '../data/crm/leadFormSchema';

/** Builder field ids that are real lead columns (the create modal has inputs for these). */
export { STANDARD_LEAD_FIELD_IDS };

/** Types a lead record can hold as a plain value. Uploads and lookups need their own flows. */
const UNSUPPORTED_TYPES = new Set(['File Upload', 'Lead Image', 'Lookup']);

export function activeLeadForm() {
  const active = getActiveFormId();
  const fromActive = active ? findForm(active) : null;
  if (fromActive && (fromActive.kind || LEAD_FORM) === LEAD_FORM) return fromActive;
  const forms = loadForms(LEAD_FORM);
  return forms.find((form) => form.isPublished) || forms[0] || null;
}

function fieldsOf(form) {
  return (form?.sections || []).flatMap((section) => section.fields || []);
}

/**
 * The Create Lead form as the builder lays it out: sections in order, each with
 * its visible fields — standard and custom — carrying their configured label,
 * placeholder and required flag. No saved form yet means the default layout.
 */
export function leadFormLayout(form = activeLeadForm()) {
  return visibleLeadFormSections(form?.sections);
}

/** True when the create form can hold a value for this custom field. */
export function isSupportedCustomField(field) {
  return Boolean(field?.id) && !STANDARD_LEAD_FIELD_IDS.has(field.id) && !UNSUPPORTED_TYPES.has(field.type);
}

/** The custom (non-column) fields of a lead form, in builder order. */
export function customLeadFields(form = activeLeadForm()) {
  return fieldsOf(form).filter(isSupportedCustomField);
}

/**
 * Every custom field any lead form defines, by id — so a lead created with an
 * older or different form still shows its values with their current labels.
 */
export function allCustomLeadFields() {
  const byId = new Map();
  loadForms(LEAD_FORM).forEach((form) => {
    customLeadFields(form).forEach((field) => {
      if (!byId.has(field.id)) byId.set(field.id, field);
    });
  });
  return byId;
}

export function isBlankValue(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

/** The first required custom field left empty, or null. */
export function missingRequiredField(fields, values = {}) {
  return fields.find((field) => field.required && isBlankValue(values[field.id])) || null;
}

/** A stored value as text, for read-only display. */
export function formatCustomValue(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return isBlankValue(value) ? '—' : String(value);
}
