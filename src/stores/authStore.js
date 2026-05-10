// src/stores/authStore.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { log, logError, logStart, logEnd } from '../utils/logger';

const MODULE = 'AUTH_STORE';

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    logStart(MODULE, 'Инициализация сессии');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      log(MODULE, 'Сессия получена:', { hasSession: !!session });
      
      set({
        session,
        user: session?.user || null,
        loading: false,
      });

      // Подписка на изменения
      supabase.auth.onAuthStateChange((event, session) => {
        log(MODULE, `Событие авторизации: ${event}`, { hasSession: !!session });
        set({
          session,
          user: session?.user || null,
        });
      });
      
      logEnd(MODULE, 'Инициализация завершена');
    } catch (error) {
      logError(MODULE, 'Ошибка инициализации', error);
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    logStart(MODULE, `Вход: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      logError(MODULE, 'Ошибка входа', error);
      return { success: false, message: error.message };
    }
    
    logEnd(MODULE, 'Вход выполнен');
    set({ user: data.user, session: data.session });
    return { success: true };
  },

  signUp: async (email, password, fullName) => {
    logStart(MODULE, `Регистрация: ${email}`);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    
    if (error) {
      logError(MODULE, 'Ошибка регистрации', error);
      return { success: false, message: error.message };
    }
    
    logEnd(MODULE, 'Регистрация выполнена');
    return { success: true };
  },

  signOut: async () => {
    logStart(MODULE, 'Выход из аккаунта');
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logError(MODULE, 'Ошибка выхода', error);
      }
      
      // Принудительная очистка
      set({ user: null, session: null });
      await AsyncStorage.removeItem('supabase.auth.token');
      
      logEnd(MODULE, 'Выход выполнен');
    } catch (error) {
      logError(MODULE, 'Критическая ошибка выхода', error);
      set({ user: null, session: null });
    }
  },
}));