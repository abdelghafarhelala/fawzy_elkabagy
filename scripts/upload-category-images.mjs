#!/usr/bin/env node
/**
 * Upload local category images to Supabase Storage and set categories.image_url.
 *
 * Usage:
 *   node scripts/upload-category-images.mjs
 *   node scripts/upload-category-images.mjs --dry-run
 *
 * Requires in .env (project root):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CATEGORIES_DIR = join(ROOT, 'public', 'images', 'categories');
const BUCKET = 'product-images';
const STORAGE_PREFIX = 'categories';

/** Local filename → category slug */
const FILE_TO_SLUG = {
  'soup.webp': 'soups',
  'salads.webp': 'salads',
  'apitizers.webp': 'appetizers',
  'gril-palte.webp': 'grill-plates',
  'side-dishes.webp': 'sides',
  'main-dishes.webp': 'mains',
  'tajins.webp': 'tajines',
  'grills.webp': 'grills',
  'fawzy-royal-dishes.webp': 'royal',
  'sandwiches.webp': 'sandwiches',
  'deserts.webp': 'desserts',
  'hot-drinks.webp': 'hot-drinks',
  'cold-drinks.webp': 'cold-drinks',
};

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

async function main() {
  loadEnv(join(ROOT, '.env'));
  loadEnv(join(ROOT, '.env.local'));

  const dryRun = process.argv.includes('--dry-run');
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

  const { data: categories, error: listError } = await supabase
    .from('categories')
    .select('id, slug, name_en, image_url')
    .eq('is_deleted', false);

  if (listError) {
    throw listError;
  }

  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  let updated = 0;

  for (const [filename, slug] of Object.entries(FILE_TO_SLUG)) {
    const category = bySlug.get(slug);
    if (!category) {
      console.warn(`⚠ No category for slug "${slug}" (${filename}) — skip`);
      continue;
    }

    const localPath = join(CATEGORIES_DIR, filename);
    if (!existsSync(localPath)) {
      console.warn(`⚠ Missing file ${filename} — skip`);
      continue;
    }

    const storagePath = `${STORAGE_PREFIX}/${slug}.webp`;
    const bytes = readFileSync(localPath);

    console.log(
      `${dryRun ? '[dry-run] ' : ''}↑ ${filename} → ${storagePath} (${category.name_en})`,
    );

    if (dryRun) continue;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        upsert: true,
        contentType: 'image/webp',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error(`  ✗ upload failed: ${uploadError.message}`);
      continue;
    }

    const { data: pub } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const { error: updateError } = await supabase
      .from('categories')
      .update({ image_url: pub.publicUrl })
      .eq('id', category.id);

    if (updateError) {
      console.error(`  ✗ db update failed: ${updateError.message}`);
      continue;
    }

    console.log(`  ✓ ${pub.publicUrl}`);
    updated += 1;
  }

  console.log(`\nDone. Updated ${updated} categories.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
