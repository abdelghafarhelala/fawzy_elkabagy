-- Create core tables for menu, contact, and reach-out content

create extension if not exists "pgcrypto";

-- Categories (menu tabs)
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ar text not null,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products within categories
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name_en text not null,
  name_ar text not null,
  description_en text not null default '',
  description_ar text not null default '',
  price_en text not null default '',
  price_ar text not null default '',
  image_url text,
  badge_en text,
  badge_ar text,
  tags jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_sort_order_idx on public.products (sort_order);

-- Full menu PDF (singleton-style; keep latest row)
create table public.menu_pdf (
  id uuid primary key default gen_random_uuid(),
  file_path text not null,
  file_url text not null,
  updated_at timestamptz not null default now()
);

-- Contact Us form submissions
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  subject text not null default '',
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

-- REACH OUT contact info (singleton row expected)
create table public.reach_out (
  id uuid primary key default gen_random_uuid(),
  location_en text not null,
  location_ar text not null,
  phone text not null,
  hours_en text not null,
  hours_ar text not null,
  updated_at timestamptz not null default now()
);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger menu_pdf_set_updated_at
  before update on public.menu_pdf
  for each row execute function public.set_updated_at();

create trigger reach_out_set_updated_at
  before update on public.reach_out
  for each row execute function public.set_updated_at();
-- Add signature / featured flags on products

alter table public.products
  add column if not exists is_signature boolean not null default false,
  add column if not exists signature_sort_order integer not null default 0;

create index if not exists products_signature_idx
  on public.products (signature_sort_order)
  where is_signature = true and is_deleted = false and is_active = true;

update public.products
set is_signature = true, signature_sort_order = 1
where name_en = 'Royal Mixed Grill';

update public.products
set is_signature = true, signature_sort_order = 2
where name_en = 'Prime Charcoal Steaks';

update public.products
set is_signature = true, signature_sort_order = 3
where name_en = 'Garden Appetizers';
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


-- Storage buckets + RLS for public read / admin write

-- Buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'menu-pdfs',
    'menu-pdfs',
    true,
    52428800,
    array['application/pdf']::text[]
  ),
  (
    'product-images',
    'product-images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
  )
on conflict (id) do nothing;

-- Enable RLS on content tables
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.menu_pdf enable row level security;
alter table public.contact_messages enable row level security;
alter table public.reach_out enable row level security;

-- categories: public read active; authenticated full access
create policy "Public can read active categories"
  on public.categories
  for select
  to anon, authenticated
  using (is_active = true and is_deleted = false);

create policy "Authenticated can insert categories"
  on public.categories
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can update categories"
  on public.categories
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete categories"
  on public.categories
  for delete
  to authenticated
  using (true);

-- products: public read active; authenticated full access
create policy "Public can read active products"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true and is_deleted = false);

create policy "Authenticated can insert products"
  on public.products
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can update products"
  on public.products
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete products"
  on public.products
  for delete
  to authenticated
  using (true);

-- menu_pdf: public read; authenticated write
create policy "Public can read menu_pdf"
  on public.menu_pdf
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated can insert menu_pdf"
  on public.menu_pdf
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can update menu_pdf"
  on public.menu_pdf
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete menu_pdf"
  on public.menu_pdf
  for delete
  to authenticated
  using (true);

-- reach_out: public read; authenticated write
create policy "Public can read reach_out"
  on public.reach_out
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated can insert reach_out"
  on public.reach_out
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can update reach_out"
  on public.reach_out
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete reach_out"
  on public.reach_out
  for delete
  to authenticated
  using (true);

-- contact_messages: anon insert; authenticated read/update/delete
create policy "Public can insert contact_messages"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);

create policy "Authenticated can read contact_messages"
  on public.contact_messages
  for select
  to authenticated
  using (true);

create policy "Authenticated can update contact_messages"
  on public.contact_messages
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete contact_messages"
  on public.contact_messages
  for delete
  to authenticated
  using (true);

-- Storage policies: public read, authenticated write
create policy "Public can read menu-pdfs"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'menu-pdfs');

create policy "Authenticated can upload menu-pdfs"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'menu-pdfs');

create policy "Authenticated can update menu-pdfs"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'menu-pdfs')
  with check (bucket_id = 'menu-pdfs');

create policy "Authenticated can delete menu-pdfs"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'menu-pdfs');

create policy "Public can read product-images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'product-images');

create policy "Authenticated can upload product-images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "Authenticated can update product-images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

create policy "Authenticated can delete product-images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-images');
-- Allow authenticated admins to read all rows (public policy still restricts anon)

create policy "Authenticated can read all categories"
  on public.categories
  for select
  to authenticated
  using (true);

create policy "Authenticated can read all products"
  on public.products
  for select
  to authenticated
  using (true);
