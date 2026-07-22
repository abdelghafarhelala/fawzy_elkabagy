-- Signatures: Crown + Grill under royal, tajine, main.
-- Copy category images onto signature product image_url.

update public.products p
set category_id = (
  select id from public.categories
  where slug = 'royal' and is_deleted = false
  limit 1
)
where p.name_en = 'The King''s Grill' and p.is_deleted = false;

update public.products
set is_signature = false, signature_sort_order = 0
where is_signature = true;

update public.products
set is_signature = true, signature_sort_order = 1
where name_en = 'The King''s Crown' and is_deleted = false;

update public.products
set is_signature = true, signature_sort_order = 2
where name_en = 'The King''s Grill' and is_deleted = false;

update public.products
set is_signature = true, signature_sort_order = 3
where name_en = 'Tajine Grape Leaves with Oxtail' and is_deleted = false;

update public.products
set is_signature = true, signature_sort_order = 4
where name_en = 'Lamb Shank Fattah' and is_deleted = false;

update public.products p
set image_url = c.image_url,
    updated_at = now()
from public.categories c
where c.id = p.category_id
  and p.is_signature = true
  and p.is_deleted = false
  and c.image_url is not null
  and p.name_en <> 'The King''s Grill';

-- King's Grill uses grills category image (not royal)
update public.products p
set image_url = c.image_url,
    updated_at = now()
from public.categories c
where c.slug = 'grills'
  and c.is_deleted = false
  and p.name_en = 'The King''s Grill'
  and p.is_deleted = false;
