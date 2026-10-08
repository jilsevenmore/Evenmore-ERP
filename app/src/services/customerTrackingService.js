/**
 * customerTrackingService — API client for Role-Based Customer Project Tracking.
 * Backed by /api/v1/pms/customer-tracking/
 */
import { api, resolveFileUrl } from './api';
import { isBackendEnabled } from './resourceSync';
import { pmsSync } from './pmsSync';

/**
 * Fetch list of projects accessible to current customer / viewer.
 */
export async function fetchCustomerProjects() {
  let projects = [];

  if (isBackendEnabled()) {
    try {
      const data = await api.get('/pms/customer-tracking/');
      projects = Array.isArray(data) ? data : data?.results || [];
    } catch (err) {
      console.warn('[customerTrackingService] backend fetch failed:', err);
    }
  }

  if (projects.length > 0) {
    return projects;
  }

  // Fallback to local / store state (e.g. offline, mock data, or freshly created store projects)
  try {
    const { usePmsStore } = await import('../stores/pmsStore');
    const { useAppStore } = await import('../stores/appStore');
    const currentUser = useAppStore.getState().currentUser;
    const isCustomer = Boolean(
      currentUser?.isCustomer ||
      currentUser?.role?.code === 'CU' ||
      String(currentUser?.role?.name || currentUser?.role || '').toLowerCase() === 'customer'
    );
    let storeProjects = usePmsStore.getState().projects || [];
    if (isCustomer) {
      const userPartyId = currentUser?.partyId || currentUser?.party_id || currentUser?.party;
      const userPartyName = String(currentUser?.partyName || '').toLowerCase().trim();
      const userName = String(currentUser?.name || '').toLowerCase().trim();
      storeProjects = storeProjects.filter((p) => {
        if (userPartyId && (p.partyId === userPartyId || p.party_id === userPartyId || p.party === userPartyId)) return true;
        const pCust = String(p.customerName || p.clientName || '').toLowerCase().trim();
        if (userPartyName && pCust && (pCust.includes(userPartyName) || userPartyName.includes(pCust))) return true;
        if (userName && pCust) {
          const userWords = userName.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
          const custWords = pCust.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
          if (userWords.some((w) => custWords.includes(w))) return true;
        }
        return false;
      });
    }
    if (storeProjects.length > 0) {
      return storeProjects.map((p) => ({
        id: p.id,
        code: p.code,
        orderNumber: p.crmOrderId || p.orderNumber || null,
        productName: p.productDetails?.productName || p.productName || p.code,
        overallCompletionPct: p.overallCompletionPct || 0,
        status: p.status || 'In Progress',
        customerName: p.customerName || '',
        startDate: p.startDate || null,
        expectedDeliveryDate: p.expectedCompletionDate || null,
        currentStage: p.currentStage ? {
          id: p.currentStage.id,
          name: p.currentStage.name,
          status: p.currentStage.status,
          completionPct: p.currentStage.completionPct || 0,
        } : (p.stages && p.stages[0] ? {
          id: p.stages[0].id,
          name: p.stages[0].name,
          status: p.stages[0].status,
          completionPct: p.stages[0].completionPct || 0,
        } : null),
        stagesCount: p.stages?.length || 0,
      }));
    }
  } catch (e) {
    console.warn('[customerTrackingService] store fallback failed:', e);
  }

  return projects;
}

/**
 * Fetch detailed customer-safe tracking view for a single project by ID or code.
 */
export async function fetchCustomerProjectTracking(projectIdOrCode) {
  if (isBackendEnabled()) {
    try {
      const data = await api.get(`/pms/customer-tracking/${encodeURIComponent(projectIdOrCode)}/`);
      if (data && data.stages) {
        data.stages = data.stages.map((st) => ({
          ...st,
          documents: (st.documents || []).map((d) => ({
            ...d,
            previewUrl: resolveFileUrl(d.previewUrl),
          })),
        }));
      }
      if (data?.productImage) {
        data.productImage = resolveFileUrl(data.productImage);
      }
      return data;
    } catch (err) {
      console.warn('[customerTrackingService] backend detail fetch failed, trying local fallback:', err);
    }
  }

  // Local / store fallback
  try {
    const { usePmsStore } = await import('../stores/pmsStore');
    const storeProjects = usePmsStore.getState().projects || [];
    const project = storeProjects.find((p) => String(p.id) === String(projectIdOrCode) || String(p.code) === String(projectIdOrCode));
    if (!project) return null;
    return {
      id: project.id,
      code: project.code,
      orderNumber: project.crmOrderId || project.orderNumber || null,
      productName: project.productDetails?.productName || project.productName || project.code,
      productImage: null,
      specifications: project.productDetails?.specifications || '',
      quantity: project.productDetails?.quantity || 1,
      overallCompletionPct: project.overallCompletionPct || 0,
      status: project.status || 'In Progress',
      customerName: project.customerName || '',
      startDate: project.startDate || null,
      expectedDeliveryDate: project.expectedCompletionDate || null,
      actualCompletionDate: project.actualCompletionDate || null,
      currentStage: project.currentStage ? {
        id: project.currentStage.id,
        name: project.currentStage.name,
        status: project.currentStage.status,
        sequence: project.currentStage.sequence || 1,
        completionPct: project.currentStage.completionPct || 0,
        percentage: project.currentStage.percentage || 0,
        expectedCompletionDate: project.currentStage.expectedCompletionDateTime || null,
      } : (project.stages && project.stages[0] ? {
        id: project.stages[0].id,
        name: project.stages[0].name,
        status: project.stages[0].status,
        sequence: project.stages[0].sequence || 1,
        completionPct: project.stages[0].completionPct || 0,
        percentage: project.stages[0].percentage || 0,
        expectedCompletionDate: project.stages[0].expectedCompletionDateTime || null,
      } : null),
      stages: (project.stages || []).map((s) => ({
        id: s.id,
        sequence: s.sequence,
        name: s.name,
        department: s.department,
        status: s.status,
        completionPct: s.completionPct || 0,
        percentage: s.percentage || s.weightPct || s.weight || 0,
        plannedDuration: s.plannedDuration || 1,
        durationUnit: s.durationUnit || 'Days',
        startDateTime: s.startDateTime || null,
        actualStartDateTime: s.actualStartDateTime || null,
        expectedCompletionDateTime: s.expectedCompletionDateTime || null,
        actualCompletionDateTime: s.actualCompletionDateTime || null,
        isOverdue: Boolean(s.isOverdue),
        isDelayed: Boolean(s.isDelayed || s.status === 'Delayed'),
        delayNotice: (s.isDelayed || s.status === 'Delayed') ? {
          message: 'Delayed',
          newExpectedDate: s.delayDetails?.expectedRecoveryDate || s.expectedCompletionDateTime || null,
        } : null,
        description: s.description || null,
        documents: (s.documents || []).map((d) => ({
          id: d.id,
          fileName: d.fileName,
          fileSize: d.fileSize,
          previewUrl: resolveFileUrl(d.previewUrl),
          uploadedAt: d.uploadedAt,
          approvalStatus: d.approvalStatus,
          isProof: Boolean(d.isProof),
          version: d.version || 1,
        })),
      })),
    };
  } catch (e) {
    console.error('[customerTrackingService] local fallback error:', e);
    return null;
  }
}
