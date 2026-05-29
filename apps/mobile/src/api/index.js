import axios from 'axios';
import { storage } from '../utils/storage';

const BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000/api' // Android emulator -> localhost
  : 'https://api.bukupay.id/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — tambahkan access token
api.interceptors.request.use(
  (config) => {
    const token = storage.getString('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle token refresh
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = storage.getString('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        storage.set('accessToken', accessToken);
        storage.set('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — logout
        storage.clearAll();
        // Navigation akan di-handle oleh auth store
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default api;
