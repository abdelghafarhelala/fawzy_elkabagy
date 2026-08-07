#!/usr/bin/env node
/**
 * Export public menu data from Supabase into local static files.
 *
 * Writes:
 *   public/data/site-data.json
 *   public/data/images/*
 *   public/data/menu.pdf
 *
 * Usage:
 *   node scripts/export-static-data.mjs
 *   node scripts/export-static-data.mjs --dry-run
 *   node scripts/export-static-data.mjs --skip-assets
 *
 * Requires in .env (project root):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = join(ROOT, 'public', 'data');
const IMAGES_DIR = join(DATA_DIR, 'images');
const SITE_DATA_PATH = join(DATA_DIR, 'site-data.json');
const MENU_PDF_PATH = join(DATA_DIR, 'menu.pdf');

function loadEnv(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function extFromUrlOrType(url, contentType) {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    if (match) return match[1].toLowerCase();
  } catch {
    // ignore
  }
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) {
    return 'jpg';
  }
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('gif')) return 'gif';
  if (contentType?.includes('pdf')) return 'pdf';
  return 'bin';
}

function hashKey(input) {
  return createHash('sha1').update(input).digest('hex').slice(0, 12);
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter(
      (tag) =>
        !!tag &&
        typeof tag === 'object' &&
        typeof tag.en === 'string' &&
        typeof tag.ar === 'string',
    )
    .map((tag) => ({
      en: tag.en,
      ar: tag.ar,
      muted: !!tag.muted,
    }));
}

function normalizePhones(phones) {
  if (!Array.isArray(phones)) return [];
  return phones.map((p) => String(p ?? '').trim()).filter(Boolean);
}

async function downloadToFile(url, destPath) {
  const response = await fetch(url, {
    credentials: 'omit',
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  writeFileSync(destPath, Buffer.from(arrayBuffer));
  return response.headers.get('content-type') || '';
}

/**
 * Download a remote asset once and return a local public path.
 * Cache by original URL so the same image is not downloaded twice.
 * Returns null when download fails (e.g. Supabase egress 402).
 */
async function localizeAsset(url, cache, dryRun, skipAssets) {
  const trimmed = (url || '').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/')) return trimmed;
  if (cache.has(trimmed)) return cache.get(trimmed);

  if (skipAssets) {
    cache.set(trimmed, null);
    return null;
  }

  const key = hashKey(trimmed);
  let ext = 'bin';
  try {
    ext = extFromUrlOrType(trimmed, '');
  } catch {
    // keep default
  }

  const filename = `${key}.${ext}`;
  const destPath = join(IMAGES_DIR, filename);
  const publicPath = `/data/images/${filename}`;

  if (dryRun) {
    console.log(`[dry-run] ↓ ${trimmed} → ${publicPath}`);
    cache.set(trimmed, publicPath);
    return publicPath;
  }

  console.log(`↓ ${trimmed}`);
  try {
    const contentType = await downloadToFile(trimmed, destPath);

    // Rename if extension was wrong based on content-type.
    const betterExt = extFromUrlOrType(trimmed, contentType);
    if (betterExt !== ext && betterExt !== 'bin') {
      const betterName = `${key}.${betterExt}`;
      const betterPath = join(IMAGES_DIR, betterName);
      const betterPublic = `/data/images/${betterName}`;
      writeFileSync(betterPath, readFileSync(destPath));
      rmSync(destPath, { force: true });
      cache.set(trimmed, betterPublic);
      console.log(`  ✓ ${betterPublic}`);
      return betterPublic;
    }

    cache.set(trimmed, publicPath);
    console.log(`  ✓ ${publicPath}`);
    return publicPath;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  ✗ skipped (${message})`);
    cache.set(trimmed, null);
    return null;
  }
}

async function main() {
  loadEnv(join(ROOT, '.env'));
  loadEnv(join(ROOT, '.env.local'));

  const dryRun = process.argv.includes('--dry-run');
  const skipAssets = process.argv.includes('--skip-assets');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env',
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (!dryRun) {
    mkdirSync(IMAGES_DIR, { recursive: true });
  }

  const assetCache = new Map();

  // —— Categories ——
  const { data: categoriesRaw, error: categoriesError } = await supabase
    .from('categories')
    .select(
      'id, slug, name_en, name_ar, image_url, sort_order, is_active, is_deleted',
    )
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('sort_order', { ascending: true });

  if (categoriesError) throw categoriesError;

  const categories = [];
  for (const row of categoriesRaw ?? []) {
    const image_url = await localizeAsset(
      row.image_url,
      assetCache,
      dryRun,
      skipAssets,
    );
    categories.push({ ...row, image_url });
  }

  // —— Products ——
  const { data: productsRaw, error: productsError } = await supabase
    .from('products')
    .select(
      'id, category_id, name_en, name_ar, description_en, description_ar, ' +
        'price_en, price_ar, image_url, badge_en, badge_ar, tags, ' +
        'sort_order, is_signature, signature_sort_order, is_active, is_deleted',
    )
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('sort_order', { ascending: true });

  if (productsError) throw productsError;

  const products = [];
  for (const row of productsRaw ?? []) {
    const image_url = await localizeAsset(
      row.image_url,
      assetCache,
      dryRun,
      skipAssets,
    );
    products.push({
      ...row,
      image_url,
      tags: normalizeTags(row.tags),
    });
  }

  // —— Signatures (with category join) ——
  const { data: signaturesRaw, error: signaturesError } = await supabase
    .from('products')
    .select(
      'id, category_id, name_en, name_ar, description_en, description_ar, ' +
        'price_en, price_ar, image_url, badge_en, badge_ar, tags, ' +
        'sort_order, is_signature, signature_sort_order, is_active, is_deleted, ' +
        'categories(image_url, slug)',
    )
    .eq('is_signature', true)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('signature_sort_order', { ascending: true });

  if (signaturesError) throw signaturesError;

  const signatures = [];
  for (const row of signaturesRaw ?? []) {
    const category = Array.isArray(row.categories)
      ? row.categories[0]
      : row.categories;
    const image_url = await localizeAsset(
      row.image_url,
      assetCache,
      dryRun,
      skipAssets,
    );
    const category_image_url = await localizeAsset(
      category?.image_url,
      assetCache,
      dryRun,
      skipAssets,
    );
    if (!image_url?.trim() && !category_image_url?.trim()) continue;
    signatures.push({
      id: row.id,
      category_id: row.category_id,
      name_en: row.name_en,
      name_ar: row.name_ar,
      description_en: row.description_en,
      description_ar: row.description_ar,
      price_en: row.price_en,
      price_ar: row.price_ar,
      image_url: image_url || category_image_url,
      badge_en: row.badge_en,
      badge_ar: row.badge_ar,
      tags: normalizeTags(row.tags),
      sort_order: row.sort_order,
      is_signature: row.is_signature,
      signature_sort_order: row.signature_sort_order,
      is_active: row.is_active,
      is_deleted: row.is_deleted,
      category_image_url,
      category_slug: category?.slug?.trim() || null,
    });
  }

  // —— Locations ——
  const { data: locationsRaw, error: locationsError } = await supabase
    .from('locations')
    .select(
      'id, name_en, name_ar, address_en, address_ar, phones, map_url, ' +
        'sort_order, is_active, is_deleted',
    )
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('sort_order', { ascending: true });

  if (locationsError) throw locationsError;

  const locations = (locationsRaw ?? []).map((row) => ({
    id: String(row.id),
    name_en: String(row.name_en ?? ''),
    name_ar: String(row.name_ar ?? ''),
    address_en: String(row.address_en ?? ''),
    address_ar: String(row.address_ar ?? ''),
    phones: normalizePhones(row.phones),
    map_url: row.map_url ?? null,
    sort_order: Number(row.sort_order ?? 0),
    is_active: !!row.is_active,
    is_deleted: !!row.is_deleted,
  }));

  // —— Reach out ——
  const { data: reachOutRaw, error: reachOutError } = await supabase
    .from('reach_out')
    .select('phone, hours_en, hours_ar')
    .limit(1)
    .maybeSingle();

  if (reachOutError) throw reachOutError;

  const reachOut = reachOutRaw
    ? {
        phone: reachOutRaw.phone ?? '',
        hours_en: reachOutRaw.hours_en ?? '',
        hours_ar: reachOutRaw.hours_ar ?? '',
      }
    : null;

  // —— Menu PDF ——
  const { data: menuPdfRaw, error: menuPdfError } = await supabase
    .from('menu_pdf')
    .select('id, file_path, file_url, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (menuPdfError) throw menuPdfError;

  let menuPdf = null;
  if (menuPdfRaw?.file_url) {
    const pdfUrl = String(menuPdfRaw.file_url).trim();
    // Local public paths (e.g. /images/menu/menu.pdf) already ship with the
    // site — keep them as-is. Remote Storage URLs are downloaded into /data.
    if (pdfUrl.startsWith('/')) {
      menuPdf = {
        id: menuPdfRaw.id,
        file_path: menuPdfRaw.file_path || pdfUrl,
        file_url: pdfUrl,
        updated_at: menuPdfRaw.updated_at,
      };
    } else if (!skipAssets) {
      if (dryRun) {
        console.log(`[dry-run] ↓ PDF ${pdfUrl} → /data/menu.pdf`);
        menuPdf = {
          id: menuPdfRaw.id,
          file_path: 'menu.pdf',
          file_url: '/data/menu.pdf',
          updated_at: menuPdfRaw.updated_at,
        };
      } else {
        console.log(`↓ PDF ${pdfUrl}`);
        try {
          await downloadToFile(pdfUrl, MENU_PDF_PATH);
          console.log('  ✓ /data/menu.pdf');
          menuPdf = {
            id: menuPdfRaw.id,
            file_path: 'menu.pdf',
            file_url: '/data/menu.pdf',
            updated_at: menuPdfRaw.updated_at,
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          console.warn(`  ✗ PDF skipped (${message})`);
        }
      }
    }
  }

  const siteData = {
    exportedAt: new Date().toISOString(),
    categories,
    products,
    signatures,
    locations,
    reachOut,
    menuPdf,
  };

  if (dryRun) {
    console.log(
      `\n[dry-run] Would write ${SITE_DATA_PATH}` +
        ` (${categories.length} categories, ${products.length} products, ` +
        `${signatures.length} signatures, ${locations.length} locations)`,
    );
    return;
  }

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(SITE_DATA_PATH, JSON.stringify(siteData, null, 2) + '\n');
  console.log(
    `\nDone. Wrote ${SITE_DATA_PATH}` +
      `\n  categories: ${categories.length}` +
      `\n  products: ${products.length}` +
      `\n  signatures: ${signatures.length}` +
      `\n  locations: ${locations.length}` +
      `\n  assets: ${assetCache.size}` +
      `\n  menuPdf: ${menuPdf ? 'yes' : 'no'}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
