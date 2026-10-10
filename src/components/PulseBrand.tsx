import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

/** Uses the app's existing icon until the approved standalone Pulse logo is supplied. */
export function PulseBrand({ compact = false }: { compact?: boolean }) {
  return (
    <View accessibilityLabel="Science By Hugs Pulse" style={styles.row}>
      <Image source={require('../../assets/icon.png')} style={compact ? styles.compactIcon : styles.icon} resizeMode="contain" accessibilityIgnoresInvertColors />
      <View style={styles.copy}>
        <Text style={styles.brand}>Science By Hugs</Text>
        <Text style={compact ? styles.compactPulse : styles.pulse}>PULSE</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 42, height: 42, borderRadius: 10 },
  compactIcon: { width: 35, height: 35, borderRadius: 8 },
  copy: { gap: 1 },
  brand: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: .45 },
  pulse: { color: colors.text, fontSize: 19, fontWeight: '900', letterSpacing: 3 },
  compactPulse: { color: colors.text, fontSize: 17, fontWeight: '900', letterSpacing: 2.5 }
});
