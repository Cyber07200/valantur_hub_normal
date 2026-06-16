// app/auth/login.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/authStore';
import { safeHaptic } from '../../src/utils/platform';
import { useTranslation } from '../../src/i18n/I18nContext';

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = t.validation?.requiredEmail || 'Введите email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t.validation?.invalidEmail || 'Некорректный email';
    }
    if (!password) {
      newErrors.password = t.validation?.requiredPassword || 'Введите пароль';
    } else if (password.length < 6) {
      newErrors.password = t.validation?.passwordMinLength || 'Пароль минимум 6 символов';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    safeHaptic('medium');

    const result = await signIn(email.trim(), password);

    if (result.success) {
      safeHaptic('success');
      router.back();
    } else {
      safeHaptic('medium');
      Alert.alert(t.loginError || 'Ошибка входа', result.message);
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
        <View style={styles.headerSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <LogIn size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t.welcomeBack || 'С возвращением!'}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t.loginSubtitle || 'Войдите, чтобы записываться на мероприятия'}
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t.email || 'Email'}</Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.surface, borderColor: errors.email ? colors.error : colors.border },
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
                placeholder={t.emailPlaceholder || 'volunteer@email.ru'}
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

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t.password || 'Пароль'}</Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.surface, borderColor: errors.password ? colors.error : colors.border },
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
                placeholder={t.passwordPlaceholder || 'Ваш пароль'}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                textContentType="password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
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

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: loading ? colors.primary + '80' : colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>{t.loginButton || 'Войти'}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerLink}>
            <Text style={[styles.registerText, { color: colors.textSecondary }]}>
              {t.noAccount || 'Нет аккаунта?'}{' '}
            </Text>
            <TouchableOpacity
              onPress={() => {
                safeHaptic('light');
                router.replace('/auth/register');
              }}
            >
              <Text style={[styles.registerLinkText, { color: colors.primary }]}>
                {t.registerButton || 'Зарегистрироваться'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  headerSection: { alignItems: 'center', marginTop: 30, marginBottom: 40 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  formSection: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, height: '100%' },
  eyeButton: { padding: 6 },
  errorText: { fontSize: 12, marginLeft: 4, marginTop: 2 },
  submitButton: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  registerLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  registerText: { fontSize: 14 },
  registerLinkText: { fontSize: 14, fontWeight: '600' },
});