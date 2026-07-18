# Public menu data flow

How the live website reads Supabase (admin dashboard is a later phase).

## Navigation

| Control | Destination |
|---------|-------------|
| Nav / footer **Our Menu** | Home `#menu` section (categories + products) |
| Nav / hero **View Menu** | `/menu` PDF page |
| **Download full menu** | `/menu` PDF page |

## Data sources

| UI | Supabase |
|----|----------|
| Home menu tabs | `categories` (active, not deleted) |
| Home menu cards | `products` (active, not deleted) |
| SIGNATURE SELECTIONS | `products` where `is_signature = true` (ordered by `signature_sort_order`) |
| `/menu` page | Latest row in `menu_pdf` (`file_url`) |

## App code

- Client: [`src/app/core/services/supabase.service.ts`](../src/app/core/services/supabase.service.ts)
- Queries: [`src/app/core/services/menu.service.ts`](../src/app/core/services/menu.service.ts)
- Config: [`src/environments/environment.ts`](../src/environments/environment.ts) (anon key; RLS protects writes)
- Env mirror: `.env` / `.env.example`

## Empty data

Categories and sample **products** were seeded from the old hard-coded menu (7 dishes). Three are marked `is_signature` for the carousel (Royal Mixed Grill, Prime Charcoal Steaks, Garden Appetizers). PDF (`menu_pdf`) is still empty until an admin uploads one.

Future dashboard: checkbox **Signature** + `signature_sort_order` when editing a product.

See migrations:
- `supabase/migrations/20260718140000_seed_products.sql`
- `supabase/migrations/20260718150000_add_product_signature_flags.sql`
