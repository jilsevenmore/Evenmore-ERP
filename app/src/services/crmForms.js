/**
 * crmForms — the lead-capture and task form definitions, at `/crm/forms/`.
 *
 * The form builders kept their definitions in three `localStorage` keys
 * (`dynamicLeadForms`, `leadFormSections`, `leadTaskFormsV1`), which meant a
 * form designed on one machine did not exist on any other. They are one server
 * collection, distinguished by `kind`, so a form published from the builder is
 * the form the capture page renders.
 *
 * Which form the builder currently has open stays in the browser: that is a
 * per-tab editing position, not part of the form.
 */
import { useCrmStore } from '../stores/crmStore';
import { syncCollection } from './crmCollections';

export const LEAD_FORM = 'lead';
export const TASK_FORM = 'task';

/** The forms of one kind, as the server returned them. */
export function loadForms(kind = LEAD_FORM) {
  return useCrmStore.getState().forms.filter((form) => (form.kind || LEAD_FORM) === kind);
}

/** Persist the form list a builder just produced. */
export function saveForms(next = [], kind = LEAD_FORM) {
  const stamped = next.map((form) => ({ ...form, kind: form.kind || kind }));
  const previous = useCrmStore.getState().forms;
  // Forms of the other kind are untouched, so they are carried through as-is.
  const others = previous.filter((form) => (form.kind || LEAD_FORM) !== kind);
  syncCollection('forms', [...others, ...stamped], previous);
}

/** One form by id, across both kinds. */
export function findForm(formId) {
  return useCrmStore.getState().forms.find((form) => String(form.id) === String(formId)) || null;
}

/** Which form the builder has open — a per-tab editing position. */
export function getActiveFormId(key = 'activeLeadFormId') {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setActiveFormId(formId, key = 'activeLeadFormId') {
  try {
    if (formId) localStorage.setItem(key, formId);
    else localStorage.removeItem(key);
  } catch {
    /* private mode — the builder still works, it just does not reopen */
  }
}
