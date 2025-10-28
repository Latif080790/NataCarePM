import { translations } from './translations.ts';
import { logger } from '@/utils/logger.enhanced';

export type Language = 'en' | 'id';
export type TranslationKey = string;

class I18nService {
  private currentLanguage: Language = 'en';
  private fallbackLanguage: Language = 'en';

  /**
   * Set the current language
   */
  setLanguage(language: Language): void {
    this.currentLanguage = language;
    logger.info('Language changed', { language });
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('preferredLanguage', language);
    } catch (error) {
      logger.warn('Failed to save language preference', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Get the current language
   */
  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Load language preference from storage
   */
  loadLanguagePreference(): void {
    try {
      const savedLanguage = localStorage.getItem('preferredLanguage') as Language | null;
      if (savedLanguage && this.isValidLanguage(savedLanguage)) {
        this.currentLanguage = savedLanguage;
      } else {
        // Detect browser language
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('id')) {
          this.currentLanguage = 'id';
        }
      }
    } catch (error) {
      logger.warn('Failed to load language preference', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Check if language is valid
   */
  private isValidLanguage(language: string): language is Language {
    return ['en', 'id'].includes(language);
  }

  /**
   * Get translated string with interpolation support
   */
  t(key: TranslationKey, params?: Record<string, string | number>): string {
    // Get translation for current language
    let translation = this.getTranslation(this.currentLanguage, key);
    
    // Fallback to fallback language if not found
    if (!translation && this.currentLanguage !== this.fallbackLanguage) {
      translation = this.getTranslation(this.fallbackLanguage, key);
    }
    
    // If still not found, return the key
    if (!translation) {
      logger.warn('Missing translation', { key, language: this.currentLanguage });
      return key;
    }
    
    // Interpolate parameters if provided
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation!.replace(
          new RegExp(`{{${param}}}`, 'g'), 
          String(params[param])
        );
      });
    }
    
    return translation;
  }

  /**
   * Get translation for specific language and key
   */
  private getTranslation(language: Language, key: string): string | undefined {
    const languageTranslations = translations[language];
    if (!languageTranslations) return undefined;
    
    // Support nested keys (e.g., 'dashboard.welcome')
    return key.split('.').reduce((obj: any, k: string) => obj?.[k], languageTranslations);
  }

  /**
   * Get all translations for current language
   */
  getTranslations(): Record<string, any> {
    return translations[this.currentLanguage] || {};
  }
}

// Export singleton instance
export const i18n = new I18nService();

// Load language preference on initialization
i18n.loadLanguagePreference();

// Hook for React components
export const useTranslation = () => {
  return {
    t: i18n.t.bind(i18n),
    language: i18n.getCurrentLanguage(),
    setLanguage: i18n.setLanguage.bind(i18n)
  };
};