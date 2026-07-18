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
