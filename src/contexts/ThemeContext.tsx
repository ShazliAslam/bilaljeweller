import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Ctx = { theme: Theme; toggle: () => void; set: (t: Theme) => void };

const ThemeCtx = createContext<Ctx>({ theme: 'light', toggle: () => {}, set: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('bj_theme') as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('bj_theme', theme);
  }, [theme]);

  return (
    <ThemeCtx.Provider value={{
      theme,
      toggle: () => setTheme(t => (t === 'light' ? 'dark' : 'light')),
      set: setTheme,
    }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
