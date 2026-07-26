import { Product } from '../models/menu.models';
import { parsePriceAmount } from './price';

export type WeightKey = 'quarter' | 'third' | 'kilo';

export interface MenuProductRow {
  id: string;
  name_en: string;
  name_ar: string;
  sort_order: number;
  kind: 'simple' | 'weighted';
  /** Simple row: full amount string without currency. */
  amount?: string;
  /** Weighted row: amounts keyed by portion size. */
  prices?: Partial<Record<WeightKey, string>>;
}

const WEIGHT_PATTERNS: Array<{
  key: WeightKey;
  en: RegExp;
  ar: RegExp;
}> = [
  {
    key: 'quarter',
    en: /\(\s*(?:¼|1\/4)\s*kg\s*\)/i,
    ar: /\(\s*ربع\s*كيلو\s*\)/,
  },
  {
    key: 'third',
    en: /\(\s*(?:⅓|1\/3)\s*kg\s*\)/i,
    ar: /\(\s*ثلث\s*كيلو\s*\)/,
  },
  {
    key: 'kilo',
    en: /\(\s*1\s*kg\s*\)/i,
    ar: /\(\s*كيلو\s*\)/,
  },
];

function detectWeight(nameEn: string, nameAr: string): WeightKey | null {
  for (const pattern of WEIGHT_PATTERNS) {
    if (pattern.en.test(nameEn) || pattern.ar.test(nameAr)) {
      return pattern.key;
    }
  }
  return null;
}

function stripWeight(name: string): string {
  return name
    .replace(/\(\s*(?:¼|⅓|1\/4|1\/3|1)\s*kg\s*\)/gi, '')
    .replace(/\(\s*(?:ربع|ثلث)?\s*كيلو\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Collapse weight variants (¼ / ⅓ / 1 kg) into one display row.
 * Products without weight stay as simple rows.
 */
export function groupProductsForMenu(products: Product[]): MenuProductRow[] {
  type Acc = {
    id: string;
    name_en: string;
    name_ar: string;
    sort_order: number;
    prices: Partial<Record<WeightKey, string>>;
    hasWeight: boolean;
    simpleAmount?: string;
  };

  const groups = new Map<string, Acc>();
  const order: string[] = [];

  for (const product of products) {
    const weight = detectWeight(product.name_en, product.name_ar);
    const baseEn = stripWeight(product.name_en);
    const baseAr = stripWeight(product.name_ar);
    const key = baseEn.toLowerCase();
    const amount =
      parsePriceAmount(product.price_en) ||
      parsePriceAmount(product.price_ar);

    let group = groups.get(key);
    if (!group) {
      group = {
        id: key,
        name_en: baseEn,
        name_ar: baseAr || baseEn,
        sort_order: product.sort_order,
        prices: {},
        hasWeight: false,
      };
      groups.set(key, group);
      order.push(key);
    } else {
      group.sort_order = Math.min(group.sort_order, product.sort_order);
    }

    if (weight) {
      group.hasWeight = true;
      if (amount) {
        group.prices[weight] = amount;
      }
    } else if (amount) {
      group.simpleAmount = amount;
    }
  }

  return order.map((key) => {
    const group = groups.get(key)!;
    if (group.hasWeight) {
      return {
        id: group.id,
        name_en: group.name_en,
        name_ar: group.name_ar,
        sort_order: group.sort_order,
        kind: 'weighted' as const,
        prices: group.prices,
      };
    }
    return {
      id: group.id,
      name_en: group.name_en,
      name_ar: group.name_ar,
      sort_order: group.sort_order,
      kind: 'simple' as const,
      amount: group.simpleAmount,
    };
  });
}

export function categoryHasWeightedProducts(products: Product[]): boolean {
  return products.some(
    (product) => detectWeight(product.name_en, product.name_ar) !== null,
  );
}
