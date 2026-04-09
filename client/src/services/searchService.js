import api from './api';

const searchService = {
  search:      (params) => api.get('/search', { params }).then(r => r.data),
  suggestions: (q)      => api.get('/search/suggestions', { params: { q } }).then(r => r.data),
};

export default searchService;
