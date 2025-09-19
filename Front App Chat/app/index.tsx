import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { colors } from '@/styles/globalStyles';

export default function IndexScreen() {
  // Redirect vers l'écran de login par défaut
  // Dans une vraie app, on vérifierait ici si l'utilisateur est connecté
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});