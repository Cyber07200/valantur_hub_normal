// app/event/[id].js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Clock, Users, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/authStore';
import { useBookings } from '../../src/hooks/useBookings';
import { fetchEventById } from '../../src/services/supabase';
import { safeHaptic } from '../../src/utils/platform';
import { showBookingNotification, scheduleReminder, scheduleHourReminder } from '../../src/utils/notifications';

// Кеш мероприятий
const EVENT_CACHE = {};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { bookEvent, bookings } = useBookings();

  const [event, setEvent] = useState(() => EVENT_CACHE[id] || null);
  const [loading, setLoading] = useState(() => !EVENT_CACHE[id]);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    // Если есть в кеше — сразу показываем
    if (EVENT_CACHE[id]) {
      setEvent(EVENT_CACHE[id]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const data = await fetchEventById(id);
      if (!cancelled && data) {
        EVENT_CACHE[id] = data;
        setEvent(data);
      }
      if (!cancelled) setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [id]);

  const isBooked = bookings.some((b) => b.event_id === id && b.status === 'registered');

  const handleBook = async () => {
    if (!user) {
      global.showAlert?.({
        type: 'info', title: 'Нужно войти', message: 'Авторизуйтесь, чтобы записаться',
        confirmText: 'Войти', cancelText: 'Отмена',
        onConfirm: () => router.push('/auth/login'),
      });
      return;
    }

    if (!event) return;

    const eventDate = new Date(event.event_date);
    const formattedDate = eventDate.toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    });

    global.showAlert?.({
      type: 'success',
      title: 'Записаться?',
      message: `${event.title}\n📅 ${formattedDate}\n📍 ${event.city}\n🕐 ${event.duration_hours} ч\n+${event.duration_hours} ч в профиль`,
      confirmText: 'Да, записаться',
      cancelText: 'Отмена',
      onConfirm: async () => {
        setBookingInProgress(true);
        safeHaptic('medium');

        const result = await bookEvent(id);

        if (result.success) {
          safeHaptic('success');
          
          global.showNotification?.('success', 'Вы записаны!', `${event.title}\n+${event.duration_hours} ч`);

          showBookingNotification(event.title, event.event_date, event.city);
          scheduleReminder(event.title, event.event_date, id);
          scheduleHourReminder(event.title, event.event_date, id);

          // Обновляем кеш и стейт
          const updated = await fetchEventById(id);
          if (updated) {
            EVENT_CACHE[id] = updated;
            setEvent(updated);
          }

          // Обновляем профиль
          global.refreshProfile?.();
        } else {
          global.showAlert?.({ type: 'error', title: 'Ошибка', message: result.message, confirmText: 'OK' });
        }

        setBookingInProgress(false);
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Загрузка...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, fontSize: 18, marginBottom: 12 }}>Мероприятие не найдено</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontSize: 16 }}>← Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
  const spotsLeft = event.max_volunteers ? event.max_volunteers - event.current_volunteers : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>
        <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{event.category}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <MapPin size={20} color={colors.primary} />
            <View style={styles.textBlock}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Место</Text>
              <Text style={[styles.value, { color: colors.text }]}>{event.city}{event.address ? `, ${event.address}` : ''}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Clock size={20} color={colors.primary} />
            <View style={styles.textBlock}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Дата</Text>
              <Text style={[styles.value, { color: colors.text }]}>{formattedDate}</Text>
              <Text style={[styles.value, { color: colors.text }]}>{event.duration_hours} ч</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Users size={20} color={colors.primary} />
            <View style={styles.textBlock}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Участники</Text>
              <Text style={[styles.value, { color: colors.text }]}>{event.current_volunteers}{event.max_volunteers ? ` / ${event.max_volunteers}` : ''} волонтеров</Text>
              {spotsLeft !== null && (
                <Text style={{ color: spotsLeft <= 3 ? '#FF9500' : colors.success, fontSize: 13, fontWeight: '600', marginTop: 2 }}>
                  {spotsLeft <= 0 ? 'Мест нет' : `Свободно: ${spotsLeft}`}
                </Text>
              )}
            </View>
          </View>
        </View>
        {event.description && (
          <View style={styles.desc}>
            <Text style={[styles.descTitle, { color: colors.text }]}>Описание</Text>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>{event.description}</Text>
          </View>
        )}
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {isBooked ? (
          <View style={[styles.bookedBtn, { backgroundColor: colors.success + '20' }]}>
            <CheckCircle size={20} color={colors.success} />
            <Text style={[styles.bookedText, { color: colors.success }]}>Вы записаны</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.bookBtn, { backgroundColor: spotsLeft === 0 ? colors.border : colors.primary, opacity: spotsLeft === 0 ? 0.6 : 1 }]}
            onPress={handleBook}
            disabled={bookingInProgress || spotsLeft === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.bookBtnText}>{spotsLeft === 0 ? 'Мест нет' : 'Записаться'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  title: { fontSize: 24, fontWeight: '800', lineHeight: 30, marginBottom: 12 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, marginBottom: 20 },
  badgeText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
  textBlock: { flex: 1 },
  label: { fontSize: 12, marginBottom: 2 },
  value: { fontSize: 15, fontWeight: '500', lineHeight: 20 },
  divider: { height: 1, marginVertical: 4 },
  desc: { marginBottom: 20 },
  descTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  descText: { fontSize: 15, lineHeight: 22 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, paddingBottom: 34 },
  bookBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bookBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  bookedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  bookedText: { fontSize: 17, fontWeight: '700' },
});