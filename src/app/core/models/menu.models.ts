export interface ProductTag {
  en: string;
  ar: string;
  muted?: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  is_deleted: boolean;
}

export interface Product {
  id: string;
  category_id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price_en: string;
  price_ar: string;
  image_url: string | null;
  badge_en: string | null;
  badge_ar: string | null;
  tags: ProductTag[];
  sort_order: number;
  is_signature: boolean;
  signature_sort_order: number;
  is_active: boolean;
  is_deleted: boolean;
}

/** Signature carousel item — prefers category photo over product photo. */
export interface SignatureProduct extends Product {
  category_image_url: string | null;
  category_slug: string | null;
}

export interface MenuPdf {
  id: string;
  file_path: string;
  file_url: string;
  updated_at: string;
}
