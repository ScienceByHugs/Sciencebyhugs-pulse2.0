import { useState } from 'react';
import { Redirect } from 'expo-router';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme';

export default function SignInScreen() {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) return <Redirect href="/(tabs)" />;

  async function signIn() {
    if (!email || !password) return Alert.alert('Missing information', 'Enter your email and password.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) Alert.alert('Could not sign in', error.message);
  }

  async function signUp() {
    if (!email || password.length < 8) {
      return Alert.alert('Check your details', 'Use a valid email and a password with at least 8 characters.');
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (error) return Alert.alert('Could not create account', error.message);
    Alert.alert('Check your email', 'Confirm your email to finish creating your Pulse account.');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Text style={styles.eyebrow}>SCIENCE BY HUGS</Text>
        <Text style={styles.logo}>PULSE</Text>
        <Text style={styles.title}>Your routine, in one place.</Text>
        <Text style={styles.subtitle}>Private protocol tracking, inventory, reminders and history.</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />
          <Pressable style={[styles.primary, busy && styles.disabled]} disabled={busy} onPress={signIn}>
            <Text style={styles.primaryText}>{busy ? 'WORKING…' : 'SIGN IN'}</Text>
          </Pressable>
          <Pressable style={styles.secondary} disabled={busy} onPress={signUp}>
            <Text style={styles.secondaryText}>Create a Pulse account</Text>
          </Pressable>
        </View>

        <Text style={styles.disclaimer}>Pulse organizes information you enter. It does not diagnose, prescribe, or recommend treatment or dosage.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  eyebrow: { color: colors.muted, fontSize: 10, letterSpacing: 2.4, fontWeight: '800' },
  logo: { color: colors.text, fontSize: 38, letterSpacing: 8, fontWeight: '900', marginTop: 4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -1, marginTop: 34 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8, maxWidth: 420 },
  form: { gap: 12, marginTop: 30 },
  input: { backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 15, color: colors.text, fontSize: 16 },
  primary: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryText: { color: '#03111f', fontWeight: '900', letterSpacing: 1.1 },
  secondary: { paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: colors.accent, fontWeight: '700' },
  disabled: { opacity: 0.55 },
  disclaimer: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 28 }
});
