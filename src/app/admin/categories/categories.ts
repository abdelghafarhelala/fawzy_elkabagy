import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category } from '../../core/models/menu.models';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-categories',
  imports: [FormsModule],
  templateUrl: './categories.html',
  styleUrl: '../admin.css',
})
export class AdminCategories implements OnInit {
  private readonly admin = inject(AdminService);

  categories = signal<Category[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  form = this.emptyForm();

  async ngOnInit(): Promise<void> {
    await this.reload();
    this.form = this.emptyForm();
  }

  emptyForm() {
    return {
      id: '' as string | undefined,
      slug: '',
      name_en: '',
      name_ar: '',
      sort_order: this.nextSortOrder(),
      is_active: true,
    };
  }

  nextSortOrder(): number {
    const list = this.categories();
    if (!list.length) {
      return 0;
    }
    return Math.max(...list.map((c) => c.sort_order)) + 1;
  }

  edit(category: Category): void {
    this.form = {
      id: category.id,
      slug: category.slug,
      name_en: category.name_en,
      name_ar: category.name_ar,
      sort_order: category.sort_order,
      is_active: category.is_active,
    };
    this.successMessage.set(null);
  }

  resetForm(): void {
    this.form = this.emptyForm();
  }

  async reload(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      this.categories.set(await this.admin.listCategories());
    } catch (err: unknown) {
      this.errorMessage.set(this.errMsg(err, 'Failed to load categories'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async save(): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      await this.admin.upsertCategory({
        ...(this.form.id ? { id: this.form.id } : {}),
        slug: this.form.slug.trim(),
        name_en: this.form.name_en.trim(),
        name_ar: this.form.name_ar.trim(),
        sort_order: Number(this.form.sort_order) || 0,
        is_active: this.form.is_active,
      });
      this.successMessage.set('Category saved.');
      await this.reload();
      this.resetForm();
    } catch (err: unknown) {
      this.errorMessage.set(this.errMsg(err, 'Failed to save category'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async remove(category: Category): Promise<void> {
    if (!confirm(`Soft-delete category “${category.name_en}”?`)) {
      return;
    }
    try {
      await this.admin.softDeleteCategory(category.id);
      await this.reload();
    } catch (err: unknown) {
      this.errorMessage.set(this.errMsg(err, 'Failed to delete category'));
    }
  }

  private errMsg(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: string }).message);
    }
    return fallback;
  }
}
