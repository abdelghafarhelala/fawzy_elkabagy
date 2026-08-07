import { Injectable } from '@angular/core';
import {
  Category,
  MenuPdf,
  Product,
  SignatureProduct,
} from '../models/menu.models';
import { LocationBranch, ReachOut } from '../models/admin.models';

interface SiteData {
  exportedAt: string;
  categories: Category[];
  products: Product[];
  signatures: SignatureProduct[];
  locations: LocationBranch[];
  reachOut: Pick<ReachOut, 'phone' | 'hours_en' | 'hours_ar'> | null;
  menuPdf: MenuPdf | null;
}

/**
 * Public menu data source. Reads once from the static export at
 * `/data/site-data.json` (produced by `npm run export:data`) so visitors
 * never hit Supabase for reads.
 */
@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private loadPromise: Promise<SiteData> | null = null;

  private async loadSiteData(): Promise<SiteData> {
    if (!this.loadPromise) {
      this.loadPromise = this.fetchSiteData();
    }
    return this.loadPromise;
  }

  private async fetchSiteData(): Promise<SiteData> {
    const response = await fetch('/data/site-data.json', {
      credentials: 'omit',
      cache: 'no-cache',
    });
    if (!response.ok) {
      throw new Error(`Failed to load site data (HTTP ${response.status})`);
    }
    return (await response.json()) as SiteData;
  }

  async getCategories(): Promise<Category[]> {
    const data = await this.loadSiteData();
    return data.categories ?? [];
  }

  async getProducts(categoryId?: string): Promise<Product[]> {
    const data = await this.loadSiteData();
    const products = data.products ?? [];
    if (!categoryId) {
      return products;
    }
    return products.filter((product) => product.category_id === categoryId);
  }

  async getSignatures(): Promise<SignatureProduct[]> {
    const data = await this.loadSiteData();
    return (data.signatures ?? []).filter(
      (product) => !!product.image_url?.trim(),
    );
  }

  async getLatestMenuPdf(): Promise<MenuPdf | null> {
    const data = await this.loadSiteData();
    return data.menuPdf ?? null;
  }

  async getLocations(): Promise<LocationBranch[]> {
    const data = await this.loadSiteData();
    return data.locations ?? [];
  }

  async getReachOutInfo(): Promise<Pick<
    ReachOut,
    'phone' | 'hours_en' | 'hours_ar'
  > | null> {
    const data = await this.loadSiteData();
    return data.reachOut ?? null;
  }
}
