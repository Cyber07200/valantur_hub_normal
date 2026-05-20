import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user || null, loading: false });
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user || null });
      });
    } catch (e) {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login')) {
        return { success: false, message: 'Неверный email или пароль' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { success: false, message: 'Email не подтверждён. Проверьте почту или отключите подтверждение в Supabase.' };
      }
      return { success: false, message: error.message };
    }
    set({ user: data.user, session: data.session });
    return { success: true };
  },

  signUp: async (email, password, fullName, nickname) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, nickname: nickname } }
    });
    if (error) {
      if (error.message.includes('already registered')) {
        return { success: false, message: 'Пользователь с таким email уже существует' };
      }
      return { success: false, message: error.message };
    }
    // Если подтверждение email отключено, пользователь сразу активен
    if (data.user?.identities?.length === 0) {
      return { success: false, message: 'Регистрация не удалась' };
    }
    return { success: true, message: 'Регистрация успешна! Теперь войдите.' };
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, session: null });
      await AsyncStorage.removeItem('supabase.auth.token');
    } catch (e) {}
  },
}));