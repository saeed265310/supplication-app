import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'auto';

export const useTheme = (initialTheme: Theme = 'auto') => {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Apply theme to document
  const applyTheme = (themeToApply: 'light' | 'dark') => {
    const root = document.documentElement;
    if (themeToApply === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setEffectiveTheme(themeToApply);
  };

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  // Update theme
  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('dhikr_theme', newTheme);

    if (newTheme === 'auto') {
      applyTheme(getSystemTheme());
    } else {
      applyTheme(newTheme);
    }
  };

  // Initialize theme on mount
  useEffect(() => {
    if (theme === 'auto') {
      applyTheme(getSystemTheme());
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      applyTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return { theme, effectiveTheme, updateTheme };
};
