// app/event/[id].js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MapPin, Clock, Users, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/authStore';
import { useBookings } from '../../src/hooks/useBookings';
import { useEventStore } from '../../src/stores/eventStore';
import { safeHaptic } from '../../src/utils/platform';
import { useTranslation } from '../../src/i18n/I18nContext';

export default function EventDetailScreen() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { bookEvent, bookings } = useBookings();
  const getEventById = useEventStore((state) => state.getEventById);
  const refreshEvent = useEventStore((state) => state.refreshEvent);
  const { t } = useTranslation();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, friction: 8, tension: 30, useNativeDriver: true }),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        setLoading(true);
        getEventById(id).then(data => {
          if (data) setEvent(data);
          setLoading(false);
        });
      }
    }, [id, getEventById])
  );

  const isBooked = bookings.some((b) => b.event_id === id && b.status === 'registered');

  const handleBack = () => {
    safeHaptic('light');
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 30, duration: 200, useNativeDriver: true }),
    ]).start(() => router.back());
  };

  const handleBook = async () => {
    if (!user) {
      global.showAlert?.({
        type: 'info',
        title: t.loginRequired || 'Нужно войти',
        message: t.loginRequiredMessage || 'Авторизуйтесь, чтобы записаться',
        confirmText: t.loginButton || 'Войти',
        cancelText: t.cancel || 'Отмена',
        onConfirm: () => router.push('/auth/login'),
      });
      return;
    }
    if (!event) return;

    const eventDate = new Date(event.event_date);
    const formattedDate = eventDate.toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    });

    // ✅ Всплывающее окно подтверждения с переводами
    global.showAlert?.({
      type: 'success',
      title: t.bookingConfirmTitle || 'Записаться?',
      message: `${event.title}\n📅 ${formattedDate}\n📍 ${event.city}\n🕐 ${event.duration_hours} ${t.hourAbbr || 'ч'}\n+${event.duration_hours} ${t.hourAbbr || 'ч'} ${t.bookingInProfile || 'в профиль'}`,
      confirmText: t.bookingConfirmButton || 'Да, записаться',
      cancelText: t.bookingCancelButton || 'Отмена',
      onConfirm: async () => {
        setBookingInProgress(true);
        safeHaptic('medium');
        const result = await bookEvent(id);
        if (result.success) {
          safeHaptic('success');
          await refreshEvent(id);
          if (global.refreshProfile) global.refreshProfile();
          if (global.refreshBookings) global.refreshBookings();
          global.showNotification?.(
            'success',
            t.bookingSuccessNotification || 'Вы записаны!',
            `${event.title}\n+${event.duration_hours} ${t.hourAbbr || 'ч'}`
          );
        } else {
          global.showAlert?.({
            type: 'error',
            title: t.error || 'Ошибка',
            message: result.message,
            confirmText: 'OK',
          });
        }
        setBookingInProgress(false);
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, fontSize: 18, marginBottom: 12 }}>Мероприятие не найдено</Text>
        <TouchableOpacity onPress={handleBack}>
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
      <Animated.View style={[styles.animatedContainer, {
        transform: [{ scale: scaleAnim }, { translateY: slideUp }],
        opacity: opacityAnim,
      }]}>
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {t.event || 'Мероприятие'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

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
              {/* ✅ Перевод "Вы записаны" */}
              <Text style={[styles.bookedText, { color: colors.success }]}>
                {t.youAreBooked || 'Вы записаны'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.bookBtn, { backgroundColor: spotsLeft === 0 ? colors.border : colors.primary, opacity: spotsLeft === 0 ? 0.6 : 1 }]}
              onPress={handleBook}
              disabled={bookingInProgress || spotsLeft === 0}
              activeOpacity={0.8}
            >
              {bookingInProgress ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                /* ✅ Перевод кнопки "Записаться" */
                <Text style={styles.bookBtnText}>
                  {spotsLeft === 0
                    ? t.noSpots || 'Мест нет'
                    : t.bookButton || 'Записаться'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  animatedContainer: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  customHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 8,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center' },
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
  footer: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, paddingBottom: 34 },
  bookBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bookBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  bookedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  bookedText: { fontSize: 17, fontWeight: '700' },
});