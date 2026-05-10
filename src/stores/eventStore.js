// src/stores/eventStore.js
import { create } from 'zustand';
import { fetchEvents } from '../services/supabase';
import { log, logError, logStart, logEnd, startTimer, endTimer } from '../utils/logger';

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
  filters: { ...defaultFilters },

  // ✅ Установка фильтра + автозагрузка
  setFilter: (key, value) => {
    log(MODULE, `Установлен фильтр: ${key} = ${value}`);
    
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
    
    // ✅ Автоматически загружаем после смены фильтра
    get().loadEvents();
  },

  // ✅ Сброс фильтров + загрузка
  resetFilters: () => {
    log(MODULE, 'Сброс всех фильтров');
    set({ filters: { ...defaultFilters } });
    get().loadEvents();
  },

  // ✅ Загрузка с защитой от повторов
  loadEvents: async () => {
    const state = get();
    
    if (state.loading) {
      log(MODULE, '⚠️ Загрузка уже выполняется');
      return;
    }

    logStart(MODULE, 'Начало загрузки мероприятий');
    const timer = startTimer();
    set({ loading: true });

    try {
      const { filters } = get();
      const events = await fetchEvents(filters);
      set({ events, loading: false, loaded: true });
      
      const duration = endTimer(timer);
      logEnd(MODULE, `Загружено ${events.length} событий`, duration);
    } catch (error) {
      logError(MODULE, 'Ошибка в loadEvents', error);
      set({ loading: false, loaded: true });
    }
  },
}));