// src/utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { log } from './logger';

// ============================================
// НАСТРОЙКА УВЕДОМЛЕНИЙ
// ============================================
export async function setupNotifications() {
  // ✅ В Expo Go push-уведомления не работают, просто выходим
  if (!Device.isDevice) {
    log('NOTIFICATIONS', 'Эмулятор или Expo Go — push-уведомления отключены');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      log('NOTIFICATIONS', 'Разрешение не получено');
      return null;
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('volunteer-events', {
        name: 'Волонтер Хаб',
        description: 'Уведомления о мероприятиях',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
        sound: 'default',
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    log('NOTIFICATIONS', 'Push token получен');
    return token;
  } catch (error) {
    log('NOTIFICATIONS', 'Ошибка настройки:', error.message);
    return null;
  }
}

// ============================================
// УВЕДОМЛЕНИЕ О ЗАПИСИ
// ============================================
export async function showBookingNotification(eventTitle, eventDate, city) {
  try {
    const formattedDate = new Date(eventDate).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Вы записаны!',
        subtitle: 'Запись на мероприятие подтверждена',
        body: `${eventTitle}\n📍 ${city}\n📅 ${formattedDate}`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: '#4CAF50',
        badge: 1,
        data: { type: 'booking', screen: 'bookings' },
      },
      trigger: null,
    });
  } catch (error) {
    // Игнорируем ошибки уведомлений
  }
}

// ============================================
// УВЕДОМЛЕНИЕ ОБ ОТМЕНЕ
// ============================================
export async function showCancelNotification(eventTitle) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '❌ Запись отменена',
        subtitle: 'Вы отказались от участия',
        body: `Мероприятие "${eventTitle}"\nВы можете записаться снова`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        color: '#FF5252',
        badge: 0,
        data: { type: 'cancel' },
      },
      trigger: null,
    });
  } catch (error) {
    // Игнорируем ошибки уведомлений
  }
}

// ============================================
// НАПОМИНАНИЕ ЗА 1 ДЕНЬ
// ============================================
export async function scheduleReminder(eventTitle, eventDate, eventId) {
  try {
    const eventTime = new Date(eventDate).getTime();
    const reminderTime = eventTime - 24 * 60 * 60 * 1000;
    if (reminderTime <= Date.now()) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Напоминание',
        subtitle: 'Мероприятие уже завтра!',
        body: `${eventTitle}\nНе забудьте прийти вовремя! 🤝`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: '#6366F1',
        data: { type: 'reminder', eventId },
      },
      trigger: { date: new Date(reminderTime) },
    });
  } catch (error) {
    // Игнорируем ошибки
  }
}

// ============================================
// НАПОМИНАНИЕ ЗА 1 ЧАС
// ============================================
export async function scheduleHourReminder(eventTitle, eventDate, eventId) {
  try {
    const eventTime = new Date(eventDate).getTime();
    const reminderTime = eventTime - 60 * 60 * 1000;
    if (reminderTime <= Date.now()) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚀 Скоро начало!',
        subtitle: 'Мероприятие начнётся через час',
        body: `${eventTitle}\nПора выходить! 🏃`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#FF9800',
        data: { type: 'reminder_hour', eventId },
      },
      trigger: { date: new Date(reminderTime) },
    });
  } catch (error) {
    // Игнорируем ошибки
  }
}