import { AfterViewInit, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';
import { Story } from '../story/story';
import { Menu } from '../menu/menu';
import { ContactUs } from '../contact-us/contact-us';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-home',
  imports: [TranslatePipe, Story, Menu, ContactUs, Footer],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements AfterViewInit, OnDestroy {
  private readonly languageService = inject(LanguageService);
  private readonly sectionIds = ['home', 'our-story', 'menu', 'contact'];
  private observer?: IntersectionObserver;

  activeSection = signal('home');
  menuOpen = signal(false);
  currentLanguage = this.languageService.currentLanguage;
  nextLanguageLabel = computed(() => (this.currentLanguage() === 'en' ? 'AR' : 'EN'));

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          this.activeSection.set(visible.target.id);
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const id of this.sectionIds) {
      const section = document.getElementById(id);
      if (section) {
        this.observer.observe(section);
      }
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    document.body.classList.remove('nav-drawer-open');
  }

  isActive(sectionId: string): boolean {
    return this.activeSection() === sectionId;
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  toggleMobileMenu(): void {
    this.menuOpen.update((open) => !open);
    this.syncBodyScroll();
  }

  closeMobileMenu(): void {
    if (!this.menuOpen()) {
      return;
    }
    this.menuOpen.set(false);
    this.syncBodyScroll();
  }

  scrollToSection(sectionId: string, event: Event): void {
    event.preventDefault();

    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    this.activeSection.set(sectionId);
    this.closeMobileMenu();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private syncBodyScroll(): void {
    document.body.classList.toggle('nav-drawer-open', this.menuOpen());
  }
}
