/**
 * leadDetailStore — the sub-collections behind one lead's detail drawer.
 *
 * These lived in a single `evenmore-crm-lead-details-v1` blob in localStorage,
 * alongside a set of `build*` helpers that invented sources, emails, files and
 * a timeline whenever the blob was empty. Every one of those sections has a
 * real endpoint (`/crm/leads/{id}/notes/`, `/calls/`, `/files/`, …), so the
 * drawer now shows what the server has — including nothing, when there is
 * nothing.
 *
 * The store is the tabs' source of truth: they render its rows and change them
 * only through `add` / `update` / `remove`, which go to the server first. Rows
 * are translated to and from each tab's shape by `leadDetailSections`.
 */
import { create } from 'zustand';
import { api } from '../services/api';
import { pullLeadDetail, pushLeadDetail, updateLeadDetailRow, deleteLeadDetailRow } from '../services/crmSync';
import { isServerId, mapWithLimit } from '../services/resourceSync';
import { sectionFromApi, sectionToApi } from '../services/leadDetailSections';

/** The sections the drawer renders, in the order it loads them. */
export const LEAD_SECTIONS = [
  'users', 'products', 'sources', 'emails',
  'timeline', 'files', 'calls', 'notes', 'threads',
];

/** Sections whose writes show up on the server-built timeline. */
const TIMELINE_SOURCES = new Set(['notes', 'calls', 'emails']);

const EMPTY_SECTIONS = Object.freeze(
  Object.fromEntries(LEAD_SECTIONS.map((section) => [section, []])),
);

/** `tasks` and `activities` come from the CRM task list and the timeline. */
export const EMPTY_DETAIL = Object.freeze({
  ...EMPTY_SECTIONS,
  tasks: [],
  activities: [],
});

export const useLeadDetailStore = create((set, get) => {
  /** Replace one section of one lead's cache. */
  const put = (leadId, section, rows) => set((s) => {
    const key = String(leadId || '');
    const current = s.byLead[key] || EMPTY_DETAIL;
    const next = { ...current, [section]: rows };
    if (section === 'timeline') next.activities = rows;
    return { byLead: { ...s.byLead, [key]: next } };
  });
  const rowsOf = (leadId, section) => (get().byLead[String(leadId || '')] || EMPTY_DETAIL)[section] || [];

  return {
    byLead: {},
    loading: {},

    /** Everything the drawer knows about one lead, never undefined. */
    sectionsFor: (leadId) => get().byLead[String(leadId || '')] || EMPTY_DETAIL,

    /**
     * Load every section for a lead. Sections whose request fails stay empty
     * rather than falling back to invented rows.
     */
    load: async (leadId, { force = false } = {}) => {
      const key = String(leadId || '');
      if (!isServerId(leadId)) return EMPTY_DETAIL;
      if (!force && get().byLead[key]) return get().byLead[key];
      if (get().loading[key]) return get().byLead[key] || EMPTY_DETAIL;

      set((s) => ({ loading: { ...s.loading, [key]: true } }));
      const pairs = await mapWithLimit(
        LEAD_SECTIONS,
        async (section) => [
          section,
          ((await pullLeadDetail(leadId, section)) || []).map((row) => sectionFromApi(section, row)),
        ],
      );
      const sections = { ...EMPTY_DETAIL, ...Object.fromEntries(pairs) };
      // The drawer's "activities" strip is the same data as the timeline.
      sections.activities = sections.timeline;
      set((s) => ({
        byLead: { ...s.byLead, [key]: sections },
        loading: { ...s.loading, [key]: false },
      }));
      return sections;
    },

    /** Append a row a tab built: server first, then the cache. Throws on rejection. */
    add: async (leadId, section, row) => {
      const saved = await pushLeadDetail(leadId, section, sectionToApi(section, row));
      if (!saved) throw new Error('Sign in to save changes to this lead.');
      const next = sectionFromApi(section, saved);
      put(leadId, section, [next, ...rowsOf(leadId, section)]);
      if (TIMELINE_SOURCES.has(section)) get().refreshSection(leadId, 'timeline');
      return next;
    },

    /** Change one row (by its server id). */
    update: async (leadId, section, rowId, changes) => {
      const saved = await updateLeadDetailRow(leadId, section, rowId, sectionToApi(section, changes));
      if (!saved) throw new Error('Sign in to save changes to this lead.');
      const next = sectionFromApi(section, saved);
      put(leadId, section, rowsOf(leadId, section).map((row) => (String(row.id) === String(rowId) ? next : row)));
      return next;
    },

    /** Remove one row. Files have their own route; the rest share `/{section}/{rowId}/`. */
    remove: async (leadId, section, rowId) => {
      if (section === 'files') {
        await api.delete(`/crm/leads/${leadId}/files/${rowId}/`);
      } else {
        await deleteLeadDetailRow(leadId, section, rowId);
      }
      put(leadId, section, rowsOf(leadId, section).filter((row) => String(row.id) !== String(rowId)));
      if (TIMELINE_SOURCES.has(section)) get().refreshSection(leadId, 'timeline');
      return true;
    },

    /** Re-read one section after something outside the drawer changed it. */
    refreshSection: async (leadId, section) => {
      const rows = await pullLeadDetail(leadId, section);
      if (!rows) return null;
      const mapped = rows.map((row) => sectionFromApi(section, row));
      put(leadId, section, mapped);
      return mapped;
    },

    clear: () => set({ byLead: {}, loading: {} }),
  };
});

export default useLeadDetailStore;
