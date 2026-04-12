import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const isPublicRoute = ['/auth/forgot-password', '/auth/reset-password'].some(r => config.url.includes(r));
  if (token && !isPublicRoute) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
