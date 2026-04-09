import api from './api';

const mentorshipService = {
  getById: (id) => api.get(`/mentorship/${id}`).then((r) => r.data),
  request: (data) => api.post('/mentorship/request', data).then((r) => r.data),
  getMine: (params) => api.get('/mentorship/mine', { params }).then((r) => r.data),
  cancel: (id) => api.patch(`/mentorship/${id}/cancel`).then((r) => r.data),
  delete: (id) => api.delete(`/mentorship/${id}`).then((r) => r.data),
  getInbox: (params) => api.get('/mentorship/inbox', { params }).then((r) => r.data),
  updateStatus: (id, data) => api.patch(`/mentorship/${id}/status`, data).then((r) => r.data),
  updateMilestone: (id, milestoneId, data) =>
    api.patch(`/mentorship/${id}/milestones/${milestoneId}`, data).then((r) => r.data),
  addUpdate: (id, data) => api.post(`/mentorship/${id}/updates`, data).then((r) => r.data),
};

export default mentorshipService;
