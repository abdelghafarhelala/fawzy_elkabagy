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
