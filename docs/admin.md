# Admin dashboard

English-only admin UI for managing site content. Public website stays bilingual.

## URLs

| Path | Purpose |
|------|---------|
| `/admin/login` | Email/password login (Supabase Auth) |
| `/admin/dashboard` | Overview links |
| `/admin/categories` | Menu tabs CRUD |
| `/admin/products` | Dishes CRUD + signature flag + image upload |
| `/admin/menu-pdf` | Upload full menu PDF |
| `/admin/reach-out` | Location, phone, hours |
| `/admin/messages` | Contact form inbox |

## Login

Use the Auth user created for the project (e.g. `FawzyElKbabgy1@gmail.com`).

Public signups should stay **disabled** in Supabase Auth settings.

## Storage

| Bucket | Used for |
|--------|----------|
| `product-images` | Product photos (public URL saved on `products.image_url`) |
| `menu-pdfs` | Full menu PDF (`menu_pdf.file_path` / `file_url`) |

## Code

- Auth: `src/app/core/services/auth.service.ts`, `src/app/core/guards/auth.guard.ts`
- Admin API: `src/app/core/services/admin.service.ts`
- UI: `src/app/admin/`
- Public contact form writes to `contact_messages` via `AdminService.submitContactMessage`

## Notes

- Soft-delete sets `is_deleted = true` (and deactivates) for categories/products.
- Signature dishes: `is_signature` + `signature_sort_order` on products.
- Authenticated users get full table access via RLS; anon can insert contact messages and read active public content.
