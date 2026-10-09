-- Enforce one dose log and one inventory deduction per client-generated UUID.
create unique index if not exists dose_logs_user_client_event_unique
  on public.dose_logs(user_id, client_event_id)
  where client_event_id is not null;

create or replace function public.log_dose_and_decrement(
  p_protocol_item_id uuid,
  p_amount numeric,
  p_unit text,
  p_route text DEFAULT NULL,
  p_site text DEFAULT NULL,
  p_inventory_container_id uuid DEFAULT NULL,
  p_scheduled_for timestamptz DEFAULT NULL,
  p_client_event_id uuid DEFAULT NULL
) returns public.dose_logs
language plpgsql set search_path = 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_log public.dose_logs;
  v_remaining numeric;
  v_inventory_unit text;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_client_event_id is null then raise exception 'Client event ID is required'; end if;
  if p_amount is null or p_amount <= 0 or p_amount > 1000000000 then raise exception 'Invalid dose amount'; end if;
  if p_unit is null or length(btrim(p_unit)) = 0 then raise exception 'Dose unit required'; end if;

  -- Replaying the same event across concurrent requests must never decrement twice.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || p_client_event_id::text, 0));
  select * into v_log from public.dose_logs
  where user_id = v_uid and client_event_id = p_client_event_id;
  if found then
    if v_log.protocol_item_id IS DISTINCT FROM p_protocol_item_id
       or v_log.amount IS DISTINCT FROM p_amount
       or lower(v_log.unit) IS DISTINCT FROM lower(p_unit)
       or v_log.inventory_container_id IS DISTINCT FROM p_inventory_container_id then
      raise exception 'Client event ID conflicts with an existing dose';
    end if;
    return v_log;
  end if;

  if not exists (
    select 1 from public.protocol_items
    where id = p_protocol_item_id and user_id = v_uid and active = true and archived_at is null
  ) then raise exception 'Active substance not found'; end if;

  if p_inventory_container_id is not null then
    select remaining_amount, unit into v_remaining, v_inventory_unit
    from public.inventory_containers
    where id = p_inventory_container_id and user_id = v_uid
      and protocol_item_id = p_protocol_item_id and is_active = true
    for update;
    if not found then raise exception 'Inventory container not found'; end if;
    if lower(v_inventory_unit) <> lower(p_unit) then raise exception 'Inventory unit must match dose unit'; end if;
    if v_remaining < p_amount then raise exception 'Not enough inventory remaining'; end if;
    update public.inventory_containers
    set remaining_amount = remaining_amount - p_amount, updated_at = now()
    where id = p_inventory_container_id and user_id = v_uid;
  end if;

  insert into public.dose_logs
    (user_id, protocol_item_id, inventory_container_id, amount, unit, route, site, status, scheduled_for, client_event_id)
  values
    (v_uid, p_protocol_item_id, p_inventory_container_id, p_amount, p_unit,
     p_route, p_site, 'completed', p_scheduled_for, p_client_event_id)
  returning * into v_log;
  return v_log;
end;
$$;
revoke all on function public.log_dose_and_decrement(uuid,numeric,text,text,text,uuid,timestamptz,uuid) from public;
grant execute on function public.log_dose_and_decrement(uuid,numeric,text,text,text,uuid,timestamptz,uuid) to authenticated;
