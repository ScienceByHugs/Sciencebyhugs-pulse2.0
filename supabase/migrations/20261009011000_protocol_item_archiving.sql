-- Reversible archive for tracked substances. Keep dose logs and inventory attached.
alter table public.protocol_items
  add column if not exists archived_at timestamptz;

create index if not exists protocol_items_user_active_archive_idx
  on public.protocol_items (user_id, archived_at, active);

comment on column public.protocol_items.archived_at is
  'When set, exclude this item from Today and active reminders; keep historical dose logs.';
