import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { colors, radius, spacing, type } from '@/theme';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import {
  getBiometricLockEnabled,
  getPrivateNotifications,
  getRemindersEnabled,
  setBiometricLockEnabled,
  setPrivateNotifications
} from '@/lib/privacy';
import { disableReminders, enableReminders, rescheduleReminders } from '@/lib/reminders';
import { listTodayItems } from '@/services/pulse';

export default function YouScreen() {
  const { session } = useAuth();
  const [biometricLock, setBiometricLock] = useState(false);
  const [privateNotifications, setPrivateNotificationsState] = useState(true);
  const [reminders, setReminders] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [lock, privateMode, reminderMode] = await Promise.all([
      getBiometricLockEnabled(),
      getPrivateNotifications(),
      getRemindersEnabled()
    ]);
    setBiometricLock(lock);
    setPrivateNotificationsState(privateMode);
    setReminders(reminderMode);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function toggleLock(value: boolean) {
    if (!value) {
      await setBiometricLockEnabled(false);
      setBiometricLock(false);
      return;
    }

    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = hardware && await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      Alert.alert('Biometrics unavailable', 'Set up Face ID, Touch ID, or device biometrics first.');
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Enable Pulse privacy lock',
      disableDeviceFallback: false
    });
    if (!result.success) return;

    await setBiometricLockEnabled(true);
    setBiometricLock(true);
  }

  async function toggleReminders(value: boolean) {
    setBusy(true);
    try {
      if (!value) {
        await disableReminders();
        setReminders(false);
        return;
      }

      const items = await listTodayItems();
      const enabled = await enableReminders(items);
      setReminders(enabled);
      if (!enabled) Alert.alert('Notifications are off', 'Enable notifications for Pulse in device settings to use reminders.');
    } catch (error) {
      Alert.alert('Could not update reminders', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function togglePrivateNotifications(value: boolean) {
    setPrivateNotificationsState(value);
    await setPrivateNotifications(value);
    if (reminders) {
      const items = await listTodayItems();
      await rescheduleReminders(items);
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Could not sign out', error.message);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.eyebrow}>PRIVATE BY DESIGN</Text>
        <Text style={styles.title}>You</Text>
        <Text style={styles.body}>Control what Pulse stores on this device and what appears on your lock screen.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>SIGNED IN AS</Text>
          <Text style={styles.value}>{session?.user.email ?? 'Pulse user'}</Text>
        </View>

        <View style={styles.card}>
          <SettingRow
            title="Biometric app lock"
            detail="Require Face ID, Touch ID, or device biometrics when Pulse opens."
            value={biometricLock}
            onValueChange={(value) => void toggleLock(value)}
          />
          <View style={styles.divider} />
          <SettingRow
            title="Protocol reminders"
            detail="Schedule local reminders from your active protocol."
            value={reminders}
            disabled={busy}
            onValueChange={(value) => void toggleReminders(value)}
          />
          <View style={styles.divider} />
          <SettingRow
            title="Private notification text"
            detail="Hide item names and amounts from notification previews."
            value={privateNotifications}
            onValueChange={(value) => void togglePrivateNotifications(value)}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data controls</Text>
          <Text style={styles.detail}>Full export and account-data deletion are the remaining privacy controls before release.</Text>
        </View>

        <Pressable style={styles.signOut} onPress={() => void signOut()}><Text style={styles.signOutText}>SIGN OUT</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ title, detail, value, disabled, onValueChange }: {
  title: string;
  detail: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <Switch value={value} disabled={disabled} onValueChange={onValueChange} trackColor={{ true: colors.accentSoft }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: spacing.lg, paddingBottom: 42 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.8, marginTop: spacing.md },
  title: { color: colors.text, fontSize: type.hero, fontWeight: '800', letterSpacing: -1, marginTop: spacing.sm },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.xl },
  card: { backgroundColor: colors.panel, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  label: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  value: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 6 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  settingCopy: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  detail: { color: colors.muted, marginTop: 5, lineHeight: 19, fontSize: 13 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  signOut: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', marginTop: spacing.md },
  signOutText: { color: colors.text, fontWeight: '900', letterSpacing: 1 }
});
