import api from './api';

const companyService = {
  getAll: (params, config = {}) => api.get('/companies', { params, ...config }).then((r) => r.data),
  getById: (id, config = {}) => api.get(`/companies/${id}`, { ...config }).then((r) => r.data),
  create: (data) => api.post('/companies', data).then((r) => r.data),
  update: (id, data) => api.put(`/companies/${id}`, data).then((r) => r.data),
  updateStage: (id, data) => api.patch(`/companies/${id}/stage`, data).then((r) => r.data),
  bulkActions: (data) => api.post('/companies/bulk-actions', data).then((r) => r.data),
  workflowOverview: (config = {}) => api.get('/companies/workflow/overview', { ...config }).then((r) => r.data),
  remove: (id) => api.delete(`/companies/${id}`).then((r) => r.data),
  getStats: (config = {}) => api.get('/companies/stats', { ...config }).then((r) => r.data),
};

export default companyService;
