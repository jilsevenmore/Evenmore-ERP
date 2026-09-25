import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { usePmsStore } from '../stores/pmsStore';
import { connectRealtime, disconnectRealtime, onRealtime } from '../services/realtime';
import { refreshNotifications } from '../services/crmEventNotifications';

/**
 * useRealtimeBridge — the session's Socket.IO connection and its app-wide
 * listeners. Mounted once, in MainLayout.
 *
 * - `notification:new` re-reads the bell's feed (every module's notifications).
 * - `pms:project_changed` re-reads that project into the PMS store, so the
 *   project list, detail page, timeline and dashboards move without a reload.
 *   Only when PMS is already loaded: an unloaded store will read fresh anyway.
 *
 * Screen-level listeners (the Messenger's `chat:activity`) subscribe themselves.
 */

const PROJECT_DEBOUNCE_MS = 400;
const BELL_DEBOUNCE_MS = 300;

export function useRealtimeBridge() {
  const userId = useAppStore((s) => s.currentUser?.id);

  useEffect(() => {
    if (!userId) return undefined;
    connectRealtime();

    let bellTimer = null;
    const offBell = onRealtime('notification:new', () => {
      clearTimeout(bellTimer);
      bellTimer = setTimeout(refreshNotifications, BELL_DEBOUNCE_MS);
    });

    // One burst of writes (a handoff touches two stages) becomes one read.
    const projectTimers = new Map();
    const offProject = onRealtime('pms:project_changed', ({ projectId, action } = {}) => {
      const pms = usePmsStore.getState();
      if (!projectId || !pms.status?.loaded) return;
      if (action === 'destroy') {
        usePmsStore.setState((st) => ({ projects: st.projects.filter((p) => p.id !== projectId) }));
        return;
      }
      clearTimeout(projectTimers.get(projectId));
      projectTimers.set(
        projectId,
        setTimeout(() => {
          projectTimers.delete(projectId);
          usePmsStore.getState().refreshProject(projectId);
        }, PROJECT_DEBOUNCE_MS),
      );
    });

    // A 401 anywhere clears the token; the socket goes with it.
    const onUnauthorized = () => disconnectRealtime();
    window.addEventListener('evenmore:unauthorized', onUnauthorized);

    return () => {
      offBell();
      offProject();
      clearTimeout(bellTimer);
      projectTimers.forEach((timer) => clearTimeout(timer));
      window.removeEventListener('evenmore:unauthorized', onUnauthorized);
      disconnectRealtime();
    };
  }, [userId]);
}

export default useRealtimeBridge;
