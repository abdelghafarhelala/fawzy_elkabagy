# Supabase setup log

Chronological record of what was applied for project **fawzyElkababgy**.

## 1. Account / organization

- Authenticated Supabase MCP with account owning org **fawzyelkbabgy1@gmail.com's Org** (`pohlbcftdctjlbiifoqh`)
- Confirmed Free plan cost via `get_cost` → **$0 / month**
- Confirmed cost via `confirm_cost`

## 2. Project creation

- Created project **fawzyElkababgy**
- Region: `eu-central-1`
- Project id / ref: `zveiywuiiyvokicmptxg`
- Status after create: `ACTIVE_HEALTHY`
- API URL: `https://zveiywuiiyvokicmptxg.supabase.co`

## 3. Local mirror

Created in the app repo:

- `supabase/config.toml`
- `supabase/migrations/20260718120000_create_core_tables.sql`
- `supabase/migrations/20260718120100_seed_reach_out_and_categories.sql`
- `supabase/migrations/20260718120200_storage_and_rls.sql`
- `supabase/migrations/20260718120300_fix_set_updated_at_search_path.sql`
- `supabase/migrations/20260718140000_seed_products.sql`
- `supabase/schema.sql`
- `supabase/seed.sql`

## 4. Remote migrations (MCP `apply_migration`)

1. **`create_core_tables`** — categories, products, menu_pdf, contact_messages, reach_out + `set_updated_at` triggers
2. **`seed_reach_out_and_categories`** — reach_out + 5 categories
3. **`storage_and_rls`** — buckets `menu-pdfs` / `product-images` + table & storage RLS policies
4. **`fix_set_updated_at_search_path`** — harden `set_updated_at` (`search_path = public`)
5. **`seed_products`** — 7 products from the previous hard-coded menu (EN/AR, images, tags)
6. **`add_product_signature_flags`** — `is_signature` + `signature_sort_order`; marked Royal Mixed Grill, Prime Charcoal Steaks, Garden Appetizers
7. **`admin_select_policies`** — authenticated can SELECT all categories/products (for admin lists)

Verified: categories = 5; products = 7 (3 signatures); reach_out = 1.

## 5. Admin Auth user

- Created confirmed Auth user: `FawzyElKbabgy1@gmail.com` (email confirmed)
- Password set in Supabase Auth only — **not** stored in this repo or docs

### Disable public signups (manual dashboard step)

MCP has no Auth settings API for this. In Supabase Dashboard:

1. Open project **fawzyElkababgy**
2. **Authentication** → **Providers** → **Email**
3. Turn off **Allow new users to sign up**
4. Save

Only the admin account should be able to sign in afterward.

## 6. App env files

- Added `.env.example` (placeholders)
- Local `.env` should hold `SUPABASE_URL` + `SUPABASE_ANON_KEY` (gitignored)
