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
  private resizeObserver: ResizeObserver | null = null;
  private renderToken = 0;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;
  private hasRendered = false;

  async ngOnInit(): Promise<void> {
    await this.loadPdf();
  }

  ngOnDestroy(): void {
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
      // Cross-origin download may fail; open in a new tab as fallback.
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      this.isDownloading.set(false);
    }
  }

  private async loadPdf(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.hasRendered = false;
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

      await this.renderAllPages();
      this.observeResize();
      this.hasRendered = true;
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

  private observeResize(): void {
    const host = this.pagesHost()?.nativeElement;
    if (!host || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.hasRendered) {
        return;
      }
      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer);
      }
      this.resizeTimer = setTimeout(() => {
        void this.renderAllPages();
      }, 200);
    });
    this.resizeObserver.observe(host);
  }

  private async renderAllPages(): Promise<void> {
    const host = this.pagesHost()?.nativeElement;
    const doc = this.pdfDoc;
    if (!host || !doc) {
      return;
    }

    const token = ++this.renderToken;
    const width = Math.max(host.clientWidth, 280);
    host.replaceChildren();

    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      if (token !== this.renderToken) {
        return;
      }

      const page = await doc.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(width / baseViewport.width, 2.5);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.className = 'menu-pdf-page-canvas';
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.setAttribute('aria-label', `Menu page ${pageNumber}`);
      host.appendChild(canvas);

      const context = canvas.getContext('2d');
      if (!context) {
        continue;
      }

      await page.render({
        canvas,
        canvasContext: context,
        viewport,
      }).promise;
    }
  }

  private teardownViewer(): void {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.renderToken += 1;
    void this.pdfDoc?.destroy();
    this.pdfDoc = null;
    this.pageCount.set(0);
  }
}
