import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';
import { listDoseLogs, listTodayItems, type TimelineEntry, type TodayItem } from '@/services/pulse';
import { calculateSevenDayConsistency, calculateSupplyForecast, siteRotationSummary } from '@/domain/insights';

export default function InsightsScreen() {
  const [items, setItems] = useState<TodayItem[]>([]);
  const [logs, setLogs] = useState<TimelineEntry[]>([]);
  const [intendedDose, setIntendedDose] = useState('');
  const [concentration, setConcentration] = useState('');

  const load = useCallback(async () => {
    try {
      const [nextItems, nextLogs] = await Promise.all([listTodayItems(), listDoseLogs(500)]);
      setItems(nextItems);
      setLogs(nextLogs);
    } catch (error) {
      Alert.alert('Could not load insights', error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const consistency = useMemo(() => calculateSevenDayConsistency(items, logs), [items, logs]);
  const supply = useMemo(() => calculateSupplyForecast(items), [items]);
  const rotation = useMemo(() => siteRotationSummary(logs), [logs]);

  const volume = useMemo(() => {
    const dose = Number(intendedDose);
    const strength = Number(concentration);
    if (!Number.isFinite(dose) || !Number.isFinite(strength) || dose <= 0 || strength <= 0) return null;
    return dose / strength;
  }, [intendedDose, concentration]);

  const nextSupply = supply[0];
  const consistencyWidth = `${Math.max(0, Math.min(100, consistency.percent))}%` as `${number}%`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>WHAT CHANGED</Text>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.body}>Useful observations from your own records. Pulse does not prescribe or recommend treatment.</Text>

        <View style={styles.heroMetric}>
          <View style={styles.heroMetricTop}>
            <View>
              <Text style={styles.metricLabel}>7-DAY CONSISTENCY</Text>
              <Text style={styles.heroMetricValue}>{consistency.percent}%</Text>
            </View>
            <View style={styles.metricBadge}><Text style={styles.metricBadgeText}>{consistency.completed}/{consistency.due}</Text></View>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: consistencyWidth }]} /></View>
          <Text style={styles.metricDetail}>{consistency.due ? 'Based only on scheduled days and your logged activity.' : 'Your consistency view will populate as scheduled activity is logged.'}</Text>
        </View>

        <View style={styles.metrics}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{items.length}</Text>
            <Text style={styles.metricLabel}>ACTIVE ITEMS</Text>
            <Text style={styles.metricDetail}>Currently participating in your active routine.</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{rotation.uniqueSites}</Text>
            <Text style={styles.metricLabel}>RECENT SITES</Text>
            <Text style={styles.metricDetail}>{rotation.administrations} site-tagged logs sampled.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.cardTitle}>Supply runway</Text>
              <Text style={styles.detail}>A forecast from the inventory and dose values you entered.</Text>
            </View>
            {nextSupply ? <Text style={styles.sectionCount}>{supply.length}</Text> : null}
          </View>
          {supply.length ? supply.slice(0, 3).map((item, index) => (
            <View key={item.name} style={[styles.supplyRow, index > 0 && styles.supplyDivider]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.value}>{item.name}</Text>
                <Text style={styles.detail}>{item.remaining} {item.unit} · ~{item.dosesRemaining} doses</Text>
              </View>
              <Text style={[styles.forecast, item.projectedLowInDays === 0 && styles.warningText]}>
                {item.projectedLowInDays === null ? '365+ days' : item.projectedLowInDays === 0 ? 'LOW NOW' : `~${item.projectedLowInDays}d`}
              </Text>
            </View>
          )) : <Text style={styles.detail}>Add inventory to a protocol item to enable supply forecasting.</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dose → volume calculator</Text>
          <Text style={styles.detail}>Enter the dose you already intend to use and the labeled concentration in matching mass units. Pulse only performs the arithmetic.</Text>
          <View style={styles.twoCol}>
            <View style={styles.flex}>
              <Text style={styles.inputLabel}>INTENDED DOSE</Text>
              <TextInput
                style={styles.input}
                value={intendedDose}
                onChangeText={setIntendedDose}
                placeholder="e.g. 100"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.inputLabel}>CONCENTRATION / mL</Text>
              <TextInput
                style={styles.input}
                value={concentration}
                onChangeText={setConcentration}
                placeholder="e.g. 250"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <View style={styles.result}>
            <Text style={styles.inputLabel}>CALCULATED VOLUME</Text>
            <Text style={styles.resultValue}>{volume === null ? '—' : `${Number(volume.toFixed(4))} mL`}</Text>
          </View>
          <Text style={styles.disclaimer}>This calculator does not determine what dose you should take. Verify units and labeling before relying on any calculation.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: spacing.lg, paddingBottom: 118 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.8, marginTop: spacing.md },
  title: { color: colors.text, fontSize: type.hero, fontWeight: '800', letterSpacing: -1.4, marginTop: spacing.sm },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.xl },
  heroMetric: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.accentBorder, marginBottom: spacing.sm },
  heroMetricTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroMetricValue: { color: colors.text, fontSize: 42, fontWeight: '900', letterSpacing: -2, marginTop: 4 },
  metricBadge: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 7 },
  metricBadgeText: { color: colors.accent, fontSize: 11, fontWeight: '900' },
  progressTrack: { height: 6, backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.md },
  progressFill: { height: 6, backgroundColor: colors.accent, borderRadius: radius.pill },
  metrics: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  metricCard: { flex: 1, backgroundColor: colors.panel, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  metricValue: { color: colors.text, fontSize: 28, fontWeight: '900' },
  metricLabel: { color: colors.accent, fontSize: 12, fontWeight: '800', marginTop: 2 },
  metricDetail: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 6 },
  card: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  sectionCount: { color: colors.accent, backgroundColor: colors.accentSoft, paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, fontWeight: '900' },
  supplyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  supplyDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  warningText: { color: colors.warning },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  value: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: spacing.md },
  detail: { color: colors.muted, marginTop: 7, lineHeight: 20 },
  forecast: { color: colors.accent, marginTop: spacing.sm, lineHeight: 20, fontWeight: '700' },
  twoCol: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  flex: { flex: 1 },
  inputLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 5 },
  input: { backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 13, paddingVertical: 12, color: colors.text, fontSize: 15 },
  result: { marginTop: spacing.md, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentBorder, borderRadius: radius.md, padding: spacing.md },
  resultValue: { color: colors.accent, fontSize: 24, fontWeight: '900' },
  disclaimer: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing.md }
});
