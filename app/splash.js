// app/splash.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { colors } = { colors: { primary: '#4A90D9', background: '#FFFFFF', text: '#1A1A2E', textSecondary: '#6B7280' } };

  useEffect(() => {
    // Через 2 секунды переходим на главную
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: '#4A90D9' }]}>
      <View style={styles.iconContainer}>
        <Heart size={64} color="#FFFFFF" fill="#FFFFFF" />
      </View>
      
      <Text style={styles.title}>Волонтер Хаб</Text>
      <Text style={styles.subtitle}>Делай добро вместе с нами</Text>
      
      {/* Анимированные точки */}
      <View style={styles.dotsContainer}>
        <View style={[styles.dot, { opacity: 1 }]} />
        <View style={[styles.dot, { opacity: 0.6 }]} />
        <View style={[styles.dot, { opacity: 0.3 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});