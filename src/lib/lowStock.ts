import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { getLowStockAlertsEnabled } from '@/lib/privacy';
import type { TodayItem } from '@/services/pulse';

export function lowStockContainerIds(items: TodayItem[]): string[] {
  return items.flatMap((item) => (item.inventory_containers ?? [])
    .filter((container) => container.is_active &&
      Number.isFinite(container.remaining_amount) &&
      Number.isFinite(container.low_threshold) &&
      container.remaining_amount <= container.low_threshold)
    .map((container) => container.id)).sort();
}

async function notificationStateKey() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error('Sign in before enabling inventory alerts.');
  return `pulse:low-stock-alerts:v1:${data.user.id}`;
}

export async function clearLowStockAlertState() {
  if (Platform.OS === 'web') return;
  await AsyncStorage.removeItem(await notificationStateKey());
}

export async function notifyLowStock(items: TodayItem[]) {
  if (Platform.OS === 'web' || !(await getLowStockAlertsEnabled())) return 0;
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') return 0;
  const key = await notificationStateKey();
  const current = lowStockContainerIds(items);
  const raw = await AsyncStorage.getItem(key);
  const previous: string[] = raw ? JSON.parse(raw) : [];
  const previousIds = new Set(previous);
  const newlyLow = current.filter((id) => !previousIds.has(id));
  if (newlyLow.length > 0) {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('pulse-stock', {
        name: 'Pulse supply alerts',
        importance: Notifications.AndroidImportance.DEFAULT
      });
    }
    // Never include substance names or quantities in a lock-screen notification.
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Pulse supply check',
        body: 'Some tracked supplies may need your attention. Open Pulse to review.',
        data: { pulseScreen: 'protocol' }
      },
      trigger: null
    });
  }
  // Save the full current set so a recovered balance can alert again next time.
  await AsyncStorage.setItem(key, JSON.stringify(current));
  return newlyLow.length;
}
