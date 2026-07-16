import { Injectable, inject, computed } from '@angular/core';
import { LanguageService } from './language.service';
import { TRANSLATIONS } from '../i18n/translations';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private languageService = inject(LanguageService);

  // Expose current translations based on language
  currentTranslations = computed(() => {
    const lang = this.languageService.currentLanguage();
    return TRANSLATIONS[lang] || TRANSLATIONS['en'];
  });

  /**
   * Get translation by key with optional params for interpolation
   */
  t(key: string, params?: any): string {
    if (!key) return '';
    
    const translations = this.currentTranslations();
    
    // First try direct flat key lookup (e.g., 'LOGIN.TITLE')
    let translation = (translations as any)[key];

    // Fallback: support nested keys using dot notation (e.g., truly nested objects)
    if (!translation) {
      translation = key.split('.').reduce((obj, segment) => obj?.[segment], translations as any);
    }
    
    // Fallback to the key itself if not found
    if (!translation) {
      translation = key;
    }

    if (params) {
      Object.keys(params).forEach(param => {
        const value = params[param];
        // Support both {{param}} and {param} formats
        const regex = new RegExp(`{{${param}}}|{${param}}`, 'g');
        translation = translation.replace(regex, value);
      });
    }

    return translation;
  }
}

