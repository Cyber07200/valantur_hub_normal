// app/(tabs)/bookings.js
import React, { useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Calendar, MapPin, Clock, XCircle } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useBookings } from '../../src/hooks/useBookings';
import { useAuthStore } from '../../src/stores/authStore';
import EmptyState from '../../src/components/EmptyState';
import { safeHaptic } from '../../src/utils/platform';

export default function BookingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { bookings, loading, cancelBooking, refresh } = useBookings();

  // Автоматическое обновление при возврате на вкладку
  useFocusEffect(
    useCallback(() => {
      if (user) refresh();
    }, [user, refresh])
  );

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Мои записи</Text>
        </View>
        <EmptyState icon={Calendar} title="Нужно войти" message="Авторизуйтесь, чтобы видеть свои записи" />
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: colors.primary }]}
          onPress={() => { safeHaptic('medium'); router.push('/auth/login'); }}
        >
          <Text style={styles.loginButtonText}>Войти</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCancel = (bookingId, eventId, eventTitle) => {
    const booking = bookings.find(b => b.id === bookingId);
    const event = booking?.event;
    const eventDate = event ? new Date(event.event_date).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    }) : '';

    global.showAlert?.({
      type: 'error',
      title: 'Отменить запись?',
      message: `${eventTitle}\n${eventDate ? '📅 ' + eventDate + '\n' : ''}Вы уверены?`,
      confirmText: 'Да, отменить',
      cancelText: 'Нет',
      onConfirm: async () => {
        safeHaptic('success');
        await cancelBooking(bookingId, eventId);
        if (global.showNotification) {
          global.showNotification('error', 'Запись отменена', eventTitle);
        }
      },
    });
  };

  const renderBooking = ({ item }) => {
    const event = item.event;
    if (!event) return null;

    const eventDate = new Date(event.event_date);
    const formattedDate = eventDate.toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    });

    const statusLabel = item.status === 'registered' ? 'Записан' : item.status === 'attended' ? 'Посетил' : 'Отменено';
    const statusColor = item.status === 'registered' ? colors.success : item.status === 'attended' ? colors.primary : colors.error;

    return (
      <View style={[styles.bookingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.bookingHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          {item.status === 'registered' && (
            <TouchableOpacity
              onPress={() => handleCancel(item.id, event.id, event.title)}
              style={styles.cancelButton}
            >
              <XCircle size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => router.push(`/event/${event.id}`)}>
          <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
            {event.title}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoRow}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{event.city}</Text>
        </View>
        <View style={styles.infoRow}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {formattedDate} · {event.duration_hours} ч
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Мои записи</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {bookings.length} {getBookingWord(bookings.length)}
        </Text>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loaderContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : (
            <EmptyState icon={Calendar} title="Нет записей" message="Вы пока не записались ни на одно мероприятие" />
          )
        }
      />
    </View>
  );
}

function getBookingWord(count) {
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 19) return 'записей';
  if (lastDigit === 1) return 'запись';
  if (lastDigit >= 2 && lastDigit <= 4) return 'записи';
  return 'записей';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  bookingCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cancelButton: { padding: 4 },
  eventTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10, lineHeight: 21 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { fontSize: 13 },
  loaderContainer: { paddingTop: 100 },
  loginButton: { marginHorizontal: 20, marginBottom: 40, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});