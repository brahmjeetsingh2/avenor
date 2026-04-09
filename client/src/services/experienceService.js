import api from './api';

const experienceService = {
  getFeed:        (params, config = {})  => api.get('/experiences', { params, ...config }).then(r => r.data),
  getById:        (id, config = {})      => api.get(`/experiences/${id}`, { ...config }).then(r => r.data),
  getByCompany:   (id, p, config = {})   => api.get(`/experiences/company/${id}`, { params: p, ...config }).then(r => r.data),
  search:         (q, p, config = {})    => api.get('/experiences/search', { params: { q, ...p }, ...config }).then(r => r.data),
  create:         (data)    => api.post('/experiences', data).then(r => r.data),
  upvote:         (id)      => api.patch(`/experiences/${id}/upvote`).then(r => r.data),
  delete:         (id)      => api.delete(`/experiences/${id}`).then(r => r.data),
  getStats:       (params, config = {})  => api.get('/experiences/stats', { params, ...config }).then(r => r.data),
};

export default experienceService;
