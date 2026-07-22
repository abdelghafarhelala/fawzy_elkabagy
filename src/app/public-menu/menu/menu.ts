import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { Category, Product, SignatureProduct } from '../../core/models/menu.models';
import { LanguageService } from '../../core/services/language.service';
import { MenuPdfPrefetchService } from '../../core/services/menu-pdf-prefetch.service';
import { MenuService } from '../../core/services/menu.service';
import { formatProductPrice } from '../../core/utils/price';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menu',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit, OnDestroy {
  private static readonly MAX_VISIBLE_PRODUCTS = 8;

  private readonly menuService = inject(MenuService);
  private readonly languageService = inject(LanguageService);
  private readonly pdfPrefetch = inject(MenuPdfPrefetchService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly signaturesTrack =
    viewChild<ElementRef<HTMLElement>>('signaturesTrack');
  private readonly categoriesTrack =
    viewChild<ElementRef<HTMLElement>>('categoriesTrack');
  private readonly menuTrack =
    viewChild<ElementRef<HTMLElement>>('menuTrack');
  private isProgrammaticMenuScroll = false;
  private querySub?: Subscription;

  readonly currentLanguage = this.languageService.currentLanguage;

  isLoading = signal(true);
  isDownloadingPdf = signal(false);
  errorMessage = signal<string | null>(null);
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  signatures = signal<SignatureProduct[]>([]);
  activeCategoryId = signal<string | null>(null);
  activeSignatureIndex = signal(0);
  /** Category ids whose product list is fully expanded. */
  expandedCategoryIds = signal<ReadonlySet<string>>(new Set());

  /** Categories that have at least one product (empty categories are hidden). */
  categoriesWithProducts = computed(() =>
    this.categories().filter((category) =>
      this.products().some((product) => product.category_id === category.id),
    ),
  );

  async ngOnInit(): Promise<void> {
    await this.loadMenu();
    this.querySub = this.route.queryParamMap.subscribe((params) => {
      const slug = params.get('category');
      if (slug) {
        this.applyCategorySlug(slug);
      }
    });
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
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

      const categorySlug = this.route.snapshot.queryParamMap.get('category');
      const matched = categorySlug
        ? this.categoriesWithProducts().find((c) => c.slug === categorySlug)
        : null;

      if (matched) {
        this.activeCategoryId.set(matched.id);
      } else {
        const firstWithProducts = categories.find((category) =>
          products.some((product) => product.category_id === category.id),
        );
        this.activeCategoryId.set(firstWithProducts?.id ?? null);
      }
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
      const slug = this.route.snapshot.queryParamMap.get('category');
      if (slug) {
        // Wait for category cards to render, then scroll into place.
        queueMicrotask(() => this.applyCategorySlug(slug));
      }
    }
  }

  /** Opens the menu section on this signature's category slide. */
  openSignatureCategory(sig: SignatureProduct): void {
    const slug = sig.category_slug;
    if (!slug) {
      return;
    }

    void this.router.navigate(['/'], {
      queryParams: { category: slug },
      fragment: 'menu',
    });

    // Same-page: ensure section scrolls into view after navigation settles.
    queueMicrotask(() => {
      document.getElementById('menu')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      this.applyCategorySlug(slug);
    });
  }

  /**
   * Selects and scrolls to a category by slug.
   * @returns true when a matching category was found
   */
  private applyCategorySlug(slug: string): boolean {
    const category = this.categoriesWithProducts().find(
      (item) => item.slug === slug,
    );
    if (!category) {
      return false;
    }
    this.selectCategory(category.id);
    return true;
  }

  selectCategory(categoryId: string): void {
    this.setActiveCategory(categoryId);
    queueMicrotask(() => this.scrollToCategoryCard(categoryId));
  }

  productsForCategory(categoryId: string): Product[] {
    return this.products().filter(
      (product) => product.category_id === categoryId,
    );
  }

  visibleProductsForCategory(categoryId: string): Product[] {
    const products = this.productsForCategory(categoryId);
    if (this.isCategoryExpanded(categoryId)) {
      return products;
    }
    return products.slice(0, Menu.MAX_VISIBLE_PRODUCTS);
  }

  categoryHasMoreProducts(categoryId: string): boolean {
    return (
      this.productsForCategory(categoryId).length > Menu.MAX_VISIBLE_PRODUCTS
    );
  }

  isCategoryExpanded(categoryId: string): boolean {
    return this.expandedCategoryIds().has(categoryId);
  }

  toggleCategoryExpand(categoryId: string): void {
    this.expandedCategoryIds.update((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  scrollMenuCategories(direction: -1 | 1): void {
    const track = this.menuTrack()?.nativeElement;
    if (!track) {
      return;
    }

    const card = track.querySelector(
      '.menu-category-card',
    ) as HTMLElement | null;
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap) || 0;
    const amount = card ? card.offsetWidth + gap : track.clientWidth;
    this.scrollTrack(track, direction, amount);
  }

  onMenuCategoriesScroll(): void {
    if (this.isProgrammaticMenuScroll) {
      return;
    }

    const track = this.menuTrack()?.nativeElement;
    if (!track) {
      return;
    }

    const cards = Array.from(
      track.querySelectorAll('.menu-category-card'),
    ) as HTMLElement[];
    if (cards.length === 0) {
      return;
    }

    const trackCenter =
      track.getBoundingClientRect().left + track.clientWidth / 2;
    let closestCard = cards[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(cardCenter - trackCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestCard = card;
      }
    }

    const categoryId = closestCard.dataset['categoryId'];
    if (categoryId && categoryId !== this.activeCategoryId()) {
      this.setActiveCategory(categoryId);
    }
  }

  private setActiveCategory(categoryId: string): void {
    this.activeCategoryId.set(categoryId);
    this.expandedCategoryIds.set(new Set());
    this.scrollActiveTabIntoView();
  }

  private scrollToCategoryCard(categoryId: string): void {
    const track = this.menuTrack()?.nativeElement;
    const card = track?.querySelector(
      `[data-category-id="${categoryId}"]`,
    ) as HTMLElement | null;
    if (!track || !card) {
      return;
    }

    this.isProgrammaticMenuScroll = true;
    card.scrollIntoView({
      behavior: 'smooth',
      inline: 'start',
      block: 'nearest',
    });
    window.setTimeout(() => {
      this.isProgrammaticMenuScroll = false;
    }, 400);
  }

  private scrollActiveTabIntoView(): void {
    const track = this.categoriesTrack()?.nativeElement;
    const active = track?.querySelector(
      'button.active',
    ) as HTMLElement | null;
    active?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
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

  signatureImage(product: SignatureProduct): string | null {
    return product.category_image_url || product.image_url;
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
