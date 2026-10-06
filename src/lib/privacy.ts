import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_KEY = 'pulse.biometric_lock';
const PRIVATE_NOTIFICATIONS_KEY = 'pulse.private_notifications';
const REMINDERS_KEY = 'pulse.reminders_enabled';

async function getBoolean(key: string, fallback = false) {
  if (Platform.OS === 'web') return fallback;
  try {
    return (await SecureStore.getItemAsync(key)) === 'true';
  } catch {
    return fallback;
  }
}

async function setBoolean(key: string, value: boolean) {
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(key, value ? 'true' : 'false');
}

export const getBiometricLockEnabled = () => getBoolean(BIOMETRIC_KEY);
export const setBiometricLockEnabled = (value: boolean) => setBoolean(BIOMETRIC_KEY, value);
export const getPrivateNotifications = () => getBoolean(PRIVATE_NOTIFICATIONS_KEY, true);
export const setPrivateNotifications = (value: boolean) => setBoolean(PRIVATE_NOTIFICATIONS_KEY, value);
export const getRemindersEnabled = () => getBoolean(REMINDERS_KEY);
export const setRemindersEnabled = (value: boolean) => setBoolean(REMINDERS_KEY, value);
