# Supabase overview — Fawzy Elkababgy

Backend for the public website and future `/admin` dashboard.

## Project

| Field | Value |
|-------|--------|
| Name | `fawzyElkababgy` |
| Project ref / id | `zveiywuiiyvokicmptxg` |
| Plan | **Free** ($0/month at creation) |
| Organization | `fawzyelkbabgy1@gmail.com's Org` (`pohlbcftdctjlbiifoqh`) |
| Region | `eu-central-1` |
| API URL | `https://zveiywuiiyvokicmptxg.supabase.co` |

## Local repo mirror

All schema and migration SQL lives in [`supabase/`](../supabase/):

- `supabase/config.toml` — project metadata
- `supabase/migrations/` — one file per remote change
- `supabase/schema.sql` — full schema snapshot
- `supabase/seed.sql` — seed data (also applied as a migration)

**Sync rule:** every change applied on Supabase must update files under `supabase/` and these docs.

## Related docs

- [supabase-schema.md](./supabase-schema.md) — tables, RLS, storage
- [supabase-setup.md](./supabase-setup.md) — chronological setup log
- [public-menu-data.md](./public-menu-data.md) — how the website reads categories, products, PDF
- [admin.md](./admin.md) — `/admin` dashboard login and CRUD
- [domain.md](./domain.md) — single domain + `/admin` paths

## Environment

Angular builds use [`src/environments/environment.ts`](../src/environments/environment.ts) (`supabaseUrl` + `supabaseAnonKey`).

Also keep a local `.env` (gitignored) for reference — see `.env.example`:

```env
SUPABASE_URL=https://zveiywuiiyvokicmptxg.supabase.co
SUPABASE_ANON_KEY=
```

Never commit service role keys or `.env`.

## Free plan notes

- Max 2 active free projects per org quota rules
- Free projects may pause after ~1 week of inactivity
