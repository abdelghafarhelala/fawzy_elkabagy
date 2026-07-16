import { Injectable, signal, computed, inject } from '@angular/core';
import { DirectionService } from './direction.service';

export type Language = 'en' | 'ar';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly LANGUAGE_KEY = 'menu-language';
  private _currentLanguage = signal<Language>('en'); // Default to English
  private directionService = inject(DirectionService);

  currentLanguage = computed(() => this._currentLanguage());

  // Auto-sync direction with language (Arabic = RTL, English = LTR)
  direction = computed(() => this._currentLanguage() === 'ar' ? 'rtl' : 'ltr');

  constructor() {
    // Direction sync happens in setLanguage() method
  }

  initLanguage(): void {
    const savedLanguage = localStorage.getItem(this.LANGUAGE_KEY) as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      this._currentLanguage.set(savedLanguage);
    } else {
      this._currentLanguage.set('en');
    }
    this.applyLanguage();

    // Sync document direction with the active language
    this.directionService.setDirection(this.direction());
  }

  toggleLanguage(): void {
    this.setLanguage(this._currentLanguage() === 'en' ? 'ar' : 'en');
  }

  setLanguage(lang: Language): void {
    this._currentLanguage.set(lang);
    localStorage.setItem(this.LANGUAGE_KEY, lang);
    this.applyLanguage();

    // Update direction based on language
    const dir = this.direction();
    this.directionService.setDirection(dir);
  }

  private applyLanguage(): void {
    const html = document.documentElement;
    const lang = this._currentLanguage();
    html.setAttribute('lang', lang);
  }

  resetToDefault(): void {
    localStorage.removeItem(this.LANGUAGE_KEY);
    this.setLanguage('en'); // Default to English on logout
  }
}
