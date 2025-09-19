import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Link, router } from 'expo-router';
import InputField from '@/components/InputField';
import CustomButton from '@/components/CustomButton';
import { colors, typography, spacing, borderRadius } from '@/styles/globalStyles';
import { apiPost } from '@/lib/api';
import { setToken } from '@/lib/auth';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    
    if (!name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    
    if (!email) {
      newErrors.email = 'L\'email est requis';
    } else if (!email.includes('@')) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmez votre mot de passe';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.values(newErrors).every(error => !error);
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const resp = await apiPost<{ token: string }>(`/auth/signup`, {
        name,
        email,
        password,
        avatar: undefined,
      });
      if (!resp?.token) throw new Error('Token manquant');
      await setToken(resp.token);
      router.replace('/(tabs)/conversations');
    } catch (e) {
      console.error('Signup error:', e);
      Alert.alert('Erreur', 'Inscription échouée. Vérifiez vos informations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.logoContainer}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/1587054/pexels-photo-1587054.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' }}
          style={styles.logo}
        />
        <Text style={styles.appTitle}>Créer un compte</Text>
        <Text style={styles.appSubtitle}>Rejoignez notre communauté</Text>
      </View>

      <View style={styles.formContainer}>
        <InputField
          label="Nom complet"
          placeholder="Votre nom complet"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />

        <InputField
          label="Email"
          placeholder="votre.email@exemple.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <InputField
          label="Mot de passe"
          placeholder="Créez un mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />

        <InputField
          label="Confirmer le mot de passe"
          placeholder="Confirmez votre mot de passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          error={errors.confirmPassword}
        />

        <CustomButton
          title="S'inscrire"
          onPress={handleSignup}
          loading={loading}
          size="large"
        />

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Déjà un compte ? </Text>
          <Link href="/(auth)/login">
            <Text style={styles.loginLink}>Se connecter</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  appTitle: {
    ...typography.largeTitle,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  appSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  formContainer: {
    flex: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  loginLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});