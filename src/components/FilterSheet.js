// src/components/FilterSheet.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput,
} from 'react-native';
import { X, Filter, MapPin } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useEventStore } from '../stores/eventStore';

const CATEGORIES = [
  { key: null, label: 'Все' },
  { key: 'ecology', label: '🌿 Экология' },
  { key: 'social', label: '🤝 Социальная помощь' },
  { key: 'education', label: '📚 Образование' },
  { key: 'health', label: '🏥 Здоровье' },
  { key: 'animals', label: '🐾 Животные' },
  { key: 'culture', label: '🎭 Культура' },
  { key: 'sport', label: '⚽ Спорт' },
];

const SORT_OPTIONS = [
  { key: 'date_asc', label: 'Сначала ближайшие' },
  { key: 'date_desc', label: 'Сначала поздние' },
  { key: 'hours_asc', label: 'Меньше часов' },
  { key: 'hours_desc', label: 'Больше часов' },
];

export default function FilterSheet() {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const filters = useEventStore((state) => state.filters);
  const setFilter = useEventStore((state) => state.setFilter);
  const resetFilters = useEventStore((state) => state.resetFilters);
  const loadEvents = useEventStore((state) => state.loadEvents);   // <-- добавили

  return (
    <>
      <TouchableOpacity
        style={[styles.triggerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setVisible(true)}
      >
        <Filter size={20} color={colors.primary} />
        <Text style={[styles.triggerText, { color: colors.primary }]}>Фильтры</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Фильтры</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Город */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Город</Text>
            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MapPin size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={filters.city || ''}
                onChangeText={(text) => setFilter('city', text || null)}
                placeholder="Введите город"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Категория */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Категория</Text>
            <View style={styles.chipContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={String(cat.key)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: filters.category === cat.key ? colors.primary : colors.surface,
                      borderColor: filters.category === cat.key ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setFilter('category', cat.key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: filters.category === cat.key ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Сортировка */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Сортировка</Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  {
                    backgroundColor: filters.sortBy === option.key ? colors.primaryLight : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setFilter('sortBy', option.key)}
              >
                <View style={styles.radioOuter}>
                  {filters.sortBy === option.key && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <Text style={[styles.sortText, { color: colors.text }]}>{option.label}</Text>
              </TouchableOpacity>
            ))}

            {/* Минимум часов */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Минимум часов</Text>
            <View style={styles.hoursContainer}>
              {[1, 2, 3, 4, 6, 8].map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.hourChip,
                    {
                      backgroundColor: filters.hoursMin === h ? colors.primary : colors.surface,
                      borderColor: filters.hoursMin === h ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setFilter('hoursMin', filters.hoursMin === h ? null : h)}
                >
                  <Text
                    style={{
                      color: filters.hoursMin === h ? '#FFFFFF' : colors.text,
                      fontWeight: '500',
                    }}
                  >
                    {h} ч
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Футер с кнопками */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.resetButton, { borderColor: colors.border }]}
              onPress={() => {
                resetFilters();
                setVisible(false);
              }}
            >
              <Text style={[styles.resetText, { color: colors.textSecondary }]}>Сбросить</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                loadEvents();   // <-- загружаем мероприятия с новыми фильтрами
                setVisible(false);
              }}
            >
              <Text style={styles.applyText}>Применить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  triggerText: { fontSize: 14, fontWeight: '500' },
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 14 },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    marginBottom: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C0C0C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  sortText: { fontSize: 14 },
  hoursContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourChip: {
    width: 54,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetText: { fontSize: 16, fontWeight: '500' },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});