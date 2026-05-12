// src/stores/eventStore.js
import { create } from 'zustand';
import { fetchEvents } from '../services/supabase';
import { log, logError } from '../utils/logger';

const MODULE = 'EVENT_STORE';

const defaultFilters = {
  search: '',
  category: null,
  city: null,
  dateFrom: null,
  hoursMin: null,
  sortBy: 'date_asc',
};

export const useEventStore = create((set, get) => ({
  events: [],
  loading: false,
  loaded: false,
  error: null,
  filters: { ...defaultFilters },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
  },

  loadEvents: async () => {
    const state = get();
    if (state.loading) return;

    set({ loading: true, error: null });

    try {
      const { filters } = get();
      const events = await fetchEvents(filters);
      set({ events, loading: false, loaded: true });
    } catch (error) {
      logError(MODULE, 'Ошибка загрузки', error);
      set({ loading: false, loaded: true, error: error.message });
    }
  },
}));