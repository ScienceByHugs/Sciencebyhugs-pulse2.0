import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { AccessibilityInfo, ActivityIndicator, Alert, Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, layout, radius, spacing, type } from '@/theme';
import { PulseMenu } from '@/components/PulseMenu';
import { flushQuickLogOutbox, listDoseLogs, listRecentSites, listTodayItems, listProtocolItems, listProtocols, quickLog, type TimelineEntry, type TodayItem } from '@/services/pulse';
import { isDueOnDate, localDateKey, localDayRange, nextScheduledTimeToday, scheduleTime } from '@/domain/schedule';
import { sitesForRoute, suggestSite } from '@/domain/sites';
import { rescheduleReminders } from '@/lib/reminders';
import { notifyLowStock } from '@/lib/lowStock';
import { updatePulseTodayWidget } from '@/lib/widgets';
import { useAuth } from '@/providers/AuthProvider';
import { calculateSevenDayConsistency } from '@/domain/insights';

function timeLabel(value?: string) {
  if (!value) return 'Any time';
  const [hourText, minute = '00'] = value.split(':');
  const hour = Number(hourText);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${minute} ${suffix}`;
}

export default function TodayScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const entrance = useRef(new Animated.Value(0)).current;
  const firstName = String(session?.user.user_metadata?.first_name ?? session?.user.user_metadata?.full_name ?? '').trim().split(/\s+/)[0] || '';
  const [allItems, setAllItems] = useState<TodayItem[]>([]);
  const [excludedItems, setExcludedItems] = useState<Array<{ id: string; name: string; reason: string }>>([]);
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
      const [items, sites, logs, tracked, protocols] = await Promise.all([listTodayItems(), listRecentSites(), listDoseLogs(150), listProtocolItems(), listProtocols()]);
      const protocolById = new Map(protocols.map((protocol) => [protocol.id, protocol]));
      const todayKey = localDateKey();
      const eligibleIds = new Set(items.map((item) => item.id));
      setExcludedItems(tracked.filter((item) => !item.archived_at && (!eligibleIds.has(item.id) || !isDueOnDate(item.schedule))).map((item) => {
        const protocol = protocolById.get(item.protocol_id);
        let reason = 'Not scheduled for today';
        if (item.archived_at) reason = 'Archived';
        else if (item.active === false) reason = 'Substance paused';
        else if (!protocol) reason = 'Protocol not found';
        else if (protocol.status !== 'active') reason = 'Protocol ' + protocol.status;
        else if (protocol.starts_on && todayKey < protocol.starts_on) reason = 'Protocol has not started';
        else if (protocol.ends_on && todayKey > protocol.ends_on) reason = 'Protocol has ended';
        else if (!isDueOnDate(item.schedule)) reason = 'Not scheduled for today — check weekday, interval, or cycle start date';
        else reason = 'Not available in active tracking';
        return { id: item.id, name: item.name, reason };
      }));
      setAllItems(items);
      setTodayLogs(logs);
      const dueItems = items.filter((item) => isDueOnDate(item.schedule));
      const nextWindow = nextScheduledTimeToday(dueItems.map((item) => item.schedule));
      const nextTime = nextWindow ? timeLabel(nextWindow) : dueItems.length ? 'Any time' : 'Open Pulse';
      await Promise.all([rescheduleReminders(items), updatePulseTodayWidget(dueItems.length, nextTime)]);
      // Notification failures must never block dashboard data or quick logging.
      try { await notifyLowStock(items); } catch { /* retry on next refresh */ }
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

  useFocusEffect(useCallback(() => {
    void load();
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      entrance.stopAnimation();
      entrance.setValue(reduced ? 1 : 0);
      if (!reduced) Animated.timing(entrance, { toValue: 1, duration: 440, useNativeDriver: true }).start();
    }).catch(() => entrance.setValue(1));
  }, [load, entrance]));

  const items = useMemo(
    () => allItems
      .filter((item) => isDueOnDate(item.schedule))
      .sort((a, b) => (scheduleTime(a.schedule) ?? '99:99').localeCompare(scheduleTime(b.schedule) ?? '99:99')),
    [allItems]
  );

  const completion = useMemo(() => {
    const { start, end } = localDayRange();
    const completedIds = new Set(todayLogs.filter((entry) => {
      const logged = new Date(entry.logged_at);
      return logged >= start && logged < end && entry.status === 'completed' && Boolean(entry.protocol_item_id);
    }).map((entry) => entry.protocol_item_id as string));
    const completed = items.filter((item) => completedIds.has(item.id)).length;
    return {
      completed,
      due: items.length,
      percent: items.length ? Math.round((completed / items.length) * 100) : 100,
      completedIds
    };
  }, [items, todayLogs]);

  const pendingItems = useMemo(() => items.filter((item) => !completion.completedIds.has(item.id)), [items, completion.completedIds]);
  const completedItems = useMemo(() => items.filter((item) => completion.completedIds.has(item.id)), [items, completion.completedIds]);

  const dayBrief = useMemo(() => {
    const lowSupply = allItems.filter((item) => {
      const inventory = item.inventory_containers?.find((container) => container.is_active);
      return inventory ? inventory.remaining_amount <= inventory.low_threshold : false;
    }).length;
    const timedItems = items.filter((item) => Boolean(scheduleTime(item.schedule)));
    const upcoming = nextScheduledTimeToday(items.filter((item) => !completion.completedIds.has(item.id)).map((item) => item.schedule));
    const untimedRemaining = items.some((item) => !scheduleTime(item.schedule) && !completion.completedIds.has(item.id));
    const nextTime = upcoming ? timeLabel(upcoming) : untimedRemaining ? 'ANY TIME' : items.length === 0 ? 'CLEAR' : completion.completed === items.length ? 'COMPLETE' : 'NO WINDOW';
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

  const consistency = useMemo(() => calculateSevenDayConsistency(allItems, todayLogs), [allItems, todayLogs]);
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.accent} />}
      >
        <PulseMenu />

        <Animated.View style={[styles.heroHeader, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
          <Animated.View pointerEvents="none" style={[styles.completionPulse, {
            opacity: completionPulse.interpolate({ inputRange: [0, 1], outputRange: [0, .24] }),
            transform: [{ scale: completionPulse.interpolate({ inputRange: [0, 1], outputRange: [.72, 1.18] }) }]
          }]} />
          <Text style={styles.heroKicker}>THE DAILY EDITION · SCIENCE BY HUGS</Text>
          <Text style={styles.greeting}>{firstName ? `Welcome back, ${firstName}.` : 'Welcome to Pulse.'}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCell}><Text style={styles.summaryNumber}>{items.length}</Text><Text style={styles.summaryLabel}>DUE TODAY</Text></View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCell}><Text style={styles.summaryNumber}>{allItems.length}</Text><Text style={styles.summaryLabel}>ACTIVE ITEMS</Text></View>
          </View>

          <View style={styles.heroFooter}>
            <View style={styles.heroFooterBar} />
            <Text style={styles.heroFooterText}>{pendingItems.length ? `${pendingItems.length} AWAITING YOUR LOG` : 'YOUR DAY, AT A GLANCE'}</Text>
          </View>
        </Animated.View>

        {loading && allItems.length === 0 ? <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} /> : null}

        {!loading && items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.cardTitle}>Nothing scheduled today.</Text>
            <Text style={styles.detail}>{allItems.length ? 'Your active routine has no items due today.' : 'Create your first protocol in the Protocol tab to start tracking.'}</Text>
          </View>
        ) : null}

        {!loading && excludedItems.length > 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.cardTitle}>Other tracked substances</Text>
            <Text style={styles.detail}>These are in Protocol but not on today's due list. Select Edit Schedule or resume them in Protocol to adjust.</Text>
            {excludedItems.map((item) => <Text key={item.id} style={styles.detail}>{item.name} · {item.reason}</Text>)}
            <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/protocol')}><Text style={styles.createActionText}>OPEN PROTOCOL →</Text></Pressable>
          </View>
        ) : null}

        {allItems.length === 0 && !loading ? <Pressable accessibilityRole="button" style={styles.createAction} onPress={() => router.push('/(tabs)/protocol')}><Text style={styles.createActionText}>＋ CREATE YOUR FIRST PROTOCOL</Text><Text style={styles.createActionArrow}>↗</Text></Pressable> : null}

        {[...pendingItems, ...completedItems].map((item, index) => {
          const inventory = item.inventory_containers?.find((container) => container.is_active);
          const low = inventory ? inventory.remaining_amount <= inventory.low_threshold : false;
          const estimatedDoses = inventory && item.dose_amount > 0 ? Math.floor(inventory.remaining_amount / item.dose_amount) : null;
          const site = selectedSites[item.id];

          return (
            <View key={item.id}>
              <Text style={styles.sectionLabel}>{completion.completedIds.has(item.id) ? (index === pendingItems.length ? 'COMPLETED TODAY' : 'COMPLETED') : (index === 0 ? 'UP NEXT' : 'UPCOMING')}</Text>
              <View style={[styles.heroCard, low && styles.lowCard, completion.completedIds.has(item.id) && styles.completedCard]}>
                <View style={styles.heroTop}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.substanceKind}>{item.category?.toUpperCase() ?? 'TRACKED SUBSTANCE'}</Text>
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
                  <Text style={styles.inventoryText}>INVENTORY NOT TRACKED</Text>
                )}

                <Pressable
                  style={[styles.primaryButton, loggingId === item.id && styles.disabled]}
                  disabled={loggingId === item.id || Boolean(recentLogAt[item.id])}
                  onPress={() => void log(item)}
                >
                  <Text style={styles.primaryButtonText}>{loggingId === item.id ? 'LOGGING…' : recentLogAt[item.id] ? 'LOGGED ✓' : completion.completedIds.has(item.id) ? 'LOG ANOTHER ENTRY' : 'CONFIRM LOG'}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>Your daily signals</Text>
          <Text style={styles.dashboardHint}>A useful summary, below your actions.</Text>
        </View>
        <View style={styles.consistencyCard}>
          <Text style={styles.briefEyebrow}>7-DAY RECORD</Text>
          <Text style={styles.consistencyValue}>{consistency.due ? `${consistency.completed}/${consistency.due}` : '—'}</Text>
          <Text style={styles.consistencyCaption}>{consistency.due ? 'Scheduled occurrences recorded' : 'No scheduled occurrences in this period'}</Text>
        </View>
        <View style={styles.dashboardSignals}>
          <View style={styles.daySignalCard}>
            <View style={styles.daySignalHeader}>
              <View>
                <Text style={styles.briefEyebrow}>DAY SIGNAL</Text>
                <Text style={styles.daySignalTitle}>{completion.due ? `${completion.completed} of ${completion.due} logged` : 'Nothing due today'}</Text>
              </View>
              <Text style={styles.daySignalPercent}>{completion.due ? `${completion.percent}%` : 'CLEAR'}</Text>
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

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: layout.pageInset, paddingBottom: layout.pageBottom, gap: spacing.sm },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, paddingTop: 0 },
  eyebrow: { color: colors.muted, fontSize: 10, letterSpacing: 2.4, fontWeight: '700' },
  logo: { color: colors.text, fontSize: 24, letterSpacing: 7, fontWeight: '900' },
  livePill: { borderRadius: 999, borderWidth: 1, borderColor: colors.accentBorder, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.accentSoft },
  liveText: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  completionPulse: { position: 'absolute', top: 56, alignSelf: 'center', width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: colors.accent },
  heroHeader: { marginBottom: 2, borderRadius: radius.xl, padding: 12, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.accentBorder, overflow: 'hidden' },
  heroKicker: { color: colors.accent, fontSize: type.eyebrow, fontWeight: '900', letterSpacing: 1.6, marginBottom: 4 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 7, gap: 8 },
  heroFooterBar: { width: 18, height: 3, backgroundColor: colors.success, borderRadius: 2 },
  heroFooterText: { flex: 1, color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: .7 },
  heroFooterIndex: { color: colors.subtle, fontSize: 9, fontWeight: '900', letterSpacing: .7 },
  substanceKind: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginBottom: 5 },
  createAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, backgroundColor: colors.accent, paddingHorizontal: spacing.md, borderRadius: radius.lg },
  createActionText: { color: colors.bg, fontSize: 12, fontWeight: '900', letterSpacing: .6 },
  createActionArrow: { color: colors.bg, fontSize: 23, fontWeight: '800' },
  dashboardHeader: { marginTop: spacing.lg },
  dashboardTitle: { color: colors.text, fontSize: 21, fontWeight: '900', letterSpacing: -.6 },
  dashboardHint: { color: colors.muted, fontSize: 12, marginTop: 3 },
  dashboardSignals: { gap: spacing.sm },
  consistencyCard: { padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  consistencyValue: { color: colors.text, fontSize: 29, lineHeight: 35, fontWeight: '900', fontVariant: ['tabular-nums'], marginTop: 5 },
  consistencyCaption: { color: colors.muted, fontSize: 11, marginTop: 3 },
  daySignalCard: { marginTop: spacing.sm, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.accentBorder, borderRadius: radius.xl, padding: spacing.md },
  daySignalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  daySignalTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 3 },
  daySignalPercent: { color: colors.accent, fontSize: 22, lineHeight: 26, fontWeight: '900', fontVariant: ['tabular-nums'] },
  daySignalTrack: { height: 5, backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.md },
  daySignalFill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.pill },
  daySignalNodes: { flexDirection: 'row', gap: 5, marginTop: spacing.sm },
  daySignalNode: { flex: 1, height: 3, borderRadius: radius.pill, backgroundColor: colors.border },
  daySignalNodeActive: { backgroundColor: colors.accent },
  briefCard: { marginTop: spacing.sm, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.accentBorder, borderRadius: radius.xl, padding: spacing.md },
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
  welcomeSignature: { color: colors.accent, fontSize: 9, letterSpacing: 1.5, fontWeight: '900', marginTop: 8 },
  greeting: { color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -.9, lineHeight: 31, maxWidth: 360 },
  accentWord: { color: colors.accent },
  date: { color: colors.muted, fontSize: 12, marginTop: 4, marginBottom: 7 },
  summaryRow: { flexDirection: 'row', backgroundColor: colors.bgElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: 9 },
  summaryCell: { flex: 1, paddingHorizontal: spacing.md },
  summaryNumber: { color: colors.text, fontSize: 20, lineHeight: 23, fontWeight: '800', fontVariant: ['tabular-nums'] },
  summaryLabel: { color: colors.subtle, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginTop: 3 },
  summaryDivider: { width: 1, backgroundColor: colors.border },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginTop: spacing.md, marginBottom: 2 },
  heroCard: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: layout.cardInset, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  lowCard: { borderColor: '#8f6b3d' },
  completedCard: { borderColor: colors.accentBorder, backgroundColor: colors.bgElevated },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  medName: { color: colors.text, fontSize: 20, fontWeight: '800', flexShrink: 1 },
  completedLabel: { color: colors.success, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginTop: 7 },
  detail: { color: colors.muted, marginTop: 4, fontSize: 13, lineHeight: 19 },
  duePill: { backgroundColor: colors.accentSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, maxWidth: 95, alignItems: 'center' },
  dueText: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: .7, fontVariant: ['tabular-nums'] },
  siteRow: { backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  siteText: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 3 },
  changeText: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  inventoryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  inventoryText: { color: colors.muted, fontSize: 12, lineHeight: 18, fontVariant: ['tabular-nums'], flexShrink: 1 },
  lowText: { color: '#f6bd75', fontWeight: '900' },
  primaryButton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 2 },
  primaryButtonText: { color: '#03111f', fontWeight: '900', letterSpacing: 1.1 },
  emptyCard: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: layout.cardInset, borderWidth: 1, borderColor: colors.border, marginTop: spacing.lg },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  disabled: { opacity: .55 }
});
