// src/theme/ThemeProvider.js
// Провайдер тем с переключением светлая/тёмная
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from './colors';

const ThemeContext = createContext({
  colors: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  // Подстраиваемся под системную тему при запуске
  useEffect(() => {
    setIsDark(systemScheme === 'dark');
  }, [systemScheme]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Хук для использования темы в любом компоненте
export function useTheme() {
  return useContext(ThemeContext);
}