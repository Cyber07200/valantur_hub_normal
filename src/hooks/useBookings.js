// src/hooks/useBookings.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchUserBookings, bookEvent, cancelBooking } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import { log } from '../utils/logger';

const MODULE = 'USE_BOOKINGS';

// Глобальный кеш
let globalBookings = [];
let globalUserId = null;
let loadingPromise = null;

export function useBookings() {
  const [bookings, setBookings] = useState(globalBookings);
  const [loading, setLoading] = useState(false);
  
  const userId = useAuthStore((state) => state.user?.id);
  const prevUserId = useRef(null);
  const mountedRef = useRef(true);

  const loadBookings = useCallback(async () => {
    if (!userId) {
      globalBookings = [];
      globalUserId = null;
      if (mountedRef.current) setBookings([]);
      return;
    }

    // Если уже загружены для этого пользователя — не грузим
    if (globalUserId === userId && globalBookings.length >= 0) {
      if (mountedRef.current) {
        setBookings(globalBookings);
        setLoading(false);
      }
      return;
    }

    // Если уже идет загрузка — ждем её
    if (loadingPromise) {
      await loadingPromise;
      if (mountedRef.current) {
        setBookings(globalBookings);
        setLoading(false);
      }
      return;
    }

    if (mountedRef.current) setLoading(true);

    loadingPromise = (async () => {
      try {
        const data = await fetchUserBookings(userId);
        globalBookings = data || [];
        globalUserId = userId;
      } catch (error) {
        // оставляем старые данные
      } finally {
        loadingPromise = null;
      }
    })();

    await loadingPromise;

    if (mountedRef.current) {
      setBookings(globalBookings);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Загружаем ТОЛЬКО если userId реально изменился
    if (userId !== prevUserId.current) {
      prevUserId.current = userId;
      
      if (userId) {
        loadBookings();
      } else {
        globalBookings = [];
        globalUserId = null;
        setBookings([]);
        setLoading(false);
      }
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [userId, loadBookings]);

  const handleBookEvent = async (eventId) => {
    if (!userId) return { success: false, message: 'Нужно войти' };
    const result = await bookEvent(userId, eventId);
    if (result.success) await loadBookings();
    return result;
  };

  const handleCancelBooking = async (bookingId, eventId) => {
    const success = await cancelBooking(bookingId, eventId);
    if (success) await loadBookings();
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