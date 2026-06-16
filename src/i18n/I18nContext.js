import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from './locales';

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('ru');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('appLanguage');
      if (saved && translations[saved]) setLang(saved);
    })();
  }, []);

  const changeLanguage = async (newLang) => {
    await AsyncStorage.setItem('appLanguage', newLang);
    setLang(newLang);
  };

  return (
    <I18nContext.Provider value={{ lang, t: translations[lang], changeLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}