import api from './api';

const applicationService = {
  // Returns the full axios response so callers can do res.data.applications etc.
  apply:           (companyId)            => api.post('/applications', { companyId }),
  getMyApps:       (params, config = {})  => api.get('/applications/my', { params, ...config }),
  getMyStats:      (config = {})          => api.get('/applications/my/stats', { ...config }),
  getById:         (id, config = {})      => api.get(`/applications/${id}`, { ...config }),
  withdraw:        (id)                   => api.delete(`/applications/${id}`),
  getByCompany:    (companyId, params, config = {}) => api.get(`/applications/company/${companyId}`, { params, ...config }),
  getCompanyStats: (companyId, config = {})            => api.get(`/applications/company/${companyId}/stats`, { ...config }),
  updateStatus:    (id, data)             => api.patch(`/applications/${id}/status`, data),
  updateNotes:     (id, data)             => api.patch(`/applications/${id}/notes`, data),
  bulkStatus:      (data)                 => api.post('/applications/bulk-status', data),
  bulkSlot:        (data)                 => api.post('/applications/bulk-slot', data),
};

export default applicationService;