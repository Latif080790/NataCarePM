import { i18n, useTranslation } from '@/i18n';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock navigator.language
Object.defineProperty(navigator, 'language', {
  writable: true,
  value: 'en-US'
});

describe('i18n Service', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset to default language
    i18n.setLanguage('en');
  });

  describe('Language Management', () => {
    it('should set and get current language', () => {
      expect(i18n.getCurrentLanguage()).toBe('en');
      
      i18n.setLanguage('id');
      expect(i18n.getCurrentLanguage()).toBe('id');
      
      i18n.setLanguage('en');
      expect(i18n.getCurrentLanguage()).toBe('en');
    });

    it('should load language preference from localStorage', () => {
      // Set language in localStorage
      localStorage.setItem('preferredLanguage', 'id');
      
      // Create new instance to trigger load
      const newI18n = Object.create(Object.getPrototypeOf(i18n));
      Object.assign(newI18n, i18n);
      newI18n.loadLanguagePreference();
      
      expect(newI18n.getCurrentLanguage()).toBe('id');
    });

    it('should detect browser language', () => {
      // Mock Indonesian browser language
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'id-ID'
      });
      
      // Clear localStorage
      localStorage.removeItem('preferredLanguage');
      
      // Create new instance to trigger load
      const newI18n = Object.create(Object.getPrototypeOf(i18n));
      Object.assign(newI18n, i18n);
      newI18n.loadLanguagePreference();
      
      expect(newI18n.getCurrentLanguage()).toBe('id');
    });

    it('should fallback to English for unsupported languages', () => {
      // Set unsupported language in localStorage
      localStorage.setItem('preferredLanguage', 'fr');
      
      // Create new instance to trigger load
      const newI18n = Object.create(Object.getPrototypeOf(i18n));
      Object.assign(newI18n, i18n);
      newI18n.loadLanguagePreference();
      
      expect(newI18n.getCurrentLanguage()).toBe('en');
    });
  });

  describe('Translation Functionality', () => {
    it('should translate simple keys', () => {
      expect(i18n.t('common.loading')).toBe('Loading...');
      expect(i18n.t('common.save')).toBe('Save');
      
      i18n.setLanguage('id');
      expect(i18n.t('common.loading')).toBe('Memuat...');
      expect(i18n.t('common.save')).toBe('Simpan');
    });

    it('should translate nested keys', () => {
      expect(i18n.t('dashboard.welcome')).toBe('Welcome back');
      expect(i18n.t('auth.login')).toBe('Login');
      
      i18n.setLanguage('id');
      expect(i18n.t('dashboard.welcome')).toBe('Selamat datang kembali');
      expect(i18n.t('auth.login')).toBe('Masuk');
    });

    it('should return key for missing translations', () => {
      const missingKey = 'missing.translation.key';
      expect(i18n.t(missingKey)).toBe(missingKey);
    });

    it('should interpolate parameters in translations', () => {
      // Add a test translation with parameters
      const testTranslations = {
        en: {
          test: {
            greeting: 'Hello {{name}}, you have {{count}} messages'
          }
        },
        id: {
          test: {
            greeting: 'Halo {{name}}, Anda memiliki {{count}} pesan'
          }
        }
      };
      
      // Mock the translations
      (i18n as any).translations = testTranslations;
      
      expect(i18n.t('test.greeting', { name: 'John', count: 5 }))
        .toBe('Hello John, you have 5 messages');
      
      i18n.setLanguage('id');
      expect(i18n.t('test.greeting', { name: 'John', count: 5 }))
        .toBe('Halo John, Anda memiliki 5 pesan');
    });

    it('should handle missing parameters gracefully', () => {
      // Add a test translation with parameters
      const testTranslations = {
        en: {
          test: {
            greeting: 'Hello {{name}}, you have {{count}} messages'
          }
        }
      };
      
      // Mock the translations
      (i18n as any).translations = testTranslations;
      
      // Missing parameters should remain as placeholders
      expect(i18n.t('test.greeting', { name: 'John' }))
        .toBe('Hello John, you have {{count}} messages');
    });
  });

  describe('useTranslation Hook', () => {
    it('should provide translation function', () => {
      const { t, language, setLanguage } = useTranslation();
      
      expect(t).toBeInstanceOf(Function);
      expect(language).toBe('en');
      expect(setLanguage).toBeInstanceOf(Function);
    });

    it('should translate using hook', () => {
      const { t } = useTranslation();
      
      expect(t('common.loading')).toBe('Loading...');
      
      // Change language through hook
      const { setLanguage } = useTranslation();
      setLanguage('id');
      
      expect(t('common.loading')).toBe('Memuat...');
    });
  });
});