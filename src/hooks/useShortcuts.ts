import { useEffect, useRef } from 'react';

/**
 * Global single-key shortcuts (Golden Rule 2). Keys are matched on KeyboardEvent.key, lower-cased;
 * use ' ' for Space. Ignored while typing in a field or when a modifier is held, so it never steals normal input.
 */
export function useShortcuts(map: Record<string, () => void>, enabled = true) {
  const ref = useRef(map);
  ref.current = map;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      // Space/Enter on a focused button should press that button, not fire a shortcut.
      if ((e.key === ' ' || e.key === 'Enter') && t?.tagName === 'BUTTON') return;
      const fn = ref.current[e.key.toLowerCase()];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
