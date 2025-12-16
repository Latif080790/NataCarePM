/**
 * P2.5: Language Switcher Component
 * Allows users to switch between Indonesian and English
 * 
 * Features:
 * - Simple dropdown UI
 * - Persists selection to localStorage
 * - Accessible keyboard navigation
 * - Icon indicators for languages
 */

import { useState } from 'react';
import { useTranslation, Language } from '@/i18n';
import { ButtonPro } from './ButtonPro';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'toggle' | 'minimal';
  showLabel?: boolean;
  className?: string;
}

export const LanguageSwitcher = ({ 
  variant = 'dropdown', 
  showLabel = true,
  className = '' 
}: LanguageSwitcherProps) => {
  const { t, language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'id' as Language, name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  ];

  const currentLang = languages.find(lang => lang.code === language) || languages[0];

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  if (variant === 'toggle') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              language === lang.code
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
            aria-label={`Switch to ${lang.name}`}
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <ButtonPro
        variant="ghost"
        size="sm"
        onClick={() => handleLanguageChange(language === 'en' ? 'id' : 'en')}
        className={className}
        aria-label="Toggle language"
      >
        <span className="text-lg mr-1">{currentLang.flag}</span>
        <span className="font-medium">{currentLang.code.toUpperCase()}</span>
      </ButtonPro>
    );
  }

  // Default: Dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-lg">{currentLang.flag}</span>
        {showLabel && <span>{currentLang.name}</span>}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('common.selectLanguage') || 'Select Language'}
              </p>
            </div>

            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 text-left transition-colors ${
                    language === lang.code
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  role="menuitem"
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium">{lang.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {lang.code.toUpperCase()}
                    </div>
                  </div>
                  {language === lang.code && (
                    <svg
                      className="w-5 h-5 text-orange-600 dark:text-orange-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('common.languageNote') || 'Language preference is saved automatically'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
