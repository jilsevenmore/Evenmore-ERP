/**
 * Formerly replayed PMS state that another tab wrote to localStorage. PMS now
 * lives on the server: a client's decision reaches open tabs through the
 * realtime `pms:project_changed` event (hooks/useRealtimeBridge), so there is
 * nothing local to replay — and replaying a stale browser copy would resurrect
 * data the server no longer has. Kept as a no-op so the layout's call is stable.
 */
export function useProofApprovalSync() {}

export default useProofApprovalSync;
