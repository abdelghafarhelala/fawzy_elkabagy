import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from './core/services/language.service';
import { MenuPdfPrefetchService } from './core/services/menu-pdf-prefetch.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly languageService = inject(LanguageService);
  private readonly menuPdfPrefetch = inject(MenuPdfPrefetchService);

  constructor() {
    this.languageService.initLanguage();
    // Resolve public assets against <base href> (needed for GitHub Pages)
    document.documentElement.style.setProperty(
      '--pm-hero-image',
      `url('${document.baseURI}images/hero.jpg')`,
    );

    this.scheduleMenuPdfPrefetch();
  }

  /** Warm menu PDF in the background without blocking first paint. */
  private scheduleMenuPdfPrefetch(): void {
    const start = () => this.menuPdfPrefetch.prefetch();
    const win = window as Window & {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number },
      ) => number;
    };

    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(start, { timeout: 2000 });
    } else {
      window.setTimeout(start, 800);
    }
  }
}
