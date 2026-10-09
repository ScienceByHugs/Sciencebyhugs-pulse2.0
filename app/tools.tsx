import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PulseMenu } from '@/components/PulseMenu';
import { colors, layout, radius, spacing, type } from '@/theme';

function numberFrom(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
function format(value: number) {
  return Number(value.toFixed(4)).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export default function ToolsScreen() {
  const [intendedAmount, setIntendedAmount] = useState('');
  const [labelConcentration, setLabelConcentration] = useState('');
  const [vialAmount, setVialAmount] = useState('');
  const [liquidVolume, setLiquidVolume] = useState('');

  const doseVolume = useMemo(() => {
    const amount = numberFrom(intendedAmount);
    const concentration = numberFrom(labelConcentration);
    return amount !== null && concentration !== null ? amount / concentration : null;
  }, [intendedAmount, labelConcentration]);

  const calculatedConcentration = useMemo(() => {
    const amount = numberFrom(vialAmount);
    const volume = numberFrom(liquidVolume);
    return amount !== null && volume !== null ? amount / volume : null;
  }, [vialAmount, liquidVolume]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <PulseMenu />
        <Text style={styles.kicker}>PRECISION LAB / 01</Text>
        <Text style={styles.title}>Calculators</Text>
        <Text style={styles.intro}>Two reference calculators for quantities you already know. No dosing instructions, recommendations or medical decisions.</Text>

        <View style={styles.panel}>
          <View style={styles.heading}><Text style={styles.index}>01</Text><View style={styles.flex}><Text style={styles.panelTitle}>Dose → volume</Text><Text style={styles.caption}>Enter the intended quantity and concentration from the label using matching mass units.</Text></View></View>
          <Text style={styles.inputLabel}>INTENDED QUANTITY (mg)</Text>
          <TextInput accessibilityLabel="Intended quantity in milligrams" style={styles.input} keyboardType="decimal-pad" placeholder="Quantity in mg" placeholderTextColor={colors.subtle} value={intendedAmount} onChangeText={setIntendedAmount} />
          <Text style={styles.inputLabel}>LABELED CONCENTRATION (mg/mL)</Text>
          <TextInput accessibilityLabel="Labeled concentration milligrams per milliliter" style={styles.input} keyboardType="decimal-pad" placeholder="mg per mL" placeholderTextColor={colors.subtle} value={labelConcentration} onChangeText={setLabelConcentration} />
          <View style={styles.output}><Text style={styles.outputLabel}>CALCULATED VOLUME</Text><Text style={styles.outputValue}>{doseVolume === null ? '—' : `${format(doseVolume)} mL`}</Text></View>
        </View>

        <View style={styles.panel}>
          <View style={styles.heading}><Text style={styles.index}>02</Text><View style={styles.flex}><Text style={styles.panelTitle}>Vial concentration</Text><Text style={styles.caption}>Reference concentration arithmetic only. The app does not tell you how to prepare or reconstitute a substance.</Text></View></View>
          <Text style={styles.inputLabel}>TOTAL SUBSTANCE ON LABEL (mg)</Text>
          <TextInput accessibilityLabel="Total substance in milligrams" style={styles.input} keyboardType="decimal-pad" placeholder="Total mg" placeholderTextColor={colors.subtle} value={vialAmount} onChangeText={setVialAmount} />
          <Text style={styles.inputLabel}>FINAL SOLUTION VOLUME (mL)</Text>
          <TextInput accessibilityLabel="Final solution volume in milliliters" style={styles.input} keyboardType="decimal-pad" placeholder="Final volume in mL" placeholderTextColor={colors.subtle} value={liquidVolume} onChangeText={setLiquidVolume} />
          <View style={styles.output}><Text style={styles.outputLabel}>CALCULATED CONCENTRATION</Text><Text style={styles.outputValue}>{calculatedConcentration === null ? '—' : `${format(calculatedConcentration)} mg/mL`}</Text></View>
        </View>
        <Text style={styles.disclaimer}>Science By Hugs Pulse organizes user-entered information. Verify units, product labeling, and any medication preparation instructions with a qualified clinician or pharmacist. These tools do not establish safety, sterility, suitability, or a dose.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: layout.pageInset, paddingBottom: layout.pageBottom },
  kicker: { color: colors.accent, fontSize: type.eyebrow, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: type.title, fontWeight: '900', letterSpacing: -1, marginTop: spacing.xs },
  intro: { color: colors.muted, fontSize: type.body, lineHeight: 21, marginTop: spacing.sm, marginBottom: spacing.lg },
  panel: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: layout.cardInset, borderWidth: 1, borderColor: colors.border, gap: 10, marginBottom: spacing.md },
  heading: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', marginBottom: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  index: { color: colors.accent, fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] },
  panelTitle: { color: colors.text, fontSize: type.card, fontWeight: '900' },
  caption: { color: colors.muted, fontSize: type.detail, lineHeight: 18, marginTop: 5 },
  inputLabel: { color: colors.accent, fontSize: type.eyebrow, fontWeight: '900', letterSpacing: 1, marginTop: 5 },
  input: { height: 48, color: colors.text, backgroundColor: colors.panel2, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, fontSize: 16 },
  output: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, backgroundColor: colors.accentSoft, borderColor: colors.accentBorder, borderWidth: 1, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.sm },
  outputLabel: { flex: 1, color: colors.accent, fontSize: type.eyebrow, fontWeight: '900', letterSpacing: .8 },
  outputValue: { color: colors.text, fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] },
  disclaimer: { color: colors.muted, fontSize: type.detail, lineHeight: 19, marginTop: spacing.sm }
});
