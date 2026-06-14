// src/stores/eventStore.js
import { create } from 'zustand';
import { fetchEvents, fetchEventById } from '../services/supabase';

const defaultFilters = {
  search: '',
  category: null,
  city: null,
  sortBy: 'date_asc',
  hoursMin: null,
};

export const useEventStore = create((set, get) => ({
  events: [],
  fullEvents: {},
  loading: false,
  hasMore: true,
  total: 0,
  filters: { ...defaultFilters },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
    get().loadEvents();
  },

  loadEvents: async () => {
    if (get().loading) return;
    set({ loading: true, events: [] });

    const { filters } = get();
    const result = await fetchEvents(filters, 1, 10);

    const newFull = { ...get().fullEvents };
    if (result.events) {
      result.events.forEach((e) => {
        newFull[e.id] = e;
      });
    }

    set({
      events: result.events || [],
      total: result.total || 0,
      hasMore: result.hasMore ?? true,
      loading: false,
      fullEvents: newFull,
    });
  },

  loadMore: async () => {
    const { loading, hasMore, events, filters, fullEvents } = get();
    if (loading || !hasMore) return;

    const nextPage = Math.floor((events.length || 0) / 10) + 1;
    set({ loading: true });

    const result = await fetchEvents(filters, nextPage, 10);
    const newFull = { ...fullEvents };
    if (result.events) {
      result.events.forEach((e) => {
        newFull[e.id] = e;
      });
    }

    set({
      events: [...events, ...(result.events || [])],
      hasMore: result.hasMore ?? false,
      loading: false,
      fullEvents: newFull,
    });
  },

  getEventById: async (id) => {
    const { fullEvents } = get();
    if (fullEvents[id]) {
      if (fullEvents[id].description !== undefined) {
        return fullEvents[id];
      }
      const detailed = await fetchEventById(id);
      if (detailed) {
        set((state) => ({
          fullEvents: { ...state.fullEvents, [id]: detailed },
        }));
        return detailed;
      }
    }
    const detailed = await fetchEventById(id);
    if (detailed) {
      set((state) => ({
        fullEvents: { ...state.fullEvents, [id]: detailed },
      }));
    }
    return detailed;
  },
}));