-- Seed reach_out + initial menu categories

insert into public.reach_out (
  location_en,
  location_ar,
  phone,
  hours_en,
  hours_ar
) values (
  '5th Settlement, New Cairo, Egypt',
  'التجمع الخامس، القاهرة الجديدة، مصر',
  '15517',
  'Daily: 12:00 PM – 02:00 AM',
  'يومياً: 12:00 ظهراً – 2:00 صباحاً'
);

insert into public.categories (slug, name_en, name_ar, sort_order) values
  ('kebab', 'KEBAB & KOFTA', 'كباب وكفتة', 1),
  ('mixed', 'MIXED GRILLS', 'مشكل مشاوي', 2),
  ('steaks', 'STEAKS', 'ستيك', 3),
  ('sides', 'SIDE DISHES', 'أطباق جانبية', 4),
  ('desserts', 'DESSERTS', 'حلويات', 5);
-- Seed products from the previous hard-coded menu data
-- Images use public/ site paths so the website can render without Storage uploads yet

insert into public.products (
  category_id,
  name_en,
  name_ar,
  description_en,
  description_ar,
  price_en,
  price_ar,
  image_url,
  badge_en,
  badge_ar,
  tags,
  sort_order
)
select
  c.id,
  v.name_en,
  v.name_ar,
  v.description_en,
  v.description_ar,
  v.price_en,
  v.price_ar,
  v.image_url,
  v.badge_en,
  v.badge_ar,
  v.tags::jsonb,
  v.sort_order
from (
  values
    (
      'kebab',
      'Signature Kofta',
      'كفتة التوقيع',
      'Minced premium beef with our signature blend of 7 spices, grilled on silver skewers.',
      'لحم بقري مفروم فاخر مع خليطنا المميز من ٧ توابل، مشوي على أسياخ فضية.',
      '480 EGP',
      '480 ج.م',
      'images/menu-kofta.jpg',
      'POPULAR',
      'الأكثر طلباً',
      '[{"en":"CHARCOAL GRILLED","ar":"مشوي على الفحم"},{"en":"HOUSE SPECIAL","ar":"خاص المنزل"}]',
      1
    ),
    (
      'kebab',
      'Lamb Chops',
      'ريش ضأن',
      'Tender lamb chops marinated for 24 hours in onion water and Mediterranean herbs.',
      'ريش ضأن طرية متبلة ٢٤ ساعة في ماء البصل وأعشاب المتوسط.',
      '620 EGP',
      '620 ج.م',
      'images/menu-lamb.jpg',
      null,
      null,
      '[{"en":"PREMIUM CUT","ar":"قطعة فاخرة"}]',
      2
    ),
    (
      'kebab',
      'Elkababgy Mix',
      'مشكل الكبابجي',
      'A grand selection of Kofta, Kebab, Shish Tawook, and Tarb served with Baladi bread.',
      'تشكيلة فاخرة من الكفتة والكباب والشيش طاووق والطرب مع العيش البلدي.',
      '750 EGP',
      '750 ج.م',
      'images/menu-mix.jpg',
      'CHEF''S CHOICE',
      'اختيار الشيف',
      '[{"en":"FEAST","ar":"وليمة"}]',
      3
    ),
    (
      'mixed',
      'Royal Mixed Grill',
      'مشكل ملكي',
      'A grand selection of lamb chops, kofta, and shish tawook, charcoal grilled to perfection.',
      'تشكيلة فاخرة من ريش الضأن والكفتة والشيش طاووق مشوية على الفحم بإتقان.',
      'EGP 850',
      '850 ج.م',
      'images/menu-mix.jpg',
      null,
      null,
      '[{"en":"CHEF''S CHOICE","ar":"اختيار الشيف"},{"en":"SMOKED 4H","ar":"تدخين ٤ ساعات","muted":true}]',
      1
    ),
    (
      'steaks',
      'Prime Charcoal Steaks',
      'ستيك الفحم الفاخر',
      'Aged for 21 days and finished over the high heat of lemonwood charcoal.',
      'مُعتّق 21 يوماً ومنتهٍ على حرارة فحم خشب الليمون العالية.',
      '620 EGP',
      '620 ج.م',
      'images/sig-steaks.jpg',
      null,
      null,
      '[{"en":"PREMIUM CUT","ar":"قطعة فاخرة"}]',
      1
    ),
    (
      'sides',
      'Garden Appetizers',
      'مقبلات الحديقة',
      'The perfect accompaniment to our grilled selections, prepared fresh every morning.',
      'المرافق المثالي لمشاوينا، يُحضَّر طازجاً كل صباح.',
      '480 EGP',
      '480 ج.م',
      'images/sig-garden.jpg',
      null,
      null,
      '[{"en":"CHARCOAL GRILLED","ar":"مشوي على الفحم","muted":true}]',
      1
    ),
    (
      'desserts',
      'Elkababgy Mix',
      'مشكل الكبابجي',
      'A grand selection of Kofta, Kebab, Shish Tawook, and Tarb served with Baladi bread.',
      'تشكيلة فاخرة من الكفتة والكباب والشيش طاووق والطرب مع العيش البلدي.',
      '750 EGP',
      '750 ج.م',
      'images/sig-royal.jpg',
      null,
      null,
      '[{"en":"FEAST","ar":"وليمة"}]',
      1
    )
) as v(
  slug,
  name_en,
  name_ar,
  description_en,
  description_ar,
  price_en,
  price_ar,
  image_url,
  badge_en,
  badge_ar,
  tags,
  sort_order
)
join public.categories c on c.slug = v.slug
where not exists (
  select 1
  from public.products p
  where p.category_id = c.id
    and p.name_en = v.name_en
    and p.is_deleted = false
);
