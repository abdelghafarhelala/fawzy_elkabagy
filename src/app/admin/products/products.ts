import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category, Product, ProductTag } from '../../core/models/menu.models';
import { AdminService } from '../../core/services/admin.service';
import { parsePriceAmount } from '../../core/utils/price';

@Component({
  selector: 'app-admin-products',
  imports: [FormsModule],
  templateUrl: './products.html',
  styleUrl: '../admin.css',
})
export class AdminProducts implements OnInit {
  private readonly admin = inject(AdminService);

  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  filterCategoryId = '';
  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  private maxSortOrder = -1;
  private maxSignatureSortOrder = -1;

  form = this.emptyForm();
  tagEn = '';
  tagAr = '';
  selectedFile: File | null = null;

  async ngOnInit(): Promise<void> {
    try {
      this.categories.set(await this.admin.listCategories());
    } catch {
      /* listed in reload too */
    }
    await this.reload();
    this.form = this.emptyForm();
  }

  emptyForm() {
    return {
      id: '' as string | undefined,
      category_id: '',
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      price: '',
      image_url: '' as string | null,
      badge_en: '',
      badge_ar: '',
      tags: [] as ProductTag[],
      sort_order: this.nextSortOrder(),
      is_signature: false,
      signature_sort_order: this.nextSignatureSortOrder(),
      is_active: true,
    };
  }

  nextSortOrder(): number {
    return this.maxSortOrder + 1;
  }

  nextSignatureSortOrder(): number {
    return this.maxSignatureSortOrder + 1;
  }

  edit(product: Product): void {
    this.form = {
      id: product.id,
      category_id: product.category_id,
      name_en: product.name_en,
      name_ar: product.name_ar,
      description_en: product.description_en,
      description_ar: product.description_ar,
      price:
        parsePriceAmount(product.price_en) ||
        parsePriceAmount(product.price_ar),
      image_url: product.image_url,
      badge_en: product.badge_en ?? '',
      badge_ar: product.badge_ar ?? '',
      tags: [...product.tags],
      sort_order: product.sort_order,
      is_signature: product.is_signature,
      signature_sort_order: product.signature_sort_order,
      is_active: product.is_active,
    };
    this.selectedFile = null;
    this.successMessage.set(null);
  }

  resetForm(): void {
    this.form = this.emptyForm();
    this.selectedFile = null;
    this.tagEn = '';
    this.tagAr = '';
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  addTag(): void {
    if (!this.tagEn.trim() || !this.tagAr.trim()) {
      return;
    }
    this.form.tags = [
      ...this.form.tags,
      { en: this.tagEn.trim(), ar: this.tagAr.trim() },
    ];
    this.tagEn = '';
    this.tagAr = '';
  }

  removeTag(index: number): void {
    this.form.tags = this.form.tags.filter((_, i) => i !== index);
  }

  displayPrice(product: Product): string {
    return (
      parsePriceAmount(product.price_en) ||
      parsePriceAmount(product.price_ar) ||
      '—'
    );
  }

  async reload(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [filtered, all] = await Promise.all([
        this.admin.listProducts(this.filterCategoryId || undefined),
        this.filterCategoryId
          ? this.admin.listProducts()
          : Promise.resolve(null),
      ]);
      this.products.set(filtered);
      const sortSource = all ?? filtered;
      this.maxSortOrder = sortSource.length
        ? Math.max(...sortSource.map((p) => p.sort_order))
        : -1;
      const signatures = sortSource.filter((p) => p.is_signature);
      this.maxSignatureSortOrder = signatures.length
        ? Math.max(...signatures.map((p) => p.signature_sort_order))
        : -1;
    } catch (err: unknown) {
      this.errorMessage.set(this.errMsg(err, 'Failed to load products'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async save(): Promise<void> {
    if (!this.form.category_id) {
      this.errorMessage.set('Select a category.');
      return;
    }

    const price = parsePriceAmount(this.form.price) || this.form.price.trim();
    if (!price) {
      this.errorMessage.set('Enter a price.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      let imageUrl = this.form.image_url;
      if (this.selectedFile) {
        imageUrl = await this.admin.uploadProductImage(this.selectedFile);
      }

      await this.admin.upsertProduct({
        ...(this.form.id ? { id: this.form.id } : {}),
        category_id: this.form.category_id,
        name_en: this.form.name_en.trim(),
        name_ar: this.form.name_ar.trim(),
        description_en: this.form.description_en.trim(),
        description_ar: this.form.description_ar.trim(),
        price_en: price,
        price_ar: price,
        image_url: imageUrl || null,
        badge_en: this.form.badge_en.trim() || null,
        badge_ar: this.form.badge_ar.trim() || null,
        tags: this.form.tags,
        sort_order: Number(this.form.sort_order) || 0,
        is_signature: this.form.is_signature,
        signature_sort_order: Number(this.form.signature_sort_order) || 0,
        is_active: this.form.is_active,
      });

      this.successMessage.set('Product saved.');
      await this.reload();
      this.resetForm();
    } catch (err: unknown) {
      this.errorMessage.set(this.errMsg(err, 'Failed to save product'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async remove(product: Product): Promise<void> {
    if (!confirm(`Soft-delete “${product.name_en}”?`)) {
      return;
    }
    try {
      await this.admin.softDeleteProduct(product.id);
      await this.reload();
    } catch (err: unknown) {
      this.errorMessage.set(this.errMsg(err, 'Failed to delete product'));
    }
  }

  categoryLabel(id: string): string {
    return this.categories().find((c) => c.id === id)?.name_en ?? id;
  }

  private errMsg(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: string }).message);
    }
    return fallback;
  }
}
