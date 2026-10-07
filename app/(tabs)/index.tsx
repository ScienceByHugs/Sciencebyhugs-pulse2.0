import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Animated, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';
import { flushQuickLogOutbox, listDoseLogs, listRecentSites, listTodayItems, quickLog, type TimelineEntry, type TodayItem } from '@/services/pulse';
import { isDueOnDate, scheduleTime } from '@/domain/schedule';
import { sitesForRoute, suggestSite } from '@/domain/sites';
import { rescheduleReminders } from '@/lib/reminders';
import { updatePulseTodayWidget } from '@/lib/widgets';

function timeLabel(value?: string) {
  if (!value) return 'Any time';
  const [hourText, minute = '00'] = value.split(':');
  const hour = Number(hourText);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${minute} ${suffix}`;
}

export default function TodayScreen() {
  const [allItems, setAllItems] = useState<TodayItem[]>([]);
  const [todayLogs, setTodayLogs] = useState<TimelineEntry[]>([]);
  const [recentSites, setRecentSites] = useState<Record<string, string[]>>({});
  const [selectedSites, setSelectedSites] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [recentLogAt, setRecentLogAt] = useState<Record<string, number>>({});
  const completionPulse = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      await flushQuickLogOutbox();
      const [items, sites, logs] = await Promise.all([listTodayItems(), listRecentSites(), listDoseLogs(150)]);
      setAllItems(items);
      setTodayLogs(logs);
      const dueItems = items.filter((item) => isDueOnDate(item.schedule));
      const nextTime = dueItems.length ? timeLabel(scheduleTime(dueItems[0]?.schedule ?? {})) : 'Open Pulse';
      await Promise.all([rescheduleReminders(items), updatePulseTodayWidget(dueItems.length, nextTime)]);
      setRecentSites(sites);
      setSelectedSites((current) => {
        const next = { ...current };
        for (const item of items) {
          if (!next[item.id] && item.site_rotation_enabled) {
            const site = suggestSite(item.route, sites[item.id] ?? []);
            if (site) next[item.id] = site;
          }
        }
        return next;
      });
    } catch (error) {
      Alert.alert('Could not load Today', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const items = useMemo(
    () => allItems
      .filter((item) => isDueOnDate(item.schedule))
      .sort((a, b) => (scheduleTime(a.schedule) ?? '99:99').localeCompare(scheduleTime(b.schedule) ?? '99:99')),
    [allItems]
  );

  const completion = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const completedIds = new Set(todayLogs.filter((entry) => {
      const logged = new Date(entry.logged_at);
      return logged >= start && logged < end && entry.protocol_item_id;
    }).map((entry) => entry.protocol_item_id as string));
    const completed = items.filter((item) => completedIds.has(item.id)).length;
    return {
      completed,
      due: items.length,
      percent: items.length ? Math.round((completed / items.length) * 100) : 100,
      completedIds
    };
  }, [items, todayLogs]);

  const dayBrief = useMemo(() => {
    const lowSupply = allItems.filter((item) => {
      const inventory = item.inventory_containers?.find((container) => container.is_active);
      return inventory ? inventory.remaining_amount <= inventory.low_threshold : false;
    }).length;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const timedItems = items
      .map((item) => ({ item, time: scheduleTime(item.schedule) }))
      .filter((entry): entry is { item: TodayItem; time: string } => Boolean(entry.time));
    const upcoming = timedItems.find(({ time }) => {
      const [hour = '0', minute = '0'] = time.split(':');
      return Number(hour) * 60 + Number(minute) >= currentMinutes;
    });
    const untimedRemaining = items.some((item) => !scheduleTime(item.schedule) && !completion.completedIds.has(item.id));
    const nextTime = upcoming ? timeLabel(upcoming.time) : untimedRemaining ? 'ANY TIME' : items.length ? 'COMPLETE' : 'CLEAR';
    return { lowSupply, nextTime, scheduled: timedItems.length };
  }, [allItems, items, completion.completedIds]);

  function cycleSite(item: TodayItem) {
    const options = sitesForRoute(item.route);
    if (!options.length) return;
    const current = selectedSites[item.id] ?? '';
    const index = Math.max(0, options.indexOf(current));
    const nextSite = options[(index + 1) % options.length];
    if (!nextSite) return;
    setSelectedSites((state) => ({ ...state, [item.id]: nextSite }));
  }

  async function log(item: TodayItem) {
    if (loggingId === item.id || recentLogAt[item.id]) return;
    try {
      setLoggingId(item.id);
      const result = await quickLog(item, selectedSites[item.id]);
      const loggedAt = Date.now();
      completionPulse.stopAnimation();
      completionPulse.setValue(0);
      Animated.sequence([
        Animated.timing(completionPulse, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(completionPulse, { toValue: 0, duration: 520, useNativeDriver: true })
      ]).start();
      setRecentLogAt((current) => ({ ...current, [item.id]: loggedAt }));
      setTimeout(() => {
        setRecentLogAt((current) => {
          if (current[item.id] !== loggedAt) return current;
          const next = { ...current };
          delete next[item.id];
          return next;
        });
      }, 5000);
      if (!result.queued) await load();
      Alert.alert(result.queued ? 'Saved offline' : 'Logged', result.queued ? 'Pulse will sync this log when your connection returns.' : `${item.name} · ${item.dose_amount} ${item.dose_unit}`);
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

        <View style={styles.heroHeader}>
          <Animated.View pointerEvents="none" style={[styles.completionPulse, {
            opacity: completionPulse.interpolate({ inputRange: [0, 1], outputRange: [0, .24] }),
            transform: [{ scale: completionPulse.interpolate({ inputRange: [0, 1], outputRange: [.72, 1.18] }) }]
          }]} />
          <Text style={styles.greeting}>Your day,<Text style={styles.accentWord}> simplified.</Text></Text>
          <Text style={styles.date}>{dateLabel}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCell}><Text style={styles.summaryNumber}>{items.length}</Text><Text style={styles.summaryLabel}>DUE TODAY</Text></View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCell}><Text style={styles.summaryNumber}>{allItems.length}</Text><Text style={styles.summaryLabel}>ACTIVE ITEMS</Text></View>
          </View>

          <View style={styles.daySignalCard}>
            <View style={styles.daySignalHeader}>
              <View>
                <Text style={styles.briefEyebrow}>DAY SIGNAL</Text>
                <Text style={styles.daySignalTitle}>{completion.due ? `${completion.completed} of ${completion.due} logged` : 'Nothing due today'}</Text>
              </View>
              <Text style={styles.daySignalPercent}>{completion.percent}%</Text>
            </View>
            <View style={styles.daySignalTrack}>
              <View style={[styles.daySignalFill, { width: `${completion.percent}%` as `${number}%` }]} />
            </View>
            <View style={styles.daySignalNodes}>
              {(items.length ? items : [null]).map((item, index) => {
                const active = item ? completion.completedIds.has(item.id) : true;
                return <View key={item?.id ?? 'clear'} style={[styles.daySignalNode, active && styles.daySignalNodeActive]} />;
              })}
            </View>
          </View>

          <View style={styles.briefCard}>
            <View style={styles.briefHeader}>
              <View>
                <Text style={styles.briefEyebrow}>PULSE BRIEF</Text>
                <Text style={styles.briefTitle}>{items.length ? 'Your day is in motion.' : 'Your schedule is clear.'}</Text>
              </View>
              <View style={[styles.briefStatus, items.length === 0 && styles.briefStatusClear]}>
                <Text style={styles.briefStatusText}>{items.length ? 'ACTIVE' : 'CLEAR'}</Text>
              </View>
            </View>
            <View style={styles.briefSignals}>
              <View style={styles.briefSignal}>
                <Text style={styles.briefValue}>{dayBrief.nextTime}</Text>
                <Text style={styles.briefLabel}>NEXT WINDOW</Text>
              </View>
              <View style={styles.briefSignalDivider} />
              <View style={styles.briefSignal}>
                <Text style={styles.briefValue}>{dayBrief.scheduled}</Text>
                <Text style={styles.briefLabel}>TIMED ITEMS</Text>
              </View>
              <View style={styles.briefSignalDivider} />
              <View style={styles.briefSignal}>
                <Text style={[styles.briefValue, dayBrief.lowSupply > 0 && styles.briefWarning]}>{dayBrief.lowSupply}</Text>
                <Text style={styles.briefLabel}>LOW SUPPLY</Text>
              </View>
            </View>
          </View>
        </View>

        {loading && allItems.length === 0 ? <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} /> : null}

        {!loading && items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.cardTitle}>Nothing scheduled today.</Text>
            <Text style={styles.detail}>{allItems.length ? 'Your active routine has no items due today.' : 'Create your first protocol in the Protocol tab to start tracking.'}</Text>
          </View>
        ) : null}

        {items.map((item, index) => {
          const inventory = item.inventory_containers?.find((container) => container.is_active);
          const low = inventory ? inventory.remaining_amount <= inventory.low_threshold : false;
          const estimatedDoses = inventory && item.dose_amount > 0 ? Math.floor(inventory.remaining_amount / item.dose_amount) : null;
          const site = selectedSites[item.id];

          return (
            <View key={item.id}>
              <Text style={styles.sectionLabel}>{index === 0 ? 'NEXT' : 'TODAY'}</Text>
              <View style={[styles.heroCard, low && styles.lowCard, completion.completedIds.has(item.id) && styles.completedCard]}>
                <View style={styles.heroTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName}>{item.name}</Text>
                    <Text style={styles.detail}>{item.dose_amount} {item.dose_unit} · {item.route}</Text>
                    {completion.completedIds.has(item.id) ? <Text style={styles.completedLabel}>LOGGED TODAY</Text> : null}
                  </View>
                  <View style={styles.duePill}><Text style={styles.dueText}>{timeLabel(scheduleTime(item.schedule))}</Text></View>
                </View>

                {site ? (
                  <Pressable style={styles.siteRow} onPress={() => cycleSite(item)}>
                    <View>
                      <Text style={styles.smallLabel}>SITE</Text>
                      <Text style={styles.siteText}>{site}</Text>
                    </View>
                    <Text style={styles.changeText}>CHANGE</Text>
                  </Pressable>
                ) : null}

                {inventory ? (
                  <View style={styles.inventoryRow}>
                    <Text style={styles.inventoryText}>{inventory.remaining_amount} {inventory.unit} remaining</Text>
                    <Text style={[styles.inventoryText, low && styles.lowText]}>{low ? 'LOW' : estimatedDoses !== null ? `~${estimatedDoses} doses` : ''}</Text>
                  </View>
                ) : (
                  <Text style={styles.inventoryText}>No inventory attached · logging still available</Text>
                )}

                <Pressable
                  style={[styles.primaryButton, loggingId === item.id && styles.disabled]}
                  disabled={loggingId === item.id || Boolean(recentLogAt[item.id])}
                  onPress={() => void log(item)}
                >
                  <Text style={styles.primaryButtonText}>{loggingId === item.id ? 'LOGGING…' : recentLogAt[item.id] ? 'LOGGED ✓' : 'LOG DOSE'}</Text>
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
  page: { padding: spacing.lg, paddingBottom: 118, gap: spacing.sm },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl, paddingTop: spacing.sm },
  eyebrow: { color: colors.muted, fontSize: 10, letterSpacing: 2.4, fontWeight: '700' },
  logo: { color: colors.text, fontSize: 24, letterSpacing: 7, fontWeight: '900' },
  livePill: { borderRadius: 999, borderWidth: 1, borderColor: colors.accentBorder, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.accentSoft },
  liveText: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  completionPulse: { position: 'absolute', top: 86, alignSelf: 'center', width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: colors.accent },
  heroHeader: { marginBottom: spacing.lg },
  daySignalCard: { marginTop: spacing.md, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.accentBorder, borderRadius: radius.xl, padding: spacing.md },
  daySignalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  daySignalTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 3 },
  daySignalPercent: { color: colors.accent, fontSize: 22, lineHeight: 26, fontWeight: '900', fontVariant: ['tabular-nums'] },
  daySignalTrack: { height: 5, backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.md },
  daySignalFill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.pill },
  daySignalNodes: { flexDirection: 'row', gap: 5, marginTop: spacing.sm },
  daySignalNode: { flex: 1, height: 3, borderRadius: radius.pill, backgroundColor: colors.border },
  daySignalNodeActive: { backgroundColor: colors.accent },
  briefCard: { marginTop: spacing.md, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.accentBorder, borderRadius: radius.xl, padding: spacing.md },
  briefHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  briefEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  briefTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 3 },
  briefStatus: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentBorder, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  briefStatusClear: { opacity: .72 },
  briefStatusText: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: .9 },
  briefSignals: { flexDirection: 'row', alignItems: 'stretch', marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  briefSignal: { flex: 1, minWidth: 0 },
  briefSignalDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 8 },
  briefValue: { color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  briefWarning: { color: colors.warning },
  briefLabel: { color: colors.subtle, fontSize: 7, fontWeight: '900', letterSpacing: .9, marginTop: 2 },
  greeting: { color: colors.text, fontSize: type.hero, fontWeight: '700', letterSpacing: -1.6, lineHeight: 44, maxWidth: 320 },
  accentWord: { color: colors.accent },
  date: { color: colors.muted, fontSize: 14, marginTop: spacing.sm, marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', backgroundColor: colors.bgElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: 15 },
  summaryCell: { flex: 1, paddingHorizontal: spacing.md },
  summaryNumber: { color: colors.text, fontSize: 22, lineHeight: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  summaryLabel: { color: colors.subtle, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginTop: 3 },
  summaryDivider: { width: 1, backgroundColor: colors.border },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginTop: spacing.md, marginBottom: 2 },
  heroCard: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  lowCard: { borderColor: '#8f6b3d' },
  completedCard: { borderColor: colors.accentBorder, backgroundColor: colors.bgElevated },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  medName: { color: colors.text, fontSize: 22, fontWeight: '700' },
  completedLabel: { color: colors.success, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginTop: 7 },
  detail: { color: colors.muted, marginTop: 4, fontSize: 13, lineHeight: 19 },
  duePill: { backgroundColor: colors.accentSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  dueText: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: .7, fontVariant: ['tabular-nums'] },
  siteRow: { backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  siteText: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 3 },
  changeText: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  inventoryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  inventoryText: { color: colors.muted, fontSize: 12, lineHeight: 18, fontVariant: ['tabular-nums'] },
  lowText: { color: '#f6bd75', fontWeight: '900' },
  primaryButton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 2 },
  primaryButtonText: { color: '#03111f', fontWeight: '900', letterSpacing: 1.1 },
  emptyCard: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.lg },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  disabled: { opacity: .55 }
});
