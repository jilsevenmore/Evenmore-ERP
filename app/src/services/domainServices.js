import { api } from './api';

export const crmService = {
  getLeads: () => api.get('/crm/leads/'),
  getLead: (id) => api.get(`/crm/leads/${id}/`),
  createLead: (data) => api.post('/crm/leads/', data),
  updateLead: (id, data) => api.patch(`/crm/leads/${id}/`, data),
  deleteLead: (id) => api.delete(`/crm/leads/${id}/`),
  getTasks: () => api.get('/crm/tasks/'),
  createTask: (data) => api.post('/crm/tasks/', data),
};

export const salesService = {
  getQuotations: () => api.get('/sales/quotations/'),
  getOrders: () => api.get('/sales/orders/'),
  getInvoices: () => api.get('/sales/invoices/'),
  getPayments: () => api.get('/sales/payments/'),
  createInvoice: (data) => api.post('/sales/invoices/', data),
};

export const hrmsService = {
  getEmployees: () => api.get('/hrms/employees/'),
  getAttendance: () => api.get('/hrms/attendance/'),
  getLeaveRequests: () => api.get('/hrms/leave/'),
  getPayroll: () => api.get('/hrms/payroll/'),
  getCandidates: () => api.get('/hrms/candidates/'),
};

export const inventoryService = {
  getItems: () => api.get('/inventory/items/'),
  getStockPositions: () => api.get('/inventory/stock/'),
  getTransfers: () => api.get('/inventory/transfers/'),
  getLocations: () => api.get('/inventory/locations/'),
};
