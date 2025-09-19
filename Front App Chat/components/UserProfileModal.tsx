import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { X, Phone, Video as VideoIcon, Mail, MoreVertical, User as UserIcon } from 'lucide-react-native';
import Avatar from './Avatar';
import { colors, spacing, typography, borderRadius, shadows } from '@/styles/globalStyles';
import { apiGet } from '@/lib/api';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  statusMessage: string | null;
  online: boolean;
}

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  userId?: number;
  userName?: string;
  userAvatar?: string;
  userStatus?: 'online' | 'offline' | 'typing' | 'away';
  onCallPress?: () => void;
  onVideoCallPress?: () => void;
  onMessagePress?: () => void;
}

export default function UserProfileModal({
  visible,
  onClose,
  conversationId,
  userId,
  userName: initialUserName = 'Utilisateur',
  userAvatar: initialUserAvatar,
  userStatus: initialUserStatus = 'offline',
  onCallPress,
  onVideoCallPress,
  onMessagePress,
}: UserProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    avatar: string | undefined;
    status: 'online' | 'offline' | 'typing' | 'away';
    statusMessage: string;
  }>({
    name: initialUserName,
    email: '',
    avatar: initialUserAvatar,
    status: initialUserStatus,
    statusMessage: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !visible) return;
      
      setIsLoading(true);
      try {
        const data = await apiGet<UserProfile>(`/users/${userId}`);
        setUserData({
          name: data.name,
          email: data.email,
          avatar: data.avatar || undefined,
          status: data.online ? 'online' : 'offline',
          statusMessage: data.statusMessage || 'Disponible'
        });
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        // Garder les valeurs par défaut en cas d'erreur
        setUserData(prev => ({
          ...prev,
          name: initialUserName,
          avatar: initialUserAvatar,
          status: initialUserStatus
        }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, visible]);

  const { name, email, avatar, status, statusMessage } = userData;
  const isOnline = status === 'online';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.avatarContainer}>
            <Avatar 
              uri={avatar} 
              size={120} 
              showOnlineIndicator={isOnline}
              isOnline={isOnline}
              fallbackIcon={UserIcon}
            />
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {statusMessage ? (
              <Text style={styles.statusMessage} numberOfLines={2}>
                {statusMessage}
              </Text>
            ) : null}
            <Text style={[
              styles.status,
              isOnline && styles.statusOnline,
              status === 'typing' && styles.statusTyping
            ]}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Mail size={20} color={colors.primary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {email || 'Non disponible'}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Phone size={20} color={colors.primary} />
              <Text style={styles.detailText}>
                {statusMessage || 'Aucun statut'}
              </Text>
            </View>
            
            <View style={styles.aboutContainer}>
              <Text style={styles.aboutTitle}>À propos</Text>
              <Text style={styles.aboutText}>
                {statusMessage || 'Aucune information supplémentaire'}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onCallPress}
            >
              <Phone size={24} color={colors.primary} />
              <Text style={styles.actionText}>Appel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onVideoCallPress}
            >
              <VideoIcon size={24} color={colors.primary} />
              <Text style={styles.actionText}>Vidéo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onMessagePress}
            >
              <MoreVertical size={24} color={colors.primary} />
              <Text style={styles.actionText}>Plus</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    ...shadows.lg,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  name: {
    ...typography.headline,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  status: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  detailsContainer: {
    marginBottom: spacing.xl,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.md,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 'auto',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    minHeight: 80,
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    padding: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    minWidth: 120,
    alignItems: 'center',
  },
  retryText: {
    ...typography.subhead,
    color: colors.onPrimary,
    fontWeight: '600',
  },
  loadingPlaceholder: {
    width: '100%',
    padding: spacing.md,
  },
  detailItemPlaceholder: {
    height: 20,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    width: '100%',
  },
  aboutContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  aboutTitle: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  aboutText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  statusOnline: {
    color: colors.success,
  },
  statusTyping: {
    color: colors.primary,
    fontStyle: 'italic',
  },
  actionButton: {
    alignItems: 'center',
    padding: spacing.sm,
    flex: 1,
  },
  actionText: {
    ...typography.caption1,
    color: colors.primary,
    marginTop: spacing.xs,
  },
});
