// App.js
// Корневой компонент — точка входа в приложение
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { useAuthStore } from './src/stores/authStore';

// Импорт Expo Router
import { Slot, useRouter, useSegments } from 'expo-router';

// Компонент-обертка для защиты маршрутов
function AuthGuard() {
  const { user, loading, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Инициализируем сессию при старте
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Редирект на логин, если не авторизован и пытается зайти в защищенные разделы
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && !inAuthGroup) {
      // Не авторизован — но не редиректим принудительно,
      // показываем заглушки с предложением войти
    }
  }, [user, loading, segments]);

  return <Slot />;
}

// Внутренний корневой компонент с доступом к теме
function AppContent() {
  const { isDark } = useTheme();

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGuard />
    </SafeAreaProvider>
  );
}

// Главный компонент, обернутый в ThemeProvider
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}