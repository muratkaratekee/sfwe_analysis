import React from 'react';
import { useTheme } from './ThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={darkMode ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
    >
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
