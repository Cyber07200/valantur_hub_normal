// src/components/InAppNotification.js
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { X, CheckCircle, XCircle, Bell, MapPin, Clock } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';

const { width } = Dimensions.get('window');

export default function InAppNotification({ visible, type, title, message, details, onClose, duration = 4000 }) {
  const { colors } = useTheme();   // ← теперь используем тему
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => hideNotification(), duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.8, duration: 300, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  if (!visible) return null;

  const getStyle = () => {
    switch (type) {
      case 'success': return { bg: '#4CAF50', icon: CheckCircle, iconColor: '#FFFFFF', accentBg: 'rgba(255,255,255,0.15)' };
      case 'error': return { bg: '#FF5252', icon: XCircle, iconColor: '#FFFFFF', accentBg: 'rgba(255,255,255,0.15)' };
      case 'info': return { bg: colors.primary, icon: Bell, iconColor: '#FFFFFF', accentBg: 'rgba(255,255,255,0.15)' };
      default: return { bg: colors.primary, icon: Bell, iconColor: '#FFFFFF', accentBg: 'rgba(255,255,255,0.15)' };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  return (
    <Animated.View style={[styles.container, {
      backgroundColor: style.bg,
      transform: [{ translateY }, { scale }],
      opacity,
    }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: style.accentBg }]}>
          <Icon size={24} color={style.iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
          {details && (
            <View style={styles.detailsRow}>
              {details.date && (
                <View style={styles.detailItem}>
                  <Clock size={12} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.detailText}>{details.date}</Text>
                </View>
              )}
              {details.city && (
                <View style={styles.detailItem}>
                  <MapPin size={12} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.detailText}>{details.city}</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <TouchableOpacity onPress={hideNotification} style={styles.closeButton}>
          <X size={18} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>
      <View style={styles.progressContainer}>
        <NotificationProgressBar duration={duration} />
      </View>
    </Animated.View>
  );
}

function NotificationProgressBar({ duration }) {
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(progress, { toValue: 0, duration: duration, useNativeDriver: false }).start();
  }, []);
  return (
    <View style={progressStyles.track}>
      <Animated.View style={[progressStyles.fill, { width: progress.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }) }]} />
    </View>
  );
}

export function useNotification() {
  const [notification, setNotification] = React.useState({
    visible: false,
    type: 'success',
    title: '',
    message: '',
    details: null,
  });

  const showNotification = (type, title, message, details = null) => {
    setNotification({ visible: true, type, title, message, details });
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, visible: false }));
  };

  return {
    notification,
    showNotification,
    hideNotification,
    NotificationComponent: (
      <InAppNotification
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        details={notification.details}
        onClose={hideNotification}
      />
    ),
  };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  closeButton: {
    padding: 6,
    marginLeft: 8,
  },
  progressContainer: {
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
});

const progressStyles = StyleSheet.create({
  track: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});