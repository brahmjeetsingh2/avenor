import api from './api';

export const salaryService = {
  submit:    (data)          => api.post('/salary', data).then(r => r.data),
  getStats:  (params)        => api.get('/salary/stats', { params }).then(r => r.data),
  getAll:    (params)        => api.get('/salary', { params }).then(r => r.data),
  getMine:   (params)        => api.get('/salary/mine', { params }).then(r => r.data),
  update:    (id, data)      => api.patch(`/salary/${id}`, data).then(r => r.data),
  verify:    (id)            => api.patch(`/salary/${id}/verify`).then(r => r.data),
  remove:    (id)            => api.delete(`/salary/${id}`).then(r => r.data),
};

export const offerService = {
  getMyOffers: ()            => api.get('/offers').then(r => r.data),
  create:      (data)        => api.post('/offers', data).then(r => r.data),
  update:      (id, data)    => api.put(`/offers/${id}`, data).then(r => r.data),
  remove:      (id)          => api.delete(`/offers/${id}`).then(r => r.data),
};
