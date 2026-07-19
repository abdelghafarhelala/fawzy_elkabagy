import { Injectable, inject } from '@angular/core';
import { Category, MenuPdf, Product, ProductTag } from '../models/menu.models';
import { LocationBranch, ReachOut } from '../models/admin.models';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly supabase = inject(SupabaseService);

  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase.client
      .from('categories')
      .select(
        'id, slug, name_en, name_ar, sort_order, is_active, is_deleted',
      )
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as Category[];
  }

  async getProducts(categoryId?: string): Promise<Product[]> {
    let query = this.supabase.client
      .from('products')
      .select(
        'id, category_id, name_en, name_ar, description_en, description_ar, ' +
          'price_en, price_ar, image_url, badge_en, badge_ar, tags, ' +
          'sort_order, is_signature, signature_sort_order, is_active, is_deleted',
      )
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as unknown as Product[];
    return rows.map((product) => ({
      ...product,
      tags: this.normalizeTags(product.tags),
    }));
  }

  async getSignatures(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(
        'id, category_id, name_en, name_ar, description_en, description_ar, ' +
          'price_en, price_ar, image_url, badge_en, badge_ar, tags, ' +
          'sort_order, is_signature, signature_sort_order, is_active, is_deleted',
      )
      .eq('is_signature', true)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('signature_sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as unknown as Product[];
    return rows.map((product) => ({
      ...product,
      tags: this.normalizeTags(product.tags),
    }));
  }

  async getLatestMenuPdf(): Promise<MenuPdf | null> {
    const { data, error } = await this.supabase.client
      .from('menu_pdf')
      .select('id, file_path, file_url, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as MenuPdf | null) ?? null;
  }

  async getLocations(): Promise<LocationBranch[]> {
    const { data, error } = await this.supabase.client
      .from('locations')
      .select(
        'id, name_en, name_ar, address_en, address_ar, phones, map_url, ' +
          'sort_order, is_active, is_deleted',
      )
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) =>
      this.normalizeLocation(row),
    );
  }

  async getReachOutInfo(): Promise<Pick<
    ReachOut,
    'phone' | 'hours_en' | 'hours_ar'
  > | null> {
    const { data, error } = await this.supabase.client
      .from('reach_out')
      .select('phone, hours_en, hours_ar')
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as Pick<ReachOut, 'phone' | 'hours_en' | 'hours_ar'> | null;
  }

  private normalizeLocation(row: Record<string, unknown>): LocationBranch {
    return {
      id: String(row['id']),
      name_en: String(row['name_en'] ?? ''),
      name_ar: String(row['name_ar'] ?? ''),
      address_en: String(row['address_en'] ?? ''),
      address_ar: String(row['address_ar'] ?? ''),
      phones: this.normalizePhones(row['phones']),
      map_url: (row['map_url'] as string | null) ?? null,
      sort_order: Number(row['sort_order'] ?? 0),
      is_active: !!row['is_active'],
      is_deleted: !!row['is_deleted'],
    };
  }

  private normalizePhones(phones: unknown): string[] {
    if (!Array.isArray(phones)) {
      return [];
    }
    return phones
      .map((p) => String(p ?? '').trim())
      .filter((p) => !!p);
  }

  private normalizeTags(tags: unknown): ProductTag[] {
    if (!Array.isArray(tags)) {
      return [];
    }

    return tags
      .filter(
        (tag): tag is ProductTag =>
          !!tag &&
          typeof tag === 'object' &&
          typeof (tag as ProductTag).en === 'string' &&
          typeof (tag as ProductTag).ar === 'string',
      )
      .map((tag) => ({
        en: tag.en,
        ar: tag.ar,
        muted: !!tag.muted,
      }));
  }
}
