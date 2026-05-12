// app/(tabs)/_layout.js
import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Dimensions } from 'react-native';
import { Search, Calendar, User } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { safeHaptic } from '../../src/utils/platform';

const { width } = Dimensions.get('window');
const TAB_WIDTH = (width - 40) / 3;

// ============================================
// ЖЕЛЕЙНЫЙ ИНДИКАТОР АКТИВНОГО ТАБА
// ============================================
function JellyTabIndicator({ activeIndex }) {
  const translateX = useRef(new Animated.Value(activeIndex * TAB_WIDTH)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const prevIndex = useRef(activeIndex);

  useEffect(() => {
    prevIndex.current = activeIndex;

    Animated.sequence([
      Animated.timing(scaleX, {
        toValue: 0.85,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: activeIndex * TAB_WIDTH,
          duration: 250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleX, {
            toValue: 1.1,
            duration: 150,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.spring(scaleX, {
            toValue: 1,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [activeIndex]);

  return (
    <Animated.View
      style={[
        styles.jellyIndicator,
        { transform: [{ translateX }, { scaleX }] },
      ]}
    />
  );
}

// ============================================
// КАСТОМНАЯ ТАБ-БАР
// ============================================
function CustomTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();

  const getIcon = (routeName, color, size) => {
    switch (routeName) {
      case 'index': return <Search size={size} color={color} />;
      case 'bookings': return <Calendar size={size} color={color} />;
      case 'profile': return <User size={size} color={color} />;
      default: return <Search size={size} color={color} />;
    }
  };

  const getLabel = (routeName) => {
    switch (routeName) {
      case 'index': return 'Поиск';
      case 'bookings': return 'Мои записи';
      case 'profile': return 'Профиль';
      default: return '';
    }
  };

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.topLine}>
        <View style={[styles.topLineInner, { backgroundColor: colors.primary }]} />
      </View>

      <View style={styles.tabsRow}>
        <View style={styles.indicatorContainer}>
          <JellyTabIndicator activeIndex={state.index} />
        </View>

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            safeHaptic('light');
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <JellyIcon isActive={isFocused}>
                {getIcon(route.name, isFocused ? colors.primary : colors.textSecondary, 22)}
              </JellyIcon>
              <Animated.Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? colors.primary : colors.textSecondary,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
              >
                {getLabel(route.name)}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ============================================
// ЖЕЛЕЙНАЯ ИКОНКА
// ============================================
function JellyIcon({ isActive, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const wasActive = useRef(isActive);

  useEffect(() => {
    if (isActive !== wasActive.current && isActive) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.3, duration: 150, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1, duration: 100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 0, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
      ]).start();
    }
    wasActive.current = isActive;
  }, [isActive]);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  return (
    <Animated.View style={{ transform: [{ scale }, { rotate: rotateInterpolate }] }}>
      {children}
    </Animated.View>
  );
}

// ============================================
// ГЛАВНЫЙ LAYOUT
// ============================================
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    paddingTop: 8, paddingBottom: 30, paddingHorizontal: 10,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
  },
  topLine: { alignItems: 'center', marginBottom: 10 },
  topLineInner: { width: 36, height: 4, borderRadius: 2, opacity: 0.3 },
  tabsRow: { flexDirection: 'row', position: 'relative', paddingHorizontal: 10 },
  indicatorContainer: { position: 'absolute', top: -8, left: 10, right: 10, bottom: 0 },
  jellyIndicator: {
    position: 'absolute', top: 0, left: 0,
    width: TAB_WIDTH, height: '100%',
    backgroundColor: 'rgba(100, 102, 241, 0.1)',
    borderRadius: 16, borderWidth: 2,
    borderColor: 'rgba(100, 102, 241, 0.3)',
  },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, zIndex: 10 },
  tabLabel: { fontSize: 11, marginTop: 6, letterSpacing: 0.3 },
});