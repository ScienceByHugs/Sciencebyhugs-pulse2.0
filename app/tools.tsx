import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SyringeReference } from '@/components/SyringeReference';
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
  const [injectionsPerWeek, setInjectionsPerWeek] = useState('2');
  const [labelConcentration, setLabelConcentration] = useState('');
  const [vialAmount, setVialAmount] = useState('');
  const [liquidVolume, setLiquidVolume] = useState('');
  const [vialUnit, setVialUnit] = useState<'mg' | 'mcg'>('mg');
  const [referenceAmount, setReferenceAmount] = useState('');
  const [referenceUnit, setReferenceUnit] = useState<'mg' | 'mcg'>('mcg');

  const doseVolume = useMemo(() => {
    const amount = numberFrom(intendedAmount);
    const concentration = numberFrom(labelConcentration);
    const times = numberFrom(injectionsPerWeek);
    return amount !== null && concentration !== null && times !== null && Number.isInteger(times) && times <= 14 ? (amount / times) / concentration : null;
  }, [intendedAmount, labelConcentration, injectionsPerWeek]);

  const trtAmountPerInjection = useMemo(() => {
    const amount = numberFrom(intendedAmount);
    const times = numberFrom(injectionsPerWeek);
    return amount !== null && times !== null && Number.isInteger(times) && times <= 14 ? amount / times : null;
  }, [intendedAmount, injectionsPerWeek]);

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
        <Text style={styles.intro}>TRT and peptide reference measurements, using only the values you enter. No treatment or preparation recommendations.</Text>

        <View style={styles.panel}>
          <View style={styles.heading}><Text style={styles.index}>01</Text><View style={styles.flex}><Text style={styles.panelTitle}>TRT calculator</Text><Text style={styles.caption}>Break down an already-prescribed weekly testosterone amount into per-injection measurements. This does not choose your prescription or frequency.</Text></View></View>
          <Text style={styles.inputLabel}>Prescribed testosterone per week (mg)</Text>
          <TextInput accessibilityLabel="Prescribed testosterone amount per week in milligrams" style={styles.input} keyboardType="decimal-pad" placeholder="Weekly amount in mg" placeholderTextColor={colors.muted} value={intendedAmount} onChangeText={setIntendedAmount} />
          <Text style={styles.inputLabel}>Concentration on the vial (mg/mL)</Text>
          <TextInput accessibilityLabel="Concentration on vial in milligrams per milliliter" style={styles.input} keyboardType="decimal-pad" placeholder="For example, 200" placeholderTextColor={colors.muted} value={labelConcentration} onChangeText={setLabelConcentration} />
          <Text style={styles.inputLabel}>Prescribed injections per week</Text>
          <View style={styles.quickRow}>
            {['1','2','3','7'].map((times) => <Pressable key={times} accessibilityRole="button" accessibilityState={{ selected: injectionsPerWeek === times }} onPress={() => setInjectionsPerWeek(times)} style={[styles.quickButton, injectionsPerWeek === times && styles.quickSelected]}><Text style={styles.quickText}>{times}</Text></Pressable>)}
          </View>
          <TextInput accessibilityLabel="Custom injections per week" style={styles.input} keyboardType="number-pad" placeholder="Or enter a whole number, 1–14" placeholderTextColor={colors.muted} value={injectionsPerWeek} onChangeText={setInjectionsPerWeek} />
          <View style={styles.resultOpen}>
            <Text style={styles.resultLabel}>Per injection · reference only</Text>
            <Text style={styles.bigResult}>{doseVolume === null ? '—' : `${format(doseVolume)} mL`}</Text>
            <Text style={styles.secondaryResult}>{trtAmountPerInjection === null ? 'Enter valid prescription details above' : `${format(trtAmountPerInjection)} mg from the prescribed weekly amount`}</Text>
            <Text style={styles.secondaryResult}>{doseVolume === null ? '' : `${format(doseVolume * 100)} units on a U-100 scale`}</Text>
          </View>
          <SyringeReference volumeMl={doseVolume} title="TRT volume on a U-100 reference syringe" />
        </View>

        <View style={styles.panel}>
          <View style={styles.heading}><Text style={styles.index}>02</Text><View style={styles.flex}><Text style={styles.panelTitle}>Peptide reconstitution calculator</Text><Text style={styles.caption}>Enter what's written on the vial and the final liquid volume to see the concentration. No mixing directions.</Text></View></View>
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
          <View style={styles.resultOpen}><Text style={styles.resultLabel}>Matching volume · reference only</Text><Text style={styles.bigResult}>{referenceVolume === null ? '—' : `${format(referenceVolume)} mL`}</Text><Text style={styles.secondaryResult}>{referenceVolume === null ? 'Enter a quantity to compare' : `${format(referenceVolume * 100)} units on a U-100 scale`}</Text></View>
          <SyringeReference volumeMl={referenceVolume} title="Peptide volume on a U-100 reference syringe" />
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
  title: { color: colors.text, fontSize: type.title, fontWeight: '700', letterSpacing: -1, marginTop: spacing.xs },
  intro: { color: colors.muted, fontSize: type.body, lineHeight: 21, marginTop: spacing.sm, marginBottom: spacing.lg },
  panel: { backgroundColor: 'transparent', borderRadius: 0, padding: layout.cardInset, borderWidth: 0, borderColor: 'transparent', gap: 10, marginBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unitButton: { paddingHorizontal: 13, minHeight: 48, justifyContent: 'center', borderWidth: 1, borderColor: colors.accentBorder, borderRadius: radius.md, backgroundColor: colors.accentSoft },
  unitButtonText: { color: colors.accent, fontWeight: '800' },
  outputColumn: { gap: 5, backgroundColor: colors.accentSoft, borderColor: colors.accentBorder, borderWidth: 1, padding: spacing.md, borderRadius: radius.md },
  bigResult: { color: colors.text, fontSize: 26, fontWeight: '900', fontVariant: ['tabular-nums'] },
  secondaryResult: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  quickRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quickButton: { minWidth: 58, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  quickSelected: { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder },
  quickText: { color: colors.text, fontWeight: '700' },
  resultOpen: { paddingVertical: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, gap: 6, marginTop: spacing.sm },
  resultLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
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
