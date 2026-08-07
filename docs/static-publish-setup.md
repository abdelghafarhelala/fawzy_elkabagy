# Static publish setup (one-time)

After deploying this branch, configure the following so the admin
**Publish** button can export Supabase data into `public/data` and
redeploy the site.

## 1. GitHub Actions secrets

Repo → Settings → Secrets and variables → Actions:

| Secret | Value |
| --- | --- |
| `SUPABASE_URL` | `https://zveiywuiiyvokicmptxg.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key from Supabase → Project Settings → API |

## 2. GitHub fine-grained PAT

Create a fine-grained personal access token scoped **only** to this repo:

- Repository permissions: **Contents: Read and write**, **Actions: Read and write**
- Store it as Vercel env var `GITHUB_TOKEN` (Production + Preview)

## 3. Vercel environment variables

Project → Settings → Environment Variables (server-side / not exposed to browser):

| Name | Notes |
| --- | --- |
| `SUPABASE_URL` | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as above (used to verify admin session) |
| `GITHUB_TOKEN` | Fine-grained PAT from step 2 |
| `GITHUB_REPO` | `abdelghafarhelala/fawzy_elkabagy` (optional; this is the default) |
| `GITHUB_WORKFLOW_FILE` | `publish-data.yml` (optional default) |
| `GITHUB_REF` | `master` (optional default) |

## 4. First publish / bootstrap

Supabase Storage may return **402 (egress exceeded)** so `npm run export:data`
cannot download images/PDF until the quota resets.

If that happens:

1. The repo already includes a bootstrapped
   [`public/data/site-data.json`](../public/data/site-data.json) (menu text +
   local image fallbacks) so the live site works without Supabase reads.
2. After the quota resets (or you temporarily lift the spend cap), run:

   ```bash
   npm run export:data
   ```

   Commit `public/data/**` and push — or use the admin **Publish** button once
   GitHub/Vercel secrets are configured.

3. With secrets set, use **Publish changes to website** on `/admin/dashboard`
   for future updates.