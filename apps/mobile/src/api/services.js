import api from './index';
import { storage } from '../utils/storage';

export const authApi = {
  requestOtp: (phone) => api.post('/auth/request-otp', { phone }),
  verifyOtp: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
};

export const kycApi = {
  uploadKtp: (formData) =>
    api.post('/kyc/upload-ktp', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadSelfie: (formData) =>
    api.post('/kyc/upload-selfie', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getStatus: () => api.get('/kyc/status'),
};

export const merchantApi = {
  getProfile: () => api.get('/merchant/profile'),
  createStore: (data) => api.post('/merchant/stores', data),
  getStores: () => api.get('/merchant/stores'),
  updateStore: (id, data) => api.put(`/merchant/stores/${id}`, data),
};

export const qrisApi = {
  generate: (storeId) => api.post('/qris/generate', { storeId }),
  getQris: (storeId) => api.get(`/qris/${storeId}`),
};

export const transactionApi = {
  getList: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
};

export const settlementApi = {
  getBalance: () => api.get('/settlements/balance'),
  getHistory: (params) => api.get('/settlements', { params }),
};

export const notificationApi = {
  registerToken: (token, device = 'android') =>
    api.post('/notification/register-token', { token, device }),
};
