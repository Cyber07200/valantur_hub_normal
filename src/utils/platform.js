// src/utils/platform.js
// Хелперы для платформозависимого кода
import { Platform } from 'react-native';

// Проверка: мобильное устройство (iOS или Android)
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

// Проверка: веб-платформа
export const isWeb = Platform.OS === 'web';

// Безопасный вызов haptics (только на мобилках)
export async function safeHaptic(type = 'light') {
  if (isMobile) {
    try {
      const Haptics = require('expo-haptics');
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      // На вебе haptics нет — просто игнорируем
    }
  }
}