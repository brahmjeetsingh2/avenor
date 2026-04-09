// import axios from 'axios';

// const api = axios.create({
//   baseURL: '/api',
//   withCredentials: true, // needed for httpOnly refresh token cookie
//   timeout: 15000,
// });

// // ─── Request interceptor — attach access token ────────────────────────────────
// api.interceptors.request.use(
//   (config) => {
//     try {
//       const auth = JSON.parse(localStorage.getItem('avenor-auth') || '{}');
//       const token = auth?.state?.token;
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//     } catch {}
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // ─── Response interceptor — handle 401, auto-refresh ─────────────────────────
// let isRefreshing = false;
// let failedQueue = [];

// const processQueue = (error, token = null) => {
//   failedQueue.forEach((prom) => {
//     if (error) prom.reject(error);
//     else prom.resolve(token);
//   });
//   failedQueue = [];
// };

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (
//       error.response?.status === 401 &&
//       !originalRequest._retry &&
//       !originalRequest.url.includes('/auth/refresh') &&
//       !originalRequest.url.includes('/auth/login')
//     ) {
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         })
//           .then((token) => {
//             originalRequest.headers.Authorization = `Bearer ${token}`;
//             return api(originalRequest);
//           })
//           .catch((err) => Promise.reject(err));
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         const res = await api.post('/auth/refresh');
//         const newToken = res.data.data.accessToken;

//         // Update token in Zustand persisted store
//         const stored = JSON.parse(localStorage.getItem('avenor-auth') || '{}');
//         if (stored?.state) {
//           stored.state.token = newToken;
//           localStorage.setItem('avenor-auth', JSON.stringify(stored));
//         }

//         processQueue(null, newToken);
//         originalRequest.headers.Authorization = `Bearer ${newToken}`;
//         return api(originalRequest);
//       } catch (refreshError) {
//         processQueue(refreshError, null);
//         // Clear auth and redirect to login
//         localStorage.removeItem('avenor-auth');
//         window.location.href = '/login';
//         return Promise.reject(refreshError);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;




























import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // needed for httpOnly refresh token cookie
  timeout: 15000,
});

// ─── Request interceptor — attach access token + prevent caching ──────────────
api.interceptors.request.use(
  (config) => {
    try {
      const auth = JSON.parse(localStorage.getItem('avenor-auth') || '{}');
      const token = auth?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}

    // Prevent browser from returning 304 cached responses for GET requests
    if (!config.method || config.method.toLowerCase() === 'get') {
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma']        = 'no-cache';
      config.headers['Expires']       = '0';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — handle 401, auto-refresh ─────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await api.post('/auth/refresh');
        const newToken = res.data.data.accessToken;

        // Update token in Zustand persisted store
        const stored = JSON.parse(localStorage.getItem('avenor-auth') || '{}');
        if (stored?.state) {
          stored.state.token = newToken;
          localStorage.setItem('avenor-auth', JSON.stringify(stored));
        }

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear auth and redirect to login
        localStorage.removeItem('avenor-auth');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;