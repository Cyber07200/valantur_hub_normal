// app/auth/register.js
// Экран регистрации нового пользователя
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/authStore';
import { safeHaptic } from '../../src/utils/platform';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Валидация всех полей
  const validate = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Введите имя';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Имя слишком короткое';
    }

    if (!email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!password) {
      newErrors.password = 'Введите пароль';
    } else if (password.length < 6) {
      newErrors.password = 'Пароль минимум 6 символов';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Подтвердите пароль';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработка регистрации
  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    safeHaptic('medium');

    const result = await signUp(email.trim(), password, fullName.trim());

    if (result.success) {
      safeHaptic('success');
      Alert.alert(
        'Регистрация успешна!',
        'На вашу почту отправлено письмо для подтверждения. Проверьте папку "Входящие".',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      safeHaptic('medium');
      Alert.alert('Ошибка регистрации', result.message);
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Приветствие */}
        <View style={styles.headerSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <UserPlus size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Присоединяйтесь!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Создайте аккаунт и начните помогать
          </Text>
        </View>

        {/* Форма */}
        <View style={styles.formSection}>
          {/* Поле Имя */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Имя</Text>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.fullName ? colors.error : colors.border,
                },
              ]}
            >
              <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
                }}
                placeholder="Иван Петров"
                placeholderTextColor={colors.textSecondary}
                textContentType="name"
                autoCapitalize="words"
              />
            </View>
            {errors.fullName && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.fullName}</Text>
            )}
          </View>

          {/* Поле Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.email ? colors.error : colors.border,
                },
              ]}
            >
              <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
                placeholder="volunteer@email.ru"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />
            </View>
            {errors.email && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text>
            )}
          </View>

          {/* Поле Пароль */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Пароль</Text>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.password ? colors.error : colors.border,
                },
              ]}
            >
              <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                }}
                placeholder="Минимум 6 символов"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text>
            )}
          </View>

          {/* Поле Подтверждение пароля */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Подтвердите пароль</Text>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.confirmPassword ? colors.error : colors.border,
                },
              ]}
            >
              <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword)
                    setErrors((prev) => ({ ...prev, confirmPassword: null }));
                }}
                placeholder="Повторите пароль"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
              />
            </View>
            {errors.confirmPassword && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.confirmPassword}
              </Text>
            )}
          </View>

          {/* Кнопка регистрации */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: loading ? colors.primary + '80' : colors.primary },
            ]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Зарегистрироваться</Text>
            )}
          </TouchableOpacity>

          {/* Ссылка на вход */}
          <View style={styles.loginLink}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              Уже есть аккаунт?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => {
                safeHaptic('light');
                router.replace('/auth/login');
              }}
            >
              <Text style={[styles.loginLinkText, { color: colors.primary }]}>Войти</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 35,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
  },
  errorText: {
    fontSize: 12,
    marginLeft: 4,
    marginTop: 2,
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    fontSize: 14,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});