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
  activeSignatureIndex = signal(0);

  /** Categories that have at least one product (empty categories are hidden). */
  categoriesWithProducts = computed(() =>
    this.categories().filter((category) =>
      this.products().some((product) => product.category_id === category.id),
    ),
  );

  activeCategory = computed(() => {
    const id = this.activeCategoryId();
    if (!id) {
      return null;
    }
    return (
      this.categoriesWithProducts().find((category) => category.id === id) ??
      null
    );
  });

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

      const firstWithProducts = categories.find((category) =>
        products.some((product) => product.category_id === category.id),
      );
      this.activeCategoryId.set(firstWithProducts?.id ?? null);
      this.activeSignatureIndex.set(0);
    } catch {
      this.errorMessage.set(
        'Unable to load the menu. Please try again later.',
      );
      this.categories.set([]);
      this.products.set([]);
      this.signatures.set([]);
      this.activeCategoryId.set(null);
      this.activeSignatureIndex.set(0);
    } finally {
      this.isLoading.set(false);
    }
  }

  selectCategory(categoryId: string): void {
    this.activeCategoryId.set(categoryId);
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

  scrollCategories(direction: -1 | 1): void {
    this.scrollTrack(this.categoriesTrack()?.nativeElement, direction);
  }

  scrollSignatures(direction: -1 | 1): void {
    const track = this.signaturesTrack()?.nativeElement;
    if (!track) {
      return;
    }

    const card = track.querySelector('.signature-card') as HTMLElement | null;
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap) || 0;
    const amount = card ? card.offsetWidth + gap : 740;
    this.scrollTrack(track, direction, amount);
  }

  onSignaturesScroll(): void {
    const track = this.signaturesTrack()?.nativeElement;
    if (!track) {
      return;
    }

    const cards = Array.from(track.children) as HTMLElement[];
    if (cards.length === 0) {
      return;
    }

    const trackCenter =
      track.getBoundingClientRect().left + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(cardCenter - trackCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== this.activeSignatureIndex()) {
      this.activeSignatureIndex.set(closestIndex);
    }
  }

  goToSignature(index: number): void {
    const track = this.signaturesTrack()?.nativeElement;
    const card = track?.children[index] as HTMLElement | undefined;
    if (!track || !card) {
      return;
    }

    card.scrollIntoView({
      behavior: 'smooth',
      inline: 'start',
      block: 'nearest',
    });
    this.activeSignatureIndex.set(index);
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
