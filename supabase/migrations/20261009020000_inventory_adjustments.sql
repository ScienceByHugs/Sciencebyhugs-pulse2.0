-- Append-only, user-scoped inventory correction history.
create table if not exists public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  inventory_container_id uuid not null references public.inventory_containers(id),
  old_remaining_amount numeric not null check (old_remaining_amount >= 0),
  new_remaining_amount numeric not null check (new_remaining_amount >= 0),
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now()
);

create index if not exists inventory_adjustments_owner_container_idx
on public.inventory_adjustments (user_id, inventory_container_id, created_at desc);

alter table public.inventory_adjustments enable row level security;

create policy inventory_adjustments_read_own
on public.inventory_adjustments for select to authenticated
using (user_id = (select auth.uid()));

grant select on public.inventory_adjustments to authenticated;

-- A single database transaction locks the container, updates the balance and records why.
create or replace function public.correct_inventory_remaining(
  p_container_id uuid, p_new_amount numeric, p_reason text
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_old numeric;
begin
  if v_user is null then raise exception 'Sign in required'; end if;
  if p_new_amount is null or p_new_amount < 0 or p_new_amount > 1000000000 then
    raise exception 'Invalid remaining quantity';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) not between 3 and 500 then
    raise exception 'Enter a correction reason of 3 to 500 characters';
  end if;
  select remaining_amount into v_old
  from public.inventory_containers
  where id = p_container_id and user_id = v_user
  for update;
  if not found then raise exception 'Inventory container not found'; end if;
  update public.inventory_containers
  set remaining_amount = p_new_amount, updated_at = now()
  where id = p_container_id and user_id = v_user;
  insert into public.inventory_adjustments
    (user_id, inventory_container_id, old_remaining_amount, new_remaining_amount, reason)
  values (v_user, p_container_id, v_old, p_new_amount, btrim(p_reason));
end;
$$;

revoke all on function public.correct_inventory_remaining(uuid,numeric,text) from public;
grant execute on function public.correct_inventory_remaining(uuid,numeric,text) to authenticated;
