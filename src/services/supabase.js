// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log, logError, logEnd, startTimer, endTimer } from '../utils/logger';

const MODULE = 'SUPABASE';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

log(MODULE, 'Инициализация клиента', { url: supabaseUrl ? 'OK' : 'MISSING' });

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================
// ПРОСТОЙ КЕШ (без очереди)
// ============================================
const eventCache = new Map();
let eventsListCache = null;
let eventsListTime = 0;

// ============================================
// ЗАГРУЗКА МЕРОПРИЯТИЙ
// ============================================
export async function fetchEvents(filters) {
  // Кеш на 30 секунд
  if (eventsListCache && Date.now() - eventsListTime < 30000) {
    log(MODULE, '📦 Кеш списка');
    return eventsListCache;
  }

  const timer = startTimer();

  try {
    let query = supabase
      .from('events')
      .select('id, title, description, category, city, event_date, duration_hours, max_volunteers, current_volunteers, status')
      .eq('status', 'active')
      .limit(50);

    if (filters.search) query = query.ilike('title', `%${filters.search}%`);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.city) query = query.eq('city', filters.city);
    if (filters.dateFrom) query = query.gte('event_date', filters.dateFrom);
    if (filters.hoursMin) query = query.gte('duration_hours', filters.hoursMin);
    query = query.order('event_date', { ascending: true });

    const { data, error } = await query;

    if (error) {
      logError(MODULE, 'Ошибка загрузки', error);
      return eventsListCache || [];
    }

    eventsListCache = data || [];
    eventsListTime = Date.now();

    const duration = endTimer(timer);
    logEnd(MODULE, `Загружено ${data?.length || 0} мероприятий`, duration);
    return data || [];
  } catch (error) {
    logError(MODULE, 'Ошибка', error);
    return eventsListCache || [];
  }
}

// ============================================
// ЗАГРУЗКА ОДНОГО МЕРОПРИЯТИЯ
// ============================================
export async function fetchEventById(eventId) {
  // Проверяем кеш (1 минута)
  if (eventCache.has(eventId)) {
    const cached = eventCache.get(eventId);
    if (Date.now() - cached.time < 60000) {
      log(MODULE, `📦 Кеш: ${cached.data?.title}`);
      return cached.data;
    }
  }

  const timer = startTimer();

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      logError(MODULE, `Ошибка: ${eventId}`, error);
      return null;
    }

    const duration = endTimer(timer);
    logEnd(MODULE, `Загружено: ${data?.title}`, duration);

    eventCache.set(eventId, { data, time: Date.now() });
    return data;
  } catch (error) {
    logError(MODULE, `Ошибка: ${eventId}`, error);
    return null;
  }
}

// ============================================
// ЗАПИСЬ НА МЕРОПРИЯТИЕ
// ============================================
export async function bookEvent(userId, eventId) {
  const timer = startTimer();

  try {
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing) return { success: false, message: 'Вы уже записаны' };

    const { error: bookingError } = await supabase
      .from('bookings')
      .insert({ user_id: userId, event_id: eventId });

    if (bookingError) {
      logError(MODULE, 'Ошибка записи', bookingError);
      return { success: false, message: 'Не удалось записаться' };
    }

    eventCache.delete(eventId);
    supabase.rpc('increment_volunteers', { event_id_param: eventId });

    const duration = endTimer(timer);
    logEnd(MODULE, 'Запись создана', duration);
    return { success: true, message: 'Вы записаны!' };
  } catch (error) {
    logError(MODULE, 'Ошибка', error);
    return { success: false, message: 'Ошибка соединения' };
  }
}

// ============================================
// ОТМЕНА ЗАПИСИ
// ============================================
export async function cancelBooking(bookingId, eventId) {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) {
      logError(MODULE, 'Ошибка отмены', error);
      return false;
    }

    eventCache.delete(eventId);
    supabase.rpc('decrement_volunteers', { event_id_param: eventId });

    return true;
  } catch (error) {
    logError(MODULE, 'Ошибка отмены', error);
    return false;
  }
}

// ============================================
// ЗАГРУЗКА БРОНИРОВАНИЙ
// ============================================
export async function fetchUserBookings(userId) {
  const timer = startTimer();

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, user_id, event_id, status, registered_at,
        event:events(id, title, category, city, event_date, duration_hours)
      `)
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .order('registered_at', { ascending: false })
      .limit(30);

    if (error) {
      logError(MODULE, 'Ошибка бронирований', error);
      return [];
    }

    const duration = endTimer(timer);
    logEnd(MODULE, `Бронирований: ${data?.length || 0}`, duration);
    return data || [];
  } catch (error) {
    logError(MODULE, 'Ошибка бронирований', error);
    return [];
  }
}

// ============================================
// ЗАГРУЗКА ПРОФИЛЯ
// ============================================
export async function fetchProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, city, total_hours')
      .eq('id', userId)
      .single();

    if (error) {
      logError(MODULE, 'Ошибка профиля', error);
      return null;
    }

    return data;
  } catch (error) {
    logError(MODULE, 'Ошибка профиля', error);
    return null;
  }
}