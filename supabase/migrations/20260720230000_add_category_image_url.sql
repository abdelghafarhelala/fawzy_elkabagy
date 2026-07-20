-- Add optional image for category cards on the public menu
alter table public.categories
  add column if not exists image_url text;
