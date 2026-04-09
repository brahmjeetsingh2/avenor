import api from './api';

const authService = {
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (data) => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  refreshToken: async () => {
    const res = await api.post('/auth/refresh');
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (data) => {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.put('/auth/profile', data);
    return res.data;
  },

  getSavedCompanies: async (config = {}) => {
    const res = await api.get('/auth/saved-companies', { ...config });
    return res.data;
  },

  toggleSavedCompany: async (companyId) => {
    const res = await api.patch(`/auth/saved-companies/${companyId}/toggle`);
    return res.data;
  },

  getReferralPreferences: async () => {
    const res = await api.get('/auth/referral-preferences');
    return res.data;
  },

  toggleReferralPreference: async (referralId, action) => {
    const res = await api.patch(`/auth/referrals/${referralId}/preference`, { action });
    return res.data;
  },
};

export default authService;
