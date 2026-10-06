import '@/lib/reminders';
import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { AuthProvider } from '@/providers/AuthProvider';
import { PrivacyGate } from '@/providers/PrivacyGate';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PrivacyGate>
        <StatusBar barStyle="light-content" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </PrivacyGate>
    </AuthProvider>
  );
}
