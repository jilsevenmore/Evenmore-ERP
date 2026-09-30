/**
 * syncCollection — write a whole CRM collection back after a screen edited it.
 *
 * Several CRM configuration screens (master tasks, stage tasks, the pipelines)
 * hold their list in local component state and save the array wholesale — they
 * were written against a `localStorage` blob. Rather than rewrite each of their
 * handlers, they hand the list here and this works out what changed: rows the
 * server has not seen are created, rows that differ are patched, and rows that
 * disappeared are deleted.
 */
import { useCrmStore } from '../stores/crmStore';
import { isServerId } from './resourceSync';

function warn(key) {
  return (err) => console.warn(`[CRM] ${key} not saved:`, err?.message || err);
}

/** Returns a promise that settles once every write has (it never rejects). */
export function syncCollection(key, next = [], previous = []) {
  const store = useCrmStore.getState();
  const before = new Map(previous.map((row) => [String(row?.id), row]));
  const after = new Set(next.map((row) => String(row?.id)));
  const report = warn(key);
  const writes = [];

  next.forEach((row) => {
    if (!row) return;
    const existing = before.get(String(row.id));
    if (!existing) {
      writes.push(store.createRecord(key, row).catch(report));
    } else if (isServerId(row.id) && JSON.stringify(existing) !== JSON.stringify(row)) {
      writes.push(store.updateRecord(key, row.id, row).catch(report));
    }
  });

  previous.forEach((row) => {
    if (row && !after.has(String(row.id)) && isServerId(row.id)) {
      writes.push(store.deleteRecord(key, row.id).catch(report));
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('crm:data-updated'));
  }
  return Promise.all(writes);
}

export default syncCollection;
