import { supabase } from '@/lib/supabase';

export async function listProtocols() {
  const { data, error } = await supabase
    .from('protocols')
    .select('id,name,status,starts_on,ends_on,created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createProtocol(name: string) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw authError ?? new Error('No authenticated user');

  const { data, error } = await supabase
    .from('protocols')
    .insert({ user_id: authData.user.id, name: name.trim() })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listDoseLogs(limit = 50) {
  const { data, error } = await supabase
    .from('dose_logs')
    .select('id,protocol_item_id,amount,unit,route,site,status,notes,scheduled_for,logged_at')
    .order('logged_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

type LogDoseInput = {
  protocolItemId: string;
  amount: number;
  unit: string;
  route?: string;
  site?: string;
  inventoryContainerId?: string;
  scheduledFor?: string;
};

export async function logDose(input: LogDoseInput) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw authError ?? new Error('No authenticated user');

  const { data, error } = await supabase
    .from('dose_logs')
    .insert({
      user_id: authData.user.id,
      protocol_item_id: input.protocolItemId,
      inventory_container_id: input.inventoryContainerId ?? null,
      amount: input.amount,
      unit: input.unit,
      route: input.route ?? null,
      site: input.site ?? null,
      scheduled_for: input.scheduledFor ?? null,
      status: 'completed'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
