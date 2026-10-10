import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { OrbitalBackground } from '@/components/OrbitalBackground';
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
  const [vialUnit, setVialUnit] = useState<'mg' | 'mcg'>('mg');
  const [referenceAmount, setReferenceAmount] = useState('');
  const [referenceUnit, setReferenceUnit] = useState<'mg' | 'mcg'>('mcg');

  const doseVolume = useMemo(() => {
    const amount = numberFrom(intendedAmount);
    const concentration = numberFrom(labelConcentration);
    return amount !== null && concentration !== null ? amount / concentration : null;
  }, [intendedAmount, labelConcentration]);

  const calculatedConcentration = useMemo(() => {
    const amount = numberFrom(vialAmount);
    const volume = numberFrom(liquidVolume);
    return amount !== null && volume !== null ? (vialUnit === 'mcg' ? amount / 1000 : amount) / volume : null;
  }, [vialAmount, liquidVolume, vialUnit]);

  const referenceVolume = useMemo(() => {
    const amount = numberFrom(referenceAmount);
    return amount !== null && calculatedConcentration !== null ? (referenceUnit === 'mcg' ? amount / 1000 : amount) / calculatedConcentration : null;
  }, [referenceAmount, referenceUnit, calculatedConcentration]);

  return (
    <SafeAreaView style={styles.safe}>
      <OrbitalBackground />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <PulseMenu />
        <Text style={styles.kicker}>YOUR CALCULATORS</Text>
        <Text style={styles.title}>Calculators</Text>
        <Text style={styles.intro}>Quick, straightforward calculations using numbers you enter. These are not dosing or preparation instructions.</Text>

        <View style={styles.panel}>
          <View style={styles.heading}><Text style={styles.index}>01</Text><View style={styles.flex}><Text style={styles.panelTitle}>How much liquid?</Text><Text style={styles.caption}>Already know an amount and a concentration? Find the matching liquid volume.</Text></View></View>
          <Text style={styles.inputLabel}>Amount you're checking (mg)</Text>
          <TextInput accessibilityLabel="Intended quantity in milligrams" style={styles.input} keyboardType="decimal-pad" placeholder="Quantity in mg" placeholderTextColor={colors.muted} value={intendedAmount} onChangeText={setIntendedAmount} />
          <Text style={styles.inputLabel}>Concentration on the label (mg/mL)</Text>
          <TextInput accessibilityLabel="Labeled concentration milligrams per milliliter" style={styles.input} keyboardType="decimal-pad" placeholder="mg per mL" placeholderTextColor={colors.subtle} value={labelConcentration} onChangeText={setLabelConcentration} />
          <View style={styles.output}><Text style={styles.outputLabel}>Liquid volume</Text><Text style={styles.outputValue}>{doseVolume === null ? '—' : `${format(doseVolume)} mL`}</Text></View>
        </View>

        <View style={styles.panel}>
          <View style={styles.heading}><Text style={styles.index}>02</Text><View style={styles.flex}><Text style={styles.panelTitle}>Peptide mixing calculator</Text><Text style={styles.caption}>Enter what's written on the vial and the final liquid volume to see the concentration. No mixing directions.</Text></View></View>
          <Text style={styles.inputLabel}>How much peptide is in the vial?</Text>
          <View style={styles.inputRow}>
            <TextInput accessibilityLabel={`Peptide amount in ${vialUnit}`} style={[styles.input, styles.flex]} keyboardType="decimal-pad" placeholder="Labeled amount" placeholderTextColor={colors.muted} value={vialAmount} onChangeText={setVialAmount} />
            <Pressable accessibilityRole="button" accessibilityLabel={`Switch amount unit; currently ${vialUnit}`} style={styles.unitButton} onPress={() => { setVialAmount(''); setVialUnit(vialUnit === 'mg' ? 'mcg' : 'mg'); }}><Text style={styles.unitButtonText}>{vialUnit} ↕</Text></Pressable>
          </View>
          <Text style={styles.inputLabel}>Final amount of liquid (mL)</Text>
          <TextInput accessibilityLabel="Final solution volume in milliliters" style={styles.input} keyboardType="decimal-pad" placeholder="Total liquid in mL" placeholderTextColor={colors.subtle} value={liquidVolume} onChangeText={setLiquidVolume} />
          <View style={styles.outputColumn}>
            <Text style={styles.outputLabel}>Strength per mL</Text>
            <Text style={styles.bigResult}>{calculatedConcentration === null ? '—' : `${format(calculatedConcentration)} mg/mL`}</Text>
            <Text style={styles.secondaryResult}>{calculatedConcentration === null ? 'Enter the vial amount and liquid volume' : `${format(calculatedConcentration * 1000)} mcg/mL`}</Text>
          </View>
          <Text style={styles.inputLabel}>Want to check a specific amount? (optional)</Text>
          <View style={styles.inputRow}>
            <TextInput accessibilityLabel={`Optional reference amount in ${referenceUnit}`} style={[styles.input, styles.flex]} keyboardType="decimal-pad" placeholder="Amount to check" placeholderTextColor={colors.muted} value={referenceAmount} onChangeText={setReferenceAmount} />
            <Pressable accessibilityRole="button" accessibilityLabel={`Switch reference unit; currently ${referenceUnit}`} style={styles.unitButton} onPress={() => { setReferenceAmount(''); setReferenceUnit(referenceUnit === 'mg' ? 'mcg' : 'mg'); }}><Text style={styles.unitButtonText}>{referenceUnit} ↕</Text></Pressable>
          </View>
          <View style={styles.output}><Text style={styles.outputLabel}>Matching liquid volume</Text><Text style={styles.outputValue}>{referenceVolume === null ? '—' : `${format(referenceVolume)} mL`}</Text></View>
          <Text style={styles.caption}>This only converts the numbers you enter. It cannot tell you what dose or mixing method is safe.</Text>
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
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unitButton: { paddingHorizontal: 13, minHeight: 48, justifyContent: 'center', borderWidth: 1, borderColor: colors.accentBorder, borderRadius: radius.md, backgroundColor: colors.accentSoft },
  unitButtonText: { color: colors.accent, fontWeight: '800' },
  outputColumn: { gap: 5, backgroundColor: colors.accentSoft, borderColor: colors.accentBorder, borderWidth: 1, padding: spacing.md, borderRadius: radius.md },
  bigResult: { color: colors.text, fontSize: 26, fontWeight: '900', fontVariant: ['tabular-nums'] },
  secondaryResult: { color: colors.muted, fontSize: 13, fontWeight: '700' },
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
