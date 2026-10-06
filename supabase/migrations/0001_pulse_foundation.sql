create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  privacy_lock_enabled boolean not null default false,
  notification_privacy text not null default 'full'
    check (notification_privacy in ('full','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.protocols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'active'
    check (status in ('active','paused','archived')),
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.protocol_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  protocol_id uuid not null references public.protocols(id) on delete cascade,
  name text not null,
  category text,
  route text not null
    check (route in ('subcutaneous','intramuscular','oral','topical','other')),
  form text,
  dose_amount numeric not null check (dose_amount > 0),
  dose_unit text not null,
  schedule jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  site_rotation_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_containers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  protocol_item_id uuid not null references public.protocol_items(id) on delete cascade,
  total_amount numeric not null check (total_amount >= 0),
  remaining_amount numeric not null check (remaining_amount >= 0),
  unit text not null,
  opened_at timestamptz,
  expires_at timestamptz,
  user_use_by_at timestamptz,
  lot_number text,
  package_type text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  protocol_item_id uuid not null references public.protocol_items(id) on delete cascade,
  inventory_container_id uuid references public.inventory_containers(id) on delete set null,
  amount numeric not null check (amount > 0),
  unit text not null,
  route text,
  site text,
  status text not null default 'completed'
    check (status in ('completed','skipped','missed')),
  notes text,
  scheduled_for timestamptz,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.protocols enable row level security;
alter table public.protocol_items enable row level security;
alter table public.inventory_containers enable row level security;
alter table public.dose_logs enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.profiles
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "profiles_delete_own" on public.profiles
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "protocols_select_own" on public.protocols
for select to authenticated using ((select auth.uid()) = user_id);
create policy "protocols_insert_own" on public.protocols
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "protocols_update_own" on public.protocols
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "protocols_delete_own" on public.protocols
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "protocol_items_select_own" on public.protocol_items
for select to authenticated using ((select auth.uid()) = user_id);
create policy "protocol_items_insert_own" on public.protocol_items
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "protocol_items_update_own" on public.protocol_items
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "protocol_items_delete_own" on public.protocol_items
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "inventory_select_own" on public.inventory_containers
for select to authenticated using ((select auth.uid()) = user_id);
create policy "inventory_insert_own" on public.inventory_containers
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "inventory_update_own" on public.inventory_containers
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "inventory_delete_own" on public.inventory_containers
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "dose_logs_select_own" on public.dose_logs
for select to authenticated using ((select auth.uid()) = user_id);
create policy "dose_logs_insert_own" on public.dose_logs
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dose_logs_update_own" on public.dose_logs
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "dose_logs_delete_own" on public.dose_logs
for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists protocols_user_id_idx on public.protocols(user_id);
create index if not exists protocol_items_user_id_idx on public.protocol_items(user_id);
create index if not exists protocol_items_protocol_id_idx on public.protocol_items(protocol_id);
create index if not exists inventory_user_id_idx on public.inventory_containers(user_id);
create index if not exists inventory_protocol_item_id_idx on public.inventory_containers(protocol_item_id);
create index if not exists dose_logs_user_id_logged_at_idx on public.dose_logs(user_id, logged_at desc);
create index if not exists dose_logs_protocol_item_id_idx on public.dose_logs(protocol_item_id);
