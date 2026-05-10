// app/(tabs)/profile.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, LogOut, Moon, Award, Clock } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/authStore';
import { useBookings } from '../../src/hooks/useBookings';
import { fetchProfile } from '../../src/services/supabase';
import { safeHaptic } from '../../src/utils/platform';

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { bookings } = useBookings();

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const data = await fetchProfile(user.id);
    if (data) setProfile(data);
  };

  const handleLogout = () => {
    safeHaptic('medium');
    signOut();
  };

  // Если не авторизован
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Профиль</Text>
        </View>
        <View style={styles.notAuthContainer}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
            <User size={48} color={colors.primary} />
          </View>
          <Text style={[styles.notAuthTitle, { color: colors.text }]}>Вы не вошли</Text>
          <Text style={[styles.notAuthText, { color: colors.textSecondary }]}>
            Авторизуйтесь, чтобы записываться на мероприятия и отслеживать свои часы
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              safeHaptic('medium');
              router.push('/auth/login');
            }}
          >
            <Text style={styles.loginButtonText}>Войти</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Профиль</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Карточка пользователя */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <User size={36} color={colors.primary} />
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user.user_metadata?.full_name || 'Волонтер'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>

          {/* Статистика */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Award size={20} color={colors.primary} />
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {profile?.total_hours || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>часов</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Clock size={20} color={colors.success} />
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {bookings?.length || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>мероприятий</Text>
            </View>
          </View>
        </View>

        {/* Настройки */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Moon size={20} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Тёмная тема</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={() => {
                safeHaptic('light');
                toggleTheme();
              }}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isDark ? colors.primary : '#F4F4F4'}
            />
          </View>
        </View>

        {/* Кнопка выхода */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <LogOut size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Выйти</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  // Неавторизованный пользователь
  notAuthContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  notAuthTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  notAuthText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Авторизованный пользователь
  profileCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});