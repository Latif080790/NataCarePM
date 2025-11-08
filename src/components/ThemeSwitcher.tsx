/**
 * ThemeSwitcher - Professional Theme Toggle Component
 * 
 * Provides seamless dark/light mode switching with:
 * - localStorage persistence
 * - System preference detection
 * - Smooth transitions
 * - Accessible controls
 * 
 * @component
 */

import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { ButtonPro } from './ButtonPro';

type Theme = 'light' | 'dark' | 'system';

interface ThemeSwitcherProps {
  /** Display mode: button, dropdown, or toggle */
  mode?: 'button' | 'dropdown' | 'toggle';
  /** Show label text */
  showLabel?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Theme Switcher Component
 */
export function ThemeSwitcher({
  mode = 'button',
  showLabel = false,
  className = '',
}: ThemeSwitcherProps) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (stored) {
      setTheme(stored);
      applyTheme(stored, prefersDark);
    } else {
      setTheme('system');
      applyTheme('system', prefersDark);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const applyTheme = (newTheme: Theme, prefersDark: boolean) => {
    const isDark = newTheme === 'dark' || (newTheme === 'system' && prefersDark);
    setResolvedTheme(isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(newTheme, prefersDark);
  };

  // Button mode - cycles through themes
  if (mode === 'button') {
    const cycleTheme = () => {
      const next: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
      handleThemeChange(next);
    };

    const getIcon = () => {
      if (theme === 'light') return <Sun className="w-4 h-4" />;
      if (theme === 'dark') return <Moon className="w-4 h-4" />;
      return <Monitor className="w-4 h-4" />;
    };

    const getLabel = () => {
      if (theme === 'light') return 'Light';
      if (theme === 'dark') return 'Dark';
      return 'System';
    };

    return (
      <ButtonPro
        variant="ghost"
        size="sm"
        onClick={cycleTheme}
        className={className}
        aria-label={`Current theme: ${theme}. Click to change.`}
        icon={getIcon().type}
      >
        {showLabel && getLabel()}
      </ButtonPro>
    );
  }

  // Toggle mode - simple dark/light switch
  if (mode === 'toggle') {
    const toggleTheme = () => {
      handleThemeChange(theme === 'dark' ? 'light' : 'dark');
    };

    return (
      <button
        onClick={toggleTheme}
        className={`
          relative inline-flex items-center h-6 w-11 rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${resolvedTheme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'}
          ${className}
        `}
        role="switch"
        aria-checked={resolvedTheme === 'dark'}
        aria-label="Toggle dark mode"
      >
        <span
          className={`
            inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200
            ${resolvedTheme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
          `}
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="w-3 h-3 text-primary-600 m-0.5" />
          ) : (
            <Sun className="w-3 h-3 text-yellow-500 m-0.5" />
          )}
        </span>
      </button>
    );
  }

  // Dropdown mode - full theme selector
  return (
    <div className={`relative inline-block ${className}`}>
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2">
        {([
          { value: 'light', icon: Sun, label: 'Light' },
          { value: 'dark', icon: Moon, label: 'Dark' },
          { value: 'system', icon: Monitor, label: 'System' },
        ] as const).map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => handleThemeChange(value)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md
              transition-all duration-200
              ${
                theme === value
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
            aria-label={`Use ${label.toLowerCase()} theme`}
            aria-pressed={theme === value}
          >
            <Icon className="w-4 h-4" />
            {showLabel && <span className="text-sm font-medium">{label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook to access current theme
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const currentTheme = stored || 'system';
    setThemeState(currentTheme);

    const isDark = currentTheme === 'dark' || (currentTheme === 'system' && prefersDark);
    setResolvedTheme(isDark ? 'dark' : 'light');
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = newTheme === 'dark' || (newTheme === 'system' && prefersDark);
    setResolvedTheme(isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  };

  return { theme, resolvedTheme, setTheme };
}

export default ThemeSwitcher;
