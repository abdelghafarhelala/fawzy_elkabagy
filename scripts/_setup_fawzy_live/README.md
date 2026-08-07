# Setup project hviscqhamtdmjorhuoum (fawzy-live org)

MCP cannot write to this org yet, so run SQL in the dashboard.

## 1. Open SQL Editor

https://supabase.com/dashboard/project/hviscqhamtdmjorhuoum/sql/new

## 2. Run files in order (copy/paste each, Run)

From repo folder `scripts/_setup_fawzy_live/`:

1. `01_schema.sql` — tables, storage, RLS
2. `02a_categories.sql`
3. `02b_products_00.sql` … `02b_products_04.sql` (all five)
4. `02c_rest.sql` — locations, reach_out, menu PDF

## 3. Create admin user

Authentication → Users → Add user  
- Email: your admin email  
- Password: your password  
- Auto confirm: ON  

## 4. Copy API keys

https://supabase.com/dashboard/project/hviscqhamtdmjorhuoum/settings/api

Paste into chat (or update yourself):

- Project URL  
- `anon` `public` key  
- `service_role` (only into `.env` / Vercel / GitHub — never commit)

Then update GitHub Actions + Vercel secrets to the new URL + service_role.
