/**
 * useModuleHydration — fills every module store from the API once a session
 * exists, and empties them again on sign-out.
 *
 * It runs inside the authenticated shell, so the sign-in page never triggers a
 * pull, and each store's own `hydrate()` decides whether there is anything to
 * do. One place to register a module keeps the boot sequence readable.
 */
import { useEffect } from 'react';
import { getStoredToken } from '../utils/authUtils';
import { refreshNotifications } from '../services/crmEventNotifications';
import { useAppStore } from '../stores/appStore';
import { useCrmStore } from '../stores/crmStore';
import { usePmsStore } from '../stores/pmsStore';
import { useAttendanceStore } from '../stores/attendanceStore';
import { useRecruitmentStore } from '../stores/recruitmentStore';
import { usePerformanceStore } from '../stores/performanceStore';
import { usePayrollStore } from '../stores/payrollStore';
import { usePolicyStore } from '../stores/policyStore';
import { useTrainingStore } from '../stores/trainingStore';
import { useAssetStore } from '../stores/assetStore';
import { useDocumentStore } from '../stores/documentStore';
import { useCalendarStore } from '../stores/calendarStore';

/** Every store that owns server data. Add a module here and it boots with the app. */
const MODULE_STORES = [
  useCrmStore,
  usePmsStore,
  useAttendanceStore,
  useRecruitmentStore,
  usePerformanceStore,
  usePayrollStore,
  usePolicyStore,
  useTrainingStore,
  useAssetStore,
  useDocumentStore,
  useCalendarStore,
];

export function useModuleHydration() {
  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      const app = useAppStore.getState();

      if (!getStoredToken()) {
        MODULE_STORES.forEach((store) => {
          const state = store.getState();
          // Some stores already used `clear` for their toast, so the data reset
          // is `clearData` there.
          (state.clearData || state.clear)?.();
        });
        app.clearHrms?.();
        return;
      }

      // Each store's own pull is already capped, but eleven of them starting
      // together would still put ~60 requests on the wire at once. Running them
      // one after another keeps the burst small, and each module appears as
      // soon as its own data lands rather than waiting for all of them.
      (async () => {
        for (const store of MODULE_STORES) {
          if (cancelled) return;
          try {
            await store.getState().hydrate?.();
          } catch (err) {
            console.warn('[hydration] module failed to load:', err?.message || err);
          }
        }
        if (cancelled) return;
        await app.hydrateHrms?.();
        if (!cancelled) refreshNotifications();
      })();

      // PMS filters "my projects" / "my tasks" by the signed-in user.
      const me = app.currentUser;
      if (me?.id) usePmsStore.getState().setCurrentUserId(me.employeeId || me.id);
    };

    run();

    // Signing in from another tab, or the token being cleared by a 401, both
    // change what this shell should be holding.
    window.addEventListener('evenmore:authorized', run);
    window.addEventListener('evenmore:unauthorized', run);
    window.addEventListener('storage', run);
    return () => {
      cancelled = true;
      window.removeEventListener('evenmore:authorized', run);
      window.removeEventListener('evenmore:unauthorized', run);
      window.removeEventListener('storage', run);
    };
  }, []);
}

export default useModuleHydration;
