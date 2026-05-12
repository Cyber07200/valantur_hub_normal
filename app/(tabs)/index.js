// app/(tabs)/index.js
import React, { useEffect, useCallback, useRef } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Text,
} from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useEventStore } from '../../src/stores/eventStore';
import SearchBar from '../../src/components/SearchBar';
import FilterSheet from '../../src/components/FilterSheet';
import EventCard from '../../src/components/EventCard';
import EmptyState from '../../src/components/EmptyState';
import { Search } from 'lucide-react-native';

// ✅ Примерная высота одной карточки для getItemLayout
const CARD_HEIGHT = 190;

export default function EventsScreen() {
  const { colors } = useTheme();
  const events = useEventStore((state) => state.events);
  const loading = useEventStore((state) => state.loading);
  const loaded = useEventStore((state) => state.loaded);
  const filters = useEventStore((state) => state.filters);
  const setFilter = useEventStore((state) => state.setFilter);
  const loadEvents = useEventStore((state) => state.loadEvents);

  const searchTimer = useRef(null);
  const initialLoadDone = useRef(false);

  // Загружаем только при первом рендере
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadEvents();
    }
  }, []);

  // Поиск с задержкой
  const handleSearchChange = useCallback((text) => {
    setFilter('search', text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadEvents();
    }, 500);
  }, [setFilter, loadEvents]);

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    loadEvents();
  }, [loadEvents]);

  // ✅ Мемоизированный рендер карточки
  const renderEvent = useCallback(({ item }) => <EventCard event={item} />, []);
  
  // ✅ Ключ — строка для быстрого сравнения
  const keyExtractor = useCallback((item) => String(item.id), []);

  // ✅ Оптимизация: getItemLayout для одинаковых карточек
  const getItemLayout = useCallback((data, index) => ({
    length: CARD_HEIGHT,
    offset: CARD_HEIGHT * index,
    index,
  }), []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Волонтер Хаб</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Найди дело по душе
        </Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBarWrapper}>
          <SearchBar value={filters.search} onChangeText={handleSearchChange} />
        </View>
        <FilterSheet />
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // ✅ Оптимизация производительности
        removeClippedSubviews={true}
        maxToRenderPerBatch={6}
        windowSize={4}
        initialNumToRender={6}
        getItemLayout={getItemLayout}
        updateCellsBatchingPeriod={50}
        // ✅ Pull to refresh
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        // ✅ Пустой список
        ListEmptyComponent={
          loading && events.length === 0 ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <EmptyState
              icon={Search}
              title="Мероприятий не найдено"
              message="Попробуйте изменить фильтры"
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 15, marginTop: 4 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  searchBarWrapper: { flex: 1 },
  loader: { paddingTop: 100 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
});