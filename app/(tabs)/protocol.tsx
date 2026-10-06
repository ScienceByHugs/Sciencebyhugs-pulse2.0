import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';
import { createProtocol, createProtocolItem, listProtocolItems, listProtocols, type TodayItem } from '@/services/pulse';

type Protocol = { id: string; name: string; status: string };
const ROUTES = ['subcutaneous', 'intramuscular', 'oral', 'topical', 'other'] as const;

export default function ProtocolScreen() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [items, setItems] = useState<TodayItem[]>([]);
  const [protocolName, setProtocolName] = useState('');
  const [itemName, setItemName] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('mg');
  const [route, setRoute] = useState<(typeof ROUTES)[number]>('subcutaneous');
  const [time, setTime] = useState('08:00');
  const [inventory, setInventory] = useState('');
  const [busy, setBusy] = useState(false);

  const activeProtocol = useMemo(() => protocols.find((p) => p.status === 'active') ?? protocols[0], [protocols]);

  const load = useCallback(async () => {
    try {
      const [nextProtocols, nextItems] = await Promise.all([listProtocols(), listProtocolItems()]);
      setProtocols(nextProtocols as Protocol[]);
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
      await load();
    } catch (error) {
      Alert.alert('Could not create protocol', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function addItem() {
    const numericDose = Number(dose);
    const numericInventory = inventory ? Number(inventory) : undefined;
    if (!activeProtocol) return Alert.alert('Create a protocol first');
    if (!itemName.trim() || !numericDose || numericDose <= 0 || !unit.trim()) {
      return Alert.alert('Check item details', 'Name, dose and unit are required.');
    }

    try {
      setBusy(true);
      await createProtocolItem({
        protocolId: activeProtocol.id,
        name: itemName,
        route,
        doseAmount: numericDose,
        doseUnit: unit,
        scheduledTime: time,
        inventoryAmount: numericInventory && numericInventory > 0 ? numericInventory : undefined
      });
      setItemName('');
      setDose('');
      setInventory('');
      await load();
    } catch (error) {
      Alert.alert('Could not add item', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>YOUR ROUTINE</Text>
        <Text style={styles.title}>Protocol</Text>
        <Text style={styles.body}>Build the routine once. Pulse handles the day-to-day tracking.</Text>

        {protocols.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create your first protocol</Text>
            <TextInput style={styles.input} placeholder="e.g. Daily routine" placeholderTextColor={colors.muted} value={protocolName} onChangeText={setProtocolName} />
            <Pressable style={styles.primary} disabled={busy} onPress={() => void addProtocol()}><Text style={styles.primaryText}>CREATE PROTOCOL</Text></Pressable>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.smallLabel}>ACTIVE PROTOCOL</Text>
              <Text style={styles.cardTitle}>{activeProtocol?.name}</Text>
              <Text style={styles.cardDetail}>{items.filter((item) => item.protocol_id === activeProtocol?.id).length} tracked items</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Add an item</Text>
              <TextInput style={styles.input} placeholder="Item name" placeholderTextColor={colors.muted} value={itemName} onChangeText={setItemName} />
              <View style={styles.twoCol}>
                <TextInput style={[styles.input, styles.flex]} placeholder="Dose" placeholderTextColor={colors.muted} keyboardType="decimal-pad" value={dose} onChangeText={setDose} />
                <TextInput style={[styles.input, styles.flex]} placeholder="Unit" placeholderTextColor={colors.muted} value={unit} onChangeText={setUnit} autoCapitalize="none" />
              </View>
              <TextInput style={styles.input} placeholder="Time (24h, e.g. 08:00)" placeholderTextColor={colors.muted} value={time} onChangeText={setTime} />
              <TextInput style={styles.input} placeholder="Starting inventory (optional, same unit)" placeholderTextColor={colors.muted} keyboardType="decimal-pad" value={inventory} onChangeText={setInventory} />
              <Text style={styles.smallLabel}>ROUTE</Text>
              <View style={styles.chips}>
                {ROUTES.map((value) => (
                  <Pressable key={value} onPress={() => setRoute(value)} style={[styles.chip, route === value && styles.chipActive]}>
                    <Text style={[styles.chipText, route === value && styles.chipTextActive]}>{value}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={[styles.primary, busy && styles.disabled]} disabled={busy} onPress={() => void addItem()}><Text style={styles.primaryText}>ADD ITEM</Text></Pressable>
            </View>

            <Text style={styles.smallLabel}>ITEMS</Text>
            {items.filter((item) => item.protocol_id === activeProtocol?.id).map((item) => {
              const inventoryItem = item.inventory_containers?.find((container) => container.is_active);
              return (
                <View style={styles.itemCard} key={item.id}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Text style={styles.cardDetail}>{item.dose_amount} {item.dose_unit} · {item.route}</Text>
                  </View>
                  <Text style={styles.stock}>{inventoryItem ? `${inventoryItem.remaining_amount} ${inventoryItem.unit}` : 'No stock'}</Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: spacing.lg, paddingBottom: 50 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.8, marginTop: spacing.md },
  title: { color: colors.text, fontSize: type.hero, fontWeight: '800', letterSpacing: -1, marginTop: spacing.sm },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.xl },
  card: { backgroundColor: colors.panel, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: 12, marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  cardDetail: { color: colors.muted, marginTop: 4, lineHeight: 20 },
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
  itemCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.panel, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginTop: 8 },
  itemTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  stock: { color: colors.accent, fontWeight: '800', fontSize: 12 },
  disabled: { opacity: .55 }
});
