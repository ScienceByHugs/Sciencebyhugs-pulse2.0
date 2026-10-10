import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { isDueOnDate, scheduleTime } from '@/domain/schedule';
import { getPrivateNotifications, getRemindersEnabled, setRemindersEnabled } from '@/lib/privacy';
import type { TodayItem } from '@/services/pulse';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

export async function requestReminderPermission() {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pulse-reminders', {
      name: 'Pulse reminders',
      importance: Notifications.AndroidImportance.DEFAULT
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

function reminderDate(day: Date, time?: string) {
  const date = new Date(day);
  const [rawHour, rawMinute] = (time ?? '09:00').split(':').map(Number);
  date.setHours(Number.isFinite(rawHour) ? (rawHour ?? 9) : 9, Number.isFinite(rawMinute) ? (rawMinute ?? 0) : 0, 0, 0);
  return date;
}

export async function rescheduleReminders(items: TodayItem[]) {
  if (Platform.OS === 'web') return 0;
  if (!(await getRemindersEnabled())) return 0;

  // iOS can revoke authorization after reminders were enabled in Pulse.
  // Never attempt to schedule notifications while permission is denied.
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return 0;

  await Notifications.cancelAllScheduledNotificationsAsync();
  const privateMode = await getPrivateNotifications();
  const now = new Date();
  let count = 0;

  for (let offset = 0; offset < 30; offset += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);

    for (const item of items) {
      if (!isDueOnDate(item.schedule, day)) continue;
      const when = reminderDate(day, scheduleTime(item.schedule));
      if (when <= now) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Pulse reminder',
          body: privateMode ? 'You have something scheduled in Pulse.' : `${item.name} · ${item.dose_amount} ${item.dose_unit}`,
          data: { protocolItemId: item.id }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: Platform.OS === 'android' ? 'pulse-reminders' : undefined
        }
      });
      count += 1;
    }
  }

  return count;
}

export async function enableReminders(items: TodayItem[]) {
  const allowed = await requestReminderPermission();
  if (!allowed) return false;
  await setRemindersEnabled(true);
  await rescheduleReminders(items);
  return true;
}

export async function disableReminders() {
  await setRemindersEnabled(false);
  if (Platform.OS !== 'web') await Notifications.cancelAllScheduledNotificationsAsync();
}
