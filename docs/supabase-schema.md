# Supabase schema

Source of truth SQL: [`supabase/schema.sql`](../supabase/schema.sql) and [`supabase/migrations/`](../supabase/migrations/).

## Tables

### `categories`

Menu tabs (e.g. STEAKS / ستيك).

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | `gen_random_uuid()` |
| slug | text unique | e.g. `steaks` |
| name_en / name_ar | text | bilingual labels |
| sort_order | int | display order |
| is_active | boolean | default true |
| is_deleted | boolean | soft delete |
| created_at / updated_at | timestamptz | auto |

### `products`

Items under a category.

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | |
| category_id | uuid FK → categories | cascade delete |
| name_en / name_ar | text | |
| description_en / description_ar | text | |
| price_en / price_ar | text | display strings |
| image_url | text | public URL |
| badge_en / badge_ar | text nullable | e.g. Popular |
| tags | jsonb | `[{ "en", "ar", "muted" }]` |
| sort_order | int | |
| is_signature | boolean | default false — featured in SIGNATURE SELECTIONS |
| signature_sort_order | int | carousel order when `is_signature` |
| is_active / is_deleted | boolean | |
| created_at / updated_at | timestamptz | |

### `menu_pdf`

Downloadable full menu PDF (keep one active row from the dashboard).

| Column | Type |
|--------|------|
| id | uuid PK |
| file_path | text (storage path) |
| file_url | text (public URL) |
| updated_at | timestamptz |

### `contact_messages`

Contact Us form inbox.

| Column | Type |
|--------|------|
| id | uuid PK |
| full_name | text |
| email | text |
| subject | text |
| message | text |
| is_read | boolean default false |
| created_at | timestamptz |

### `reach_out`

REACH OUT block (location, phone, hours) — singleton row.

| Column | Type |
|--------|------|
| id | uuid PK |
| location_en / location_ar | text |
| phone | text (seeded `15517`) |
| hours_en / hours_ar | text |
| updated_at | timestamptz |

## RLS summary

| Table | Anon | Authenticated (admin) |
|-------|------|------------------------|
| categories, products | SELECT where active and not deleted | INSERT, UPDATE, DELETE |
| menu_pdf, reach_out | SELECT | INSERT, UPDATE, DELETE |
| contact_messages | INSERT | SELECT, UPDATE, DELETE |

## Storage buckets

| Bucket | Public read | Authenticated write | Allowed types |
|--------|-------------|---------------------|---------------|
| `menu-pdfs` | yes | yes | PDF (50 MB) |
| `product-images` | yes | yes | jpeg/png/webp/gif (5 MB) |

## Seeded data

- 1 `reach_out` row (New Cairo, phone `15517`, daily hours)
- 5 categories: kebab, mixed, steaks, sides, desserts
