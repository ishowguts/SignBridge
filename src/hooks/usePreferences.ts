import { useState, useEffect, useCallback } from 'react';
import type { AppPreferences } from '../types/recognition';

const STORAGE_KEY = 'signbridge_preferences';

const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'light',
  textSize: 'standard',
  reducedMotion: false,
  speechEnabled: true,
  requireManualConfirm: true,
  shortcutsEnabled: true,
};

function loadPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<AppPreferences>) };
    }
  } catch {
    // Ignore parse errors
  }
  // Check system preference for reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return { ...DEFAULT_PREFERENCES, reducedMotion: prefersReduced };
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<AppPreferences>(loadPreferences);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [preferences.theme]);

  // Apply text size
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.textSize === 'large') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }
  }, [preferences.textSize]);

  const updatePreference = useCallback(<K extends keyof AppPreferences>(
    key: K,
    value: AppPreferences[K]
  ) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage unavailable
      }
      return updated;
    });
  }, []);

  return { preferences, updatePreference };
}
