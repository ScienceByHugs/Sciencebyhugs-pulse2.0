import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme';

type Props = { volumeMl: number | null; title?: string };

// Educational scale for a specifically labeled U-100, 1 mL reference syringe.
// No clinical instruction or claim of physical measurement accuracy.
export function SyringeReference({ volumeMl, title = 'U-100 syringe reference' }: Props) {
  const units = volumeMl === null ? null : volumeMl * 100;
  const inRange = units !== null && Number.isFinite(units) && units >= 0 && units <= 100;
  const position = inRange && units !== null ? units : 0;

  return (
    <View style={styles.root} accessible accessibilityLabel={inRange ? `${title}: ${position.toFixed(2)} units out of 100, equal to ${volumeMl?.toFixed(4)} milliliters` : `${title}: no valid position to show`}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.syringeRow}>
        <View style={styles.syringeTip} />
        <View style={styles.barrel}>
          <View style={[styles.fill, { width: `${position}%` }]} />
          <View style={[styles.plungerMark, { left: `${position}%`, opacity: inRange ? 1 : 0 }]} />
        </View>
        <View style={styles.flange} />
      </View>
      <View style={styles.scale}>
        {[0, 25, 50, 75, 100].map((unit) => <Text key={unit} style={styles.scaleLabel}>{unit}</Text>)}
      </View>
      <Text style={styles.note}>{units === null ? 'Enter values to see a reference position.' : !inRange ? 'Outside this 1 mL (100-unit) reference scale. No position shown.' : `${Number(position.toFixed(2))} units · ${volumeMl?.toFixed(4)} mL`}</Text>
      <Text style={styles.caution}>Illustrative scale only — not a substitute for syringe labeling or professional instructions.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: spacing.md, paddingBottom: spacing.md, gap: 9 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  syringeRow: { flexDirection: 'row', alignItems: 'center', height: 47, paddingHorizontal: 6 },
  syringeTip: { width: 20, height: 2, backgroundColor: colors.muted },
  barrel: { flex: 1, height: 29, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.muted, borderRadius: 5, justifyContent: 'center', overflow: 'visible' },
  fill: { position: 'absolute', left: 0, top: 1, bottom: 1, backgroundColor: colors.accentSoft, borderRadius: 4 },
  plungerMark: { position: 'absolute', width: 3, top: -4, bottom: -4, borderRadius: 2, backgroundColor: colors.accent },
  flange: { height: 40, width: 6, borderRadius: 2, backgroundColor: colors.muted },
  scale: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 26, paddingRight: 9 },
  scaleLabel: { color: colors.muted, fontSize: 11, fontVariant: ['tabular-nums'] },
  note: { color: colors.accent, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  caution: { color: colors.muted, fontSize: 11, lineHeight: 17 }
});
