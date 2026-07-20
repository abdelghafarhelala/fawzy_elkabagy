import {
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { Category, Product } from '../../core/models/menu.models';
import { LanguageService } from '../../core/services/language.service';
import { MenuPdfPrefetchService } from '../../core/services/menu-pdf-prefetch.service';
import { MenuService } from '../../core/services/menu.service';
import { formatProductPrice } from '../../core/utils/price';

@Component({
  selector: 'app-menu',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit {
  private readonly menuService = inject(MenuService);
  private readonly languageService = inject(LanguageService);
  private readonly pdfPrefetch = inject(MenuPdfPrefetchService);
  private readonly signaturesTrack =
    viewChild<ElementRef<HTMLElement>>('signaturesTrack');
  private readonly menuTrack =
    viewChild<ElementRef<HTMLElement>>('menuTrack');
  private readonly categoriesTrack =
    viewChild<ElementRef<HTMLElement>>('categoriesTrack');

  readonly currentLanguage = this.languageService.currentLanguage;

  isLoading = signal(true);
  isDownloadingPdf = signal(false);
  errorMessage = signal<string | null>(null);
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  signatures = signal<Product[]>([]);
  activeCategoryId = signal<string | null>(null);

  visibleProducts = computed(() => {
    const categoryId = this.activeCategoryId();
    if (!categoryId) {
      return [];
    }
    return this.products().filter(
      (product) => product.category_id === categoryId,
    );
  });

  async ngOnInit(): Promise<void> {
    await this.loadMenu();
  }

  async loadMenu(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const [categories, products, signatures] = await Promise.all([
        this.menuService.getCategories(),
        this.menuService.getProducts(),
        this.menuService.getSignatures(),
      ]);

      this.categories.set(categories);
      this.products.set(products);
      this.signatures.set(signatures);
      this.activeCategoryId.set(categories[0]?.id ?? null);
    } catch {
      this.errorMessage.set(
        'Unable to load the menu. Please try again later.',
      );
      this.categories.set([]);
      this.products.set([]);
      this.signatures.set([]);
      this.activeCategoryId.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  selectCategory(categoryId: string): void {
    this.activeCategoryId.set(categoryId);
    queueMicrotask(() => {
      const track = this.menuTrack()?.nativeElement;
      track?.scrollTo({ left: 0, behavior: 'smooth' });
    });
  }

  async downloadFullMenu(): Promise<void> {
    if (this.isDownloadingPdf()) {
      return;
    }

    this.isDownloadingPdf.set(true);
    try {
      await this.pdfPrefetch.ensurePrefetched();
      let blob = this.pdfPrefetch.getCachedBlob();

      if (!blob) {
        const pdf = await this.pdfPrefetch.getPdfForViewer();
        if (!pdf) {
          return;
        }
        blob = new Blob([pdf.data], { type: 'application/pdf' });
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
      const meta = this.pdfPrefetch.getCachedMeta();
      if (meta?.file_url) {
        window.open(meta.file_url, '_blank', 'noopener,noreferrer');
      }
    } finally {
      this.isDownloadingPdf.set(false);
    }
  }

  categoryName(category: Category): string {
    return this.currentLanguage() === 'ar'
      ? category.name_ar
      : category.name_en;
  }

  productName(product: Product): string {
    return this.currentLanguage() === 'ar'
      ? product.name_ar
      : product.name_en;
  }

  productPrice(product: Product): string {
    return formatProductPrice(product, this.currentLanguage());
  }

  productDescription(product: Product): string {
    return this.currentLanguage() === 'ar'
      ? product.description_ar
      : product.description_en;
  }

  productBadge(product: Product): string | null {
    const badge =
      this.currentLanguage() === 'ar' ? product.badge_ar : product.badge_en;
    return badge?.trim() ? badge : null;
  }

  productTagLabel(tag: { en: string; ar: string }): string {
    return this.currentLanguage() === 'ar' ? tag.ar : tag.en;
  }

  scrollCategories(direction: -1 | 1): void {
    this.scrollTrack(this.categoriesTrack()?.nativeElement, direction);
  }

  scrollMenu(direction: -1 | 1): void {
    const track = this.menuTrack()?.nativeElement;
    if (!track) {
      return;
    }

    this.scrollTrack(track, direction, this.getCardStep(track));
  }

  scrollSignatures(direction: -1 | 1): void {
    const track = this.signaturesTrack()?.nativeElement;
    if (!track) {
      return;
    }
    track.scrollBy({ left: direction * 740, behavior: 'smooth' });
  }

  private getCardStep(track: HTMLElement): number {
    const card = track.querySelector('.menu-card') as HTMLElement | null;
    if (!card) {
      return Math.max(track.clientWidth * 0.6, 160);
    }

    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap) || 0;
    return card.offsetWidth + gap;
  }

  private scrollTrack(
    track: HTMLElement | undefined,
    direction: -1 | 1,
    amount?: number,
  ): void {
    if (!track) {
      return;
    }

    const distance = amount ?? Math.max(track.clientWidth * 0.6, 160);
    const isRtl = getComputedStyle(track).direction === 'rtl';
    // direction: -1 = left arrow, 1 = right arrow (physical)
    const delta = direction * distance * (isRtl ? -1 : 1);
    track.scrollBy({ left: delta, behavior: 'smooth' });
  }
}
