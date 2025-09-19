import { Stack } from 'expo-router';
import { colors } from '@/styles/globalStyles';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Paramètres',
        }}
      />
      <Stack.Screen 
        name="change-password" 
        options={{
          title: 'Changer le mot de passe',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
