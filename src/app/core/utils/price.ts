/** Extract numeric amount from stored price (supports legacy "480 EGP"). */
export function parsePriceAmount(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const match = String(value).match(/\d+(?:[.,]\d+)?/);
  return match ? match[0].replace(',', '.') : '';
}

/** Public display: EN → "480 EGP", AR → "480 ج.م". */
export function formatProductPrice(
  product: { price_en: string; price_ar: string },
  language: 'ar' | 'en',
): string {
  const amount =
    parsePriceAmount(product.price_en) ||
    parsePriceAmount(product.price_ar);
  if (!amount) {
    return '';
  }
  return language === 'ar' ? `${amount} ج.م` : `${amount} EGP`;
}
