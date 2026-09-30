/**
 * useOrgCollection — one Organization list (departments, designations,
 * locations) read from and written to `/hrms/<key>/`.
 *
 * Every write re-reads the list, because the rows carry counts the server
 * computes (headcount, teams, open roles) that a local patch would get wrong.
 * A refusal — a duplicate name, a unit still in use — is shown as the
 * server's own message and leaves the list as the server has it.
 */
import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { hrmsSync, describeError } from '../../services/hrmsSync';

export function useOrgCollection(key, noun) {
  const showToast = useAppStore((s) => s.showToast);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  // A failed read keeps what is on screen and says so, rather than showing
  // an empty list as if there were nothing.
  const [failed, setFailed] = useState(false);

  const reload = useCallback(async () => {
    const next = await hrmsSync.pull(key);
    if (Array.isArray(next)) setRows(next);
    setFailed(!Array.isArray(next));
    setLoading(false);
    return next;
  }, [key]);

  useEffect(() => {
    reload();
  }, [reload]);

  /** Create (no id) or update (id) — resolves to the saved row, or null. */
  const save = useCallback(async (id, payload) => {
    try {
      const saved = id
        ? await hrmsSync.update(key, id, payload)
        : await hrmsSync.create(key, payload);
      await reload();
      return saved || null;
    } catch (err) {
      showToast(`${noun} not saved — ${describeError(err)}`);
      return null;
    }
  }, [key, noun, reload, showToast]);

  const remove = useCallback(async (id) => {
    try {
      await hrmsSync.remove(key, id);
      await reload();
      return true;
    } catch (err) {
      showToast(`${noun} not deleted — ${describeError(err)}`);
      return false;
    }
  }, [key, noun, reload, showToast]);

  return { rows, loading, failed, reload, save, remove };
}

/** Employees for the head / people pickers, from the HRMS store. */
export function useEmployeeOptions() {
  const employees = useAppStore((s) => s.employees || []);
  const refreshHrms = useAppStore((s) => s.refreshHrms);
  useEffect(() => {
    if (!employees.length) refreshHrms?.('employees');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return employees.filter((e) => e?.id && !['Resigned', 'Terminated'].includes(e.status));
}

/** A confirm step before a delete, shared by the three list pages. */
export function useConfirmDelete(remove, showToast, noun) {
  const [target, setTarget] = useState(null);
  async function confirm() {
    if (!target) return;
    const { id, name } = target;
    setTarget(null);
    if (await remove(id)) showToast(`${noun} "${name}" deleted`);
  }
  return { target, ask: setTarget, cancel: () => setTarget(null), confirm };
}
