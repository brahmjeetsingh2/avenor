import api from './api';

const notificationService = {
  getAll:        (params, config = {}) => api.get('/notifications', { params, ...config }).then(r => r.data),
  getUnread:     (config = {})       => api.get('/notifications/unread-count', { ...config }).then(r => r.data),
  markRead:      (id)     => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead:   ()       => api.patch('/notifications/read-all').then(r => r.data),
  delete:        (id)     => api.delete(`/notifications/${id}`).then(r => r.data),
  announce:      (data)   => api.post('/notifications/announce', data).then(r => r.data),
  previewAudience: (data) => api.post('/notifications/announce/preview-audience', data).then(r => r.data),
  getTemplates: (config = {}) => api.get('/notifications/announce/templates', { ...config }).then(r => r.data),
  getHistory: (params, config = {}) => api.get('/notifications/announce/history', { params, ...config }).then(r => r.data),
  cloneAnnouncement: (id) => api.post(`/notifications/announce/${id}/clone`).then(r => r.data),
};

export default notificationService;
