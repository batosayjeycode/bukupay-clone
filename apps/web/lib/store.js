import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAdmin: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('bukupay_token', token);
      sessionStorage.setItem('bukupay_user', JSON.stringify(user));
    }
    set({ user, token, isAdmin: user?.role === 'ADMIN' });
  },

  loadFromSession: () => {
    if (typeof window === 'undefined') return;
    const token = sessionStorage.getItem('bukupay_token');
    const userStr = sessionStorage.getItem('bukupay_user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      set({ user, token, isAdmin: user?.role === 'ADMIN' });
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('bukupay_token');
      sessionStorage.removeItem('bukupay_user');
    }
    set({ user: null, token: null, isAdmin: false });
  },
}));

export const useDashboardStore = create((set, get) => ({
  activeStore: null,
  stores: [],
  dailyReport: null,
  isLoading: false,

  setStores: (stores) => {
    const saved = typeof window !== 'undefined'
      ? localStorage.getItem('bukupay_active_store')
      : null;
    const active = stores.find((s) => s.id === saved) || stores[0] || null;
    set({ stores, activeStore: active });
  },

  setActiveStore: (store) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bukupay_active_store', store.id);
    }
    set({ activeStore: store });
  },

  setDailyReport: (report) => set({ dailyReport: report }),
  setLoading: (v) => set({ isLoading: v }),
}));
