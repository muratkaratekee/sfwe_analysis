import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    // Kayıtlı tema tercihini kontrol et veya sistem tercihini kullan
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', darkMode);
    root.setAttribute('data-theme', darkMode ? 'dark' : 'light');

    if (darkMode) {
      root.style.setProperty('--bg-primary', '#111827');
      root.style.setProperty('--bg-secondary', '#0b1220');
      root.style.setProperty('--text-primary', '#e5e7eb');
      root.style.setProperty('--text-secondary', '#a8b3c3');
      root.style.setProperty('--border-color', '#2b3a55');

      root.style.setProperty('--color-bg', '#0b1220');
      root.style.setProperty('--color-text', '#e5e7eb');
      root.style.setProperty('--color-border', '#2b3a55');
      root.style.setProperty('--color-primary', '#7aa2f7');
    } else {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8fafc');
      root.style.setProperty('--text-primary', '#111827');
      root.style.setProperty('--text-secondary', '#4b5563');
      root.style.setProperty('--border-color', '#e5e7eb');

      root.style.setProperty('--color-bg', '#f8fafc');
      root.style.setProperty('--color-text', '#111827');
      root.style.setProperty('--color-border', '#e5e7eb');
      root.style.setProperty('--color-primary', '#2563eb');
    }
    // Tercihi kaydet
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme ThemeProvider içinde kullanılmalıdır');
  }
  return context;
};
