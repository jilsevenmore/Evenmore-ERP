import { apiClient, buildQuery } from './api';

// ── 1. Sales & CRM (§2.1) ──────────────────────────────────────────────────
export async function importEstimatesExcel(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient('/sales/estimates/import-excel/', {
    method: 'POST',
    data: formData,
    headers: {}, // let browser set boundary
  });
}

export async function convertEstimateToChallan(estimateId) {
  return apiClient(`/sales/estimates/${estimateId}/convert-to-challan/`, {
    method: 'POST',
  });
}

export async function captureContractSignature(contractId, { role, signature, signatoryName, signatoryEmail }) {
  return apiClient(`/crm/contracts/${contractId}/capture-signature/`, {
    method: 'POST',
    data: { role, signature, signatoryName, signatoryEmail },
  });
}

export async function updateContractWorkflowStatus(contractId, { status, rejectionReason }) {
  return apiClient(`/crm/contracts/${contractId}/workflow-status/`, {
    method: 'POST',
    data: { status, rejectionReason },
  });
}

export async function generateContractPdf(contractId) {
  return apiClient(`/crm/contracts/${contractId}/generate-pdf/`, {
    method: 'POST',
  });
}

export async function sendContractEmail(contractId, email) {
  return apiClient(`/crm/contracts/${contractId}/send-email/`, {
    method: 'POST',
    data: { email },
  });
}

export async function fetchWonRevenueAttribution(year) {
  const query = year ? { year } : {};
  return apiClient('/crm/deals/won-revenue-attribution/', { query });
}

export async function impersonateCustomer(customerId, reason) {
  return apiClient('/auth/impersonate-customer/', {
    method: 'POST',
    data: { customerId, reason },
  });
}

// ── 2. Operations & Supply Chain (§2.2) ───────────────────────────────────
export async function fetchPoRegister() {
  return apiClient('/purchase/orders/register/');
}

export async function fetchVendorAdvances(vendorId) {
  const query = vendorId ? { vendorId } : {};
  return apiClient('/purchase/advances/', { query });
}

export async function createVendorAdvance(data) {
  return apiClient('/purchase/advances/', {
    method: 'POST',
    data,
  });
}

export async function reconcileVendorAdvance(advanceId, purchaseBillId, amount) {
  return apiClient(`/purchase/advances/${advanceId}/reconcile/`, {
    method: 'POST',
    data: { purchaseBillId, amount },
  });
}

export async function createShortSupplyDebitNote(billId, { noteReason, shortfallAmount, shortfallItems }) {
  return apiClient('/purchase/receipts/create-short-supply-debit-note/', {
    method: 'POST',
    data: { billId, noteReason, shortfallAmount, shortfallItems },
  });
}

export async function fetchVendorWeightVariations() {
  return apiClient('/purchase/receipts/vendor-weight-variations/');
}

export async function fetchDemoUnits(params = {}) {
  return apiClient('/inventory/demo-units/', { query: params });
}

export async function createDemoUnit(data) {
  return apiClient('/inventory/demo-units/', {
    method: 'POST',
    data,
  });
}

export async function returnDemoUnitInspection(unitId, data) {
  return apiClient(`/inventory/demo-units/${unitId}/return-inspection/`, {
    method: 'POST',
    data,
  });
}

export async function convertDemoUnitToSale(unitId, data) {
  return apiClient(`/inventory/demo-units/${unitId}/convert-to-sale/`, {
    method: 'POST',
    data,
  });
}

export async function fetchReworkOrders(params = {}) {
  return apiClient('/inventory/rework-orders/', { query: params });
}

export async function createReworkOrder(data) {
  return apiClient('/inventory/rework-orders/', {
    method: 'POST',
    data,
  });
}

export async function logReworkScrap(orderId, data) {
  return apiClient(`/inventory/rework-orders/${orderId}/log-scrap/`, {
    method: 'POST',
    data,
  });
}
export const logScrapFromRework = logReworkScrap;

export async function fetchScrapLogs(params = {}) {
  return apiClient('/inventory/scrap-logs/', { query: params });
}

export async function createScrapLog(data) {
  return apiClient('/inventory/scrap-logs/', {
    method: 'POST',
    data,
  });
}

// ── 3. Finance & Accounting (§2.4) ────────────────────────────────────────
export async function fetchBudgets() {
  return apiClient('/accounting/budgets/');
}

export async function createBudget(data) {
  return apiClient('/accounting/budgets/', {
    method: 'POST',
    data,
  });
}

export async function updateBudget(id, data) {
  return apiClient(`/accounting/budgets/${id}/`, {
    method: 'PATCH',
    data,
  });
}

export async function deleteBudget(id) {
  return apiClient(`/accounting/budgets/${id}/`, {
    method: 'DELETE',
  });
}

export async function fetchBudgetVarianceSummary() {
  return apiClient('/accounting/budgets/variance-summary/');
}

// ── 4. HRMS (§2.5) ────────────────────────────────────────────────────────
export async function fetchEmployeeTransfers(employeeId) {
  const query = employeeId ? { employeeId } : {};
  return apiClient('/hrms/transfers/', { query });
}

export async function createEmployeeTransfer(data) {
  return apiClient('/hrms/transfers/', { method: 'POST', data });
}

export async function fetchEmployeePromotions(employeeId) {
  const query = employeeId ? { employeeId } : {};
  return apiClient('/hrms/promotions/', { query });
}

export async function createEmployeePromotion(data) {
  return apiClient('/hrms/promotions/', { method: 'POST', data });
}

export async function fetchEmployeeWarnings(employeeId) {
  const query = employeeId ? { employeeId } : {};
  return apiClient('/hrms/warnings/', { query });
}

export async function createEmployeeWarning(data) {
  return apiClient('/hrms/warnings/', { method: 'POST', data });
}

export async function fetchEmployeeAwards(employeeId) {
  const query = employeeId ? { employeeId } : {};
  return apiClient('/hrms/awards/', { query });
}

export async function createEmployeeAward(data) {
  return apiClient('/hrms/awards/', { method: 'POST', data });
}

export async function fetchTravelRequests(employeeId) {
  const query = employeeId ? { employeeId } : {};
  return apiClient('/hrms/travel-requests/', { query });
}

export async function createTravelRequest(data) {
  return apiClient('/hrms/travel-requests/', { method: 'POST', data });
}

export async function fetchAnnouncements() {
  return apiClient('/hrms/announcements/');
}

export async function createAnnouncement(data) {
  return apiClient('/hrms/announcements/', { method: 'POST', data });
}

export async function calculateLeaveDaysPreview(fromDate, toDate, leaveTypeId) {
  return apiClient('/hrms/leave/calculate-days/', {
    method: 'POST',
    data: { fromDate, toDate, leaveTypeId },
  });
}

export async function generateInterviewZoom(interviewId) {
  return apiClient(`/hrms/interviews/${interviewId}/generate-zoom-meeting/`, {
    method: 'POST',
  });
}

export async function fetchScreeningQuestions(jobId) {
  const query = jobId ? { jobId } : {};
  return apiClient('/hrms/recruitment/questions/', { query });
}

export async function createScreeningQuestion(data) {
  return apiClient('/hrms/recruitment/questions/', { method: 'POST', data });
}

// ── 5. PMS (§2.6) ─────────────────────────────────────────────────────────
export async function fetchProjectBugs(projectId) {
  const query = projectId ? { projectId } : {};
  return apiClient('/pms/bugs/', { query });
}

export async function createProjectBug(data) {
  return apiClient('/pms/bugs/', { method: 'POST', data });
}

export async function updateProjectBug(bugId, data) {
  return apiClient(`/pms/bugs/${bugId}/`, { method: 'PATCH', data });
}

export async function fetchDelegatedTasks(tab = 'assigned_to_me') {
  return apiClient('/pms/delegated-tasks/', { query: { tab } });
}

export async function createDelegatedTask(data) {
  return apiClient('/pms/delegated-tasks/', { method: 'POST', data });
}
export const delegateTask = createDelegatedTask;

export async function acceptDelegatedTask(id) {
  return apiClient(`/pms/delegated-tasks/${id}/accept/`, { method: 'POST' });
}

export async function rejectDelegatedTask(id, reason) {
  return apiClient(`/pms/delegated-tasks/${id}/reject/`, { method: 'POST', data: { reason } });
}

export async function completeDelegatedTask(id, notes) {
  return apiClient(`/pms/delegated-tasks/${id}/complete/`, { method: 'POST', data: { notes } });
}

export async function fetchTimesheets(employeeId) {
  const query = employeeId ? { employeeId } : {};
  return apiClient('/pms/timesheets/', { query });
}

export async function createTimesheet(data) {
  return apiClient('/pms/timesheets/', { method: 'POST', data });
}

export async function submitTimesheet(id) {
  return apiClient(`/pms/timesheets/${id}/submit/`, { method: 'POST' });
}

export async function approveTimesheet(id) {
  return apiClient(`/pms/timesheets/${id}/approve/`, { method: 'POST' });
}

export async function rejectTimesheet(id, reason) {
  return apiClient(`/pms/timesheets/${id}/reject/`, { method: 'POST', data: { reason } });
}

export async function fetchTimesheetEntries(params = {}) {
  return apiClient('/pms/timesheet-entries/', { query: params });
}

export async function startLiveTimer({ projectId, taskId, description, isBillable }) {
  return apiClient('/pms/timesheet-entries/start-timer/', {
    method: 'POST',
    data: { projectId, taskId, description, isBillable },
  });
}

export async function stopLiveTimer(entryId) {
  return apiClient(`/pms/timesheet-entries/${entryId}/stop-timer/`, {
    method: 'POST',
  });
}

export async function fetchActiveTimer() {
  return apiClient('/pms/timesheet-entries/active-timer/');
}

export const startTimesheetTimer = startLiveTimer;
export const stopTimesheetTimer = stopLiveTimer;
export const getActiveTimesheetTimer = fetchActiveTimer;

export async function fetchProjectProfitability(projectId) {
  return apiClient(`/pms/projects/${projectId}/profitability/`);
}

export async function fetchCrossProjectCalendar() {
  return apiClient('/pms/calendar-schedule/');
}

// ── 6. Platform & Settings (§2.7) ─────────────────────────────────────────
export async function fetchCustomFields(entityType) {
  const query = entityType ? { entityType } : {};
  return apiClient('/custom-fields/', { query });
}

export async function createCustomField(data) {
  return apiClient('/custom-fields/', { method: 'POST', data });
}

export async function deleteCustomField(id) {
  return apiClient(`/custom-fields/${id}/`, { method: 'DELETE' });
}

export async function fetchWebhooks() {
  return apiClient('/webhooks/');
}

export async function createWebhook(data) {
  return apiClient('/webhooks/', { method: 'POST', data });
}

export async function deleteWebhook(id) {
  return apiClient(`/webhooks/${id}/`, { method: 'DELETE' });
}

export async function testPingWebhook(id) {
  return apiClient(`/webhooks/${id}/test-ping/`, { method: 'POST' });
}

export async function sendOmnichannelNotification(data) {
  return apiClient('/notifications/send-omnichannel/', {
    method: 'POST',
    data,
  });
}

// ── 7. Targeted Services Implementation Scope ─────────────────────────────
// §2.1 CRM Bulk Lead Assignment
export async function bulkAssignLeads(data) {
  return apiClient('/crm/leads/bulk-assign/', {
    method: 'POST',
    data,
  });
}

// §2.2 Quality Control (QC) Inspection Desk (Hidden: QC out of scope)
// export async function fetchQualityInspections(params = {}) {
//   return apiClient('/inventory/quality-inspections/', { query: params });
// }
// export async function createQualityInspection(data) {
//   return apiClient('/inventory/quality-inspections/', {
//     method: 'POST',
//     data,
//   });
// }
// export async function completeQualityInspection(id, data) {
//   return apiClient(`/inventory/quality-inspections/${id}/complete-inspection/`, {
//     method: 'POST',
//     data,
//   });
// }

// §2.5 Universal Meetings & Conference Room Booking
export async function fetchMeetingRooms(params = {}) {
  return apiClient('/hrms/meeting-rooms/', { query: params });
}

export async function createMeetingRoom(data) {
  return apiClient('/hrms/meeting-rooms/', {
    method: 'POST',
    data,
  });
}

export async function fetchCompanyMeetings(params = {}) {
  return apiClient('/hrms/meetings/', { query: params });
}

export async function createCompanyMeeting(data) {
  return apiClient('/hrms/meetings/', {
    method: 'POST',
    data,
  });
}

export async function updateCompanyMeeting(id, data) {
  return apiClient(`/hrms/meetings/${id}/`, {
    method: 'PUT',
    data,
  });
}

export async function saveMeetingMinutes(id, data) {
  return apiClient(`/hrms/meetings/${id}/mom/`, {
    method: 'POST',
    data,
  });
}

// §2.8 Vendor Self-Service Portal
export async function vendorPortalLogin(email) {
  return apiClient('/purchase/vendor-portal/auth/login/', {
    method: 'POST',
    data: { email },
  });
}

export async function fetchVendorOrders(token) {
  const headers = token ? { 'X-Vendor-Token': token } : {};
  return apiClient('/purchase/vendor-portal/orders/', { headers });
}

export async function acknowledgeVendorOrder(orderId, token) {
  const headers = token ? { 'X-Vendor-Token': token } : {};
  return apiClient(`/purchase/vendor-portal/orders/${orderId}/acknowledge/`, {
    method: 'POST',
    headers,
  });
}

export async function submitVendorMilestone(orderId, data, token) {
  const headers = token ? { 'X-Vendor-Token': token } : {};
  return apiClient(`/purchase/vendor-portal/orders/${orderId}/milestones/`, {
    method: 'POST',
    data,
    headers,
  });
}

export async function submitVendorASN(data, token) {
  const headers = token ? { 'X-Vendor-Token': token } : {};
  return apiClient('/purchase/vendor-portal/asn/create/', {
    method: 'POST',
    data,
    headers,
  });
}

export async function fetchVendorLedger(token) {
  const headers = token ? { 'X-Vendor-Token': token } : {};
  return apiClient('/purchase/vendor-portal/ledger/', { headers });
}


