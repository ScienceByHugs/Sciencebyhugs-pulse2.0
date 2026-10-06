import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';
import { listTodayItems, quickLog, type TodayItem } from '@/services/pulse';

function scheduleLabel(schedule: Record<string, unknown>) {
  const time = typeof schedule?.time === 'string' ? schedule.time : null;
  if (!time) return 'Any time';
  const [hourText, minute = '00'] = time.split(':');
  const hour = Number(hourText);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

export default function TodayScreen() {
  const [items, setItems] = useState<TodayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingId, setLoggingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await listTodayItems());
    } catch (error) {
      Alert.alert('Could not load Today', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function log(item: TodayItem) {
    try {
      setLoggingId(item.id);
      await quickLog(item);
      await load();
      Alert.alert('Logged', `${item.name} · ${item.dose_amount} ${item.dose_unit}`);
    } catch (error) {
      Alert.alert('Could not log dose', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoggingId(null);
    }
  }

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.accent} />}
      >
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.eyebrow}>SCIENCE BY HUGS</Text>
            <Text style={styles.logo}>PULSE</Text>
          </View>
          <View style={styles.livePill}><Text style={styles.liveText}>LIVE</Text></View>
        </View>

        <Text style={styles.greeting}>Today.</Text>
        <Text style={styles.date}>{dateLabel}</Text>

        {loading && items.length === 0 ? <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} /> : null}

        {!loading && items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.cardTitle}>Your day is clear.</Text>
            <Text style={styles.detail}>Create your first protocol in the Protocol tab to start tracking.</Text>
          </View>
        ) : null}

        {items.map((item, index) => {
          const inventory = item.inventory_containers?.find((container) => container.is_active);
          const low = inventory ? inventory.remaining_amount <= inventory.low_threshold : false;
          const estimatedDoses = inventory && item.dose_amount > 0
            ? Math.floor(inventory.remaining_amount / item.dose_amount)
            : null;

          return (
            <View key={item.id}>
              <Text style={styles.sectionLabel}>{index === 0 ? 'NEXT' : 'TODAY'}</Text>
              <View style={[styles.heroCard, low && styles.lowCard]}>
                <View style={styles.heroTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName}>{item.name}</Text>
                    <Text style={styles.detail}>{item.dose_amount} {item.dose_unit} · {item.route}</Text>
                  </View>
                  <View style={styles.duePill}><Text style={styles.dueText}>{scheduleLabel(item.schedule)}</Text></View>
                </View>

                {inventory ? (
                  <View style={styles.inventoryRow}>
                    <Text style={styles.inventoryText}>{inventory.remaining_amount} {inventory.unit} remaining</Text>
                    <Text style={[styles.inventoryText, low && styles.lowText]}>
                      {low ? 'LOW' : estimatedDoses !== null ? `~${estimatedDoses} doses` : ''}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.inventoryText}>No inventory attached · logging still available</Text>
                )}

                <Pressable
                  style={[styles.primaryButton, loggingId === item.id && styles.disabled]}
                  disabled={loggingId === item.id}
                  onPress={() => void log(item)}
                >
                  <Text style={styles.primaryButtonText}>{loggingId === item.id ? 'LOGGING…' : 'LOG DOSE'}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: spacing.lg, paddingBottom: 40, gap: spacing.sm },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  eyebrow: { color: colors.muted, fontSize: 10, letterSpacing: 2.4, fontWeight: '700' },
  logo: { color: colors.text, fontSize: 28, letterSpacing: 6, fontWeight: '800' },
  livePill: { borderRadius: 999, borderWidth: 1, borderColor: colors.accentBorder, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.accentSoft },
  liveText: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  greeting: { color: colors.text, fontSize: type.hero, fontWeight: '700', letterSpacing: -1 },
  date: { color: colors.muted, fontSize: 14, marginBottom: spacing.md },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginTop: spacing.md, marginBottom: 2 },
  heroCard: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.accentBorder, gap: spacing.md },
  lowCard: { borderColor: '#8f6b3d' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  medName: { color: colors.text, fontSize: 22, fontWeight: '700' },
  detail: { color: colors.muted, marginTop: 4, fontSize: 13, lineHeight: 19 },
  duePill: { backgroundColor: colors.accentSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  dueText: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: .7 },
  inventoryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  inventoryText: { color: colors.muted, fontSize: 12 },
  lowText: { color: '#f6bd75', fontWeight: '900' },
  primaryButton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { color: '#03111f', fontWeight: '900', letterSpacing: 1.1 },
  emptyCard: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.lg },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  disabled: { opacity: .55 }
});
