// src/hooks/useBookings.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchUserBookings, bookEvent, cancelBooking } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import { useEventStore } from '../stores/eventStore';

export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const prevUserId = useRef(null);
  const mountedRef = useRef(true);

  const loadBookings = useCallback(async () => {
    if (!userId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchUserBookings(userId);
      if (mountedRef.current) {
        setBookings(data || []);
      }
    } catch (error) {
      if (mountedRef.current) {
        setBookings([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (userId !== prevUserId.current) {
      prevUserId.current = userId;
      loadBookings();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [userId, loadBookings]);

  const handleBookEvent = async (eventId) => {
    if (!userId) return { success: false, message: 'Нужно войти' };
    const result = await bookEvent(userId, eventId);
    if (result.success) {
      // Мгновенно обновляем список
      await loadBookings();
    }
    return result;
  };

  const handleCancelBooking = async (bookingId, eventId) => {
    const success = await cancelBooking(bookingId, eventId);
    if (success) {
      // Мгновенно обновляем список
      await loadBookings();
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