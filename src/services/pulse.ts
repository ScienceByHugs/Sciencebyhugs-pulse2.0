import { supabase } from '@/lib/supabase';

export type InventorySummary = {
  id: string;
  remaining_amount: number;
  total_amount: number;
  unit: string;
  low_threshold: number;
  is_active: boolean;
};

export type TodayItem = {
  id: string;
  protocol_id: string;
  name: string;
  category: string | null;
  route: string;
  dose_amount: number;
  dose_unit: string;
  schedule: Record<string, unknown>;
  site_rotation_enabled: boolean;
  inventory_containers?: InventorySummary[];
};

export type TimelineEntry = {
  id: string;
  amount: number;
  unit: string;
  route: string | null;
  site: string | null;
  status: string;
  logged_at: string;
  protocol_items?: { name: string } | null;
};

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error('No authenticated user');
  return data.user.id;
}

export async function listProtocols() {
  const { data, error } = await supabase
    .from('protocols')
    .select('id,name,status,starts_on,ends_on,created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createProtocol(name: string) {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('protocols')
    .insert({ user_id: userId, name: name.trim() })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listProtocolItems(protocolId?: string) {
  let query = supabase
    .from('protocol_items')
    .select('id,protocol_id,name,category,route,form,dose_amount,dose_unit,schedule,active,site_rotation_enabled,created_at,inventory_containers(id,remaining_amount,total_amount,unit,low_threshold,is_active)')
    .order('created_at', { ascending: false });

  if (protocolId) query = query.eq('protocol_id', protocolId);

  const { data, error } = await query;
  if (error) throw error;
  return data as TodayItem[];
}

export async function listTodayItems() {
  const { data, error } = await supabase
    .from('protocol_items')
    .select('id,protocol_id,name,category,route,dose_amount,dose_unit,schedule,site_rotation_enabled,inventory_containers(id,remaining_amount,total_amount,unit,low_threshold,is_active),protocols!inner(status)')
    .eq('active', true)
    .eq('protocols.status', 'active')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as unknown as TodayItem[];
}

type CreateItemInput = {
  protocolId: string;
  name: string;
  category?: string;
  route: 'subcutaneous' | 'intramuscular' | 'oral' | 'topical' | 'other';
  doseAmount: number;
  doseUnit: string;
  scheduledTime?: string;
  inventoryAmount?: number;
  lowThreshold?: number;
};

export async function createProtocolItem(input: CreateItemInput) {
  const userId = await currentUserId();
  const { data: item, error } = await supabase
    .from('protocol_items')
    .insert({
      user_id: userId,
      protocol_id: input.protocolId,
      name: input.name.trim(),
      category: input.category?.trim() || null,
      route: input.route,
      dose_amount: input.doseAmount,
      dose_unit: input.doseUnit.trim(),
      schedule: input.scheduledTime ? { type: 'daily', time: input.scheduledTime } : {},
      site_rotation_enabled: input.route === 'subcutaneous' || input.route === 'intramuscular'
    })
    .select()
    .single();

  if (error) throw error;

  if (input.inventoryAmount && input.inventoryAmount > 0) {
    const { error: inventoryError } = await supabase.from('inventory_containers').insert({
      user_id: userId,
      protocol_item_id: item.id,
      total_amount: input.inventoryAmount,
      remaining_amount: input.inventoryAmount,
      unit: input.doseUnit.trim(),
      low_threshold: Math.max(input.lowThreshold ?? input.doseAmount * 3, 0),
      is_active: true
    });
    if (inventoryError) throw inventoryError;
  }

  return item;
}

export async function quickLog(item: TodayItem, site?: string) {
  const activeInventory = item.inventory_containers?.find((container) => container.is_active);

  const { data, error } = await supabase.rpc('log_dose_and_decrement', {
    p_protocol_item_id: item.id,
    p_amount: item.dose_amount,
    p_unit: item.dose_unit,
    p_route: item.route,
    p_site: site ?? null,
    p_inventory_container_id: activeInventory?.id ?? null,
    p_scheduled_for: null
  });

  if (error) throw error;
  return data;
}

export async function listDoseLogs(limit = 50) {
  const { data, error } = await supabase
    .from('dose_logs')
    .select('id,amount,unit,route,site,status,logged_at,protocol_items(name)')
    .order('logged_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as unknown as TimelineEntry[];
}
