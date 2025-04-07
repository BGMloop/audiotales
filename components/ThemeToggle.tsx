'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 lg:w-10 lg:h-10 mx-auto text-purple-500 mt-10 border border-purple-500 p-2 rounded-md hover:opacity-50 cursor-pointer"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon className="w-full h-full" /> : <Sun className="w-full h-full" />}
    </button>
  );
} 