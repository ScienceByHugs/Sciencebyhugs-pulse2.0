import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, layout, radius, spacing, type } from '@/theme';
import { PulseMenu } from '@/components/PulseMenu';
import { createProtocol, createProtocolItem, listProtocolItems, listProtocols, setProtocolItemActive, updateProtocolItemDetails, updateProtocolStatus, type TodayItem } from '@/services/pulse';
import { formatSchedule, isDueOnDate, localDateKey, scheduleTime } from '@/domain/schedule';

type Protocol = { id: string; name: string; status: string };
const ROUTES = ['subcutaneous', 'intramuscular', 'oral', 'topical', 'other'] as const;
const SCHEDULES = ['daily', 'weekdays', 'interval', 'cycle'] as const;
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CATEGORIES = ['Peptide', 'GLP-1', 'Anabolic', 'Medication', 'Vitamin', 'Supplement', 'Other'] as const;

export default function ProtocolScreen() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [items, setItems] = useState<TodayItem[]>([]);
  const [protocolName, setProtocolName] = useState('');
  const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editCategory, setEditCategory] = useState('Other');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<string>('Peptide');
  const [showNewProtocol, setShowNewProtocol] = useState(false);
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('mg');
  const [route, setRoute] = useState<(typeof ROUTES)[number]>('subcutaneous');
  const [scheduleType, setScheduleType] = useState<(typeof SCHEDULES)[number]>('daily');
  const [time, setTime] = useState('08:00');
  const [days, setDays] = useState<number[]>([1,2,3,4,5]);
  const [everyDays, setEveryDays] = useState('2');
  const [onDays, setOnDays] = useState('5');
  const [offDays, setOffDays] = useState('2');
  const [inventory, setInventory] = useState('');
  const [busy, setBusy] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showMapDetails, setShowMapDetails] = useState(false);
  const [builderStep, setBuilderStep] = useState<1 | 2 | 3>(1);

  const activeProtocol = useMemo(() => protocols.find((p) => p.status === 'active' && p.id === selectedProtocolId) ?? protocols.find((p) => p.status === 'active'), [protocols, selectedProtocolId]);
  const activeItems = useMemo(() => activeProtocol ? items.filter((item) => item.protocol_id === activeProtocol.id) : [], [activeProtocol, items]);
  const protocolMap = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() + offset);
      const due = activeItems.filter((item) => item.active !== false && isDueOnDate(item.schedule, date));
      return {
        key: localDateKey(date),
        label: formatter.format(date).slice(0, 3).toUpperCase(),
        day: date.getDate(),
        today: offset === 0,
        due,
        firstTime: due.map((item) => scheduleTime(item.schedule)).filter((value): value is string => Boolean(value)).sort()[0]
      };
    });
  }, [activeItems]);

  const load = useCallback(async () => {
    try {
      const [nextProtocols, nextItems] = await Promise.all([listProtocols(), listProtocolItems()]);
      setProtocols(nextProtocols as Protocol[]);
      setSelectedProtocolId((id) => id && nextProtocols.some((p) => p.id === id && p.status === 'active') ? id : (nextProtocols.find((p) => p.status === 'active')?.id ?? null));
      setItems(nextItems);
    } catch (error) {
      Alert.alert('Could not load protocol', error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function addProtocol() {
    if (!protocolName.trim()) return;
    try {
      setBusy(true);
      await createProtocol(protocolName);
      setProtocolName('');
      setShowNewProtocol(false);
      await load();
    } catch (error) {
      Alert.alert('Could not create protocol', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function setProtocolStatus(protocolId: string, status: 'active' | 'paused' | 'archived') {
    try {
      setBusy(true);
      await updateProtocolStatus(protocolId, status);
      if (status === 'active') setSelectedProtocolId(protocolId);
      await load();
    } catch (error) {
      Alert.alert('Could not update protocol', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function toggleItem(item: TodayItem) {
    try {
      setBusy(true);
      await setProtocolItemActive(item.id, item.active === false);
      await load();
    } catch (error) {
      Alert.alert('Could not update substance', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(item: TodayItem) {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditCategory(item.category || 'Other');
  }

  async function saveItemEdit() {
    if (!editingItemId) return;
    try {
      setBusy(true);
      await updateProtocolItemDetails(editingItemId, editItemName, editCategory);
      setEditingItemId(null);
      await load();
    } catch (error) {
      Alert.alert('Could not save substance', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  function toggleDay(day: number) {
    setDays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort());
  }

  function buildSchedule() {
    const startDate = localDateKey();
    if (scheduleType === 'daily') return { type: 'daily', time };
    if (scheduleType === 'weekdays') return { type: 'weekdays', time, days };
    if (scheduleType === 'interval') return { type: 'interval', time, everyDays: Math.max(1, Number(everyDays) || 1), startDate };
    return { type: 'cycle', time, onDays: Math.max(1, Number(onDays) || 1), offDays: Math.max(0, Number(offDays) || 0), startDate };
  }

  async function addItem() {
    const numericDose = Number(dose);
    const numericInventory = inventory ? Number(inventory) : undefined;
    if (!activeProtocol) return Alert.alert('Create a protocol first');
    if (!itemName.trim() || !numericDose || numericDose <= 0 || !unit.trim()) {
      return Alert.alert('Check item details', 'Name, dose and unit are required.');
    }
    if (scheduleType === 'weekdays' && days.length === 0) {
      return Alert.alert('Choose at least one day');
    }

    try {
      setBusy(true);
      await createProtocolItem({
        protocolId: activeProtocol.id,
        name: itemName,
        category,
        route,
        doseAmount: numericDose,
        doseUnit: unit,
        schedule: buildSchedule(),
        inventoryAmount: numericInventory && numericInventory > 0 ? numericInventory : undefined
      });
      setItemName('');
      setDose('');
      setInventory('');
      setShowBuilder(false);
      setBuilderStep(1);
      await load();
    } catch (error) {
      Alert.alert('Could not add item', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <PulseMenu />
        <Text style={styles.eyebrow}>YOUR ROUTINE</Text>
        <Text style={styles.title}>Protocol Library</Text>
        <Text style={styles.body}>Your substances and routines, organized your way. Track more than one protocol.</Text>

        <View style={styles.launchRow}>
          <Pressable style={styles.launchButton} onPress={() => setShowNewProtocol((value) => !value)}><Text style={styles.launchText}>＋ NEW PROTOCOL</Text></Pressable>
          {activeProtocol ? <Pressable style={styles.launchButton} onPress={() => { setBuilderStep(1); setShowBuilder(true); }}><Text style={styles.launchText}>＋ ADD SUBSTANCE</Text></Pressable> : null}
        </View>
        {showNewProtocol && protocols.length > 0 ? <View style={styles.card}><Text style={styles.cardTitle}>Name your new protocol</Text><TextInput style={styles.input} placeholder="e.g. Daily regimen" placeholderTextColor={colors.muted} value={protocolName} onChangeText={setProtocolName} /><Pressable style={styles.primary} disabled={busy} onPress={() => void addProtocol()}><Text style={styles.primaryText}>CREATE PROTOCOL</Text></Pressable></View> : null}

        {protocols.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create your first protocol</Text>
            <TextInput style={styles.input} placeholder="e.g. Daily routine" placeholderTextColor={colors.muted} value={protocolName} onChangeText={setProtocolName} />
            <Pressable style={styles.primary} disabled={busy} onPress={() => void addProtocol()}><Text style={styles.primaryText}>CREATE PROTOCOL</Text></Pressable>
          </View>
        ) : (
          <>
            {protocols.some((p) => p.status === 'active') ? <View style={styles.protocolPicker}><Text style={styles.smallLabel}>ACTIVE PROTOCOLS · SELECT TO MANAGE</Text><View style={styles.chips}>{protocols.filter((p) => p.status === 'active').map((p) => <Pressable accessibilityRole="button" accessibilityState={{ selected: activeProtocol?.id === p.id }} key={p.id} style={[styles.chip, activeProtocol?.id === p.id && styles.chipActive]} onPress={() => { setSelectedProtocolId(p.id); setShowBuilder(false); setEditingItemId(null); }}><Text style={[styles.chipText, activeProtocol?.id === p.id && styles.chipTextActive]}>{p.name}</Text></Pressable>)}</View></View> : null}
            {activeProtocol ? (
              <View style={styles.card}>
                <Text style={styles.smallLabel}>ACTIVE PROTOCOL</Text>
                <Text style={styles.cardTitle}>{activeProtocol.name}</Text>
                <Text style={styles.cardDetail}>{activeItems.length} tracked items</Text>
                <View style={styles.protocolActions}>
                  <Pressable style={styles.secondaryAction} disabled={busy} onPress={() => void setProtocolStatus(activeProtocol.id, 'paused')}>
                    <Text style={styles.secondaryActionText}>PAUSE</Text>
                  </Pressable>
                  <Pressable style={styles.archiveAction} disabled={busy} onPress={() => void setProtocolStatus(activeProtocol.id, 'archived')}>
                    <Text style={styles.archiveActionText}>ARCHIVE</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>No active protocol</Text>
                <Text style={styles.cardDetail}>Activate a paused protocol below to return its scheduled items to Today.</Text>
              </View>
            )}

            {protocols.filter((protocol) => protocol.status !== 'active').map((protocol) => (
              <View style={styles.protocolRow} key={protocol.id}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{protocol.name}</Text>
                  <Text style={styles.cardDetail}>{protocol.status}</Text>
                </View>
                {protocol.status === 'paused' || protocol.status === 'archived' ? (
                  <Pressable style={styles.activateButton} disabled={busy} onPress={() => void setProtocolStatus(protocol.id, 'active')}>
                    <Text style={styles.activateText}>ACTIVATE</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}

            {activeProtocol && activeItems.length ? (
              <View style={styles.mapCard}>
                <View style={styles.mapHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.smallLabel}>PROTOCOL MAP</Text>
                    <Text style={styles.mapTitle}>Your next 7 days</Text>
                    <Text style={styles.cardDetail}>A live view of how your routine is distributed across the week.</Text>
                  </View>
                  <View style={styles.mapLegendPill}><Text style={styles.mapLegendText}>{activeItems.length} ACTIVE</Text></View>
                </View>

                <View style={styles.weekStrip}>
                  {protocolMap.map((day) => (
                    <View key={day.key} style={[styles.dayColumn, day.today && styles.dayColumnToday]}>
                      <Text style={[styles.mapDayLabel, day.today && styles.mapDayLabelToday]}>{day.label}</Text>
                      <Text style={[styles.mapDayNumber, day.today && styles.mapDayNumberToday]}>{day.day}</Text>
                      <View style={styles.loadTrack}>
                        <View style={[styles.loadFill, { height: Math.min(30, Math.max(4, day.due.length * 8)) }, day.due.length === 0 && styles.loadFillEmpty]} />
                      </View>
                      <Text style={[styles.mapCount, day.due.length > 0 && styles.mapCountActive]}>{day.due.length}</Text>
                    </View>
                  ))}
                </View>

                <Pressable accessibilityRole="button" accessibilityLabel={showMapDetails ? 'Hide schedule details' : 'Show schedule details'} onPress={() => setShowMapDetails((value) => !value)} style={styles.mapDetailsToggle}><Text style={styles.mapDetailsToggleText}>{showMapDetails ? 'HIDE DETAILS  −' : 'VIEW SCHEDULE DETAILS  +'}</Text></Pressable>
                {showMapDetails ? <View style={styles.mapScheduleList}>
                  {protocolMap.filter((day) => day.due.length > 0).slice(0, 4).map((day, index) => (
                    <View key={day.key} style={[styles.mapScheduleRow, index > 0 && styles.mapScheduleDivider]}>
                      <View style={styles.mapScheduleDay}>
                        <Text style={styles.mapScheduleDayText}>{day.label}</Text>
                        <Text style={styles.mapScheduleDate}>{day.day}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mapScheduleItems} numberOfLines={1}>{day.due.map((item) => item.name).join(' · ')}</Text>
                        <Text style={styles.mapScheduleMeta}>{day.due.length} scheduled{day.firstTime ? ` · first at ${day.firstTime}` : ''}</Text>
                      </View>
                    </View>
                  ))}
                </View> : null}
              </View>
            ) : null}

            {activeProtocol && !showBuilder ? (
              <Pressable style={styles.addItemLaunch} onPress={() => { setBuilderStep(1); setShowBuilder(true); }}>
                <View style={styles.addIcon}><Text style={styles.addIconText}>＋</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Add to your protocol</Text>
                  <Text style={styles.cardDetail}>Set up an item, schedule and supply.</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ) : null}

            {activeProtocol && showBuilder ? (
              <View style={styles.builderCard}>
                <View style={styles.builderTop}>
                  <View>
                    <Text style={styles.smallLabel}>ADD ITEM · STEP {builderStep} OF 3</Text>
                    <Text style={styles.builderTitle}>{builderStep === 1 ? 'What are you tracking?' : builderStep === 2 ? 'When do you take it?' : 'Supply & review'}</Text>
                  </View>
                  <Pressable onPress={() => { setShowBuilder(false); setBuilderStep(1); }}><Text style={styles.closeText}>CLOSE</Text></Pressable>
                </View>
                <View style={styles.progress}><View style={[styles.progressFill, { width: builderStep === 1 ? '33%' : builderStep === 2 ? '66%' : '100%' }]} /></View>

                {builderStep === 1 ? <>
                <TextInput style={styles.input} placeholder="Item name" placeholderTextColor={colors.muted} value={itemName} onChangeText={setItemName} />
                <View style={styles.twoCol}>
                  <TextInput style={[styles.input, styles.flex]} placeholder="Dose" placeholderTextColor={colors.muted} keyboardType="decimal-pad" value={dose} onChangeText={setDose} />
                  <TextInput style={[styles.input, styles.flex]} placeholder="Unit" placeholderTextColor={colors.muted} value={unit} onChangeText={setUnit} autoCapitalize="none" />
                </View>
                <Text style={styles.smallLabel}>CATEGORY</Text>
                <View style={styles.chips}>{CATEGORIES.map((value) => <Pressable key={value} onPress={() => setCategory(value)} style={[styles.chip, category === value && styles.chipActive]}><Text style={[styles.chipText, category === value && styles.chipTextActive]}>{value}</Text></Pressable>)}</View>
                <Text style={styles.smallLabel}>ROUTE</Text>
                <View style={styles.chips}>
                  {ROUTES.map((value) => <Pressable key={value} onPress={() => setRoute(value)} style={[styles.chip, route === value && styles.chipActive]}><Text style={[styles.chipText, route === value && styles.chipTextActive]}>{value}</Text></Pressable>)}
                </View>
                <Pressable style={styles.primary} onPress={() => {
                  if (!itemName.trim() || !Number(dose) || Number(dose) <= 0 || !unit.trim()) return Alert.alert('Add the basics first', 'Enter a name, dose and unit to continue.');
                  setBuilderStep(2);
                }}><Text style={styles.primaryText}>CONTINUE</Text></Pressable>
                </> : null}

                {builderStep === 2 ? <>
              <View style={styles.builderSummary}>
                <Text style={styles.builderSummaryName}>{itemName}</Text>
                <Text style={styles.cardDetail}>{dose} {unit} · {route}</Text>
              </View>

              <Text style={styles.smallLabel}>SCHEDULE</Text>
              <View style={styles.chips}>
                {SCHEDULES.map((value) => (
                  <Pressable key={value} onPress={() => setScheduleType(value)} style={[styles.chip, scheduleType === value && styles.chipActive]}>
                    <Text style={[styles.chipText, scheduleType === value && styles.chipTextActive]}>{value}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput style={styles.input} placeholder="Time (24h)" placeholderTextColor={colors.muted} value={time} onChangeText={setTime} />

              {scheduleType === 'weekdays' ? (
                <View style={styles.dayRow}>
                  {DAY_LABELS.map((label, day) => (
                    <Pressable key={`${label}-${day}`} style={[styles.day, days.includes(day) && styles.dayActive]} onPress={() => toggleDay(day)}>
                      <Text style={[styles.dayText, days.includes(day) && styles.chipTextActive]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {scheduleType === 'interval' ? (
                <TextInput style={styles.input} placeholder="Every X days" placeholderTextColor={colors.muted} keyboardType="number-pad" value={everyDays} onChangeText={setEveryDays} />
              ) : null}

              {scheduleType === 'cycle' ? (
                <View style={styles.twoCol}>
                  <TextInput style={[styles.input, styles.flex]} placeholder="Days on" placeholderTextColor={colors.muted} keyboardType="number-pad" value={onDays} onChangeText={setOnDays} />
                  <TextInput style={[styles.input, styles.flex]} placeholder="Days off" placeholderTextColor={colors.muted} keyboardType="number-pad" value={offDays} onChangeText={setOffDays} />
                </View>
              ) : null}

              <View style={styles.builderNav}>
                <Pressable style={styles.backButton} onPress={() => setBuilderStep(1)}><Text style={styles.backText}>BACK</Text></Pressable>
                <Pressable style={[styles.primary, styles.flex]} onPress={() => {
                  if (scheduleType === 'weekdays' && days.length === 0) return Alert.alert('Choose at least one day');
                  setBuilderStep(3);
                }}><Text style={styles.primaryText}>CONTINUE</Text></Pressable>
              </View>
              </> : null}

              {builderStep === 3 ? <>
                <View style={styles.reviewBox}>
                  <Text style={styles.reviewName}>{itemName}</Text>
                  <Text style={styles.cardDetail}>{dose} {unit} · {route}</Text>
                  <Text style={styles.scheduleText}>{formatSchedule(buildSchedule())}</Text>
                </View>
                <Text style={styles.smallLabel}>SUPPLY · OPTIONAL</Text>
                <TextInput style={styles.input} placeholder={`Starting inventory in ${unit || 'same unit'}`} placeholderTextColor={colors.muted} keyboardType="decimal-pad" value={inventory} onChangeText={setInventory} />
                <View style={styles.builderNav}>
                  <Pressable style={styles.backButton} onPress={() => setBuilderStep(2)}><Text style={styles.backText}>BACK</Text></Pressable>
                  <Pressable style={[styles.primary, styles.flex, busy && styles.disabled]} disabled={busy} onPress={() => void addItem()}><Text style={styles.primaryText}>{busy ? 'ADDING…' : 'ADD TO PROTOCOL'}</Text></Pressable>
                </View>
              </> : null}
              </View>
            ) : null}

            {activeProtocol ? <Text style={styles.smallLabel}>ITEMS</Text> : null}
            {activeProtocol ? items.filter((item) => item.protocol_id === activeProtocol.id).map((item) => {
              const inventoryItem = item.inventory_containers?.find((container) => container.is_active);
              return (
                <View style={styles.itemCard} key={item.id}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Text style={styles.cardDetail}>{item.category || 'Substance'} · {item.dose_amount} {item.dose_unit} · {item.route}</Text>
                    <Text style={styles.scheduleText}>{formatSchedule(item.schedule)}</Text>
                  </View>
                  <Text style={styles.stock}>{inventoryItem ? `${inventoryItem.remaining_amount} ${inventoryItem.unit}` : 'No stock'}</Text>
                </View>
              );
            }) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: layout.pageInset, paddingBottom: layout.pageBottom },
  launchRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  launchButton: { flex: 1, minWidth: 0, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft, borderColor: colors.accentBorder, borderWidth: 1, borderRadius: radius.md },
  launchText: { color: colors.accent, fontWeight: '900', fontSize: 10, letterSpacing: .7, textAlign: 'center' },
  eyebrow: { color: colors.accent, fontSize: type.eyebrow, fontWeight: '900', letterSpacing: 1.8, marginTop: spacing.md },
  title: { color: colors.text, fontSize: type.title, fontWeight: '800', letterSpacing: -1.4, marginTop: spacing.sm },
  body: { color: colors.muted, fontSize: type.body, lineHeight: 21, marginTop: spacing.sm, marginBottom: spacing.md },
  card: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: layout.cardInset, borderWidth: 1, borderColor: colors.border, gap: 12, marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  cardDetail: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  scheduleText: { color: colors.accent, marginTop: 5, fontSize: 12, fontWeight: '700' },
  input: { backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13, color: colors.text, fontSize: 15 },
  twoCol: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  primary: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', marginTop: 2 },
  primaryText: { color: '#03111f', fontWeight: '900', letterSpacing: 1 },
  smallLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: colors.panel2 },
  chipActive: { borderColor: colors.accentBorder, backgroundColor: colors.accentSoft },
  chipText: { color: colors.muted, fontSize: 12, textTransform: 'capitalize' },
  chipTextActive: { color: colors.accent, fontWeight: '800' },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel2 },
  dayActive: { borderColor: colors.accentBorder, backgroundColor: colors.accentSoft },
  dayText: { color: colors.muted, fontWeight: '800' },
  protocolPicker: { backgroundColor: colors.panel, padding: layout.cardInset, borderRadius: radius.xl, borderColor: colors.accentBorder, borderWidth: 1, marginBottom: spacing.md, gap: 12 },
  itemCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.panel, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginTop: 8 },
  itemTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  stock: { color: colors.accent, fontWeight: '800', fontSize: 12, maxWidth: 92, textAlign: 'right', flexShrink: 1 },
  protocolActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  secondaryAction: { flex: 1, borderWidth: 1, borderColor: colors.accentBorder, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center', backgroundColor: colors.accentSoft },
  secondaryActionText: { color: colors.accent, fontWeight: '900', fontSize: 11, letterSpacing: .8 },
  archiveAction: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center' },
  archiveActionText: { color: colors.muted, fontWeight: '900', fontSize: 11, letterSpacing: .8 },
  protocolRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  activateButton: { borderRadius: radius.md, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentBorder, paddingHorizontal: 12, paddingVertical: 9 },
  activateText: { color: colors.accent, fontWeight: '900', fontSize: 10, letterSpacing: .7 },
  mapCard: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.accentBorder, marginBottom: spacing.md },
  mapHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  mapTitle: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 4, letterSpacing: -.5 },
  mapLegendPill: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentBorder, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  mapLegendText: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  weekStrip: { flexDirection: 'row', justifyContent: 'space-between', gap: 5, marginTop: spacing.lg },
  dayColumn: { flex: 1, alignItems: 'center', borderRadius: radius.md, paddingVertical: 9, paddingHorizontal: 2, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border },
  dayColumnToday: { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder },
  mapDayLabel: { color: colors.subtle, fontSize: 8, fontWeight: '900', letterSpacing: .7 },
  mapDayLabelToday: { color: colors.accent },
  mapDayNumber: { color: colors.text, fontSize: 16, lineHeight: 20, fontWeight: '900', marginTop: 2, fontVariant: ['tabular-nums'] },
  mapDayNumberToday: { color: colors.accent },
  loadTrack: { height: 34, width: 5, justifyContent: 'flex-end', backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden', marginTop: 7 },
  loadFill: { width: '100%', backgroundColor: colors.accent, borderRadius: radius.pill },
  loadFillEmpty: { height: 2, backgroundColor: colors.subtle },
  mapCount: { color: colors.subtle, fontSize: 9, fontWeight: '900', marginTop: 5, fontVariant: ['tabular-nums'] },
  mapCountActive: { color: colors.accent },
  mapDetailsToggle: { paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  mapDetailsToggleText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.1, color: colors.accent },
  mapScheduleList: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  mapScheduleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 11 },
  mapScheduleDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  mapScheduleDay: { width: 38, alignItems: 'center' },
  mapScheduleDayText: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  mapScheduleDate: { color: colors.text, fontSize: 18, lineHeight: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
  mapScheduleItems: { color: colors.text, fontSize: 13, fontWeight: '800' },
  mapScheduleMeta: { color: colors.muted, fontSize: 10, marginTop: 3, fontVariant: ['tabular-nums'] },
  addItemLaunch: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bgElevated, borderRadius: radius.xl, padding: layout.cardInset, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
  addIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentBorder },
  addIconText: { color: colors.accent, fontSize: 23, lineHeight: 27 },
  chevron: { color: colors.subtle, fontSize: 28 },
  builderCard: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: layout.cardInset, borderWidth: 1, borderColor: colors.accentBorder, gap: spacing.md, marginBottom: spacing.xl },
  builderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  builderTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 5 },
  closeText: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  progress: { height: 3, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden', marginBottom: spacing.sm },
  progressFill: { height: 3, backgroundColor: colors.accent, borderRadius: 2 },
  builderSummary: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  builderSummaryName: { color: colors.text, fontSize: 16, fontWeight: '900' },
  builderNav: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  backButton: { paddingHorizontal: 16, paddingVertical: 15, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  backText: { color: colors.muted, fontWeight: '900', fontSize: 11, letterSpacing: .8 },
  reviewBox: { backgroundColor: colors.bgElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  reviewName: { color: colors.text, fontSize: 20, fontWeight: '800' },
  disabled: { opacity: .55 }
});
