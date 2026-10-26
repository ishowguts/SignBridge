import React from 'react';
import { Menu, Sun, Moon, Settings, Keyboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AppPreferences } from '../types/recognition';

interface HeaderProps {
  title: string;
  subtitle?: string;
  preferences: AppPreferences;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  onShowShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  preferences,
  onToggleSidebar,
  onToggleTheme,
  onShowShortcuts,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleSidebar}
          aria-label="Open navigation menu"
          aria-controls="sidebar"
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onShowShortcuts}
            aria-label="Show keyboard shortcuts (?)"
            title="Keyboard shortcuts (?)"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Keyboard className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={onToggleTheme}
            aria-label={`Switch to ${preferences.theme === 'light' ? 'dark' : 'light'} mode`}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {preferences.theme === 'light' ? (
              <Moon className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Sun className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          <Link
            to="/settings"
            aria-label="Open settings"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
          </Link>

          {/* Avatar placeholder */}
          <div
            aria-label="User avatar placeholder"
            className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-semibold ml-1"
          >
            SB
          </div>
        </div>
      </div>
    </header>
  );
};
