// app/(tabs)/index.js
import React, { useEffect, useCallback, useRef } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Text, TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useEventStore } from '../../src/stores/eventStore';
import SearchBar from '../../src/components/SearchBar';
import FilterSheet from '../../src/components/FilterSheet';
import EventCard from '../../src/components/EventCard';
import EmptyState from '../../src/components/EmptyState';
import { Search } from 'lucide-react-native';

const CARD_HEIGHT = 190;

export default function EventsScreen() {
  const { colors } = useTheme();
  const events = useEventStore((state) => state.events);
  const loading = useEventStore((state) => state.loading);
  const hasMore = useEventStore((state) => state.hasMore);
  const total = useEventStore((state) => state.total);
  const filters = useEventStore((state) => state.filters);
  const setFilter = useEventStore((state) => state.setFilter);
  const loadEvents = useEventStore((state) => state.loadEvents);
  const loadMore = useEventStore((state) => state.loadMore);

  const searchTimer = useRef(null);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadEvents();
    }
  }, []);

  const handleSearchChange = useCallback((text) => {
    setFilter('search', text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadEvents(), 400);
  }, [setFilter, loadEvents]);

  const handleRefresh = useCallback(() => loadEvents(), [loadEvents]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore && events.length > 0) loadMore();
  }, [loading, hasMore, events.length, loadMore]);

  const renderEvent = useCallback(({ item }) => <EventCard event={item} />, []);
  const keyExtractor = useCallback((item) => String(item.id), []);

  const getItemLayout = useCallback((data, index) => ({
    length: CARD_HEIGHT, offset: CARD_HEIGHT * index, index,
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
        removeClippedSubviews={true}
        maxToRenderPerBatch={6}
        windowSize={4}
        initialNumToRender={6}
        getItemLayout={getItemLayout}
        updateCellsBatchingPeriod={50}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && events.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Загружено {events.length} из {total}
              </Text>
            </View>
          ) : !hasMore && events.length > 0 ? (
            <Text style={[styles.footerText, { color: colors.textSecondary, textAlign: 'center', padding: 16 }]}>
              Все мероприятия загружены ({events.length})
            </Text>
          ) : hasMore && events.length > 0 ? (
            <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Загрузить ещё</Text>
            </TouchableOpacity>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          loading && events.length === 0 ? (
            <View style={styles.loader}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : (
            <EmptyState icon={Search} title="Мероприятий не найдено" message="Попробуйте изменить фильтры" />
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
  footerLoader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, gap: 8 },
  footerText: { fontSize: 13 },
  loadMoreButton: { alignItems: 'center', padding: 12, marginTop: 8 },
});