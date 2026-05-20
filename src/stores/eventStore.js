import { create } from 'zustand';
import { fetchEvents, fetchEventById } from '../services/supabase';

const defaultFilters = {
  search: '',
  category: null,
};

export const useEventStore = create((set, get) => ({
  events: [],
  fullEvents: {},   // кеш полных объектов по id
  loading: false,
  hasMore: true,
  total: 0,
  filters: { ...defaultFilters },

  setFilter: (key, value) => {
    set((state) => ({ filters: { ...state.filters, [key]: value } }));
  },

  loadEvents: async () => {
    if (get().loading) return;
    set({ loading: true, events: [] });

    const { filters } = get();
    const result = await fetchEvents(filters, 1, 10);

    // Сохраняем краткие данные, а также добавляем в fullEvents для быстрого доступа
    const newFull = { ...get().fullEvents };
    result.events.forEach(e => { newFull[e.id] = e; });
    set({
      events: result.events,
      total: result.total,
      hasMore: result.hasMore,
      loading: false,
      fullEvents: newFull,
    });
  },

  loadMore: async () => {
    const { loading, hasMore, events, filters, fullEvents } = get();
    if (loading || !hasMore) return;

    const nextPage = Math.floor(events.length / 10) + 1;
    set({ loading: true });

    const result = await fetchEvents(filters, nextPage, 10);
    const newFull = { ...fullEvents };
    result.events.forEach(e => { newFull[e.id] = e; });

    set({
      events: [...events, ...result.events],
      hasMore: result.hasMore,
      loading: false,
      fullEvents: newFull,
    });
  },

  // Получить полную информацию об ивенте (из стора или из БД)
  getEventById: async (id) => {
    const { fullEvents } = get();
    // Если в сторе есть полные данные (включая description, address)
    if (fullEvents[id] && fullEvents[id].description !== undefined) {
      return fullEvents[id];
    }
    // Если есть только краткие данные, дозагружаем
    if (fullEvents[id]) {
      const detailed = await fetchEventById(id);
      if (detailed) {
        set((state) => ({
          fullEvents: { ...state.fullEvents, [id]: detailed }
        }));
        return detailed;
      }
    }
    // Загружаем с нуля
    const detailed = await fetchEventById(id);
    if (detailed) {
      set((state) => ({
        fullEvents: { ...state.fullEvents, [id]: detailed }
      }));
    }
    return detailed;
  }
}));