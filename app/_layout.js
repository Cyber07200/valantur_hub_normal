// app/_layout.js
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, TouchableOpacity } from 'react-native';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { useAuthStore } from '../src/stores/authStore';
import { useNotification } from '../src/components/InAppNotification';
import { useCustomAlert } from '../src/components/CustomAlert';

const { width: SW, height: SH } = Dimensions.get('window');
const MAX_DIM = Math.max(SW, SH) * 2.5;

// ============================================
// СПЛЭШ-ЭКРАН
// ============================================
function SplashScreen() {
  const bgScale = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const circle1Scale = useRef(new Animated.Value(0)).current;
  const circle2Scale = useRef(new Animated.Value(0)).current;
  const circle3Scale = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(bgScale, { toValue: 1.08, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bgScale, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    Animated.stagger(200, [
      Animated.spring(circle1Scale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.spring(circle2Scale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.spring(circle3Scale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(titleTranslateY, { toValue: 0, friction: 5, tension: 40, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.sequence([
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(subtitleTranslateY, { toValue: 0, friction: 5, tension: 40, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.timing(progressWidth, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();
  }, []);

  const progressWidthInterpolate = progressWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={splashStyles.container}>
      <Animated.View style={[splashStyles.bgGradient, { transform: [{ scale: bgScale }] }]}>
        <Animated.View style={[splashStyles.circle, splashStyles.circle1, { transform: [{ scale: circle1Scale }] }]} />
        <Animated.View style={[splashStyles.circle, splashStyles.circle2, { transform: [{ scale: circle2Scale }] }]} />
        <Animated.View style={[splashStyles.circle, splashStyles.circle3, { transform: [{ scale: circle3Scale }] }]} />
      </Animated.View>
      <View style={splashStyles.content}>
        <Animated.View style={[splashStyles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={splashStyles.logoInner}><Text style={splashStyles.logoEmoji}>🤝</Text></View>
          <PulsingRing />
        </Animated.View>
        <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }}>
          <Text style={splashStyles.title}>Волонтер Хаб</Text>
        </Animated.View>
        <Animated.View style={{ opacity: subtitleOpacity, transform: [{ translateY: subtitleTranslateY }] }}>
          <Text style={splashStyles.subtitle}>Меняем мир вместе</Text>
        </Animated.View>
        <View style={splashStyles.progressContainer}>
          <View style={splashStyles.progressTrack}>
            <Animated.View style={[splashStyles.progressFill, { width: progressWidthInterpolate }]} />
          </View>
        </View>
        <Text style={splashStyles.loadingText}>Загрузка...</Text>
      </View>
      <View style={splashStyles.bottomWave}><View style={splashStyles.waveShape} /></View>
    </View>
  );
}

function PulsingRing() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.4, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1500, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 1500, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]),
    ])).start();
  }, []);
  return <Animated.View style={[splashStyles.pulsingRing, { transform: [{ scale }], opacity }]} />;
}

// ============================================
// КНОПКА ТЕМЫ С ВОЛНОЙ НА ВЕСЬ ЭКРАН
// ============================================
function GlobalThemeButton({ colors, isDark, toggleTheme }) {
  const [animating, setAnimating] = useState(false);
  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);
  const waveScale = useRef(new Animated.Value(0)).current;

  const measureButton = useCallback(() => {
    if (buttonRef.current) {
      buttonRef.current.measureInWindow((x, y, w, h) => {
        setButtonPos({ x: x + w / 2, y: y + h / 2 });
      });
    }
  }, []);

  const handlePress = () => {
    if (animating) return;
    measureButton();
    setAnimating(true);
    waveScale.setValue(0);
    Animated.timing(waveScale, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      toggleTheme();
      setAnimating(false);
    });
  };

  return (
    <>
      {/* Волна на весь экран */}
      {animating && (
        <Animated.View
          pointerEvents="none"
          style={[
            toggleStyles.wave,
            {
              backgroundColor: isDark ? '#F8F9FA' : '#0F0F1A',
              left: buttonPos.x - MAX_DIM / 2,
              top: buttonPos.y - MAX_DIM / 2,
              width: MAX_DIM,
              height: MAX_DIM,
              borderRadius: MAX_DIM / 2,
              transform: [{ scale: waveScale }],
            },
          ]}
        />
      )}

      {/* Кнопка */}
      <TouchableOpacity
        ref={buttonRef}
        onPress={handlePress}
        onLayout={measureButton}
        style={[toggleStyles.button, { backgroundColor: colors.surface }]}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 20 }}>{isDark ? '🌙' : '☀️'}</Text>
      </TouchableOpacity>
    </>
  );
}

// ============================================
// КОРНЕВОЙ LAYOUT
// ============================================
function RootLayoutInner() {
  const { colors, isDark, toggleTheme } = useTheme();
  const initialize = useAuthStore((state) => state.initialize);
  const [showSplash, setShowSplash] = useState(true);
  const { showNotification, NotificationComponent } = useNotification();
  const { showAlert, AlertComponent } = useCustomAlert();

  useEffect(() => { initialize(); }, [initialize]);
  useEffect(() => {
    global.showNotification = showNotification;
    global.showAlert = showAlert;
  }, [showNotification, showAlert]);
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <><StatusBar style="light" /><SplashScreen /></>;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'none',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="event/[id]" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="auth/login" options={{ headerShown: true, headerTitle: 'Вход', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, presentation: 'modal' }} />
        <Stack.Screen name="auth/register" options={{ headerShown: true, headerTitle: 'Регистрация', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, presentation: 'modal' }} />
      </Stack>

      {/* Глобальная кнопка темы */}
      <GlobalThemeButton colors={colors} isDark={isDark} toggleTheme={toggleTheme} />

      {NotificationComponent}
      {AlertComponent}
    </>
  );
}

export default function RootLayout() {
  return <ThemeProvider><RootLayoutInner /></ThemeProvider>;
}

// ============================================
// СТИЛИ
// ============================================
const splashStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)' },
  circle1: { width: 300, height: 300, top: -60, right: -80 },
  circle2: { width: 200, height: 200, bottom: 120, left: -50 },
  circle3: { width: 150, height: 150, top: '40%', right: -30 },
  content: { alignItems: 'center', zIndex: 10, paddingHorizontal: 40 },
  logoContainer: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  logoInner: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', zIndex: 2 },
  logoEmoji: { fontSize: 44 },
  pulsingRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  title: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 17, color: 'rgba(255,255,255,0.8)', letterSpacing: 1, marginBottom: 50, textAlign: 'center' },
  progressContainer: { width: SW * 0.55, marginBottom: 16 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#FFFFFF' },
  loadingText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, fontWeight: '500' },
  bottomWave: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  waveShape: { position: 'absolute', bottom: -50, left: -50, right: -50, height: 120, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', transform: [{ scaleX: 1.5 }] },
});

const toggleStyles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  wave: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 10,
  },
});