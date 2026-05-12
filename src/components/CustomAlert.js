// src/components/CustomAlert.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal } from 'react-native';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function CustomAlert({ visible, type, title, message, confirmText, cancelText, onConfirm, onCancel, icon }) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.8);
      opacity.setValue(0);
    }
  }, [visible]);

  const getColors = () => {
    switch (type) {
      case 'success': return { bg: '#4CAF50', light: '#E8F5E9', text: '#2E7D32' };
      case 'error': return { bg: '#FF5252', light: '#FFEBEE', text: '#C62828' };
      case 'warning': return { bg: '#FF9800', light: '#FFF3E0', text: '#E65100' };
      default: return { bg: '#6366F1', light: '#EEF2FF', text: '#3730A3' };
    }
  };

  const colors = getColors();

  const getIcon = () => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return AlertTriangle;
      case 'warning': return AlertTriangle;
      default: return Info;
    }
  };

  const IconComponent = icon || getIcon();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { transform: [{ scale }], opacity }]}>
          {/* Иконка */}
          <View style={[styles.iconContainer, { backgroundColor: colors.light }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.bg }]}>
              <IconComponent size={28} color="#FFFFFF" />
            </View>
          </View>

          {/* Текст */}
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Кнопки */}
          <View style={styles.buttonsRow}>
            {cancelText && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            {confirmText && (
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, { backgroundColor: colors.bg }]}
                onPress={onConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmText}>{confirmText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ============================================
// ХУК ДЛЯ УПРАВЛЕНИЯ АЛЕРТОМ
// ============================================
export function useCustomAlert() {
  const [alertState, setAlertState] = React.useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: null,
    onConfirm: null,
    onCancel: null,
    icon: null,
  });

  const showAlert = (config) => {
    setAlertState({ visible: true, ...config });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  const AlertComponent = (
    <CustomAlert
      visible={alertState.visible}
      type={alertState.type}
      title={alertState.title}
      message={alertState.message}
      confirmText={alertState.confirmText}
      cancelText={alertState.cancelText}
      onConfirm={() => {
        if (alertState.onConfirm) alertState.onConfirm();
        hideAlert();
      }}
      onCancel={() => {
        if (alertState.onCancel) alertState.onCancel();
        hideAlert();
      }}
      icon={alertState.icon}
    />
  );

  return { showAlert, hideAlert, AlertComponent };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  container: {
    width: width - 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    position: 'absolute',
    top: -35,
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});