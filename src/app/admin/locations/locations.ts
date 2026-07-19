import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LocationBranch } from '../../core/models/admin.models';
import { AdminService } from '../../core/services/admin.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-admin-locations',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './locations.html',
  styleUrl: '../admin.css',
})
export class AdminLocations implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly i18n = inject(TranslationService);

  locations = signal<LocationBranch[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  form = this.emptyForm();
  phonesText = '';

  async ngOnInit(): Promise<void> {
    await this.reload();
    this.form = this.emptyForm();
  }

  emptyForm() {
    return {
      id: '' as string | undefined,
      name_en: '',
      name_ar: '',
      address_en: '',
      address_ar: '',
      map_url: '',
      sort_order: this.nextSortOrder(),
      is_active: true,
    };
  }

  nextSortOrder(): number {
    const list = this.locations();
    if (!list.length) {
      return 0;
    }
    return Math.max(...list.map((l) => l.sort_order)) + 1;
  }

  edit(location: LocationBranch): void {
    this.form = {
      id: location.id,
      name_en: location.name_en,
      name_ar: location.name_ar,
      address_en: location.address_en,
      address_ar: location.address_ar,
      map_url: location.map_url ?? '',
      sort_order: location.sort_order,
      is_active: location.is_active,
    };
    this.phonesText = location.phones.join(', ');
    this.successMessage.set(null);
  }

  resetForm(): void {
    this.form = this.emptyForm();
    this.phonesText = '';
  }

  async reload(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      this.locations.set(await this.admin.listLocations());
    } catch (err: unknown) {
      this.errorMessage.set(
        this.errMsg(err, this.i18n.t('admin.locations.loadFailed')),
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  async save(): Promise<void> {
    const phones = this.phonesText
      .split(/[,|\n]/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (!phones.length) {
      this.errorMessage.set(this.i18n.t('admin.locations.phonesRequired'));
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      await this.admin.upsertLocation({
        ...(this.form.id ? { id: this.form.id } : {}),
        name_en: this.form.name_en.trim(),
        name_ar: this.form.name_ar.trim(),
        address_en: this.form.address_en.trim(),
        address_ar: this.form.address_ar.trim(),
        phones,
        map_url: this.form.map_url.trim() || null,
        sort_order: Number(this.form.sort_order) || 0,
        is_active: this.form.is_active,
      });
      this.successMessage.set(this.i18n.t('admin.locations.saved'));
      await this.reload();
      this.resetForm();
    } catch (err: unknown) {
      this.errorMessage.set(
        this.errMsg(err, this.i18n.t('admin.locations.saveFailed')),
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  async remove(location: LocationBranch): Promise<void> {
    if (
      !confirm(
        this.i18n.t('admin.locations.deleteConfirm', {
          name: location.name_en,
        }),
      )
    ) {
      return;
    }
    try {
      await this.admin.softDeleteLocation(location.id);
      await this.reload();
    } catch (err: unknown) {
      this.errorMessage.set(
        this.errMsg(err, this.i18n.t('admin.locations.deleteFailed')),
      );
    }
  }

  private errMsg(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: string }).message);
    }
    return fallback;
  }
}
