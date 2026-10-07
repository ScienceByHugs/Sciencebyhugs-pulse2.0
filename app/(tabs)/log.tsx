import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';
import { listDoseLogs, type TimelineEntry } from '@/services/pulse';

function dayKey(value: string) {
  return new Date(value).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function LogScreen() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);

  const load = useCallback(async () => {
    try {
      setEntries(await listDoseLogs());
    } catch (error) {
      Alert.alert('Could not load timeline', error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const groups = useMemo(() => {
    const map = new Map<string, TimelineEntry[]>();
    for (const entry of entries) {
      const key = dayKey(entry.logged_at);
      map.set(key, [...(map.get(key) ?? []), entry]);
    }
    return [...map.entries()];
  }, [entries]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YOUR HISTORY</Text>
        <Text style={styles.title}>Timeline</Text>
        <Text style={styles.body}>A clear record of what you logged, when you logged it, and where.</Text>

        {entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyDot} />
            <Text style={styles.cardTitle}>Your timeline starts here.</Text>
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
  page: { padding: spacing.lg, paddingBottom: 118 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.8, marginTop: spacing.md },
  title: { color: colors.text, fontSize: type.hero, fontWeight: '800', letterSpacing: -1.4, marginTop: spacing.sm },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.xl, maxWidth: 340 },
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
