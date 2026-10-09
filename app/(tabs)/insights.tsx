import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, layout, radius, spacing, type } from '@/theme';
import { PulseMenu } from '@/components/PulseMenu';
import { listDoseLogs, listTodayItems, type TimelineEntry, type TodayItem } from '@/services/pulse';
import { calculateSevenDayConsistency, calculateSupplyForecast, siteRotationSummary } from '@/domain/insights';
import { isDueOnDate } from '@/domain/schedule';

export default function InsightsScreen() {
  const [items, setItems] = useState<TodayItem[]>([]);
  const [logs, setLogs] = useState<TimelineEntry[]>([]);

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

  const routineFingerprint = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return items.slice(0, 4).map((item) => ({
      id: item.id,
      name: item.name,
      days: Array.from({ length: 7 }, (_, offset) => {
        const date = new Date(today);
        date.setDate(today.getDate() + offset);
        return isDueOnDate(item.schedule, date);
      })
    }));
  }, [items]);

  const fingerprintLabels = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      return date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1).toUpperCase();
    });
  }, []);

  const nextSupply = supply[0];
  const consistencyWidth = `${Math.max(0, Math.min(100, consistency.percent))}%` as `${number}%`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <PulseMenu />
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

        {routineFingerprint.length ? (
          <View style={styles.fingerprintCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.signalEyebrow}>ROUTINE FINGERPRINT</Text>
                <Text style={styles.cardTitle}>Your next 7 days</Text>
                <Text style={styles.detail}>Each signal shows when an active item is scheduled to appear.</Text>
              </View>
            </View>
            <View style={styles.fingerprintHeaderRow}>
              <View style={styles.fingerprintNameSpacer} />
              {fingerprintLabels.map((label, index) => <Text key={`${label}-${index}`} style={styles.fingerprintDayLabel}>{label}</Text>)}
            </View>
            {routineFingerprint.map((item, rowIndex) => (
              <View key={item.id} style={[styles.fingerprintRow, rowIndex > 0 && styles.fingerprintDivider]}>
                <Text style={styles.fingerprintName} numberOfLines={2}>{item.name}</Text>
                {item.days.map((active, index) => (
                  <View key={`${item.id}-${index}`} style={[styles.fingerprintNode, active && styles.fingerprintNodeActive]}>
                    {active ? <View style={styles.fingerprintCore} /> : null}
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.signalEyebrow}>SUPPLY RESERVOIR</Text>
              <Text style={styles.cardTitle}>What remains</Text>
              <Text style={styles.detail}>Projected from your recorded supply and schedule. NO DATE means the low threshold was not reached within 365 days.</Text>
            </View>
            {nextSupply ? <Text style={styles.sectionCount}>{supply.length}</Text> : null}
          </View>
          {supply.length ? supply.slice(0, 3).map((item, index) => (
            <View key={item.itemId} style={[styles.supplyRow, index > 0 && styles.supplyDivider]}>
              <View style={styles.supplyIdentity}>
                <Text style={styles.supplyName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.supplyAmount}>{item.remaining} {item.unit}</Text>
              </View>
              <View style={styles.reservoir}>
                <View style={styles.reservoirLabels}>
                  <Text style={styles.reservoirLabel}>CAPACITY</Text>
                  <Text style={[styles.reservoirPercentage, item.projectedLowInDays === 0 && styles.warningText]}>{item.total > 0 ? `${Math.round(Math.max(0, Math.min(100, item.remaining / item.total * 100)))}%` : '—'}</Text>
                </View>
                <View style={styles.reservoirRail}>
                  <View style={[styles.reservoirFill, { width: `${Math.max(0, Math.min(100, item.total > 0 ? item.remaining / item.total * 100 : 0))}%` as `${number}%` }, item.projectedLowInDays === 0 && styles.reservoirFillLow]} />
                </View>
                <View style={styles.supplyMeta}>
                  <Text style={styles.supplyDose}>~{item.dosesRemaining} DOSES</Text>
                  <Text style={[styles.forecast, item.projectedLowInDays === 0 && styles.warningText]}>
                    {item.projectedLowInDays === null ? 'NO DATE' : item.projectedLowInDays === 0 ? 'LOW NOW' : `LOW IN ~${item.projectedLowInDays}D`}
                  </Text>
                </View>
              </View>
            </View>
          )) : <Text style={styles.detail}>Add inventory to a protocol item to enable supply forecasting.</Text>}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: layout.pageInset, paddingBottom: layout.pageBottom },
  eyebrow: { color: colors.accent, fontSize: type.eyebrow, fontWeight: '900', letterSpacing: 1.8, marginTop: spacing.md },
  title: { color: colors.text, fontSize: type.title, fontWeight: '800', letterSpacing: -1.4, marginTop: spacing.sm },
  body: { color: colors.muted, fontSize: type.body, lineHeight: 21, marginTop: spacing.sm, marginBottom: spacing.md },
  heroMetric: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: layout.cardInset, borderWidth: 1, borderColor: colors.accentBorder, marginBottom: spacing.sm },
  heroMetricTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroMetricValue: { color: colors.text, fontSize: 42, fontWeight: '900', letterSpacing: -2, marginTop: 4, fontVariant: ['tabular-nums'], lineHeight: 48 },
  metricBadge: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 7 },
  metricBadgeText: { color: colors.accent, fontSize: 11, fontWeight: '900', fontVariant: ['tabular-nums'] },
  progressTrack: { height: 6, backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.md },
  progressFill: { height: 6, backgroundColor: colors.accent, borderRadius: radius.pill },
  metrics: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  metricCard: { flex: 1, backgroundColor: colors.panel, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  metricValue: { color: colors.text, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'], lineHeight: 32 },
  metricLabel: { color: colors.accent, fontSize: 12, fontWeight: '800', marginTop: 2 },
  metricDetail: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 6 },
  fingerprintCard: { backgroundColor: colors.bgElevated, borderRadius: radius.xl, padding: layout.cardInset, borderWidth: 1, borderColor: colors.accentBorder, marginBottom: spacing.sm },
  signalEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 5 },
  fingerprintHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, marginBottom: 5 },
  fingerprintNameSpacer: { flex: 2.5 },
  fingerprintDayLabel: { flex: 1, color: colors.subtle, textAlign: 'center', fontSize: 8, fontWeight: '900' },
  fingerprintRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  fingerprintDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  fingerprintName: { flex: 2.5, color: colors.text, fontSize: 11, fontWeight: '800', paddingRight: 8 },
  fingerprintNode: { flex: 1, height: 24, alignItems: 'center', justifyContent: 'center' },
  fingerprintNodeActive: { opacity: 1 },
  fingerprintCore: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.accentSoft },
  card: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: layout.cardInset, borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  sectionHeaderCopy: { flex: 1, minWidth: 0 },
  sectionCount: { color: colors.accent, backgroundColor: colors.accentSoft, minWidth: 30, textAlign: 'center', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, fontWeight: '900', fontVariant: ['tabular-nums'], alignSelf: 'flex-start' },
  supplyRow: { paddingVertical: spacing.md, gap: spacing.sm },
  supplyIdentity: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  supplyName: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '900' },
  supplyAmount: { color: colors.muted, textAlign: 'right', flexShrink: 1, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  reservoir: { gap: 7 },
  reservoirLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reservoirLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.1, color: colors.subtle },
  reservoirPercentage: { fontSize: 12, fontWeight: '900', color: colors.accent, fontVariant: ['tabular-nums'] },
  reservoirRail: { height: 8, backgroundColor: colors.bgElevated, borderRadius: radius.pill, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  reservoirFill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.pill },
  reservoirFillLow: { backgroundColor: colors.warning },
  supplyMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  supplyDose: { color: colors.subtle, fontSize: 9, fontWeight: '900', letterSpacing: 1, fontVariant: ['tabular-nums'] },
  supplyDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  warningText: { color: colors.warning },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  value: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: spacing.md },
  detail: { color: colors.muted, marginTop: 7, lineHeight: 20 },
  forecast: { color: colors.accent, minWidth: 62, textAlign: 'right', marginTop: spacing.sm, lineHeight: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  twoCol: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  flex: { flex: 1 },
  inputLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 5 },
  input: { backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 13, paddingVertical: 12, color: colors.text, fontSize: 15 },
  result: { marginTop: spacing.md, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentBorder, borderRadius: radius.md, padding: spacing.md },
  resultValue: { color: colors.accent, fontSize: 24, fontWeight: '900' },
  disclaimer: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing.md }
});
