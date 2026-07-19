import { Injectable, inject } from '@angular/core';
import { MenuPdf } from '../models/menu.models';
import { MenuService } from './menu.service';

/**
 * Prefetches the latest menu PDF in the background so /menu opens faster.
 * Keeps file metadata + a Blob copy in memory (and fills the HTTP cache).
 */
@Injectable({
  providedIn: 'root',
})
export class MenuPdfPrefetchService {
  private readonly menuService = inject(MenuService);

  private meta: MenuPdf | null = null;
  private blob: Blob | null = null;
  private prefetchPromise: Promise<void> | null = null;

  /** Fire-and-forget warm-up (safe to call many times). */
  prefetch(): void {
    void this.ensurePrefetched();
  }

  /** Resolve when metadata + PDF bytes are ready (or failed). */
  ensurePrefetched(): Promise<void> {
    if (!this.prefetchPromise) {
      this.prefetchPromise = this.runPrefetch();
    }
    return this.prefetchPromise;
  }

  getCachedMeta(): MenuPdf | null {
    return this.meta;
  }

  getCachedBlob(): Blob | null {
    return this.blob;
  }

  /**
   * Returns cached bytes when available, otherwise fetches now.
   * Always returns a fresh ArrayBuffer (PDF.js may transfer/detach it).
   */
  async getPdfForViewer(): Promise<{
    meta: MenuPdf;
    data: ArrayBuffer;
  } | null> {
    await this.ensurePrefetched();

    if (this.meta?.file_url && this.blob) {
      return {
        meta: this.meta,
        data: await this.blob.arrayBuffer(),
      };
    }

    // Prefetch failed earlier — try a direct load once.
    try {
      const meta = await this.menuService.getLatestMenuPdf();
      if (!meta?.file_url) {
        return null;
      }
      const response = await fetch(meta.file_url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      this.meta = meta;
      this.blob = blob;
      return { meta, data: await blob.arrayBuffer() };
    } catch {
      return null;
    }
  }

  private async runPrefetch(): Promise<void> {
    try {
      const meta = await this.menuService.getLatestMenuPdf();
      this.meta = meta;
      if (!meta?.file_url) {
        return;
      }

      // Hint the browser network stack (helps on supported browsers).
      this.injectPreloadLink(meta.file_url);

      const response = await fetch(meta.file_url, {
        credentials: 'omit',
        mode: 'cors',
        cache: 'force-cache',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.blob = await response.blob();
    } catch {
      // Leave cache empty; viewer will retry on open.
      this.blob = null;
    }
  }

  private injectPreloadLink(url: string): void {
    if (typeof document === 'undefined') {
      return;
    }
    const existing = document.head.querySelector(
      `link[data-menu-pdf-preload="true"]`,
    );
    if (existing) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'fetch';
    link.href = url;
    link.crossOrigin = 'anonymous';
    link.dataset['menuPdfPreload'] = 'true';
    document.head.appendChild(link);
  }
}
