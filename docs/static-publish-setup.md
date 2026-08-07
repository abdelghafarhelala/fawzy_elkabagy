# Static publish setup (fawzy-live org)

Public site = static files on Vercel. Admin edits Supabase. **Publish**
exports DB → git → Vercel redeploy.

## Active project

| | |
| --- | --- |
| Org | [fawzy-live](https://supabase.com/dashboard/org/oqjdzhfbkllcrqgcfgqp) |
| Project | `fawzy-elkabagy` |
| Ref | `hviscqhamtdmjorhuoum` |
| URL | `https://hviscqhamtdmjorhuoum.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/hviscqhamtdmjorhuoum |

## One-time secrets

### 1. service_role

https://supabase.com/dashboard/project/hviscqhamtdmjorhuoum/settings/api  
Copy **service_role** into:

- local `.env` → `SUPABASE_SERVICE_ROLE_KEY`
- GitHub Actions secrets: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- Vercel env (same) → redeploy

`SUPABASE_URL` must be `https://hviscqhamtdmjorhuoum.supabase.co`

### 2. Admin user

Authentication → Users → Add user (Auto confirm ON).

### 3. Publish flow

Edit in dashboard → **Publish** → GitHub Action exports `public/data` → Vercel live.
