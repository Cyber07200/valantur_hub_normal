// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://xbphujijpyoujhjfwrqu.supabase.co';
const supabaseAnonKey = 'sb_publishable_ZqneI8Bekc22bcNNpCQd1Q_spqs80x2';

console.log('[SUPABASE] Init');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================
// ЗАГРУЗКА МЕРОПРИЯТИЙ (список)
// ============================================
export async function fetchEvents(filters = {}, page = 1, pageSize = 10) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  console.log(`[FETCH] page=${page}, range=${from}-${to}`);

  try {
    let query = supabase
      .from('events')
      .select('id, title, category, city, event_date, duration_hours, max_volunteers, current_volunteers, status', { count: 'exact' })
      .eq('status', 'active')
      .order('event_date', { ascending: true })
      .range(from, to);

    if (filters.search) query = query.ilike('title', `%${filters.search}%`);
    if (filters.category) query = query.eq('category', filters.category);

    const { data, error, count } = await query;

    if (error) {
      console.log('[FETCH] Error:', error.message);
      return { events: [], total: 0, hasMore: false };
    }

    const hasMore = from + data.length < count;
    console.log(`[FETCH] received ${data.length}, total=${count}, hasMore=${hasMore}`);

    return { events: data || [], total: count, hasMore };
  } catch (e) {
    console.log('[FETCH] Exception:', e.message);
    return { events: [], total: 0, hasMore: false };
  }
}

// ============================================
// ЗАГРУЗКА ОДНОГО МЕРОПРИЯТИЯ (полные данные)
// ============================================
export async function fetchEventById(eventId) {
  if (!eventId) return null;
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
    if (error) {
      console.log('[EVENT] Error:', error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.log('[EVENT] Exception:', e.message);
    return null;
  }
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

    const { error } = await supabase
      .from('bookings')
      .insert({ user_id: userId, event_id: eventId });

    if (error) return { success: false, message: error.message };

    return { success: true, message: 'Вы записаны!' };
  } catch (e) {
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
    return !error;
  } catch (e) {
    return false;
  }
}

// ============================================
// БРОНИРОВАНИЯ
// ============================================
export async function fetchUserBookings(userId) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, user_id, event_id, status, registered_at, event:events(*)')
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .order('registered_at', { ascending: false })
      .limit(20);
    if (error) return [];
    return data || [];
  } catch (e) {
    return [];
  }
}

// ============================================
// ПРОФИЛЬ
// ============================================
export async function fetchProfile(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  } catch (e) {
    return null;
  }
}

// ============================================
// ЛИДЕРБОРД
// ============================================
export async function fetchLeaderboard() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, nickname, avatar_url, total_hours')
      .order('total_hours', { ascending: false })
      .limit(30);
    if (error) return [];
    return data || [];
  } catch (e) {
    return [];
  }
}

// ============================================
// НИКНЕЙМ
// ============================================
export async function checkNickname(nickname, userId = null) {
  try {
    let q = supabase.from('profiles').select('id').eq('nickname', nickname);
    if (userId) q = q.neq('id', userId);
    const { data } = await q;
    return !data || data.length === 0;
  } catch (e) {
    return false;
  }
}

// ============================================
// ОБНОВЛЕНИЕ ПРОФИЛЯ
// ============================================
export async function updateProfile(userId, updates) {
  try {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, message: 'Ошибка' };
  }
}

// ============================================
// АВАТАР
// ============================================
export async function uploadAvatar(userId, uri) {
  try {
    const r = await fetch(uri);
    const b = await r.blob();
    const name = `${userId}_${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(name, b, { contentType: 'image/jpeg', upsert: true });
    if (error) return uri;
    const { data } = supabase.storage.from('avatars').getPublicUrl(name);
    return data.publicUrl;
  } catch (e) {
    return uri;
  }
}