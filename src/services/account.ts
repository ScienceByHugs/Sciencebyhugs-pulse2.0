import { Share } from 'react-native';
import { supabase } from '@/lib/supabase';

export async function exportPulseData() {
  const [
    profile,
    protocols,
    items,
    inventory,
    logs
  ] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('protocols').select('*').order('created_at'),
    supabase.from('protocol_items').select('*').order('created_at'),
    supabase.from('inventory_containers').select('*').order('created_at'),
    supabase.from('dose_logs').select('*').order('logged_at')
  ]);

  const error = profile.error ?? protocols.error ?? items.error ?? inventory.error ?? logs.error;
  if (error) throw error;

  const payload = {
    exported_at: new Date().toISOString(),
    format: 'pulse-2-export-v1',
    profile: profile.data,
    protocols: protocols.data,
    protocol_items: items.data,
    inventory_containers: inventory.data,
    dose_logs: logs.data
  };

  const json = JSON.stringify(payload, null, 2);
  await Share.share({
    title: 'Pulse data export',
    message: json
  });

  return payload;
}

export async function deletePulseAccount() {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
    body: {}
  });

  if (error) throw error;
  if (!data?.deleted) throw new Error('Account deletion was not confirmed by the server');

  await supabase.auth.signOut({ scope: 'local' });
}
