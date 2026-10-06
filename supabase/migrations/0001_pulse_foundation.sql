create extension if not exists pgcrypto;

-- Pulse 2.0 is intentionally isolated from the existing Pulse 1.x tables.
-- Existing auth.users identities can be reused without risking legacy records.

create table if not exists public.pulse2_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'UTC',
  privacy_lock_enabled boolean not null default false,
  notification_privacy text not null default 'full' check (notification_privacy in ('full','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pulse2_protocols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active','paused','archived')),
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pulse2_protocol_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  protocol_id uuid not null references public.pulse2_protocols(id) on delete cascade,
  name text not null,
  category text,
  route text not null check (route in ('subcutaneous','intramuscular','oral','topical','other')),
  form text,
  dose_amount numeric not null check (dose_amount > 0),
  dose_unit text not null,
  schedule jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pulse2_inventory_containers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  protocol_item_id uuid not null references public.pulse2_protocol_items(id) on delete cascade,
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

create table if not exists public.pulse2_dose_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  protocol_item_id uuid not null references public.pulse2_protocol_items(id) on delete cascade,
  inventory_container_id uuid references public.pulse2_inventory_containers(id) on delete set null,
  amount numeric not null check (amount > 0),
  unit text not null,
  route text,
  site text,
  status text not null default 'completed' check (status in ('completed','skipped','missed')),
  notes text,
  scheduled_for timestamptz,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.pulse2_settings enable row level security;
alter table public.pulse2_protocols enable row level security;
alter table public.pulse2_protocol_items enable row level security;
alter table public.pulse2_inventory_containers enable row level security;
alter table public.pulse2_dose_logs enable row level security;

create policy "pulse2_settings_own_rows" on public.pulse2_settings
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "pulse2_protocols_own_rows" on public.pulse2_protocols
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "pulse2_protocol_items_own_rows" on public.pulse2_protocol_items
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "pulse2_inventory_own_rows" on public.pulse2_inventory_containers
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "pulse2_dose_logs_own_rows" on public.pulse2_dose_logs
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists pulse2_protocols_user_id_idx on public.pulse2_protocols(user_id);
create index if not exists pulse2_protocol_items_user_id_idx on public.pulse2_protocol_items(user_id);
create index if not exists pulse2_protocol_items_protocol_id_idx on public.pulse2_protocol_items(protocol_id);
create index if not exists pulse2_inventory_user_id_idx on public.pulse2_inventory_containers(user_id);
create index if not exists pulse2_inventory_protocol_item_idx on public.pulse2_inventory_containers(protocol_item_id);
create index if not exists pulse2_logs_user_id_logged_at_idx on public.pulse2_dose_logs(user_id, logged_at desc);
create index if not exists pulse2_logs_protocol_item_idx on public.pulse2_dose_logs(protocol_item_id);
