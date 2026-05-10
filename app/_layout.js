// app/_layout.js
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { useAuthStore } from '../src/stores/authStore';

function RootLayoutInner() {
  const { colors, isDark } = useTheme();
  const initialize = useAuthStore((state) => state.initialize);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <>
        <StatusBar style="light" />
        <View style={splashStyles.container}>
          <View style={splashStyles.iconContainer}>
            <Text style={splashStyles.emoji}>❤️</Text>
          </View>
          <Text style={splashStyles.title}>Волонтер Хаб</Text>
          <Text style={splashStyles.subtitle}>Делай добро вместе с нами</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          // ✅ Отключаем анимацию — предотвращает размонтирование
          animation: 'none',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="event/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Мероприятие',
            headerBackTitle: 'Назад',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            // ✅ Чтобы не пересоздавался экран
            animation: 'none',
          }}
        />
        <Stack.Screen
          name="auth/login"
          options={{
            headerShown: true,
            headerTitle: 'Вход',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="auth/register"
          options={{
            headerShown: true,
            headerTitle: 'Регистрация',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4A90D9',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  emoji: { fontSize: 56 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    letterSpacing: 2,
  },
});