import api from './api';

const dashboardService = {
  getStats:    (params, config = {}) => api.get('/dashboard/stats',    { params, ...config }).then(r => r.data),
  getFunnel:   (config = {})       => api.get('/dashboard/funnel', { ...config }).then(r => r.data),
  getBranches: (config = {})       => api.get('/dashboard/branches', { ...config }).then(r => r.data),
  getTimeline: (params, config = {}) => api.get('/dashboard/timeline', { params, ...config }).then(r => r.data),
  getActivity: (config = {})       => api.get('/dashboard/activity', { ...config }).then(r => r.data),
  getOperations: (config = {})     => api.get('/dashboard/operations', { ...config }).then(r => r.data),
  getAlumniImpact: (config = {})   => api.get('/dashboard/alumni-impact', { ...config }).then(r => r.data),
  exportCSV:   (config = {})       => api.get('/dashboard/export', { responseType: 'blob', ...config }).then(r => {
    const url  = URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }));
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `placements-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }),
};

export default dashboardService;
