import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';
import { listDoseLogs, type TimelineEntry } from '@/services/pulse';

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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.eyebrow}>HISTORY</Text>
        <Text style={styles.title}>Timeline</Text>
        <Text style={styles.body}>Every logged administration appears here in chronological order.</Text>

        {entries.length === 0 ? (
          <View style={styles.card}><Text style={styles.cardTitle}>Nothing logged yet.</Text><Text style={styles.detail}>Use Log Dose on Today and your history will appear here.</Text></View>
        ) : entries.map((entry) => (
          <View style={styles.card} key={entry.id}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{entry.protocol_items?.name ?? 'Protocol item'}</Text>
                <Text style={styles.detail}>{entry.amount} {entry.unit}{entry.route ? ` · ${entry.route}` : ''}{entry.site ? ` · ${entry.site}` : ''}</Text>
              </View>
              <Text style={styles.time}>{new Date(entry.logged_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
            </View>
            <Text style={styles.date}>{new Date(entry.logged_at).toLocaleDateString()}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: spacing.lg, paddingBottom: 42 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.8, marginTop: spacing.md },
  title: { color: colors.text, fontSize: type.hero, fontWeight: '800', letterSpacing: -1, marginTop: spacing.sm },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.xl },
  card: { backgroundColor: colors.panel, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  detail: { color: colors.muted, marginTop: 6, lineHeight: 20 },
  time: { color: colors.accent, fontWeight: '800', fontSize: 12 },
  date: { color: colors.muted, fontSize: 11, marginTop: 8 }
});
