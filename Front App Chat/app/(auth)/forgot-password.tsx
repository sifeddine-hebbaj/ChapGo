import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import InputField from '@/components/InputField';
import CustomButton from '@/components/CustomButton';
import HeaderBar from '@/components/HeaderBar';
import { colors, typography, spacing } from '@/styles/globalStyles';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      setError('L\'email est requis');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Format d\'email invalide');
      return;
    }
    
    setError('');
    setLoading(true);
    
    // Simulation de l'envoi d'un email de réinitialisation
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Email envoyé',
        'Un email de réinitialisation a été envoyé à votre adresse.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="Mot de passe oublié"
        showBackButton
        onBackPress={() => router.back()}
      />
      
      <View style={styles.content}>
        <Text style={styles.description}>
          Entrez votre adresse email pour recevoir un lien de réinitialisation de votre mot de passe.
        </Text>

        <InputField
          label="Email"
          placeholder="votre.email@exemple.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
        />

        <CustomButton
          title="Envoyer le lien"
          onPress={handleResetPassword}
          loading={loading}
          size="large"
        />
      </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
});