import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // User endpoints
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/auth/login', { email, password }),
    register: (email: string, password: string, name: string) =>
      apiClient.post('/auth/register', { email, password, name }),
    logout: () => apiClient.post('/auth/logout'),
    getProfile: () => apiClient.get('/auth/profile'),
  },

  // Bot user endpoints
  users: {
    getStats: () => apiClient.get('/users/stats'),
    list: () => apiClient.get('/users'),
    getUser: (id: string) => apiClient.get(`/users/${id}`),
    updateUser: (id: string, data: any) => apiClient.put(`/users/${id}`, data),
  },

  // Subscription endpoints
  subscriptions: {
    list: () => apiClient.get('/subscriptions'),
    getStats: () => apiClient.get('/subscriptions/stats'),
    update: (userId: string, planId: string) =>
      apiClient.post(`/subscriptions/${userId}`, { planId }),
    cancel: (userId: string) => apiClient.delete(`/subscriptions/${userId}`),
  },

  // Analytics endpoints
  analytics: {
    getDashboard: () => apiClient.get('/analytics/dashboard'),
    getUsage: (range: string = '7d') => apiClient.get(`/analytics/usage?range=${range}`),
    getRevenue: (range: string = '7d') => apiClient.get(`/analytics/revenue?range=${range}`),
    getTopUsers: (limit: number = 10) => apiClient.get(`/analytics/top-users?limit=${limit}`),
  },

  // Bot settings endpoints
  settings: {
    get: () => apiClient.get('/settings'),
    update: (data: any) => apiClient.put('/settings', data),
  },
};
