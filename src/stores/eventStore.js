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
    set((state) => ({ filters: { ...state.filters, [key]: value } }));
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
      result.events.forEach((e) => { newFull[e.id] = e; });
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

    // ✅ Убираем дубликаты, проверяя id
    const existingIds = new Set(events.map((e) => e.id));
    const newUniqueEvents = (result.events || []).filter(
      (e) => !existingIds.has(e.id)
    );

    const newFull = { ...fullEvents };
    newUniqueEvents.forEach((e) => { newFull[e.id] = e; });

    set({
      events: [...events, ...newUniqueEvents],
      hasMore: result.hasMore && newUniqueEvents.length > 0,
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

  refreshEvent: async (eventId) => {
    const detailed = await fetchEventById(eventId);
    if (!detailed) return;
    set((state) => {
      const newFull = { ...state.fullEvents, [eventId]: detailed };
      // Обновляем существующее мероприятие в списке, не добавляя дубликатов
      const newEvents = state.events.map((e) =>
        e.id === eventId
          ? { ...e, current_volunteers: detailed.current_volunteers, max_volunteers: detailed.max_volunteers }
          : e
      );
      return { fullEvents: newFull, events: newEvents };
    });
  },
}));