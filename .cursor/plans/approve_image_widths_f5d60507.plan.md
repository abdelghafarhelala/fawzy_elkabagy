---
name: Approve image widths
overview: Per-file visual QA of the 900px WebP previews is done. Most category photos can stay at 900px; four signature-carousel sources should be 1200px; two photos with engraved Arabic brand text should be 1100px. Production files will be replaced only after you approve this list, keeping the same public filenames so site-data.json does not change.
todos:
  - id: backup-originals
    content: Copy production category WebPs and Logo.png to a gitignored backup folder
    status: completed
  - id: encode-replace
    content: Encode per approved widths and overwrite public files in place (same filenames)
    status: completed
  - id: verify-build
    content: Grep image URLs, run tsc + ng build, report measured before/after MB and A/B/C transfer
    status: completed
isProject: false
---

# Phase 2: Per-file image widths, then replace

You asked for a **final width list and your approval before any production replace**. This plan is that list.

## Display facts (no lightbox)

There is **no modal/zoom** for category photos. Largest views:

- Mobile category card: almost full viewport (~340–390px), 3:4, `object-fit: contain`
- Desktop category card: max **420px** wide ([`public-menu.css`](src/app/public-menu/public-menu.css) `.menu-card-image`)
- Hover only scales **1.03**
- Desktop signature carousel: up to **640px** CSS wide ([`.signature-card`](src/app/public-menu/public-menu.css)), `object-fit: cover` — this is the sharpest-need case
- Prices and dish names are **HTML** in the card body, not baked into the photos
- In-photo text found: engraved **فوزي الكبابجي** on metal/clay in `mashwyat.webp` and `soup.webp`

Logo uses [`images/Logo.png`](public/images/Logo.png) in navbar, drawer, and admin login (login logo height **120px**, max-width **450px**). Original is a **flat black-background PNG** (not a transparent mark). Keep **PNG + same filename** so we do not change HTML or add WebP artifacts on type.

## Recommended encode widths

Quality: `cwebp -q 82 -m 6` (same as previews). Widths are not forced equal.

| File | Chosen width | Why |
| ---- | ------------ | --- |
| `sandwiches.webp` | **900** | Already ~960px source; food photo; no in-image text |
| `aptizers.webp` | **900** | Category card only; inspect again at encode time (900px preview would not decode in this session) |
| `dessert.webp` | **900** | Food photo; no text |
| `fresh-drinks.webp` | **900** | Food photo; no text |
| `grill.webp` | **900** | Food photo; no text |
| `hot-drinks.webp` | **900** | Food photo; no text |
| `salts.webp` | **900** | Food photo; no text |
| `side-dishes.webp` | **900** | Food photo; no text |
| `mashwyat.webp` | **1100** | Engraved Arabic brand on brass — keep calligraphy crisp on 2–3x displays |
| `soup.webp` | **1100** | Raised Arabic on tagine pot |
| `fawzy-roal-dishes.webp` | **1200** | Used as signature image (desktop ~640px CSS ≈ 1280px at 2x) |
| `tajen.webp` | **1200** | Same — signature `image_url` |
| `fata-moza-dany.webp` | **1200** | Same — signature `image_url` |
| `main-dishes.webp` | **1200** | Same — signature `image_url` |
| `Logo.png` | **720px wide PNG** | Navbar 64px / login 120px; keep `.png` path and black background |

900px is enough for 420px cards (~2.1x). 1200px is for the 640px signature strip, not because those photos contain prices.

## After you approve this list (implementation)

1. Copy current production files to a gitignored backup (e.g. `.image-opt-backup/`) — do not delete until after build/reference checks.
2. Encode each file at the width above into a temp folder, then **overwrite** [`public/images/menu/*.webp`](public/images/menu/) and [`public/images/Logo.png`](public/images/Logo.png) in place (same names).
3. Do **not** edit [`public/data/site-data.json`](public/data/site-data.json), PDF, hero video, auth, APIs, or caching.
4. Grep that `/images/menu/` and `images/Logo.png` still resolve.
5. Run `npx tsc -p tsconfig.app.json --noEmit` and `npx ng build`. Confirm dist contains the new files and `robots.txt`; no broken copies of old huge files at those URLs.
6. Report **measured** category totals (not estimates) and A/B/C transfer using those bytes.

Phase 1 behavior stays: no boot-time `menu.pdf`; lazy category images; hashed JS/CSS cache only.

## Expected transfer (this step only)

Phase 1 already removed the 11.6 MB homepage PDF prefetch. Image replacement mainly helps visitors who **scroll the menu / signatures**.

Rough (900px set was 2.47 MB; 1100/1200 files will land higher — finals after encode):

- **A. Homepage, no scroll:** ~2.3 MB before and after (lazy). Logo ~315 KB → ~57 KB.
- **B. Homepage, scroll all categories:** ~12.6 MB → ~5–6 MB (category set ~10.27 MB → ~3 MB class).
- **C. Home + all categories + `/menu` PDF:** add **11.6 MB** PDF either way (~24 MB → ~17 MB).

Exact A/B/C numbers after the files exist.

## Not in this step

PDF, `hero.mp4`, Supabase, auth, API, `site-data.json` cache, unused-JPG deletion.
