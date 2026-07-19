-- Multi-branch locations (name, address, phones, maps)
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null,
  address_en text not null,
  address_ar text not null,
  phones jsonb not null default '[]'::jsonb,
  map_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

alter table public.locations enable row level security;

create policy "Public can read active locations"
  on public.locations
  for select
  to anon, authenticated
  using (is_active = true and is_deleted = false);

create policy "Authenticated can select all locations"
  on public.locations
  for select
  to authenticated
  using (true);

create policy "Authenticated can insert locations"
  on public.locations
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can update locations"
  on public.locations
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete locations"
  on public.locations
  for delete
  to authenticated
  using (true);

insert into public.locations (
  name_en, name_ar, address_en, address_ar, phones, map_url, sort_order
) values
(
  '5th Settlement',
  'التجمع الخامس',
  '5th Settlement, New Cairo, Egypt',
  'التجمع الخامس، القاهرة الجديدة، مصر',
  '["15517"]'::jsonb,
  'https://maps.google.com/?q=5th+Settlement+New+Cairo',
  0
),
(
  'Branch 2',
  'الفرع الثاني',
  'Update address in Admin',
  'حدّث العنوان من لوحة التحكم',
  '["15517"]'::jsonb,
  null,
  1
),
(
  'Branch 3',
  'الفرع الثالث',
  'Update address in Admin',
  'حدّث العنوان من لوحة التحكم',
  '["15517"]'::jsonb,
  null,
  2
);
