alter table public.dose_logs
  add column if not exists client_event_id uuid;

create unique index if not exists dose_logs_user_client_event_uidx
  on public.dose_logs(user_id, client_event_id)
  where client_event_id is not null;

create or replace function public.log_dose_and_decrement(
  p_protocol_item_id uuid,
  p_amount numeric,
  p_unit text,
  p_route text default null,
  p_site text default null,
  p_inventory_container_id uuid default null,
  p_scheduled_for timestamptz default null,
  p_client_event_id uuid default null
)
returns public.dose_logs
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_log public.dose_logs;
  v_remaining numeric;
  v_inventory_unit text;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Dose amount must be greater than zero'; end if;

  if p_client_event_id is not null then
    select * into v_log from public.dose_logs
    where user_id = v_uid and client_event_id = p_client_event_id;
    if found then return v_log; end if;
  end if;

  if not exists (
    select 1 from public.protocol_items
    where id = p_protocol_item_id and user_id = v_uid and active = true
  ) then raise exception 'Protocol item not found'; end if;

  if p_inventory_container_id is not null then
    select remaining_amount, unit into v_remaining, v_inventory_unit
    from public.inventory_containers
    where id = p_inventory_container_id
      and user_id = v_uid
      and protocol_item_id = p_protocol_item_id
      and is_active = true
    for update;

    if not found then raise exception 'Inventory container not found'; end if;
    if lower(v_inventory_unit) <> lower(p_unit) then raise exception 'Inventory unit must match dose unit'; end if;
    if v_remaining < p_amount then raise exception 'Not enough inventory remaining'; end if;

    update public.inventory_containers
    set remaining_amount = remaining_amount - p_amount, updated_at = now()
    where id = p_inventory_container_id;
  end if;

  insert into public.dose_logs (
    user_id, protocol_item_id, inventory_container_id, amount, unit,
    route, site, status, scheduled_for, client_event_id
  ) values (
    v_uid, p_protocol_item_id, p_inventory_container_id, p_amount, p_unit,
    p_route, p_site, 'completed', p_scheduled_for, p_client_event_id
  )
  returning * into v_log;

  return v_log;
end;
$$;

revoke all on function public.log_dose_and_decrement(uuid,numeric,text,text,text,uuid,timestamptz,uuid) from public;
grant execute on function public.log_dose_and_decrement(uuid,numeric,text,text,text,uuid,timestamptz,uuid) to authenticated;

revoke all on function public.handle_new_pulse_user() from public;
revoke all on function public.handle_new_pulse_user() from anon;
revoke all on function public.handle_new_pulse_user() from authenticated;
