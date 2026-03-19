'use client';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Hellmodus aktivieren' : 'Dunkelmodus aktivieren'}
      aria-label={theme === 'dark' ? 'Hellmodus aktivieren' : 'Dunkelmodus aktivieren'}
      className="flex items-center justify-center w-9 h-9 rounded-lg bg-transparent border-none cursor-pointer transition-colors shrink-0 text-gray-600 hover:text-gray-900 hover:bg-black/10 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
