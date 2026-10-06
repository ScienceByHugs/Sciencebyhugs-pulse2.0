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
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Dose amount must be greater than zero'; end if;
  if not exists (select 1 from public.protocol_items where id = p_protocol_item_id and user_id = v_uid and active = true)
    then raise exception 'Protocol item not found'; end if;
  if p_inventory_container_id is not null then
    update public.inventory_containers
       set remaining_amount = greatest(remaining_amount - p_amount, 0), updated_at = now()
     where id = p_inventory_container_id and user_id = v_uid and protocol_item_id = p_protocol_item_id and is_active = true;
    if not found then raise exception 'Inventory container not found'; end if;
  end if;
  insert into public.dose_logs (user_id,protocol_item_id,inventory_container_id,amount,unit,route,site,status,scheduled_for)
  values (v_uid,p_protocol_item_id,p_inventory_container_id,p_amount,p_unit,p_route,p_site,'completed',p_scheduled_for)
  returning * into v_log;
  return v_log;
end;
$$;
revoke all on function public.log_dose_and_decrement(uuid,numeric,text,text,text,uuid,timestamptz) from public;
grant execute on function public.log_dose_and_decrement(uuid,numeric,text,text,text,uuid,timestamptz) to authenticated;
