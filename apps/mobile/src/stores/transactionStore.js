import { create } from 'zustand';
import { transactionApi } from '../api/services';

export const useTransactionStore = create((set, get) => ({
  transactions: [],
  selectedTransaction: null,
  todayTotal: 0,
  todayCount: 0,
  isLoading: false,
  hasMore: true,
  page: 1,
  error: null,

  loadTransactions: async ({ storeId, status, startDate, endDate, reset = false } = {}) => {
    const currentPage = reset ? 1 : get().page;

    set({ isLoading: true, error: null });

    try {
      const result = await transactionApi.getList({
        storeId,
        status,
        startDate,
        endDate,
        page: currentPage,
        limit: 20,
      });

      const { transactions, pagination } = result.data;

      set((state) => ({
        transactions: reset ? transactions : [...state.transactions, ...transactions],
        page: currentPage + 1,
        hasMore: currentPage < pagination.totalPages,
        isLoading: false,
      }));

      return transactions;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  loadTransactionById: async (id) => {
    set({ isLoading: true });
    try {
      const result = await transactionApi.getById(id);
      set({ selectedTransaction: result.data, isLoading: false });
      return result.data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  addTransaction: (transaction) => {
    set((state) => ({
      transactions: [transaction, ...state.transactions],
      todayTotal: state.todayTotal + transaction.amount,
      todayCount: state.todayCount + 1,
    }));
  },

  setTodayStats: (total, count) => {
    set({ todayTotal: total, todayCount: count });
  },

  reset: () => {
    set({ transactions: [], page: 1, hasMore: true });
  },
}));
