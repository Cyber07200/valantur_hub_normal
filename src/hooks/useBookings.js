// src/hooks/useBookings.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchUserBookings, bookEvent, cancelBooking } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';

export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;

  const loadBookings = useCallback(async () => {
    if (!userId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchUserBookings(userId);
      if (mountedRef.current) setBookings(data || []);
    } catch (error) {
      if (mountedRef.current) setBookings([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userId]);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (userId) {
      loadBookings();
    } else {
      setBookings([]);
      setLoading(false);
    }

    // Сохраняем функцию обновления глобально, чтобы другие компоненты могли вызвать её
     global.refreshBookings = loadBookings;
  return () => {
    global.refreshBookings = null;
  };
}, [userId, loadBookings]);

  const handleBookEvent = async (eventId) => {
    if (!userId) return { success: false, message: 'Нужно войти' };
    const result = await bookEvent(userId, eventId);
    if (result.success) {
      await loadBookings(); // обновляем список сразу
      if (global.refreshBookings) global.refreshBookings(); // на всякий случай
    }
    return result;
  };

  const handleCancelBooking = async (bookingId, eventId) => {
    const success = await cancelBooking(bookingId, eventId);
    if (success) {
      await loadBookings();
      if (global.refreshBookings) global.refreshBookings();
    }
    return success;
  };

  return {
    bookings,
    loading,
    bookEvent: handleBookEvent,
    cancelBooking: handleCancelBooking,
    refresh: loadBookings,
  };
}