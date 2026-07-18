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
import { MenuService } from '../../core/services/menu.service';

@Component({
  selector: 'app-menu',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit {
  private readonly menuService = inject(MenuService);
  private readonly languageService = inject(LanguageService);
  private readonly signaturesTrack =
    viewChild<ElementRef<HTMLElement>>('signaturesTrack');

  readonly currentLanguage = this.languageService.currentLanguage;

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  activeCategoryId = signal<string | null>(null);

  readonly signatures = [
    {
      id: 'royal',
      image: 'images/sig-royal.jpg',
      titleKey: 'signatures.royal.title',
      descKey: 'signatures.royal.desc',
    },
    {
      id: 'steaks',
      image: 'images/sig-steaks.jpg',
      titleKey: 'signatures.steaks.title',
      descKey: 'signatures.steaks.desc',
    },
    {
      id: 'garden',
      image: 'images/sig-garden.jpg',
      titleKey: 'signatures.garden.title',
      descKey: 'signatures.garden.desc',
    },
  ];

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
      const [categories, products] = await Promise.all([
        this.menuService.getCategories(),
        this.menuService.getProducts(),
      ]);

      this.categories.set(categories);
      this.products.set(products);
      this.activeCategoryId.set(categories[0]?.id ?? null);
    } catch {
      this.errorMessage.set(
        'Unable to load the menu. Please try again later.',
      );
      this.categories.set([]);
      this.products.set([]);
      this.activeCategoryId.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  selectCategory(categoryId: string): void {
    this.activeCategoryId.set(categoryId);
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
    return this.currentLanguage() === 'ar'
      ? product.price_ar
      : product.price_en;
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

  scrollSignatures(direction: -1 | 1): void {
    const track = this.signaturesTrack()?.nativeElement;
    if (!track) {
      return;
    }
    track.scrollBy({ left: direction * 740, behavior: 'smooth' });
  }
}
