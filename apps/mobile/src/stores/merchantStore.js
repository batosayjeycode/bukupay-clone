import { create } from 'zustand';
import { merchantApi, qrisApi } from '../api/services';
import { storage, storageKeys } from '../utils/storage';

export const useMerchantStore = create((set, get) => ({
  stores: [],
  activeStore: null,
  isLoading: false,
  error: null,

  loadStores: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await merchantApi.getStores();
      const stores = result.data;

      // Restore active store dari storage
      const savedActiveStoreId = storage.getString(storageKeys.ACTIVE_STORE);
      const activeStore =
        stores.find((s) => s.id === savedActiveStoreId) || stores[0] || null;

      set({ stores, activeStore, isLoading: false });
      return stores;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  createStore: async (storeData) => {
    set({ isLoading: true });
    try {
      const result = await merchantApi.createStore(storeData);
      const newStore = result.data;

      set((state) => ({
        stores: [...state.stores, newStore],
        activeStore: state.activeStore || newStore,
        isLoading: false,
      }));

      return newStore;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  setActiveStore: (store) => {
    storage.set(storageKeys.ACTIVE_STORE, store.id);
    set({ activeStore: store });
  },

  generateQris: async (storeId) => {
    set({ isLoading: true });
    try {
      const result = await qrisApi.generate(storeId);
      const qrisData = result.data;

      // Update store dengan QRIS baru
      set((state) => ({
        stores: state.stores.map((s) =>
          s.id === storeId ? { ...s, qrisCode: qrisData.qrisCode, isActive: true } : s
        ),
        activeStore:
          state.activeStore?.id === storeId
            ? { ...state.activeStore, qrisCode: qrisData.qrisCode, isActive: true }
            : state.activeStore,
        isLoading: false,
      }));

      return qrisData;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
}));
