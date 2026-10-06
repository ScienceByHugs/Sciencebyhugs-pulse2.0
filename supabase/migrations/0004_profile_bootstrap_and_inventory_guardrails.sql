alter table public.inventory_containers
  add column if not exists low_threshold numeric not null default 0
  check (low_threshold >= 0);

create or replace function public.handle_new_pulse_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name, timezone)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, ''), '@', 1)), 'UTC')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_pulse_auth_user_created on auth.users;
create trigger on_pulse_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_pulse_user();

create or replace function public.log_dose_and_decrement(
  p_protocol_item_id uuid,
  p_amount numeric,
  p_unit text,
  p_route text default null,
  p_site text default null,
  p_inventory_container_id uuid default null,
  p_scheduled_for timestamptz default null
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
  if not exists (select 1 from public.protocol_items where id = p_protocol_item_id and user_id = v_uid and active = true)
    then raise exception 'Protocol item not found'; end if;

  if p_inventory_container_id is not null then
    select remaining_amount, unit into v_remaining, v_inventory_unit
      from public.inventory_containers
     where id = p_inventory_container_id and user_id = v_uid and protocol_item_id = p_protocol_item_id and is_active = true
     for update;
    if not found then raise exception 'Inventory container not found'; end if;
    if lower(v_inventory_unit) <> lower(p_unit) then raise exception 'Inventory unit must match dose unit'; end if;
    if v_remaining < p_amount then raise exception 'Not enough inventory remaining'; end if;

    update public.inventory_containers
       set remaining_amount = remaining_amount - p_amount, updated_at = now()
     where id = p_inventory_container_id;
  end if;

  insert into public.dose_logs (user_id,protocol_item_id,inventory_container_id,amount,unit,route,site,status,scheduled_for)
  values (v_uid,p_protocol_item_id,p_inventory_container_id,p_amount,p_unit,p_route,p_site,'completed',p_scheduled_for)
  returning * into v_log;
  return v_log;
end;
$$;
