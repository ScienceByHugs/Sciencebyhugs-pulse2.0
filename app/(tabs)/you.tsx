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
import { deletePulseAccount, exportPulseData } from '@/services/account';

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

  async function exportData() {
    setBusy(true);
    try {
      await exportPulseData();
    } catch (error) {
      Alert.alert('Could not export data', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete Pulse account?',
      'This permanently deletes your Pulse 2.0 account and all synced protocol, inventory, and log data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await deletePulseAccount();
              } catch (error) {
                Alert.alert('Could not delete account', error instanceof Error ? error.message : 'Unknown error');
              } finally {
                setBusy(false);
              }
            })();
          }
        }
      ]
    );
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

        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(session?.user.email ?? 'P').slice(0, 1).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>SIGNED IN AS</Text>
            <Text style={styles.value}>{session?.user.email ?? 'Pulse user'}</Text>
          </View>
          <View style={styles.securePill}><Text style={styles.secureText}>SECURE</Text></View>
        </View>

        <Text style={styles.sectionLabel}>PRIVACY & REMINDERS</Text>
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

        <Text style={styles.sectionLabel}>YOUR DATA</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data controls</Text>
          <Text style={styles.detail}>Your Pulse data belongs to you. Export a portable JSON copy or permanently delete your account and synced data.</Text>
          <Pressable style={styles.dataButton} disabled={busy} onPress={() => void exportData()}>
            <Text style={styles.dataButtonText}>EXPORT MY DATA</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} disabled={busy} onPress={confirmDeleteAccount}>
            <Text style={styles.deleteButtonText}>DELETE ACCOUNT & DATA</Text>
          </Pressable>
        </View>

        <View style={styles.aboutRow}>
          <Text style={styles.aboutText}>Pulse 2.0</Text>
          <Text style={styles.aboutText}>Science By Hugs</Text>
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
  page: { padding: spacing.lg, paddingBottom: 118 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.8, marginTop: spacing.md },
  title: { color: colors.text, fontSize: type.hero, fontWeight: '800', letterSpacing: -1.4, marginTop: spacing.sm },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.xl },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.panel, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentBorder, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.accent, fontSize: 18, fontWeight: '900' },
  securePill: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: colors.accentSoft },
  secureText: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  sectionLabel: { color: colors.subtle, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: spacing.sm, marginBottom: spacing.sm },
  card: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  label: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  value: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 6 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  settingCopy: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  detail: { color: colors.muted, marginTop: 5, lineHeight: 19, fontSize: 13 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  dataButton: { borderWidth: 1, borderColor: colors.accentBorder, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center', marginTop: spacing.md, backgroundColor: colors.accentSoft },
  dataButtonText: { color: colors.accent, fontWeight: '900', letterSpacing: .8 },
  deleteButton: { borderWidth: 1, borderColor: '#6f3030', borderRadius: radius.md, paddingVertical: 13, alignItems: 'center', marginTop: spacing.sm },
  deleteButtonText: { color: '#ff9b9b', fontWeight: '900', letterSpacing: .8 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingHorizontal: 2 },
  aboutText: { color: colors.subtle, fontSize: 11 },
  signOut: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', marginTop: spacing.xl },
  signOutText: { color: colors.text, fontWeight: '900', letterSpacing: 1 }
});
