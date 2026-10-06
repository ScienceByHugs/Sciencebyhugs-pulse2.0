import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pulse.quick_log_outbox.v1';

export type QuickLogPayload = {
  protocolItemId: string;
  amount: number;
  unit: string;
  route?: string | null;
  site?: string | null;
  inventoryContainerId?: string | null;
  scheduledFor?: string | null;
  clientEventId: string;
};

export async function readOutbox(): Promise<QuickLogPayload[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function enqueueQuickLog(payload: QuickLogPayload) {
  const current = await readOutbox();
  if (current.some((item) => item.clientEventId === payload.clientEventId)) return;
  await AsyncStorage.setItem(KEY, JSON.stringify([...current, payload]));
}

export async function removeQuickLog(clientEventId: string) {
  const current = await readOutbox();
  await AsyncStorage.setItem(KEY, JSON.stringify(current.filter((item) => item.clientEventId !== clientEventId)));
}
