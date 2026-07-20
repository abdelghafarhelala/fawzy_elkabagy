-- Full schema snapshot for fawzyElkababgy (as of initial setup)
-- Keep in sync with supabase/migrations/*

create extension if not exists "pgcrypto";

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
  is_signature boolean not null default false,
  signature_sort_order integer not null default 0,
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_sort_order_idx on public.products (sort_order);
create index products_signature_idx
  on public.products (signature_sort_order)
  where is_signature = true and is_deleted = false and is_active = true;

create table public.menu_pdf (
  id uuid primary key default gen_random_uuid(),
  file_path text not null,
  file_url text not null,
  updated_at timestamptz not null default now()
);

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

create table public.reach_out (
  id uuid primary key default gen_random_uuid(),
  location_en text not null,
  location_ar text not null,
  phone text not null,
  hours_en text not null,
  hours_ar text not null,
  updated_at timestamptz not null default now()
);

create table public.locations (
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

create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

-- RLS enabled on all content tables (see migrations/20260718120200_storage_and_rls.sql)
-- Storage buckets: menu-pdfs, product-images
