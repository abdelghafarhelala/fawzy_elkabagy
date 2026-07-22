-- Add missing tajines from menu PDF and set signature to grape leaves with oxtail.

with tajine_cat as (
  select id from public.categories
  where slug = 'tajines' and is_deleted = false
  limit 1
),
new_items (
  name_en,
  name_ar,
  price_en,
  price_ar,
  image_url,
  sort_order
) as (
  values
    (
      'Tajine Oxtail with Onions',
      'طاجن عكاوى بالبصل',
      '490 EGP',
      '490 ج.م',
      'images/menu/tajine-oxtail-with-onions.jpg',
      17
    ),
    (
      'Tajine Freekeh with Meat',
      'طاجن فريك باللحمة',
      '310 EGP',
      '310 ج.م',
      'images/menu/tajine-freekeh-with-meat.jpg',
      18
    ),
    (
      'Tajine Molokhia with Meat',
      'طاجن ملوخية باللحمة',
      '310 EGP',
      '310 ج.م',
      'images/menu/tajine-molokhia-with-meat.jpg',
      19
    ),
    (
      'Tajine Stuffed Rice with Meat',
      'طاجن أرز معمر باللحمة',
      '370 EGP',
      '370 ج.م',
      'images/menu/tajine-stuffed-rice-with-meat.jpg',
      20
    ),
    (
      'Tajine Grape Leaves with Kaware',
      'طاجن ورق عنب كوارع',
      '550 EGP',
      '550 ج.م',
      'images/menu/tajine-grape-leaves-with-kaware.jpg',
      21
    ),
    (
      'Tajine Ribs with Onions',
      'طاجن ريش بالبصل',
      '380 EGP',
      '380 ج.م',
      'images/menu/tajine-ribs-with-onions.jpg',
      22
    ),
    (
      'Tajine Kaware',
      'طاجن كوارع',
      '600 EGP',
      '600 ج.م',
      'images/menu/tajine-kaware.jpg',
      23
    ),
    (
      'Tajine Orzo with Veal',
      'طاجن لسان عصفور باللحمة البتلو',
      '350 EGP',
      '350 ج.م',
      'images/menu/tajine-orzo-with-veal.jpg',
      24
    ),
    (
      'Tajine Moussaka with Minced Meat',
      'طاجن مسقعة باللحمة المفرومة',
      '310 EGP',
      '310 ج.م',
      'images/menu/tajine-moussaka-with-minced-meat.jpg',
      25
    ),
    (
      'Tajine Grape Leaves with Oxtail',
      'طاجن ورق عنب عكاوي',
      '570 EGP',
      '570 ج.م',
      'images/menu/tajine-grape-leaves-with-oxtail.jpg',
      26
    ),
    (
      'Plain Orzo Tajine',
      'طاجن لسان عصفور سادة',
      '120 EGP',
      '120 ج.م',
      'images/menu/plain-orzo-tajine.jpg',
      27
    ),
    (
      'Plain Freekeh Tajine',
      'طاجن فريك سادة',
      '120 EGP',
      '120 ج.م',
      'images/menu/plain-freekeh-tajine.jpg',
      28
    ),
    (
      'Plain Green Beans Tajine',
      'طاجن فاصوليا خضراء سادة',
      '120 EGP',
      '120 ج.م',
      'images/menu/plain-green-beans-tajine.jpg',
      29
    ),
    (
      'Plain Okra Tajine',
      'طاجن بامية سادة',
      '120 EGP',
      '120 ج.م',
      'images/menu/plain-okra-tajine.jpg',
      30
    )
)
insert into public.products (
  category_id,
  name_en,
  name_ar,
  description_en,
  description_ar,
  price_en,
  price_ar,
  image_url,
  sort_order,
  is_active,
  is_deleted,
  is_signature,
  signature_sort_order
)
select
  c.id,
  v.name_en,
  v.name_ar,
  '',
  '',
  v.price_en,
  v.price_ar,
  v.image_url,
  v.sort_order,
  true,
  false,
  false,
  0
from new_items v
cross join tajine_cat c
where not exists (
  select 1
  from public.products p
  where p.category_id = c.id
    and p.is_deleted = false
    and p.name_ar = v.name_ar
);

-- Signature: grape leaves with oxtail instead of fattah kaware
update public.products
set is_signature = false, signature_sort_order = 0
where name_en = 'Tajine Fattah Kaware' and is_deleted = false;

update public.products
set is_signature = true, signature_sort_order = 3
where name_en = 'Tajine Grape Leaves with Oxtail' and is_deleted = false;
