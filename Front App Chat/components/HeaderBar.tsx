import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ArrowLeft, Search, Phone, Video, LogOut } from 'lucide-react-native';
import Avatar from './Avatar';
import { colors, typography, spacing, shadows } from '@/styles/globalStyles';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  avatar?: string;
  showBackButton?: boolean;
  showSearchButton?: boolean;
  showCallButtons?: boolean;
  showLogoutButton?: boolean;
  callMode?: 'audio' | 'video';
  onBackPress?: () => void;
  onSearchPress?: () => void;
  onCallPress?: () => void;
  onVideoPress?: () => void;
  onAvatarPress?: () => void;
  onLogoutPress?: () => void;
}

export default function HeaderBar({
  title,
  subtitle,
  avatar,
  showBackButton = false,
  showSearchButton = false,
  showCallButtons = false,
  showLogoutButton = false,
  callMode,
  onBackPress,
  onSearchPress,
  onCallPress,
  onVideoPress,
  onAvatarPress,
  onLogoutPress,
}: HeaderBarProps) {
  return (
    <View style={[styles.container, shadows.sm]}>
      <View style={styles.content}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={onBackPress}
          >
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          {avatar && (
            <Avatar 
              uri={avatar} 
              size={35} 
              onPress={onAvatarPress}
              showOnlineIndicator={true}
              isOnline={true}
            />
          )}
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          {showCallButtons && (
            <>
              {(!callMode || callMode === 'audio') && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={onCallPress}
                >
                  <Phone size={22} color={colors.primary} />
                </TouchableOpacity>
              )}
              {(!callMode || callMode === 'video') && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={onVideoPress}
                >
                  <Video size={22} color={colors.primary} />
                </TouchableOpacity>
              )}
            </>
          )}
          {showSearchButton && (
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={onSearchPress}
            >
              <Search size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
          {showLogoutButton && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onLogoutPress}
            >
              <LogOut size={22} color={colors.error}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 60,
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    marginHorizontal: spacing.xs,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  title: {
    ...typography.headline,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption1,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});