// src/components/EmptyState.js
// Заглушка, когда список пуст
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';

export default function EmptyState({ icon: Icon = Search, title, message }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Icon size={64} color={colors.textSecondary} strokeWidth={1.5} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});