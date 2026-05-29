import axios from 'axios';

const BASE_URL =
  typeof window === 'undefined'
    ? process.env.INTERNAL_API_URL || 'http://localhost:3000/api'
    : (process.env.NEXT_PUBLIC_API_URL || '') + '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Injeksi token dari session
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('bukupay_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;

// ============================================================
// API Services
// ============================================================

export const authApi = {
  requestOtp: (phone) => api.post('/auth/request-otp', { phone }),
  verifyOtp: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
};

export const dashboardApi = {
  // Reports
  getDailyReport: (storeId, date) => api.get('/reports/daily', { params: { storeId, date } }),
  getWeeklyReport: (storeId, weekStart) => api.get('/reports/weekly', { params: { storeId, weekStart } }),
  getMonthlyReport: (storeId, month) => api.get('/reports/monthly', { params: { storeId, month } }),
  getTopHours: (storeId) => api.get('/reports/top-hours', { params: { storeId } }),
  exportCsv: (storeId, startDate, endDate) =>
    `${BASE_URL}/reports/export?storeId=${storeId || ''}&startDate=${startDate}&endDate=${endDate}&format=csv`,

  // Merchants
  getStores: () => api.get('/merchant/stores'),

  // Transactions
  getTransactions: (params) => api.get('/transactions', { params }),
  getTransaction: (id) => api.get(`/transactions/${id}`),

  // Settlements
  getBalance: () => api.get('/settlements/balance'),
  getSettlements: (params) => api.get('/settlements', { params }),
  requestInstant: (amount) => api.post('/settlements/instant', { amount }),

  // Employees
  getEmployees: (storeId) => api.get(`/employee/list/${storeId}`),
  inviteEmployee: (data) => api.post('/employee/invite', data),
  removeEmployee: (id) => api.delete(`/employee/${id}`),
  updatePermissions: (id, data) => api.put(`/employee/${id}/permissions`, data),

  // Soundbox
  getDevices: () => api.get('/soundbox/devices'),
  updateDevice: (id, data) => api.put(`/soundbox/devices/${id}`, data),
  testSound: (id) => api.post(`/soundbox/test/${id}`),
};

// Admin-only API
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getMerchants: (params) => api.get('/admin/merchants', { params }),
  getMerchant: (id) => api.get(`/admin/merchants/${id}`),
  toggleStatus: (id, isActive, reason) => api.patch(`/admin/merchants/${id}/status`, { isActive, reason }),
  reviewKyc: (id, status, note) => api.post(`/admin/merchants/${id}/kyc-review`, { status, note }),
  getLogs: (params) => api.get('/admin/logs', { params }),
};
