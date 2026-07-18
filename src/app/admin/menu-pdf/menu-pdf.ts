import { Component, OnInit, inject, signal } from '@angular/core';
import { MenuPdf } from '../../core/models/menu.models';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-menu-pdf',
  templateUrl: './menu-pdf.html',
  styleUrl: '../admin.css',
})
export class AdminMenuPdf implements OnInit {
  private readonly admin = inject(AdminService);

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
      this.errorMessage.set(this.errMsg(err, 'Failed to load PDF'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async upload(): Promise<void> {
    if (!this.selectedFile) {
      this.errorMessage.set('Choose a PDF file first.');
      return;
    }

    this.isUploading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const pdf = await this.admin.uploadMenuPdf(this.selectedFile);
      this.current.set(pdf);
      this.selectedFile = null;
      this.successMessage.set('Menu PDF uploaded.');
    } catch (err: unknown) {
      this.errorMessage.set(this.errMsg(err, 'Upload failed'));
    } finally {
      this.isUploading.set(false);
    }
  }

  private errMsg(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: string }).message);
    }
    return fallback;
  }
}
