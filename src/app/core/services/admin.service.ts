import { Injectable, inject } from '@angular/core';
import { Category, MenuPdf, Product, ProductTag } from '../models/menu.models';
import { ContactMessage, LocationBranch, ReachOut } from '../models/admin.models';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly supabase = inject(SupabaseService);

  // —— Categories ——

  async listCategories(includeDeleted = false): Promise<Category[]> {
    let query = this.supabase.client
      .from('categories')
      .select(
        'id, slug, name_en, name_ar, sort_order, is_active, is_deleted',
      )
      .order('sort_order', { ascending: true });

    if (!includeDeleted) {
      query = query.eq('is_deleted', false);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return (data ?? []) as Category[];
  }

  async upsertCategory(
    payload: Partial<Category> & {
      name_en: string;
      name_ar: string;
      slug: string;
    },
  ): Promise<void> {
    const row = {
      name_en: payload.name_en,
      name_ar: payload.name_ar,
      slug: payload.slug,
      sort_order: payload.sort_order ?? 0,
      is_active: payload.is_active ?? true,
      is_deleted: payload.is_deleted ?? false,
      ...(payload.id ? { id: payload.id } : {}),
    };

    const { error } = await this.supabase.client
      .from('categories')
      .upsert(row);
    if (error) {
      throw error;
    }
  }

  async softDeleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('categories')
      .update({ is_deleted: true, is_active: false })
      .eq('id', id);
    if (error) {
      throw error;
    }
  }

  // —— Products ——

  async listProducts(categoryId?: string): Promise<Product[]> {
    let query = this.supabase.client
      .from('products')
      .select(
        'id, category_id, name_en, name_ar, description_en, description_ar, ' +
          'price_en, price_ar, image_url, badge_en, badge_ar, tags, ' +
          'sort_order, is_signature, signature_sort_order, is_active, is_deleted',
      )
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return ((data ?? []) as unknown as Product[]).map((p) => ({
      ...p,
      tags: this.normalizeTags(p.tags),
    }));
  }

  async upsertProduct(
    payload: Partial<Product> & {
      category_id: string;
      name_en: string;
      name_ar: string;
    },
  ): Promise<void> {
    const row = {
      category_id: payload.category_id,
      name_en: payload.name_en,
      name_ar: payload.name_ar,
      description_en: payload.description_en ?? '',
      description_ar: payload.description_ar ?? '',
      price_en: payload.price_en ?? '',
      price_ar: payload.price_ar ?? '',
      image_url: payload.image_url ?? null,
      badge_en: payload.badge_en ?? null,
      badge_ar: payload.badge_ar ?? null,
      tags: payload.tags ?? [],
      sort_order: payload.sort_order ?? 0,
      is_signature: payload.is_signature ?? false,
      signature_sort_order: payload.signature_sort_order ?? 0,
      is_active: payload.is_active ?? true,
      is_deleted: false,
      ...(payload.id ? { id: payload.id } : {}),
    };

    const { error } = await this.supabase.client.from('products').upsert(row);
    if (error) {
      throw error;
    }
  }

  async softDeleteProduct(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('products')
      .update({ is_deleted: true, is_active: false, is_signature: false })
      .eq('id', id);
    if (error) {
      throw error;
    }
  }

  async uploadProductImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await this.supabase.client.storage
      .from('product-images')
      .upload(path, file, { upsert: false, contentType: file.type });

    if (error) {
      throw error;
    }

    const { data } = this.supabase.client.storage
      .from('product-images')
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // —— Menu PDF ——

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

  async uploadMenuPdf(file: File): Promise<MenuPdf> {
    const path = `menu-${Date.now()}.pdf`;

    const { error: uploadError } = await this.supabase.client.storage
      .from('menu-pdfs')
      .upload(path, file, {
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = this.supabase.client.storage
      .from('menu-pdfs')
      .getPublicUrl(path);

    const existing = await this.getLatestMenuPdf();
    const row = {
      ...(existing?.id ? { id: existing.id } : {}),
      file_path: path,
      file_url: urlData.publicUrl,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase.client
      .from('menu_pdf')
      .upsert(row)
      .select('id, file_path, file_url, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return data as MenuPdf;
  }

  // —— Reach out ——

  async getReachOut(): Promise<ReachOut | null> {
    const { data, error } = await this.supabase.client
      .from('reach_out')
      .select(
        'id, location_en, location_ar, phone, hours_en, hours_ar, updated_at',
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return (data as ReachOut | null) ?? null;
  }

  async updateReachOut(payload: {
    id?: string;
    location_en: string;
    location_ar: string;
    phone: string;
    hours_en: string;
    hours_ar: string;
  }): Promise<void> {
    const row = {
      ...(payload.id ? { id: payload.id } : {}),
      location_en: payload.location_en,
      location_ar: payload.location_ar,
      phone: payload.phone,
      hours_en: payload.hours_en,
      hours_ar: payload.hours_ar,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.supabase.client.from('reach_out').upsert(row);
    if (error) {
      throw error;
    }
  }

  // —— Contact messages ——

  async listMessages(): Promise<ContactMessage[]> {
    const { data, error } = await this.supabase.client
      .from('contact_messages')
      .select('id, full_name, email, subject, message, is_read, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    return (data ?? []) as ContactMessage[];
  }

  async setMessageRead(id: string, isRead: boolean): Promise<void> {
    const { error } = await this.supabase.client
      .from('contact_messages')
      .update({ is_read: isRead })
      .eq('id', id);
    if (error) {
      throw error;
    }
  }

  async deleteMessage(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('contact_messages')
      .delete()
      .eq('id', id);
    if (error) {
      throw error;
    }
  }

  async submitContactMessage(payload: {
    full_name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<void> {
    const { error } = await this.supabase.client
      .from('contact_messages')
      .insert({
        full_name: payload.full_name,
        email: payload.email,
        subject: payload.subject,
        message: payload.message,
        is_read: false,
      });
    if (error) {
      throw error;
    }
  }

  // —— Locations ——

  async listLocations(): Promise<LocationBranch[]> {
    const { data, error } = await this.supabase.client
      .from('locations')
      .select(
        'id, name_en, name_ar, address_en, address_ar, phones, map_url, ' +
          'sort_order, is_active, is_deleted, created_at, updated_at',
      )
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) =>
      this.normalizeLocation(row),
    );
  }

  async upsertLocation(
    payload: Partial<LocationBranch> & {
      name_en: string;
      name_ar: string;
      address_en: string;
      address_ar: string;
      phones: string[];
    },
  ): Promise<void> {
    const row = {
      ...(payload.id ? { id: payload.id } : {}),
      name_en: payload.name_en,
      name_ar: payload.name_ar,
      address_en: payload.address_en,
      address_ar: payload.address_ar,
      phones: payload.phones ?? [],
      map_url: payload.map_url?.trim() || null,
      sort_order: payload.sort_order ?? 0,
      is_active: payload.is_active ?? true,
      is_deleted: false,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.supabase.client.from('locations').upsert(row);
    if (error) {
      throw error;
    }
  }

  async softDeleteLocation(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('locations')
      .update({ is_deleted: true, is_active: false })
      .eq('id', id);
    if (error) {
      throw error;
    }
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
      created_at: row['created_at'] as string | undefined,
      updated_at: row['updated_at'] as string | undefined,
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
