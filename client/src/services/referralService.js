import api from './api';

const referralService = {
  list: (params, config = {}) => api.get('/referrals', { params, ...config }).then((r) => r.data),
  listMine: (params, config = {}) => api.get('/referrals/mine', { params, ...config }).then((r) => r.data),
  create: (data) => api.post('/referrals', data).then((r) => r.data),
  update: (id, data) => api.patch(`/referrals/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/referrals/${id}`).then((r) => r.data),
  trackClick: (id) => api.post(`/referrals/${id}/track-click`).then((r) => r.data),
  trackIntent: (id, type) => api.post(`/referrals/${id}/track-intent`, { type }).then((r) => r.data),
};

export default referralService;
