import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, layout, radius, type } from '@/theme';

const links = [
  { label: 'Today', route: '/(tabs)' },
  { label: 'Protocol Library', route: '/(tabs)/protocol' },
  { label: 'Timeline', route: '/(tabs)/log' },
  { label: 'Insights', route: '/(tabs)/insights' },
  { label: 'Calculators & Tools', route: '/tools' },
  { label: 'Account & Privacy', route: '/(tabs)/you' }
] as const;

export function PulseMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <View style={styles.brandRow}>
        <View>
          <Text style={styles.brand}>SCIENCE BY HUGS</Text>
          <Text style={styles.pulse}>PULSE <Text style={styles.version}>02 / LAB</Text></Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open Pulse menu" onPress={() => setOpen(true)} style={styles.trigger}>
          <View style={styles.bar} /><View style={styles.bar} /><View style={styles.bar} />
        </Pressable>
      </View>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.scrim}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close menu" style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.panel}>
            <View style={styles.panelTop}>
              <View><Text style={styles.brand}>SCIENCE BY HUGS</Text><Text style={styles.panelTitle}>PULSE NAVIGATION</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={() => setOpen(false)} style={styles.close}><Text style={styles.closeText}>✕</Text></Pressable>
            </View>
            {links.map((entry, index) => (
              <Pressable key={entry.route} accessibilityRole="button" onPress={() => { setOpen(false); router.push(entry.route); }} style={[styles.item, index > 0 && styles.divider]}>
                <Text style={styles.itemIndex}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={styles.itemText}>{entry.label}</Text>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
            ))}
            <Text style={styles.footer}>BUILT FOR YOUR ROUTINE · SCIENCE BY HUGS</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 54, marginBottom: layout.sectionGap },
  brand: { color: colors.accent, fontSize: type.eyebrow, fontWeight: '900', letterSpacing: 2 },
  pulse: { color: colors.text, fontSize: 21, fontWeight: '900', letterSpacing: 4, marginTop: 3 },
  version: { color: colors.muted, fontSize: 9, letterSpacing: 1 },
  trigger: { minHeight: layout.minTapHeight, width: 46, borderWidth: 1, borderColor: colors.accentBorder, backgroundColor: colors.bgElevated, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center', gap: 5 },
  bar: { width: 18, height: 2, backgroundColor: colors.accent, borderRadius: 2 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.76)', justifyContent: 'flex-start', paddingTop: 55 },
  panel: { margin: 14, borderRadius: radius.xl, padding: layout.cardInset, borderWidth: 1, borderColor: colors.accentBorder, backgroundColor: colors.panel },
  panelTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginBottom: 12 },
  panelTitle: { color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: 1.3, marginTop: 8 },
  close: { minHeight: 44, width: 44, justifyContent: 'center', alignItems: 'center' },
  closeText: { color: colors.text, fontSize: 24 },
  item: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 14 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  itemIndex: { color: colors.subtle, fontSize: 11, fontWeight: '900', fontVariant: ['tabular-nums'] },
  itemText: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '800' },
  arrow: { color: colors.accent, fontSize: 26 },
  footer: { color: colors.subtle, fontSize: 9, letterSpacing: 1.1, marginTop: 20, textAlign: 'center' }
});
