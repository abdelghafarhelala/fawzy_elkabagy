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
