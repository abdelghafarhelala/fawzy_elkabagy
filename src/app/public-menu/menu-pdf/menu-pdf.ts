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
import { MenuPdfPrefetchService } from '../../core/services/menu-pdf-prefetch.service';

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
  private readonly pdfPrefetch = inject(MenuPdfPrefetchService);
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
      const cached = this.pdfPrefetch.getCachedBlob();
      let blob = cached;
      if (!blob) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        blob = await response.blob();
      }
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
      // Uses in-memory blob when home already warmed the PDF.
      const ready = await this.pdfPrefetch.getPdfForViewer();
      if (!ready) {
        this.fileUrl.set(null);
        return;
      }

      this.fileUrl.set(ready.meta.file_url);
      const loadingTask = getDocument({
        data: new Uint8Array(ready.data),
        withCredentials: false,
      });
      this.pdfDoc = await loadingTask.promise;
      this.pageCount.set(this.pdfDoc.numPages);
      this.isLoading.set(false);

      await new Promise<void>((resolve) => {
        afterNextRender(() => resolve(), { injector: this.injector });
      });

      // First page ASAP, then remaining pages (feels much faster).
      await this.renderAllPages({ force: true, progressive: true });
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
   * Render at high pixel density. Pinch-zoom must NOT re-render
   * (that caused white flashing on mobile).
   */
  private async renderAllPages(options?: {
    force?: boolean;
    progressive?: boolean;
  }): Promise<void> {
    const host = this.pagesHost()?.nativeElement;
    const doc = this.pdfDoc;
    if (!host || !doc) {
      return;
    }

    const cssWidth = Math.max(host.clientWidth, 280);
    if (
      !options?.force &&
      this.lastCssWidth > 0 &&
      Math.abs(cssWidth - this.lastCssWidth) < 48
    ) {
      return;
    }

    const token = ++this.renderToken;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const zoomHeadroom = cssWidth < 900 ? 2 : 1.35;
    const targetPixelWidth = Math.min(
      Math.round(cssWidth * dpr * zoomHeadroom),
      2400,
    );

    if (options?.progressive) {
      host.replaceChildren();
      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
        if (token !== this.renderToken) {
          return;
        }
        const canvas = await this.renderPageCanvas(
          doc,
          pageNumber,
          targetPixelWidth,
        );
        if (token !== this.renderToken || !canvas) {
          return;
        }
        host.appendChild(canvas);
      }
    } else {
      const fragment = document.createDocumentFragment();
      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
        if (token !== this.renderToken) {
          return;
        }
        const canvas = await this.renderPageCanvas(
          doc,
          pageNumber,
          targetPixelWidth,
        );
        if (token !== this.renderToken || !canvas) {
          return;
        }
        fragment.appendChild(canvas);
      }
      if (token !== this.renderToken) {
        return;
      }
      host.replaceChildren(fragment);
    }

    this.lastCssWidth = cssWidth;
  }

  private async renderPageCanvas(
    doc: PDFDocumentProxy,
    pageNumber: number,
    targetPixelWidth: number,
  ): Promise<HTMLCanvasElement | null> {
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
      return null;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    await page.render({
      canvas,
      canvasContext: context,
      viewport,
    }).promise;

    return canvas;
  }

  private teardownViewer(): void {
    this.renderToken += 1;
    this.lastCssWidth = 0;
    void this.pdfDoc?.destroy();
    this.pdfDoc = null;
    this.pageCount.set(0);
  }
}
