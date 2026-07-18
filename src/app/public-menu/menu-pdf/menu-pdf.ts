import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { MenuService } from '../../core/services/menu.service';

@Component({
  selector: 'app-menu-pdf',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './menu-pdf.html',
  styleUrl: './menu-pdf.css',
})
export class MenuPdf implements OnInit {
  private readonly menuService = inject(MenuService);
  private readonly sanitizer = inject(DomSanitizer);

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  fileUrl = signal<string | null>(null);
  safePdfUrl = signal<SafeResourceUrl | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadPdf();
  }

  private async loadPdf(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const pdf = await this.menuService.getLatestMenuPdf();
      if (!pdf?.file_url) {
        this.fileUrl.set(null);
        this.safePdfUrl.set(null);
        return;
      }

      this.fileUrl.set(pdf.file_url);
      this.safePdfUrl.set(
        this.sanitizer.bypassSecurityTrustResourceUrl(pdf.file_url),
      );
    } catch {
      this.errorMessage.set(
        'Unable to load the menu PDF. Please try again later.',
      );
      this.fileUrl.set(null);
      this.safePdfUrl.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }
}
