import { create } from 'zustand';
import { authApi } from '../api/services';
import { storage, storageKeys } from '../utils/storage';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  // Actions
  initialize: () => {
    try {
      const userStr = storage.getString(storageKeys.USER);
      const accessToken = storage.getString(storageKeys.ACCESS_TOKEN);

      if (userStr && accessToken) {
        const user = JSON.parse(userStr);
        set({ user, isAuthenticated: true, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    } catch {
      set({ isInitialized: true });
    }
  },

  requestOtp: async (phone) => {
    set({ isLoading: true });
    try {
      const result = await authApi.requestOtp(phone);
      return result.data;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (phone, otp) => {
    set({ isLoading: true });
    try {
      const result = await authApi.verifyOtp(phone, otp);
      const { user, accessToken, refreshToken } = result.data;

      // Simpan ke storage
      storage.set(storageKeys.ACCESS_TOKEN, accessToken);
      storage.set(storageKeys.REFRESH_TOKEN, refreshToken);
      storage.set(storageKeys.USER, JSON.stringify(user));

      set({ user, isAuthenticated: true });
      return user;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      const refreshToken = storage.getString(storageKeys.REFRESH_TOKEN);
      await authApi.logout(refreshToken);
    } catch {
      // Ignore logout errors
    } finally {
      storage.clearAll();
      set({ user: null, isAuthenticated: false });
    }
  },

  updateUser: (updates) => {
    const updatedUser = { ...get().user, ...updates };
    storage.set(storageKeys.USER, JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
}));
