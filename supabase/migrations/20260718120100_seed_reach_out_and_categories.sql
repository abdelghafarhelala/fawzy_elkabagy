-- Seed reach_out and initial categories

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
