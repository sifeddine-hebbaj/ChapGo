import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Settings, Bell, Shield, CircleHelp as HelpCircle, LogOut, CreditCard as Edit3 } from 'lucide-react-native';
import Avatar from '@/components/Avatar';
import HeaderBar from '@/components/HeaderBar';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/globalStyles';
import { apiGet, apiPatch } from '@/lib/api';
import { selectImage } from '@/lib/mediaService';
import { clearToken } from '@/lib/auth';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  showArrow?: boolean;
}

function MenuItem({ icon, title, onPress, showArrow = true }: MenuItemProps) {
  return (
    <TouchableOpacity style={[styles.menuItem, shadows.sm]} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={styles.menuItemText}>{title}</Text>
      </View>
      {showArrow && (
        <Text style={styles.arrow}>›</Text>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string; statusMessage?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await apiGet<any>('/api/me');
        setUser({
          name: me.name,
          email: me.email,
          avatar: me.avatar,
          statusMessage: me.statusMessage,
        });
      } catch (e) {
        console.warn('Failed to load profile', e);
        Alert.alert('Erreur', 'Impossible de charger le profil');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleEditProfile = async () => {
    try {
      const media = await selectImage();
      if (!media) return;
      // Envoyer la nouvelle URL d'avatar au backend
      const updated = await apiPatch<any>('/api/me/avatar', { url: media.url });
      setUser({
        name: updated?.name ?? user?.name ?? '',
        email: updated?.email ?? user?.email ?? '',
        avatar: updated?.avatar ?? media.url,
        statusMessage: updated?.statusMessage ?? user?.statusMessage,
      });
      Alert.alert('Profil', 'Avatar mis à jour');
    } catch (e) {
      console.warn('Failed to update avatar', e);
      Alert.alert('Erreur', "Impossible de mettre à jour l'avatar");
    }
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'Paramètres de notification à implémenter');
  };

  const handlePrivacy = () => {
    Alert.alert('Confidentialité', 'Paramètres de confidentialité à implémenter');
  };

  const handleHelp = () => {
    Alert.alert('Aide', 'Centre d\'aide à implémenter');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => { await clearToken(); router.replace('/(auth)/login'); }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="Profil" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <Avatar 
            uri={user?.avatar} 
            size={100} 
            onPress={handleEditProfile}
          />
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Edit3 size={16} color={colors.primary} />
          </TouchableOpacity>
          
          <Text style={styles.userName}>{user?.name ?? (loading ? 'Chargement...' : 'Utilisateur')}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          {!!user?.statusMessage && (
            <Text style={styles.userStatus}>{user?.statusMessage}</Text>
          )}
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Compte</Text>
          
          <MenuItem
            icon={<Settings size={20} color={colors.primary} />}
            title="Paramètres généraux"
            onPress={handleSettings}
          />
          
          <MenuItem
            icon={<Bell size={20} color={colors.primary} />}
            title="Notifications"
            onPress={handleNotifications}
          />
          
          <MenuItem
            icon={<Shield size={20} color={colors.primary} />}
            title="Confidentialité"
            onPress={handlePrivacy}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <MenuItem
            icon={<HelpCircle size={20} color={colors.primary} />}
            title="Aide et support"
            onPress={handleHelp}
          />
        </View>

        <View style={styles.menuSection}>
          <MenuItem
            icon={<LogOut size={20} color={colors.error} />}
            title="Déconnexion"
            onPress={handleLogout}
            showArrow={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingVertical: spacing.lg,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  editButton: {
    position: 'absolute',
    right: spacing.lg + 30,
    top: 70,
    backgroundColor: colors.surface,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  userName: {
    ...typography.title2,
    color: colors.text,
    marginTop: spacing.md,
  },
  userEmail: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  userStatus: {
    ...typography.body,
    color: colors.primary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.text,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuItemText: {
    ...typography.body,
    color: colors.text,
  },
  arrow: {
    ...typography.title2,
    color: colors.textSecondary,
  },
});