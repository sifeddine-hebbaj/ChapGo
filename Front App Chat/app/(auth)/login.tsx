import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Link, router } from 'expo-router';
import InputField from '@/components/InputField';
import CustomButton from '@/components/CustomButton';
import { colors, typography, spacing, borderRadius } from '@/styles/globalStyles';
import { apiPost } from '@/lib/api';
import { setToken } from '@/lib/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { ResponseType } from 'expo-auth-session';

export default function LoginScreen() {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ code: '', password: '' });

  // Google Auth setup
  WebBrowser.maybeCompleteAuthSession();
  const [request, response, promptAsync] = Google.useAuthRequest({
    responseType: ResponseType.IdToken,
    expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === 'success') {
        const idToken = response.params?.id_token as string | undefined;
        if (!idToken) {
          Alert.alert('Erreur', "Google n'a pas renvoyé de id_token");
          return;
        }
        try {
          setLoading(true);
          const auth = await apiPost<{ token: string }>(`/auth/google`, { idToken });
          if (!auth?.token) throw new Error('Token JWT manquant');
          await setToken(auth.token);
          router.replace('/(tabs)/conversations');
        } catch (e) {
          console.error('Google login error:', e);
          Alert.alert('Erreur', 'Connexion Google échouée');
        } finally {
          setLoading(false);
        }
      }
    };
    handleGoogleResponse();
  }, [response]);

  const validateForm = useCallback(() => {
    const newErrors = { code: '', password: '' };
    let isValid = true;
    
    if (!code || code.trim() === '') {
      newErrors.code = "L'email est requis";
      isValid = false;
    } else if (!code.includes('@')) {
      newErrors.code = "Format d'email invalide";
      isValid = false;
    }
    
    if (!password || password.trim() === '') {
      newErrors.password = 'Le mot de passe est requis';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  }, [code, password]);

  const handleLogin = useCallback(async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Appel API backend /auth/login
      const resp = await apiPost<{ token: string }>(`/auth/login`, {
        email: code, // on réutilise le champ "code" comme email pour l'instant
        password,
      });
      if (!resp?.token) throw new Error('Token manquant');
      await setToken(resp.token);
      router.replace('/(tabs)/conversations');
    } catch (error) {
      console.error('Login error:', error);
      const msg = (error as Error)?.message || '';
      if (msg.includes('401') || msg.includes('403')) {
        Alert.alert('Identifiants invalides', "Email ou mot de passe incorrect");
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la connexion');
      }
    } finally {
      setLoading(false);
    }
  }, [code, password, validateForm]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      await promptAsync();
    } catch (e) {
      console.warn('Prompt Google error', e);
      Alert.alert('Erreur', 'Impossible de démarrer Google Sign-In');
    }
  }, [promptAsync]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.logoContainer}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/1587054/pexels-photo-1587054.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' }}
          style={styles.logo}
          resizeMode="cover"
        />
        <Text style={styles.appTitle}>ChatApp</Text>
        <Text style={styles.appSubtitle}>Connectez-vous pour commencer</Text>
      </View>

      <View style={styles.formContainer}>
        <InputField
          label="Email"
          placeholder="votre.email@exemple.com"
          value={code}
          onChangeText={setCode}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.code}
        />

        <InputField
          label="Mot de passe"
          placeholder="Entrez votre mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />

        <View style={styles.forgotPassword}>
          <Link href="/(auth)/forgot-password" asChild>
            <Text style={styles.linkText}>Mot de passe oublié ?</Text>
          </Link>
        </View>

        <CustomButton
          title="Se connecter"
          onPress={handleLogin}
          loading={loading}
          size="large"
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <CustomButton
          title="Continuer avec Google"
          onPress={handleGoogleLogin}
          variant="outline"
          size="medium"
        />

       
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Pas encore de compte ?</Text>
          <Link href="/(auth)/signup" asChild>
            <Text style={styles.signupLink}>Créer un compte</Text>
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
    marginVertical: spacing.xxl,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  linkText: {
    ...typography.subhead,
    color: colors.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  signupText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  signupLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});