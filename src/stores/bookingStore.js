// src/stores/bookingStore.js
import { create } from 'zustand';
import { fetchUserBookings, bookEvent, cancelBooking } from '../services/supabase';
import { log, logError } from '../utils/logger';

const MODULE = 'BOOKING_STORE';

export const useBookingStore = create((set, get) => ({
  bookings: [],
  loading: false,
  loaded: false,
  userId: null,

  // ============================================
  // ЗАГРУЗКА БРОНИРОВАНИЙ (только если нужно)
  // ============================================
  loadBookings: async (userId) => {
    const state = get();

    // Уже грузим — не запускаем второй раз
    if (state.loading) {
      log(MODULE, '⏩ loadBookings пропущен — уже идёт загрузка');
      return;
    }

    // Уже загружено для этого пользователя — не перегружаем
    if (state.loaded && state.userId === userId) {
      log(MODULE, '⏩ loadBookings пропущен — данные актуальны');
      return;
    }

    if (!userId) {
      set({ bookings: [], loading: false, loaded: false, userId: null });
      return;
    }

    log(MODULE, `📋 loadBookings начат для userId=${userId}`);
    set({ loading: true, userId });

    try {
      const data = await fetchUserBookings(userId);
      log(MODULE, `✅ loadBookings: загружено ${data?.length ?? 0} записей`);
      set({ bookings: data || [], loading: false, loaded: true });
    } catch (error) {
      logError(MODULE, '❌ loadBookings упал', error);
      set({ loading: false, loaded: true, bookings: [] });
    }
  },

  // ============================================
  // ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ (после записи/отмены)
  // ============================================
  reloadBookings: async () => {
    const { userId } = get();
    if (!userId) return;

    log(MODULE, `🔄 reloadBookings для userId=${userId}`);
    set({ loaded: false }); // сбрасываем флаг чтобы loadBookings не пропустил
    await get().loadBookings(userId);
  },

  // ============================================
  // ЗАПИСЬ НА МЕРОПРИЯТИЕ
  // ============================================
  bookEvent: async (eventId) => {
    const { userId } = get();
    if (!userId) return { success: false, message: 'Нужно войти' };

    log(MODULE, `📝 bookEvent: eventId=${eventId}`);
    const result = await bookEvent(userId, eventId);

    if (result.success) {
      // Обновляем список после записи
      await get().reloadBookings();
    }
    return result;
  },

  // ============================================
  // ОТМЕНА ЗАПИСИ
  // ============================================
  cancelBooking: async (bookingId, eventId) => {
    log(MODULE, `🚫 cancelBooking: bookingId=${bookingId}`);
    const success = await cancelBooking(bookingId, eventId);

    if (success) {
      // Обновляем список после отмены
      await get().reloadBookings();
    }
    return success;
  },

  // ============================================
  // СБРОС ПРИ ВЫХОДЕ
  // ============================================
  reset: () => {
    log(MODULE, '🔄 Сброс bookingStore');
    set({ bookings: [], loading: false, loaded: false, userId: null });
  },
}));
