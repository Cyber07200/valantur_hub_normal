// app/+not-found.js
// Страница для несуществующих маршрутов
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Home } from 'lucide-react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { safeHaptic } from '../src/utils/platform';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.emoji]}>🔍</Text>
      <Text style={[styles.title, { color: colors.text }]}>Страница не найдена</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        Возможно, она была удалена или вы перешли по неверной ссылке
      </Text>
      <TouchableOpacity
        style={[styles.homeButton, { backgroundColor: colors.primary }]}
        onPress={() => {
          safeHaptic('light');
          router.replace('/');
        }}
      >
        <Home size={20} color="#FFFFFF" />
        <Text style={styles.homeButtonText}>На главную</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});