import { type PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { getBiometricLockEnabled } from '@/lib/privacy';
import { colors, radius, spacing } from '@/theme';

export function PrivacyGate({ children }: PropsWithChildren) {
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);

  const authenticate = useCallback(async () => {
    if (Platform.OS === 'web') {
      setLocked(false);
      setChecking(false);
      return;
    }

    const enabled = await getBiometricLockEnabled();
    if (!enabled) {
      setLocked(false);
      setChecking(false);
      return;
    }

    setLocked(true);
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = hardware && await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      setChecking(false);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Pulse',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false
    });

    setLocked(!result.success);
    setChecking(false);
  }, []);

  useEffect(() => {
    void authenticate();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') setLocked(true);
      if (state === 'active') void authenticate();
    });
    return () => subscription.remove();
  }, [authenticate]);

  if (!locked && !checking) return children;

  return (
    <View style={styles.page}>
      <Text style={styles.brand}>PULSE</Text>
      <Text style={styles.title}>{checking ? 'Securing Pulse…' : 'Pulse is locked'}</Text>
      {!checking ? <Pressable style={styles.button} onPress={() => void authenticate()}><Text style={styles.buttonText}>UNLOCK</Text></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  brand: { color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 5 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 12 },
  button: { marginTop: 24, backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: 28, paddingVertical: 14 },
  buttonText: { color: '#03111f', fontWeight: '900', letterSpacing: 1 }
});
