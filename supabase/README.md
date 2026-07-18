# Supabase local files

This folder mirrors the remote Supabase project **fawzyElkababgy**.

| File | Purpose |
|------|---------|
| `config.toml` | Project ref, org, region |
| `migrations/` | Ordered SQL applied remotely |
| `schema.sql` | Full current schema snapshot |
| `seed.sql` | Seed data (also in a migration) |

When changing the remote database via MCP or Dashboard SQL:

1. Add/update a file under `migrations/`
2. Refresh `schema.sql`
3. Update `docs/supabase*.md`
