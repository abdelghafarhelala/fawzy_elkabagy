# Static publish setup (new Supabase project)

Public visitors read static files from Vercel (`/data/site-data.json` +
images/PDF). The admin dashboard edits **Supabase** live. Clicking
**Publish changes to website** exports DB → git → Vercel redeploy so the
live site shows the latest text, images, and PDF.

## Active project

| | |
| --- | --- |
| Name | `fawzy-elkabagy-live` |
| Ref | `mrcmlorpbveilbeaeqvu` |
| URL | `https://mrcmlorpbveilbeaeqvu.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/mrcmlorpbveilbeaeqvu |

## How Publish works

1. Admin edits products / categories / PDF / locations in the dashboard
   (writes go to Supabase Storage + tables).
2. Admin taps **Publish** → `POST /api/publish` (Vercel) verifies the
   admin JWT, then triggers GitHub Action `publish-data.yml`.
3. The Action runs `npm run export:data`, which:
   - reads categories, products, signatures, locations, reach_out, menu_pdf
   - keeps paths that already start with `/` (e.g. `/images/menu/…`)
   - downloads new Storage URLs into `public/data/images/` and
     `public/data/menu.pdf`
   - writes `public/data/site-data.json`
4. Action commits `public/data` and pushes `master` → Vercel redeploys
   → live site updates.

## One-time secrets (update to the NEW project)

### 1. Supabase service role

Dashboard → Project Settings → API → copy **service_role** (secret).

### 2. Local `.env`

```bash
SUPABASE_URL=https://mrcmlorpbveilbeaeqvu.supabase.co
SUPABASE_ANON_KEY=<anon key from API settings>
SUPABASE_SERVICE_ROLE_KEY=<service_role>
```

`src/environments/environment.ts` already points at the new URL + anon key.

### 3. GitHub Actions secrets

Repo → Settings → Secrets and variables → Actions — **replace** old values:

| Secret | Value |
| --- | --- |
| `SUPABASE_URL` | `https://mrcmlorpbveilbeaeqvu.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | New project's service_role |

### 4. Vercel env vars

Project → Settings → Environment Variables — **replace** for Production
(+ Preview if used):

| Name | Notes |
| --- | --- |
| `SUPABASE_URL` | New project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | New service_role (verifies admin + used by APIs) |
| `GITHUB_TOKEN` | Fine-grained PAT: Contents + Actions write on this repo |
| `GITHUB_REPO` | `abdelghafarhelala/fawzy_elkabagy` (optional default) |
| `GITHUB_WORKFLOW_FILE` | `publish-data.yml` (optional) |
| `GITHUB_REF` | `master` (optional) |

Redeploy Vercel after changing env vars.

### 5. Admin login user

Auth users do **not** copy between projects. Create one:

1. Supabase → Authentication → Users → **Add user**
2. Use your usual admin email + password
3. Confirm email if required (or disable email confirm in Auth settings)

Then log in at `/admin`.

## First publish after switching

1. Update secrets (steps 3–4) and create the admin user (step 5).
2. Log into the dashboard, make a small edit (or none), tap **Publish**.
3. Watch GitHub → Actions → “Export Supabase data and publish”.
4. After it succeeds and Vercel finishes deploying, refresh the live site.

Local paths under `public/images/menu/` stay in the repo; new uploads from
the dashboard are copied into `public/data/` on each Publish so visitors
never hit Supabase Storage.
