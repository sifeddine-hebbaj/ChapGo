import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotification } from '@/context/NotificationContext';
import { colors, spacing, borderRadius, shadows, typography } from '@/styles/globalStyles';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const AUTO_HIDE_MS = 4000;

const InAppBanner: React.FC = () => {
  const { notification, hideNotification } = useNotification();
  const translateY = useRef(new Animated.Value(-100)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gradient = useMemo(() => [colors.primary, '#5b9dff'], []);
  const accent = 'rgba(255,255,255,0.85)';

  useEffect(() => {
    if (notification) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        hide();
      }, AUTO_HIDE_MS);

      // progress bar animation
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: AUTO_HIDE_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [notification]);

  const hide = () => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => hideNotification());
  };

  if (!notification) return null;

  const timeAgo = notification.timestamp 
    ? formatDistanceToNow(notification.timestamp, { 
        addSuffix: true, 
        locale: fr 
      })
    : 'à l\'instant';

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.gradientWrap, shadows.lg]}>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>

        <TouchableOpacity
          activeOpacity={0.92}
          style={styles.banner}
          onPress={() => {
            try {
              notification.onPress?.();
            } finally {
              hide();
            }
          }}
        >
          {/* Leading monogram avatar */}
          <View style={styles.monogramWrap}>
            <View style={styles.monogramCircle}>
              <Text style={styles.monogramText}>
                {(notification.senderName || notification.title || '?').trim().charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.texts}>
            <View style={styles.headerRow}>
              <Text numberOfLines={1} style={styles.title}>
                {notification.conversationName || notification.senderName || notification.title}
              </Text>
              <Text style={styles.time}>
                {timeAgo}
              </Text>
            </View>
            <Text numberOfLines={2} style={styles.body}>
              {notification.senderName && notification.senderName !== notification.title && (
                <Text style={{ fontWeight: 'bold' }}>{notification.senderName}: </Text>
              )}
              {notification.body}
            </Text>
          </View>

          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              hide();
            }} 
            style={styles.closeBtn}
          >
            <Text style={{ color: accent, fontSize: 18, lineHeight: 18 }}>×</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.select({ ios: 54, android: 24, default: 8 }),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
    pointerEvents: 'box-none',
  },
  gradientWrap: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    maxWidth: '95%',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
  },
  monogramWrap: {
    marginRight: spacing.md,
  },
  monogramCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monogramText: {
    ...typography.headline,
    color: 'white',
    fontSize: 20,
    lineHeight: 24,
  },
  texts: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    ...typography.subhead,
    color: 'white',
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  time: {
    ...typography.caption2,
    color: 'rgba(255,255,255,0.8)',
  },
  body: {
    ...typography.footnote,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  closeBtn: {
    padding: spacing.xs,
    marginLeft: 'auto',
    alignSelf: 'flex-start',
  },
  closeText: {
    color: 'white',
    fontSize: 18,
    lineHeight: 20,
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});

export default InAppBanner;
