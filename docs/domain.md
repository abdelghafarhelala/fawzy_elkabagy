# One Domain for Website + Admin Dashboard

Yes. One domain can serve both — this is the normal approach.

## How it works

| URL | What opens |
|-----|------------|
| `fawzyelkababgy.com` | Public website |
| `fawzyelkababgy.com/admin` | Admin login |
| `fawzyelkababgy.com/admin/dashboard` | Dashboard |

Same Angular app (or same host), different **routes**. You only buy **one** domain.

---

## In your Angular app

Add admin routes next to the public ones in `app.routes.ts`:

```ts
export const routes: Routes = [
  // Public
  { path: '', loadComponent: () => import('./public-menu/home/home').then(m => m.Home) },

  // Admin (lazy-loaded so visitors don't download dashboard code)
  {
    path: 'admin',
    canActivate: [authGuard], // only logged-in admins
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin/dashboard/dashboard').then(m => m.Dashboard),
      },
      // categories, items, etc.
    ],
  },

  { path: '**', redirectTo: '' },
];
```

Folder sketch:

```text
src/app/
  public-menu/     ← current website
  admin/           ← dashboard
    login/
    dashboard/
  core/
    services/
      menu.service.ts      ← Supabase reads (public)
      admin.service.ts     ← Supabase writes (auth required)
    guards/
      auth.guard.ts
```

---

## Auth & security (important)

Path `/admin` alone is **not** security — anyone can type it. Protect with:

1. **Supabase Auth** (email/password for the owner)
2. An Angular **`authGuard`** that redirects to login if not signed in
3. **Supabase RLS** so only authenticated admin can insert/update/delete menu data; the public site only **reads**

---

## Hosting (still one domain)

Deploy the Angular build once (e.g. Firebase Hosting, Vercel, Netlify, Cloudflare Pages). Point `fawzyelkababgy.com` DNS to that host.

SPA rule: all paths like `/admin/dashboard` must rewrite to `index.html` so Angular routing handles them (hosts usually have a “SPA fallback” setting).

---

## Optional: subdomain later (same domain purchase)

You can also use `admin.fawzyelkababgy.com` with **one** domain (a subdomain, not a second purchase). Paths are simpler and enough for a small dashboard.

---

## Bottom line

Buy one domain, one hosting project, path `/admin/...` for the dashboard + Supabase Auth + RLS. That is the standard, cheap setup for what you want.
