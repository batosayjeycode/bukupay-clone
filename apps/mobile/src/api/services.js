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
  // Phase 2: Pencairan Instan via Xendit Disbursement
  requestInstant: (data) => api.post('/settlements/instant', data),
};

export const notificationApi = {
  registerToken: (token, device = 'android') =>
    api.post('/notification/register-token', { token, device }),
};

// ─── Phase 2 Services ────────────────────────────────────────────────────────

export const apiService = {
  employee: {
    invite: (data) => api.post('/employee/invite', data),
    join: (token) => api.post('/employee/join', { token }),
    list: (storeId) => api.get(`/employee/list/${storeId}`),
    updatePermissions: (id, permissions) => api.put(`/employee/${id}/permissions`, permissions),
    setPin: (id, pin) => api.put(`/employee/${id}/pin`, { pin }),
    pinLogin: (data) => api.post('/employee/pin-login', data),
    remove: (id) => api.delete(`/employee/${id}`),
    shiftSummary: (storeId) => api.get(`/employee/shift-summary/${storeId}`),
  },

  soundbox: {
    register: (data) => api.post('/soundbox/register', data),
    getDevices: (storeId) => api.get('/soundbox/devices', { params: { storeId } }),
    updateDevice: (id, data) => api.put(`/soundbox/devices/${id}`, data),
    testSound: (id) => api.post(`/soundbox/test/${id}`),
    getCredentials: (id) => api.get(`/soundbox/credentials/${id}`),
    delete: (id) => api.delete(`/soundbox/devices/${id}`),
  },
};
