import {
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
} from 'pdfjs-dist';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { MenuService } from '../../core/services/menu.service';

// Keep in sync with installed pdfjs-dist version (package.json).
GlobalWorkerOptions.workerSrc =
  'https://unpkg.com/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs';

@Component({
  selector: 'app-menu-pdf',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './menu-pdf.html',
  styleUrl: './menu-pdf.css',
})
export class MenuPdf implements OnInit, OnDestroy {
  private readonly menuService = inject(MenuService);
  private readonly injector = inject(Injector);
  private readonly pagesHost =
    viewChild<ElementRef<HTMLDivElement>>('pagesHost');

  isLoading = signal(true);
  isDownloading = signal(false);
  errorMessage = signal<string | null>(null);
  fileUrl = signal<string | null>(null);
  pageCount = signal(0);

  private pdfDoc: PDFDocumentProxy | null = null;
  private renderToken = 0;
  private lastCssWidth = 0;
  private readonly onOrientation = () => {
    // Orientation only — never re-render on pinch-zoom / URL bar show-hide.
    window.setTimeout(() => {
      void this.renderAllPages({ force: true });
    }, 250);
  };

  async ngOnInit(): Promise<void> {
    window.addEventListener('orientationchange', this.onOrientation);
    await this.loadPdf();
  }

  ngOnDestroy(): void {
    window.removeEventListener('orientationchange', this.onOrientation);
    this.teardownViewer();
  }

  async downloadPdf(): Promise<void> {
    const url = this.fileUrl();
    if (!url || this.isDownloading()) {
      return;
    }

    this.isDownloading.set(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = 'fawzy-elkababgy-menu.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      this.isDownloading.set(false);
    }
  }

  private async loadPdf(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.teardownViewer();

    try {
      const pdf = await this.menuService.getLatestMenuPdf();
      if (!pdf?.file_url) {
        this.fileUrl.set(null);
        return;
      }

      this.fileUrl.set(pdf.file_url);
      const loadingTask = getDocument({
        url: pdf.file_url,
        withCredentials: false,
      });
      this.pdfDoc = await loadingTask.promise;
      this.pageCount.set(this.pdfDoc.numPages);
      this.isLoading.set(false);

      await new Promise<void>((resolve) => {
        afterNextRender(() => resolve(), { injector: this.injector });
      });

      await this.renderAllPages({ force: true });
    } catch {
      this.errorMessage.set(
        'Unable to load the menu PDF. Please try again later.',
      );
      this.fileUrl.set(null);
      this.pdfDoc = null;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Render once at high pixel density. Pinch-zoom must NOT re-render
   * (that caused white flashing on mobile).
   */
  private async renderAllPages(options?: {
    force?: boolean;
  }): Promise<void> {
    const host = this.pagesHost()?.nativeElement;
    const doc = this.pdfDoc;
    if (!host || !doc) {
      return;
    }

    const cssWidth = Math.max(host.clientWidth, 280);
    // Skip tiny layout jitters (keyboard / URL bar), keep orientation updates.
    if (
      !options?.force &&
      this.lastCssWidth > 0 &&
      Math.abs(cssWidth - this.lastCssWidth) < 48
    ) {
      return;
    }

    const token = ++this.renderToken;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    // Extra pixels so zoom-in stays readable on phones.
    const zoomHeadroom = cssWidth < 900 ? 2 : 1.35;
    const targetPixelWidth = Math.min(
      Math.round(cssWidth * dpr * zoomHeadroom),
      2400,
    );

    // Build off-DOM so the page doesn't go blank while drawing.
    const fragment = document.createDocumentFragment();

    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      if (token !== this.renderToken) {
        return;
      }

      const page = await doc.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = targetPixelWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.className = 'menu-pdf-page-canvas';
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.setAttribute('aria-label', `Menu page ${pageNumber}`);

      const context = canvas.getContext('2d', { alpha: false });
      if (!context) {
        continue;
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      await page.render({
        canvas,
        canvasContext: context,
        viewport,
      }).promise;

      fragment.appendChild(canvas);
    }

    if (token !== this.renderToken) {
      return;
    }

    host.replaceChildren(fragment);
    this.lastCssWidth = cssWidth;
  }

  private teardownViewer(): void {
    this.renderToken += 1;
    this.lastCssWidth = 0;
    void this.pdfDoc?.destroy();
    this.pdfDoc = null;
    this.pageCount.set(0);
  }
}
