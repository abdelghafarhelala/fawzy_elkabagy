#!/usr/bin/env node
/**
 * Upload local menu images to Supabase Storage and point products at the
 * public URLs.
 *
 * Usage:
 *   node scripts/upload-menu-images.mjs
 *   node scripts/upload-menu-images.mjs --dry-run
 *   node scripts/upload-menu-images.mjs --only kofta.jpg,tarb.jpg
 *   node scripts/upload-menu-images.mjs --limit 5
 *
 * Requires in .env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (Dashboard → Project Settings → API)
 *
 * Matching rule:
 *   local file  public/images/menu/{slug}.jpg
 *   products    image_url = images/menu/{slug}.jpg  (or already that storage URL)
 *   storage     product-images/menu/{slug}.jpg
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { basename, join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MENU_DIR = join(ROOT, 'public', 'images', 'menu');
const BUCKET = 'product-images';
const STORAGE_PREFIX = 'menu';

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

function parseArgs(argv) {
  const opts = { dryRun: false, limit: Infinity, only: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--limit') {
      opts.limit = Number(argv[++i]);
      if (!Number.isFinite(opts.limit) || opts.limit < 1) {
        throw new Error('--limit must be a positive number');
      }
    } else if (arg === '--only') {
      opts.only = new Set(
        argv[++i]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => (s.endsWith('.jpg') ? s : `${s}.jpg`)),
      );
    } else if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

function localPathFor(filename) {
  return `images/menu/${filename}`;
}

function storagePathFor(filename) {
  return `${STORAGE_PREFIX}/${filename}`;
}

async function main() {
  loadEnv(join(ROOT, '.env'));
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    console.log(`Upload menu images to Supabase Storage and update products.

  node scripts/upload-menu-images.mjs [--dry-run] [--limit N] [--only a.jpg,b.jpg]

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY`);
    return;
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Missing SUPABASE_URL in .env');
  }
  if (!serviceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY in .env\n' +
        'Add it from Supabase Dashboard → Project Settings → API → service_role',
    );
  }

  if (!existsSync(MENU_DIR)) {
    throw new Error(`Menu images folder not found: ${MENU_DIR}`);
  }

  let files = readdirSync(MENU_DIR)
    .filter((f) => f.toLowerCase().endsWith('.jpg'))
    .sort();

  if (opts.only) {
    files = files.filter((f) => opts.only.has(f));
    const missing = [...opts.only].filter((f) => !files.includes(f));
    if (missing.length) {
      console.warn(`Warning: not found locally: ${missing.join(', ')}`);
    }
  }

  if (opts.limit < files.length) {
    files = files.slice(0, opts.limit);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name_en, image_url')
    .eq('is_deleted', false);

  if (productsError) throw productsError;

  const byLocalPath = new Map();
  for (const product of products ?? []) {
    const imageUrl = product.image_url || '';
    let key = null;
    if (imageUrl.startsWith('images/menu/')) {
      key = basename(imageUrl);
    } else if (imageUrl.includes(`/storage/v1/object/public/${BUCKET}/${STORAGE_PREFIX}/`)) {
      key = basename(imageUrl.split('?')[0]);
    }
    if (!key) continue;
    if (!byLocalPath.has(key)) byLocalPath.set(key, []);
    byLocalPath.get(key).push(product);
  }

  console.log(
    `${opts.dryRun ? '[dry-run] ' : ''}Uploading ${files.length} images` +
      ` → bucket "${BUCKET}/${STORAGE_PREFIX}/"`,
  );

  let uploaded = 0;
  let updatedProducts = 0;
  let skippedNoProduct = 0;
  let failed = 0;

  for (const filename of files) {
    const matched = byLocalPath.get(filename) ?? [];
    const filePath = join(MENU_DIR, filename);
    const objectPath = storagePathFor(filename);
    const bytes = readFileSync(filePath);

    if (opts.dryRun) {
      const { data: publicData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(objectPath);
      console.log(
        `• ${filename} → ${matched.length} product(s)` +
          (matched.length
            ? ` [${matched.map((p) => p.name_en).join(', ')}]`
            : ' (no matching products)') +
          `\n  would set image_url = ${publicData.publicUrl}`,
      );
      if (!matched.length) skippedNoProduct++;
      else {
        uploaded++;
        updatedProducts += matched.length;
      }
      continue;
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, bytes, {
        upsert: true,
        contentType: 'image/jpeg',
        cacheControl: '31536000',
      });

    if (uploadError) {
      failed++;
      console.error(`✗ ${filename}: upload failed — ${uploadError.message}`);
      continue;
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(objectPath);
    const publicUrl = publicData.publicUrl;

    if (!matched.length) {
      skippedNoProduct++;
      uploaded++;
      console.log(`✓ ${filename} uploaded (no products currently use it)`);
      continue;
    }

    const ids = matched.map((p) => p.id);
    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: publicUrl })
      .in('id', ids);

    if (updateError) {
      failed++;
      console.error(
        `✗ ${filename}: uploaded but product update failed — ${updateError.message}`,
      );
      continue;
    }

    uploaded++;
    updatedProducts += matched.length;
    console.log(
      `✓ ${filename} → ${matched.length} product(s)` +
        ` [${matched.map((p) => p.name_en).join(', ')}]`,
    );
  }

  console.log('\nDone.');
  console.log(`  images processed : ${uploaded}`);
  console.log(`  products updated : ${updatedProducts}`);
  console.log(`  no product match : ${skippedNoProduct}`);
  console.log(`  failed           : ${failed}`);
  console.log(
    `  local path example: ${localPathFor('kofta.jpg')} → storage ${storagePathFor('kofta.jpg')}`,
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
