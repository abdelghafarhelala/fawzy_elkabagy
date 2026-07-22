-- Signature selections: one dish per category so category images differ.
-- Keep King's Crown (royal) + Kofta (grills); add tajine + main.

update public.products
set is_signature = false, signature_sort_order = 0
where is_signature = true;

update public.products
set is_signature = true, signature_sort_order = 1
where name_en = 'The King''s Crown' and is_deleted = false;

update public.products
set is_signature = true, signature_sort_order = 2
where name_en = 'Kofta (1 kg)' and is_deleted = false;

update public.products
set is_signature = true, signature_sort_order = 3
where name_en = 'Tajine Fattah Kaware' and is_deleted = false;

update public.products
set is_signature = true, signature_sort_order = 4
where name_en = 'Lamb Shank Fattah' and is_deleted = false;
