// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log, logError, logEnd, startTimer, endTimer } from '../utils/logger';

const MODULE = 'SUPABASE';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================
// УМНЫЙ КЕШ С TTL
// ============================================
const cache = new Map();
const CACHE_TTL = {
  events: 30000,    // 30 секунд
  event: 60000,     // 1 минута
  bookings: 15000,  // 15 секунд
  profile: 30000,   // 30 секунд
  leaderboard: 60000, // 1 минута
};

function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.time > (CACHE_TTL[key.split(':')[0]] || 15000)) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
}

function clearCache(pattern) {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) cache.delete(key);
  }
}

// ============================================
// ДЕДУПЛИКАЦИЯ ЗАПРОСОВ
// ============================================
const _inflight = new Map();

function dedupe(key, fn) {
  if (_inflight.has(key)) {
    return _inflight.get(key);
  }
  
  const promise = fn()
    .then(result => { _inflight.delete(key); return result; })
    .catch(error => { _inflight.delete(key); throw error; });
  
  _inflight.set(key, promise);
  return promise;
}

// ============================================
// ПРОВЕРКА СОЕДИНЕНИЯ
// ============================================
export async function checkConnection() {
  try {
    const start = Date.now();
    const { error } = await supabase.from('events').select('id').limit(1);
    if (error) return false;
    log(MODULE, `БД доступна (${Date.now() - start}мс)`);
    return true;
  } catch { return false; }
}

checkConnection();

// ============================================
// ЗАГРУЗКА МЕРОПРИЯТИЙ (с кешем)
// ============================================
export async function fetchEvents(filters) {
  const cacheKey = `events:${JSON.stringify(filters)}`;
  const cached = getCache(cacheKey);
  if (cached) {
    log(MODULE, '📦 Кеш мероприятий');
    return cached;
  }

  const timer = startTimer();

  return dedupe(cacheKey, async () => {
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

      if (error) { logError(MODULE, 'Ошибка fetchEvents', error); return []; }

      const result = data || [];
      setCache(cacheKey, result);
      logEnd(MODULE, `Загружено ${result.length} мероприятий`, endTimer(timer));
      return result;
    } catch (error) {
      logError(MODULE, 'Ошибка fetchEvents', error);
      return [];
    }
  });
}

// ============================================
// ЗАГРУЗКА ОДНОГО МЕРОПРИЯТИЯ (с кешем)
// ============================================
export async function fetchEventById(eventId) {
  if (!eventId) return null;
  
  const cacheKey = `event:${eventId}`;
  const cached = getCache(cacheKey);
  if (cached) {
    log(MODULE, '📦 Кеш мероприятия');
    return cached;
  }

  return dedupe(cacheKey, async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) { logError(MODULE, `Ошибка event/${eventId}`, error); return null; }
    
    setCache(cacheKey, data);
    return data;
  });
}

// ============================================
// ЗАПИСЬ НА МЕРОПРИЯТИЕ
// ============================================
export async function bookEvent(userId, eventId) {
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

    if (bookingError) return { success: false, message: 'Не удалось' };

    // Параллельные запросы для скорости
    await Promise.all([
      supabase.rpc('increment_volunteers', { event_id_param: eventId }),
      supabase.rpc('add_hours_to_user', { user_id_param: userId, event_id_param: eventId }),
    ]);

    // Очищаем кеш
    clearCache('events');
    clearCache(`event:${eventId}`);
    clearCache(`bookings:${userId}`);
    clearCache('leaderboard');
    clearCache(`profile:${userId}`);

    return { success: true, message: 'Вы записаны! Часы начислены!' };
  } catch (error) {
    return { success: false, message: 'Ошибка соединения' };
  }
}

// ============================================
// ОТМЕНА ЗАПИСИ
// ============================================
export async function cancelBooking(bookingId, eventId) {
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('user_id, event_id')
      .eq('id', bookingId)
      .single();

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) return false;

    await Promise.all([
      supabase.rpc('decrement_volunteers', { event_id_param: eventId }),
      booking?.user_id ? supabase.rpc('remove_hours_from_user', { user_id_param: booking.user_id, event_id_param: booking.event_id }) : Promise.resolve(),
    ]);

    clearCache('events');
    clearCache(`event:${eventId}`);
    clearCache(`bookings:${booking?.user_id}`);
    clearCache('leaderboard');
    clearCache(`profile:${booking?.user_id}`);

    return true;
  } catch { return false; }
}

// ============================================
// ЗАГРУЗКА БРОНИРОВАНИЙ (с кешем)
// ============================================
export async function fetchUserBookings(userId) {
  if (!userId) return [];
  
  const cacheKey = `bookings:${userId}`;
  const cached = getCache(cacheKey);
  if (cached) {
    log(MODULE, '📦 Кеш бронирований');
    return cached;
  }

  return dedupe(cacheKey, async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`id, user_id, event_id, status, registered_at, event:events(id, title, category, city, event_date, duration_hours)`)
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .order('registered_at', { ascending: false })
      .limit(30);

    if (error) return [];
    
    const result = data || [];
    setCache(cacheKey, result);
    return result;
  });
}

// ============================================
// ЗАГРУЗКА ПРОФИЛЯ (с кешем)
// ============================================
export async function fetchProfile(userId) {
  if (!userId) return null;
  
  const cacheKey = `profile:${userId}`;
  const cached = getCache(cacheKey);
  if (cached) {
    log(MODULE, '📦 Кеш профиля');
    return cached;
  }

  return dedupe(cacheKey, async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    
    setCache(cacheKey, data);
    return data;
  });
}

// ============================================
// ЗАГРУЗКА ЛИДЕРБОРДА (с кешем)
// ============================================
export async function fetchLeaderboard() {
  const cacheKey = 'leaderboard';
  const cached = getCache(cacheKey);
  if (cached) {
    log(MODULE, '📦 Кеш лидерборда');
    return cached;
  }

  return dedupe(cacheKey, async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, nickname, avatar_url, total_hours')
      .order('total_hours', { ascending: false })
      .limit(50);

    if (error) return [];
    
    const result = data || [];
    setCache(cacheKey, result);
    return result;
  });
}

// ============================================
// ПРОВЕРКА НИКНЕЙМА
// ============================================
export async function checkNickname(nickname, userId = null) {
  try {
    let query = supabase.from('profiles').select('id').eq('nickname', nickname);
    if (userId) query = query.neq('id', userId);
    const { data, error } = await query;
    if (error) return false;
    return data.length === 0;
  } catch { return false; }
}

// ============================================
// ОБНОВЛЕНИЕ ПРОФИЛЯ
// ============================================
export async function updateProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    
    clearCache(`profile:${userId}`);
    clearCache('leaderboard');
    return { success: true, data };
  } catch { return { success: false, message: 'Ошибка соединения' }; }
}

// ============================================
// ЗАГРУЗКА АВАТАРА
// ============================================
export async function uploadAvatar(userId, uri) {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileExt = uri.split('.').pop() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, {
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) return uri;
    
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    clearCache(`profile:${userId}`);
    return urlData.publicUrl;
  } catch { return uri; }
}

// ============================================
// ОЧИСТКА ВСЕГО КЕША (вызывать при выходе)
// ============================================
export function clearAllCache() {
  cache.clear();
  _inflight.clear();
}