// src/components/EventCard.js
import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Clock, Users } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { safeHaptic } from '../utils/platform';

// ✅ memo предотвращает лишние перерендеры
const EventCard = memo(function EventCard({ event }) {
  const { colors } = useTheme();
  const router = useRouter();

  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const spotsLeft = event.max_volunteers
    ? event.max_volunteers - event.current_volunteers
    : null;

  const handlePress = () => {
    safeHaptic('light');
    router.push(`/event/${event.id}`);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryBadge, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.categoryText, { color: colors.primary }]}>
          {EMOJI_MAP[event.category] || '📌'} {LABEL_MAP[event.category] || event.category}
        </Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {event.title}
      </Text>

      <View style={styles.infoRow}>
        <MapPin size={16} color={colors.textSecondary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={1}>
          {event.city}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Clock size={16} color={colors.textSecondary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          {formattedDate} · {event.duration_hours} ч
        </Text>
      </View>

      {spotsLeft !== null && (
        <View style={styles.spotsContainer}>
          <View style={styles.spotsRow}>
            <Users size={14} color={spotsLeft <= 3 ? '#FF9500' : colors.success} />
            <Text style={[styles.spotsText, { color: spotsLeft <= 3 ? '#FF9500' : colors.success }]}>
              {spotsLeft <= 0 ? 'Мест нет' : spotsLeft === 1 ? '1 место' : `${spotsLeft} мест`}
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: spotsLeft <= 3 ? '#FF9500' : colors.success,
                  width: `${(event.current_volunteers / event.max_volunteers) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
});

// Константы вне компонента — не создаются заново при каждом рендере
const EMOJI_MAP = {
  ecology: '🌿',
  social: '🤝',
  education: '📚',
  health: '🏥',
  animals: '🐾',
  culture: '🎭',
  sport: '⚽',
};

const LABEL_MAP = {
  ecology: 'Экология',
  social: 'Соц. помощь',
  education: 'Образование',
  health: 'Здоровье',
  animals: 'Животные',
  culture: 'Культура',
  sport: 'Спорт',
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  spotsContainer: {
    marginTop: 10,
  },
  spotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  spotsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default EventCard;