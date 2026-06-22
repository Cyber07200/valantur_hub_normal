// app/auth/register.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Animated, Easing,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, AtSign, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/authStore';
import { checkNickname } from '../../src/services/supabase';
import { safeHaptic } from '../../src/utils/platform';
import { useTranslation } from '../../src/i18n/I18nContext';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 20;

export default function RegisterScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);
  const signIn = useAuthStore((state) => state.signIn);
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [nicknameStatus, setNicknameStatus] = useState(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const successOpacity = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(0)).current;

  // Единое анимированное значение прогресса (от 0 до 100)
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Частицы
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const checkNicknameTimer = useRef(null);

  const handleNicknameChange = (text) => {
    const cleaned = text.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    setNickname(cleaned);
    if (checkNicknameTimer.current) clearTimeout(checkNicknameTimer.current);
    if (cleaned.length >= 3) {
      setNicknameStatus('checking');
      checkNicknameTimer.current = setTimeout(async () => {
        const isAvailable = await checkNickname(cleaned);
        setNicknameStatus(isAvailable ? 'available' : 'taken');
      }, 500);
    } else {
      setNicknameStatus(null);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!fullName.trim() || fullName.trim().length < 2)
      newErrors.fullName = t.validation?.requiredName || 'Введите имя (минимум 2 символа)';
    if (!nickname || nickname.length < 3)
      newErrors.nickname = t.validation?.nicknameMinLength || 'Никнейм минимум 3 символа';
    if (nicknameStatus === 'taken')
      newErrors.nickname = t.validation?.nicknameTaken || 'Никнейм занят';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = t.validation?.invalidEmail || 'Некорректный email';
    if (!password || password.length < 6)
      newErrors.password = t.validation?.passwordMinLength || 'Пароль минимум 6 символов';
    if (password !== confirmPassword)
      newErrors.confirmPassword = t.validation?.passwordsMismatch || 'Пароли не совпадают';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const runSuccessAnimation = () => {
    // Сбрасываем значение прогресса
    progressAnim.setValue(0);

    // Плавное появление контейнера
    Animated.timing(successOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Анимация круга и заполнение прогресса
    Animated.sequence([
      Animated.spring(circleScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      // Заполнение от 0 до 100 за 3 секунды
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 3000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,   // обязательно false, т.к. используется в интерполяции текста
      }),
    ]).start();

    // Анимация частиц (разлёт и сбор)
    particles.forEach((p, i) => {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const radius = 120 + Math.random() * 40;

      Animated.loop(
        Animated.sequence([
          Animated.delay(Math.random() * 500),
          Animated.parallel([
            Animated.spring(p.x, {
              toValue: Math.cos(angle) * radius,
              friction: 6,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.spring(p.y, {
              toValue: Math.sin(angle) * radius,
              friction: 6,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.timing(p.scale, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(p.opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(p.x, { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.timing(p.y, { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.timing(p.scale, { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.timing(p.opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
          ]),
        ])
      ).start();
    });

    // Тактильная отдача каждые 500 мс
    let hapticInterval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 500);

    // Через 3 секунды – сильная отдача и переход
    setTimeout(() => {
      clearInterval(hapticInterval);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    }, 3000);
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    safeHaptic('medium');

    const result = await signUp(email.trim(), password, fullName.trim(), nickname.trim());

    if (result.success) {
      setShowSuccess(true);
      await signIn(email.trim(), password);
      runSuccessAnimation();
    } else {
      safeHaptic('medium');
      Alert.alert(t.registrationError || 'Ошибка регистрации', result.message);
    }

    setLoading(false);
  };

  // Экран успеха (полноэкранный)
  if (showSuccess) {
    // Вычисляем целое число процентов для отображения
    const percentText = progressAnim.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <View style={[successStyles.container, { backgroundColor: colors.primary }]}>
        {particles.map((p, i) => (
          <Animated.View
            key={i}
            style={[
              successStyles.particle,
              {
                width: 8 + Math.random() * 6,
                height: 8 + Math.random() * 6,
                borderRadius: 4,
                backgroundColor: '#FFFFFF',
                transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }],
                opacity: p.opacity,
              },
            ]}
          />
        ))}

        <Animated.View style={{ opacity: successOpacity, alignItems: 'center' }}>
          <View style={successStyles.circleContainer}>
            <Animated.View style={[successStyles.circle, { transform: [{ scale: circleScale }] }]}>
              <View style={successStyles.circleInner}>
                <Animated.View
                  style={[
                    successStyles.circleFill,
                    {
                      transform: [
                        {
                          rotate: progressAnim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={successStyles.circleHalf} />
                </Animated.View>
                <View style={successStyles.circleCenter}>
                  <Animated.Text style={successStyles.percentText}>
                    {percentText}
                  </Animated.Text>
                </View>
              </View>
            </Animated.View>
          </View>

          <Text style={successStyles.title}>
            {t.registrationSuccess || 'Регистрация успешна!'}
          </Text>
          <Text style={successStyles.subtitle}>
            {t.welcomeUser?.replace('{name}', fullName) || `Добро пожаловать, ${fullName}!`}
          </Text>
        </Animated.View>
      </View>
    );
  }

  // Основная форма регистрации (без изменений)
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <UserPlus size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t.joinUs || 'Присоединяйтесь!'}</Text>
        </View>

        <InputField icon={User} label={t.name || 'Имя'} value={fullName} onChangeText={setFullName} placeholder={t.namePlaceholder || 'Иван Петров'} error={errors.fullName} colors={colors} />

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>{t.nickname || 'Никнейм'} *</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: errors.nickname ? colors.error : nicknameStatus === 'available' ? colors.success : colors.border }]}>
            <AtSign size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={nickname}
              onChangeText={handleNicknameChange}
              placeholder={t.nicknamePlaceholder || 'volunteer_nick'}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {nicknameStatus === 'checking' && <ActivityIndicator size="small" color={colors.primary} />}
            {nicknameStatus === 'available' && <CheckCircle size={18} color={colors.success} />}
            {nicknameStatus === 'taken' && <Text style={{ color: colors.error, fontSize: 12 }}>{t.taken || 'Занят'}</Text>}
          </View>
          {errors.nickname && <Text style={[styles.errorText, { color: colors.error }]}>{errors.nickname}</Text>}
        </View>

        <InputField icon={Mail} label={t.email || 'Email'} value={email} onChangeText={setEmail} placeholder={t.emailPlaceholder || 'volunteer@email.ru'} keyboardType="email-address" error={errors.email} colors={colors} />

        <InputField icon={Lock} label={t.password || 'Пароль'} value={password} onChangeText={setPassword} placeholder={t.passwordMinPlaceholder || 'Минимум 6 символов'} secureTextEntry={!showPassword} error={errors.password} colors={colors} rightIcon={showPassword ? EyeOff : Eye} onRightIconPress={() => setShowPassword(!showPassword)} />

        <InputField icon={Lock} label={t.confirmPassword || 'Подтвердите пароль'} value={confirmPassword} onChangeText={setConfirmPassword} placeholder={t.confirmPasswordPlaceholder || 'Повторите пароль'} secureTextEntry={!showPassword} error={errors.confirmPassword} colors={colors} />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: loading ? colors.primary + '80' : colors.primary }]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>{t.registerButton || 'Зарегистрироваться'}</Text>}
        </TouchableOpacity>

        <View style={styles.loginLink}>
          <Text style={[styles.loginText, { color: colors.textSecondary }]}>
            {t.haveAccount || 'Уже есть аккаунт?'}{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/auth/login')}>
            <Text style={[styles.loginLinkText, { color: colors.primary }]}>{t.loginButton || 'Войти'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Компонент поля ввода (без изменений)
function InputField({ icon: Icon, label, value, onChangeText, placeholder, keyboardType, secureTextEntry, error, colors, rightIcon: RightIcon, onRightIconPress }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border }]}>
        <Icon size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {RightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={{ padding: 6 }}>
            <RightIcon size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  headerSection: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800' },
  inputGroup: { gap: 6, marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, height: '100%' },
  errorText: { fontSize: 12, marginLeft: 4, marginTop: 2 },
  submitButton: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  loginLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  loginText: { fontSize: 14 },
  loginLinkText: { fontSize: 14, fontWeight: '600' },
});

const successStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  particle: {
    position: 'absolute',
    top: height / 2 - 4,
    left: width / 2 - 4,
  },
  circleContainer: {
    marginBottom: 30,
  },
  circle: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  circleFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circleHalf: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 6,
    borderColor: '#FFFFFF',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  circleCenter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    textAlign: 'center',
  },
});