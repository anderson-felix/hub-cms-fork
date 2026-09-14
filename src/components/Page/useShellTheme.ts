import { useEffect, useState } from 'react';

type ShellTheme = 'light' | 'dark';

const STORAGE_KEY = 'hub-cms-shell-theme';

function getInitial(): ShellTheme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY) as ShellTheme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useShellTheme() {
  const [theme, setTheme] = useState<ShellTheme>('light');

  useEffect(() => {
    setTheme(getInitial());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return {
    theme,
    toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
  };
}
