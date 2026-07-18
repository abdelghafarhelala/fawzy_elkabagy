import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { MenuPdf } from '../../core/models/menu.models';
import { AdminService } from '../../core/services/admin.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-admin-menu-pdf',
  imports: [TranslatePipe],
  templateUrl: './menu-pdf.html',
  styleUrl: '../admin.css',
})
export class AdminMenuPdf implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly i18n = inject(TranslationService);

  current = signal<MenuPdf | null>(null);
  isLoading = signal(true);
  isUploading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  selectedFile: File | null = null;

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  async reload(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      this.current.set(await this.admin.getLatestMenuPdf());
    } catch (err: unknown) {
      this.errorMessage.set(
        this.errMsg(err, this.i18n.t('admin.menuPdf.loadFailed')),
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  async upload(): Promise<void> {
    if (!this.selectedFile) {
      this.errorMessage.set(this.i18n.t('admin.menuPdf.chooseFile'));
      return;
    }

    this.isUploading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const pdf = await this.admin.uploadMenuPdf(this.selectedFile);
      this.current.set(pdf);
      this.selectedFile = null;
      this.successMessage.set(this.i18n.t('admin.menuPdf.saved'));
    } catch (err: unknown) {
      this.errorMessage.set(
        this.errMsg(err, this.i18n.t('admin.menuPdf.uploadFailed')),
      );
    } finally {
      this.isUploading.set(false);
    }
  }

  currentUpdatedLabel(date: string): string {
    return this.i18n.t('admin.menuPdf.currentUpdated', { date });
  }

  private errMsg(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: string }).message);
    }
    return fallback;
  }
}
