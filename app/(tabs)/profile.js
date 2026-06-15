// app/(tabs)/profile.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Image, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { User, LogOut, Moon, Award, Clock, Camera, Edit3, Phone, BookOpen, AtSign, Trophy, Crown, Medal, Star, X } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/authStore';
import { useBookings } from '../../src/hooks/useBookings';
import { fetchProfile, updateProfile, uploadAvatar, checkNickname, fetchLeaderboard } from '../../src/services/supabase';
import { safeHaptic } from '../../src/utils/platform';

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { bookings } = useBookings();

  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);

  // Лидерборд
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [leaders, setLeaders] = useState([]);
  const [leadersLoading, setLeadersLoading] = useState(false);
  const [userRank, setUserRank] = useState(null);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    const data = await fetchProfile(user.id);
    if (data) {
      setProfile(data);
      setEditFullName(data.full_name || '');
      setEditNickname(data.nickname || '');
      setEditPhone(data.phone || '');
      setEditBio(data.bio || '');
    }
  }, [user?.id]);

  // Загружаем профиль при каждом появлении экрана
  useFocusEffect(
    useCallback(() => {
      if (user) loadProfile();
    }, [user, loadProfile])
  );

  useEffect(() => {
    if (user) {
      global.refreshProfile = loadProfile;
    }
    return () => { global.refreshProfile = null; };
  }, [user, loadProfile]);

  useEffect(() => {
    const checkFirstTime = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const seen = await AsyncStorage.getItem('leaderboard_seen');
        if (seen === 'true') setShowIntro(false);
      } catch (e) {}
    };
    checkFirstTime();
  }, []);

  const loadLeaders = async () => {
    setLeadersLoading(true);
    const data = await fetchLeaderboard();
    setLeaders(data || []);
    if (user?.id && data) {
      const rank = data.findIndex((l) => l.id === user.id);
      setUserRank(rank >= 0 ? rank + 1 : null);
    }
    setLeadersLoading(false);
  };

  const handleOpenLeaderboard = () => {
    safeHaptic('light');
    loadLeaders();
    setShowLeaderboard(true);
  };

  const handleGotIt = async () => {
    safeHaptic('light');
    setShowIntro(false);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('leaderboard_seen', 'true');
    } catch (e) {}
    loadLeaders();
  };

  const formatPhone = (text) => {
    let cleaned = text.replace(/[^\d]/g, '');
    if (cleaned.startsWith('7') || cleaned.startsWith('8')) cleaned = cleaned.substring(1);
    cleaned = cleaned.substring(0, 10);
    let formatted = '+7';
    if (cleaned.length > 0) formatted += ' (' + cleaned.substring(0, 3);
    if (cleaned.length > 3) formatted += ') ' + cleaned.substring(3, 6);
    if (cleaned.length > 6) formatted += '-' + cleaned.substring(6, 8);
    if (cleaned.length > 8) formatted += '-' + cleaned.substring(8, 10);
    return formatted;
  };

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        global.showAlert?.({ type: 'error', title: 'Нет доступа', message: 'Разрешите доступ к галерее', confirmText: 'OK' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        const url = await uploadAvatar(user.id, result.assets[0].uri);
        await updateProfile(user.id, { avatar_url: url });
        await loadProfile();
      }
    } catch (error) {
      global.showAlert?.({ type: 'error', title: 'Ошибка', message: 'Не удалось открыть галерею', confirmText: 'OK' });
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    if (editNickname !== profile.nickname) {
      const available = await checkNickname(editNickname, user.id);
      if (!available) {
        global.showAlert?.({ type: 'error', title: 'Ошибка', message: 'Никнейм занят', confirmText: 'OK' });
        return;
      }
    }
    setSaving(true);
    const result = await updateProfile(user.id, {
      full_name: editFullName, nickname: editNickname, phone: editPhone, bio: editBio,
    });
    if (result.success) {
      safeHaptic('success');
      setEditMode(false);
      await loadProfile();
    } else {
      global.showAlert?.({ type: 'error', title: 'Ошибка', message: result.message, confirmText: 'OK' });
    }
    setSaving(false);
  };

  const handleLogout = () => {
    global.showAlert?.({
      type: 'warning', title: 'Выйти?', message: 'Вы уверены?',
      confirmText: 'Выйти', cancelText: 'Отмена',
      onConfirm: () => { safeHaptic('medium'); signOut(); },
    });
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Crown size={22} color="#FFD700" />;
      case 1: return <Medal size={20} color="#C0C0C0" />;
      case 2: return <Medal size={20} color="#CD7F32" />;
      default: return <Text style={[lbStyles.rankNum, { color: colors.textSecondary }]}>{index + 1}</Text>;
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}><Text style={[styles.headerTitle, { color: colors.text }]}>Профиль</Text></View>
        <View style={styles.notAuth}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryLight }]}><User size={48} color={colors.primary} /></View>
          <Text style={[styles.notAuthTitle, { color: colors.text }]}>Вы не вошли</Text>
          <TouchableOpacity style={[styles.loginBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginBtnText}>Войти</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}><Text style={[styles.headerTitle, { color: colors.text }]}>Профиль</Text></View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Профиль</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrap}>
          {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} /> :
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}><User size={36} color={colors.primary} /></View>}
          <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}><Camera size={14} color="#FFF" /></View>
        </TouchableOpacity>

        {editMode ? (
          <View style={styles.form}>
            <EditField icon={User} label="Имя" value={editFullName} onChangeText={setEditFullName} colors={colors} />
            <EditField icon={AtSign} label="Никнейм" value={editNickname} onChangeText={setEditNickname} colors={colors} autoCapitalize="none" />
            <EditField icon={Phone} label="Телефон" value={editPhone} onChangeText={(t) => setEditPhone(formatPhone(t))} colors={colors} keyboardType="phone-pad" maxLength={18} />
            <EditField icon={BookOpen} label="Биография" value={editBio} onChangeText={setEditBio} colors={colors} multiline numberOfLines={4} />
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Сохранить</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.name, { color: colors.text }]}>{profile.full_name || 'Волонтер'}</Text>
            <Text style={[styles.nickname, { color: colors.primary }]}>@{profile.nickname || ''}</Text>
            {profile.bio ? <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text> : null}
            {profile.phone ? <View style={styles.infoRow}><Phone size={14} color={colors.textSecondary} /><Text style={[styles.infoText, { color: colors.textSecondary }]}>{profile.phone}</Text></View> : null}
            
            <View style={styles.stats}>
              <View style={styles.stat}><Award size={20} color={colors.primary} /><Text style={[styles.statNum, { color: colors.text }]}>{profile.total_hours || 0}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>часов</Text></View>
              <View style={styles.stat}><Clock size={20} color={colors.success} /><Text style={[styles.statNum, { color: colors.text }]}>{bookings?.length || 0}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>записей</Text></View>
            </View>

            {/* Кнопка редактирования – теперь растянута на всю ширину */}
            <TouchableOpacity
              style={[styles.editProfileBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setEditMode(true)}
              activeOpacity={0.7}
            >
              <Edit3 size={20} color={colors.primary} />
              <Text style={[styles.editProfileBtnText, { color: colors.primary }]}>Редактировать профиль</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.leaderboardBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleOpenLeaderboard}
              activeOpacity={0.7}
            >
              <Trophy size={22} color="#FFD700" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.leaderboardBtnTitle, { color: colors.text }]}>Таблица лидеров</Text>
                <Text style={[styles.leaderboardBtnSub, { color: colors.textSecondary }]}>Соревнуйся с другими волонтёрами</Text>
              </View>
              {userRank && (
                <View style={[styles.rankBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.rankBadgeText, { color: colors.primary }]}>#{userRank}</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <Moon size={20} color={colors.text} /><Text style={[styles.settingText, { color: colors.text }]}>Тёмная тема</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{isDark ? '🌙 Включена' : '☀️ Выключена'}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleLogout}>
          <LogOut size={20} color={colors.error} /><Text style={[styles.logoutText, { color: colors.error }]}>Выйти</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Модальное окно лидерборда */}
      <Modal visible={showLeaderboard} animationType="slide" onRequestClose={() => setShowLeaderboard(false)}>
        <View style={[lbStyles.container, { backgroundColor: colors.background }]}>
          <View style={lbStyles.lbHeader}>
            <Text style={[lbStyles.lbTitle, { color: colors.text }]}>🏆 Таблица лидеров</Text>
            <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {showIntro ? (
            <View style={lbStyles.introContent}>
              <View style={[lbStyles.introIcon, { backgroundColor: colors.primaryLight }]}>
                <Trophy size={48} color={colors.primary} />
              </View>
              <Text style={[lbStyles.introTitle, { color: colors.text }]}>Как это работает?</Text>
              <Text style={[lbStyles.introText, { color: colors.textSecondary }]}>
                Чем больше часов волонтёрской работы — тем выше место в рейтинге!{'\n\n'}
                🥇 1 место — золото{'\n'}
                🥈 2 место — серебро{'\n'}
                🥉 3 место — бронза{'\n\n'}
                Записывайтесь на мероприятия и поднимайтесь вверх!
              </Text>
              <TouchableOpacity style={[lbStyles.introBtn, { backgroundColor: colors.primary }]} onPress={handleGotIt}>
                <Text style={lbStyles.introBtnText}>Понятно!</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {userRank && (
                <View style={[lbStyles.myCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                  <Text style={[lbStyles.myLabel, { color: colors.primary }]}>Ваше место</Text>
                  <Text style={[lbStyles.myRank, { color: colors.primary }]}>#{userRank}</Text>
                  <Text style={[lbStyles.myHours, { color: colors.text }]}>{profile.total_hours || 0} ч</Text>
                </View>
              )}

              {leadersLoading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
              ) : (
                <FlatList
                  data={leaders}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={lbStyles.listContent}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item, index }) => {
                    const isCurrentUser = user?.id === item.id;
                    const isTop3 = index < 3;
                    const bgColor = isTop3
                      ? (index === 0 ? '#FFF9E6' : index === 1 ? '#F5F5F5' : '#FFF5EE')
                      : colors.surface;
                    const borderColor = isTop3
                      ? (index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32')
                      : colors.border;
                    const nameColor = isTop3 ? '#1F2937' : colors.text;
                    const nickColor = isTop3 ? '#4B5563' : colors.textSecondary;

                    return (
                      <View style={[lbStyles.leaderCard, {
                        backgroundColor: bgColor,
                        borderColor: isCurrentUser ? colors.primary : borderColor,
                      }, isCurrentUser && lbStyles.currentCard]}>
                        <View style={lbStyles.rankIcon}>{getRankIcon(index)}</View>
                        <View style={[lbStyles.avatar, { backgroundColor: colors.primaryLight }]}>
                          {item.avatar_url ? <Image source={{ uri: item.avatar_url }} style={lbStyles.avatarImg} /> : <User size={22} color={colors.primary} />}
                        </View>
                        <View style={lbStyles.infoBlock}>
                          <View style={lbStyles.nameRow}>
                            <Text style={[lbStyles.name, { color: nameColor }]} numberOfLines={1}>{item.full_name || 'Волонтер'}</Text>
                            {isCurrentUser && <View style={[lbStyles.youBadge, { backgroundColor: colors.primary }]}><Text style={lbStyles.youText}>Вы</Text></View>}
                          </View>
                          <Text style={[lbStyles.nick, { color: nickColor }]}>@{item.nickname || '---'}</Text>
                        </View>
                        <View style={lbStyles.hoursBlock}>
                          <Star size={14} color={isTop3 ? (index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32') : colors.primary} />
                          <Text style={[lbStyles.hours, { color: isTop3 ? '#1F2937' : colors.text }]}>{item.total_hours || 0} ч</Text>
                        </View>
                      </View>
                    );
                  }}
                />
              )}
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

function EditField({ icon: Icon, label, value, onChangeText, colors, ...props }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[efs.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[efs.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Icon size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput style={[efs.input, { color: colors.text }]} value={value} onChangeText={onChangeText} placeholderTextColor={colors.textSecondary} {...props} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  scroll: { paddingHorizontal: 20, paddingBottom: 100, alignItems: 'center' },
  avatarWrap: { marginBottom: 16 },
  avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  name: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  nickname: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  bio: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 12, paddingHorizontal: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { fontSize: 14 },
  stats: { flexDirection: 'row', marginTop: 16, marginBottom: 20, gap: 40 },
  stat: { alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  editProfileBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    width: '100%',   // ← теперь на всю ширину, как leaderboardBtn
    paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16,
  },
  editProfileBtnText: { fontSize: 16, fontWeight: '600' },
  leaderboardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    width: '100%', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16,
  },
  leaderboardBtnTitle: { fontSize: 16, fontWeight: '700' },
  leaderboardBtnSub: { fontSize: 12, marginTop: 2 },
  rankBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  rankBadgeText: { fontSize: 14, fontWeight: '800' },
  form: { width: '100%', marginBottom: 16 },
  saveBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  section: { width: '100%', borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  settingText: { fontSize: 16, flex: 1 },
  logoutBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  logoutText: { fontSize: 16, fontWeight: '600' },
  notAuth: { alignItems: 'center', paddingTop: 60 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  notAuthTitle: { fontSize: 20, fontWeight: '700', marginBottom: 24 },
  loginBtn: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

const lbStyles = StyleSheet.create({
  container: { flex: 1 },
  lbHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  lbTitle: { fontSize: 22, fontWeight: '800' },
  myCard: { marginHorizontal: 20, padding: 16, borderRadius: 16, borderWidth: 2, alignItems: 'center', marginBottom: 16, flexDirection: 'row', justifyContent: 'space-around' },
  myLabel: { fontSize: 13, fontWeight: '600' },
  myRank: { fontSize: 28, fontWeight: '800' },
  myHours: { fontSize: 16, fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  leaderCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1.5, marginBottom: 8 },
  currentCard: { borderWidth: 2.5, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  rankIcon: { width: 32, alignItems: 'center', marginRight: 8 },
  rankNum: { fontSize: 15, fontWeight: '700' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  infoBlock: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14, fontWeight: '600' },
  youBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  youText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  nick: { fontSize: 11, marginTop: 1 },
  hoursBlock: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.03)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  hours: { fontSize: 15, fontWeight: '700' },
  introContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, paddingBottom: 80 },
  introIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  introTitle: { fontSize: 22, fontWeight: '800', marginBottom: 14 },
  introText: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  introBtn: { width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  introBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});

const efs = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', marginBottom: 4, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 44 },
  input: { flex: 1, fontSize: 15, height: '100%' },
});