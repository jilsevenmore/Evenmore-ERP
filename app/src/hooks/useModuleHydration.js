/**
<<<<<<< Updated upstream
 * useModuleHydration — keeps the module stores in step with the session.
 *
 * It no longer fills them. Every module store hydrates itself the first time a
 * screen reads it (`services/lazyModules`), so opening the app costs the
 * requests of the page being opened and nothing else; the CRM, PMS, payroll,
 * recruitment and training pulls happen when those screens are actually asked
 * for.
 *
 * What still has to be watched from here is the session itself:
 *
 *   signed out — empty every store, so the next user sees nothing of the
 *                previous one, and forget what was loaded.
 *   signed in  — forget what was loaded and re-pull whichever modules this tab
 *                has already used: screens that are already mounted will not
 *                read their store a second time on their own.
=======
 * useModuleHydration — fills every module store from the API once a session
 * exists, and empties them again on sign-out.
 *
 * It runs inside the authenticated shell, so the sign-in page never triggers a
 * pull, and each store's own `hydrate()` decides whether there is anything to
 * do. One place to register a module keeps the boot sequence readable.
>>>>>>> Stashed changes
 */
import { useEffect } from 'react';
import { getStoredToken } from '../utils/authUtils';
import { refreshNotifications } from '../services/crmEventNotifications';
<<<<<<< Updated upstream
import {
  resetLazyModules,
  refreshRequestedModules,
  requestedModuleNames,
} from '../services/lazyModules';
=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
/** Every store that owns server data, for the sign-out sweep. */
=======
/** Every store that owns server data. Add a module here and it boots with the app. */
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
/** Run when the browser is next idle, so it never competes with the first paint. */
function whenIdle(fn) {
  if (typeof window !== 'undefined' && window.requestIdleCallback) {
    return window.requestIdleCallback(fn, { timeout: 3000 });
  }
  return setTimeout(fn, 1200);
}

=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        resetLazyModules();
        return;
      }

      // A session just appeared (or changed). Anything this tab already pulled
      // belongs to the previous one, so re-pull exactly that much; everything
      // else stays unloaded until a screen asks.
      refreshRequestedModules(requestedModuleNames());
=======
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
>>>>>>> Stashed changes

      // PMS filters "my projects" / "my tasks" by the signed-in user.
      const me = app.currentUser;
      if (me?.id) usePmsStore.getState().setCurrentUserId(me.employeeId || me.id);
    };

    run();

<<<<<<< Updated upstream
    // The notification bell lives in the topbar on every screen, so its feed is
    // session-wide — but it is one request behind the page the user asked for.
    const idle = whenIdle(() => {
      if (!cancelled && getStoredToken()) refreshNotifications();
    });

=======
>>>>>>> Stashed changes
    // Signing in from another tab, or the token being cleared by a 401, both
    // change what this shell should be holding.
    window.addEventListener('evenmore:authorized', run);
    window.addEventListener('evenmore:unauthorized', run);
    window.addEventListener('storage', run);
    return () => {
      cancelled = true;
<<<<<<< Updated upstream
      if (typeof window !== 'undefined' && window.cancelIdleCallback) {
        window.cancelIdleCallback(idle);
      } else {
        clearTimeout(idle);
      }
=======
>>>>>>> Stashed changes
      window.removeEventListener('evenmore:authorized', run);
      window.removeEventListener('evenmore:unauthorized', run);
      window.removeEventListener('storage', run);
    };
  }, []);
}

export default useModuleHydration;
