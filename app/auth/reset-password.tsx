import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);

  async function updatePassword() {
    if (!session) return Alert.alert('Link not ready', 'Open the latest password reset email link again.');
    if (password.length < 8) return Alert.alert('Weak password', 'Use at least 8 characters.');
    if (password !== confirmation) return Alert.alert('Passwords differ', 'Make sure both passwords match.');
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirmation('');
      Alert.alert('Password updated', 'Your password was changed successfully.', [
        { text: 'Continue to Pulse', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      Alert.alert('Could not update password', error instanceof Error ? error.message : 'Try requesting a new link.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.kicker}>ACCOUNT SECURITY</Text>
        <Text style={styles.title}>Reset password.</Text>
        <Text style={styles.description}>{loading ? 'Verifying your reset link…' : session ? 'Choose a new password for Pulse.' : 'Your reset link could not be verified. Return to sign-in to request a new one.'}</Text>
        {session ? (
          <>
            <TextInput accessibilityLabel="New password" secureTextEntry autoComplete="new-password" placeholder="New password (8+ characters)" placeholderTextColor={colors.muted} style={styles.input} value={password} onChangeText={setPassword} />
            <TextInput accessibilityLabel="Confirm new password" secureTextEntry autoComplete="new-password" placeholder="Confirm new password" placeholderTextColor={colors.muted} style={styles.input} value={confirmation} onChangeText={setConfirmation} />
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void updatePassword()} style={styles.button}><Text style={styles.buttonText}>{busy ? 'UPDATING…' : 'UPDATE PASSWORD'}</Text></Pressable>
          </>
        ) : null}
        <Pressable accessibilityRole="button" onPress={() => router.replace('/sign-in')} style={styles.back}><Text style={styles.backText}>Back to sign in</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center', gap: spacing.md },
  kicker: { color: colors.accent, fontWeight: '700', fontSize: 11, letterSpacing: 1.4 },
  title: { color: colors.text, fontWeight: '700', fontSize: 32, letterSpacing: -1.1 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  input: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, color: colors.text, padding: 14, fontSize: 16 },
  button: { backgroundColor: colors.accent, borderRadius: radius.md, padding: 16, alignItems: 'center' },
  buttonText: { color: colors.bg, fontWeight: '800' },
  back: { paddingVertical: 12, alignItems: 'center' },
  backText: { color: colors.accent, fontWeight: '700' }
});
