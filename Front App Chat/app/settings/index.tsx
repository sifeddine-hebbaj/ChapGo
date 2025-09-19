import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity, ActivityIndicator, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Save, Image as ImageIcon, User, Mail, Edit3, Lock } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/globalStyles';
import { apiGet, apiPatch } from '@/lib/api';
import { selectImage } from '@/lib/mediaService';
import Avatar from '@/components/Avatar';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function SettingsScreen() {
  const fadeAnim = useState(new Animated.Value(0))[0];
  const translateY = useState(new Animated.Value(30))[0];

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.poly(4)),
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState({
    name: '',
    email: '',
    statusMessage: '',
    avatar: '',
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const me = await apiGet<any>('/api/me');
      setUser({
        name: me.name || '',
        email: me.email || '',
        statusMessage: me.statusMessage || '',
        avatar: me.avatar || '',
      });
    } catch (error) {
      console.error('Failed to load profile', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAvatar = async () => {
    try {
      const media = await selectImage();
      if (!media) return;
      
      setSaving(true);
      const updated = await apiPatch('/api/me/avatar', { url: media.url });
      setUser(prev => ({ ...prev, avatar: updated.avatar || media.url }));
      Alert.alert('Succès', 'Photo de profil mise à jour');
    } catch (error) {
      console.error('Failed to update avatar', error);
      Alert.alert('Erreur', "Impossible de mettre à jour la photo de profil");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user.name.trim() || !user.email.trim()) {
      Alert.alert('Erreur', 'Le nom et l\'email sont obligatoires');
      return;
    }

    try {
      setSaving(true);
      const updated = await apiPatch('/api/me', {
        name: user.name,
        email: user.email,
        statusMessage: user.statusMessage,
      });
      
      setUser(prev => ({
        ...prev,
        name: updated.name || prev.name,
        email: updated.email || prev.email,
        statusMessage: updated.statusMessage || prev.statusMessage,
      }));
      
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      console.error('Failed to update profile', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[styles.header, { 
          opacity: fadeAnim,
          transform: [{ translateY }]
        }]}
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, styles.headerButton]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres généraux</Text>
        <AnimatedTouchable 
          onPress={handleSave} 
          style={[styles.saveButton, styles.headerButton, saving && styles.saveButtonDisabled]}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          )}
        </AnimatedTouchable>
      </Animated.View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[styles.card, { 
            opacity: fadeAnim,
            transform: [{ translateY }]
          }]}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Avatar uri={user.avatar} size={120} />
              <TouchableOpacity 
                style={styles.avatarEditButton}
                onPress={handleChangeAvatar}
                disabled={saving}
                activeOpacity={0.8}
              >
                <ImageIcon size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user.name || 'Utilisateur'}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </Animated.View>

        <Animated.View 
          style={[styles.card, { 
            opacity: fadeAnim,
            transform: [{ translateY }],
            marginTop: 20
          }]}
        >
          <View style={styles.sectionHeader}>
            <User size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom complet</Text>
            <View style={styles.inputContainer}>
              <User size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={user.name}
                onChangeText={(text) => setUser(prev => ({ ...prev, name: text }))}
                placeholder="Votre nom"
                placeholderTextColor={colors.textSecondary}
              />
              <Edit3 size={16} color={colors.textSecondary} style={styles.inputIcon} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Mail size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={user.email}
                onChangeText={(text) => setUser(prev => ({ ...prev, email: text }))}
                placeholder="votre@email.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Edit3 size={16} color={colors.textSecondary} style={styles.inputIcon} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Statut</Text>
            <View style={styles.inputContainer}>
              <Edit3 size={16} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={user.statusMessage}
                onChangeText={(text) => setUser(prev => ({ ...prev, statusMessage: text }))}
                placeholder="Votre statut (optionnel)"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          style={[styles.card, { 
            opacity: fadeAnim,
            transform: [{ translateY }],
            marginTop: 20
          }]}
        >
          <View style={styles.sectionHeader}>
            <Lock size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Sécurité</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/settings/change-password')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(255, 71, 87, 0.1)' }]}>
                <Lock size={18} color={colors.error} />
              </View>
              <Text style={styles.menuItemText}>Changer le mot de passe</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </Animated.View>
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
    flex: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...shadows.sm,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.headline,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Pour centrer le titre
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.primaryDisabled,
  },
  saveButtonText: {
    color: colors.white,
    ...typography.subhead,
    fontWeight: '600',
  },
  avatarSection: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarEditButton: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadows.sm,
  },
  userName: {
    ...typography.title2,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  userEmail: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  formSection: {
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    ...shadows.xs,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  label: {
    ...typography.subhead,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: 0,
    color: colors.text,
    ...typography.body,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuItemText: {
    ...typography.body,
    color: colors.text,
  },
  arrow: {
    ...typography.title1,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  passwordButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.xs,
  },
  passwordButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
});
