import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, layout, radius, spacing, type } from '@/theme';
import { PulseMenu } from '@/components/PulseMenu';
import { localDateKey } from '@/domain/schedule';
import { listDoseLogs, listProtocols, listProtocolItems, type TimelineEntry, type TodayItem } from '@/services/pulse';

type TrackedProtocol = { id: string; name: string; status: string; starts_on: string | null; ends_on: string | null };

function dayKey(value: string) {
  return new Date(value).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function LogScreen() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [protocols, setProtocols] = useState<TrackedProtocol[]>([]);
  const [protocolItems, setProtocolItems] = useState<TodayItem[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year' | 'cycle' | 'all'>('week');

  const load = useCallback(async () => {
    try {
      const [logs, nextProtocols, nextItems] = await Promise.all([listDoseLogs(1000), listProtocols(), listProtocolItems()]);
      setEntries(logs);
      setProtocols(nextProtocols);
      setProtocolItems(nextItems);
      setSelectedProtocol((previous) => previous && nextProtocols.some((p) => p.id === previous) ? previous : (nextProtocols[0]?.id ?? null));
    } catch (error) {
      Alert.alert('Could not load timeline', error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const cycleEntries = useMemo(() => {
    if (!selectedProtocol) return [];
    const itemIds = new Set(protocolItems.filter((item) => item.protocol_id === selectedProtocol).map((item) => item.id));
    const protocol = protocols.find((entry) => entry.id === selectedProtocol);
    return entries.filter((entry) => {
      if (!entry.protocol_item_id || !itemIds.has(entry.protocol_item_id)) return false;
      const date = localDateKey(new Date(entry.logged_at));
      return (!protocol?.starts_on || date >= protocol.starts_on) && (!protocol?.ends_on || date <= protocol.ends_on);
    });
  }, [entries, protocolItems, protocols, selectedProtocol]);

  const filteredEntries = useMemo(() => {
    const now = new Date();
    if (viewMode === 'all') return entries;
    if (viewMode === 'cycle') return cycleEntries;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    if (viewMode === 'week') start.setDate(start.getDate() - 6);
    if (viewMode === 'month') start.setDate(1);
    if (viewMode === 'year') start.setMonth(0, 1);
    return entries.filter((entry) => new Date(entry.logged_at) >= start);
  }, [entries, cycleEntries, viewMode]);

  const activity = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(now.getDate() - (6 - index));
      const next = new Date(date);
      next.setDate(date.getDate() + 1);
      const count = (viewMode === 'cycle' ? cycleEntries : entries).filter((entry) => {
        const logged = new Date(entry.logged_at);
        return logged >= date && logged < next;
      }).length;
      return {
        key: localDateKey(date),
        label: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1),
        count,
        today: index === 6
      };
    });
  }, [entries, cycleEntries, viewMode]);

  const maxActivity = useMemo(() => Math.max(1, ...activity.map((day) => day.count)), [activity]);

  const groups = useMemo(() => {
    const map = new Map<string, TimelineEntry[]>();
    for (const entry of filteredEntries) {
      const key = dayKey(entry.logged_at);
      map.set(key, [...(map.get(key) ?? []), entry]);
    }
    return [...map.entries()];
  }, [filteredEntries]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <PulseMenu />
        <Text style={styles.eyebrow}>YOUR HISTORY</Text>
        <Text style={styles.title}>Timeline</Text>
        <Text style={styles.body}>A clear record of what you logged, when you logged it, and where.</Text>

        <View style={styles.modeStrip}>{(['day', 'week', 'month', 'year', 'cycle', 'all'] as const).map((mode) => <Pressable accessibilityRole="button" accessibilityState={{ selected: viewMode === mode }} key={mode} style={[styles.modeButton, viewMode === mode && styles.modeButtonActive]} onPress={() => setViewMode(mode)}><Text style={[styles.modeText, viewMode === mode && styles.modeTextActive]}>{mode.toUpperCase()}</Text></Pressable>)}</View>
        {viewMode === 'cycle' ? (
          <View style={styles.cycleSelector}>
            <Text style={styles.signalEyebrow}>SELECT PROTOCOL / CYCLE</Text>
            {protocols.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cycleOptions}>{protocols.map((protocol) => <Pressable key={protocol.id} onPress={() => setSelectedProtocol(protocol.id)} style={[styles.cyclePill, selectedProtocol === protocol.id && styles.cyclePillActive]} accessibilityRole="button" accessibilityState={{ selected: selectedProtocol === protocol.id }}><Text style={[styles.cyclePillText, selectedProtocol === protocol.id && styles.cyclePillTextActive]}>{protocol.name}</Text></Pressable>)}</ScrollView> : <Text style={styles.detail}>Create a protocol to explore its activity by cycle.</Text>}
            <Text style={styles.cycleHint}>Showing recorded events associated with the selected protocol, within its start/end dates when defined.</Text>
          </View>
        ) : null}
        <View style={styles.signalCard}>
          <View style={styles.signalHeader}>
            <View>
              <Text style={styles.signalEyebrow}>ACTIVITY SIGNAL</Text>
              <Text style={styles.signalTitle}>{viewMode === 'cycle' ? 'Cycle activity · last 7 days' : 'Last 7 days · overview'}</Text>
            </View>
            <Text style={styles.signalTotal}>{viewMode === 'cycle' ? cycleEntries.length : filteredEntries.length}</Text>
          </View>
          <View style={styles.signalStrip}>
            {activity.map((day) => (
              <View key={day.key} style={styles.signalDay}>
                <View style={styles.signalTrack}>
                  <View style={[styles.signalFill, { height: Math.max(3, Math.round((day.count / maxActivity) * 42)) }, day.count === 0 && styles.signalFillEmpty]} />
                </View>
                <Text style={[styles.signalLabel, day.today && styles.signalLabelToday]}>{day.label}</Text>
                <Text style={[styles.signalCount, day.count > 0 && styles.signalCountActive]}>{day.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {filteredEntries.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyDot} />
            <Text style={styles.cardTitle}>{viewMode === 'cycle' ? 'No records for this cycle yet.' : 'Your timeline starts here.'}</Text>
            <Text style={styles.detail}>Log an item from Today and its history will appear automatically.</Text>
          </View>
        ) : groups.map(([day, dayEntries]) => (
          <View key={day} style={styles.group}>
            <Text style={styles.dayLabel}>{day.toUpperCase()}</Text>
            {dayEntries.map((entry, index) => (
              <View key={entry.id} style={styles.timelineRow}>
                <View style={styles.rail}>
                  <View style={styles.dot} />
                  {index < dayEntries.length - 1 ? <View style={styles.line} /> : null}
                </View>
                <View style={styles.card}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{entry.protocol_items?.name ?? 'Protocol item'}</Text>
                      <Text style={styles.dose}>{entry.amount} {entry.unit}{entry.route ? ` · ${entry.route}` : ''}</Text>
                    </View>
                    <Text style={styles.time}>{new Date(entry.logged_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
                  </View>
                  {entry.site ? <Text style={styles.site}>SITE · {entry.site}</Text> : null}
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>{(entry.status || 'logged').toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: layout.pageInset, paddingBottom: layout.pageBottom },
  modeStrip: { flexDirection: 'row', gap: 5, marginBottom: 14 },
  cycleSelector: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.accentBorder, borderRadius: radius.lg, padding: layout.cardInset, marginBottom: spacing.md, gap: 10 },
  cycleOptions: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  cyclePill: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 11, minHeight: 42 },
  cyclePillActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  cyclePillText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  cyclePillTextActive: { color: colors.accent },
  cycleHint: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  modeButton: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center', backgroundColor: colors.bgElevated },
  modeButtonActive: { borderColor: colors.accentBorder, backgroundColor: colors.accentSoft },
  modeText: { fontSize: 8, fontWeight: '900', color: colors.muted },
  modeTextActive: { color: colors.accent },
  eyebrow: { color: colors.accent, fontSize: type.eyebrow, fontWeight: '900', letterSpacing: 1.8, marginTop: spacing.md },
  title: { color: colors.text, fontSize: type.title, fontWeight: '800', letterSpacing: -1.4, marginTop: spacing.sm },
  body: { color: colors.muted, fontSize: type.body, lineHeight: 21, marginTop: spacing.sm, marginBottom: spacing.xl, maxWidth: 340 },
  signalCard: { backgroundColor: colors.bgElevated, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.accentBorder, padding: spacing.lg, marginBottom: spacing.md },
  signalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  signalEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  signalTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 4 },
  signalTotal: { color: colors.accent, fontSize: 28, lineHeight: 32, fontWeight: '900', fontVariant: ['tabular-nums'] },
  signalStrip: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginTop: spacing.lg },
  signalDay: { flex: 1, alignItems: 'center' },
  signalTrack: { width: 10, height: 46, borderRadius: radius.pill, backgroundColor: colors.border, justifyContent: 'flex-end', overflow: 'hidden' },
  signalFill: { width: '100%', backgroundColor: colors.accent, borderRadius: radius.pill },
  signalFillEmpty: { backgroundColor: colors.subtle, opacity: .45 },
  signalLabel: { color: colors.subtle, fontSize: 9, fontWeight: '900', marginTop: 7 },
  signalLabelToday: { color: colors.accent },
  signalCount: { color: colors.subtle, fontSize: 8, fontWeight: '900', marginTop: 2, fontVariant: ['tabular-nums'] },
  signalCountActive: { color: colors.text },
  group: { marginBottom: spacing.lg },
  dayLabel: { color: colors.subtle, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginBottom: spacing.sm, marginLeft: 4 },
  timelineRow: { flexDirection: 'row', alignItems: 'stretch' },
  rail: { width: 24, alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent, marginTop: 22, zIndex: 2 },
  line: { width: 1, flex: 1, backgroundColor: colors.border, marginTop: -1 },
  card: { flex: 1, backgroundColor: colors.panel, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  dose: { color: colors.muted, marginTop: 5, lineHeight: 19, textTransform: 'capitalize' },
  time: { color: colors.accent, fontWeight: '800', fontSize: 12 },
  site: { color: colors.subtle, fontSize: 10, fontWeight: '800', letterSpacing: .8, marginTop: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  statusText: { color: colors.subtle, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  emptyCard: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, alignItems: 'flex-start' },
  emptyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, marginBottom: spacing.lg },
  detail: { color: colors.muted, marginTop: 6, lineHeight: 20 }
});
