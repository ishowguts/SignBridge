import type { HistoryEntry } from '../types/recognition';

const STORAGE_KEY = 'signbridge_history';
const MAX_HISTORY = 50;

/**
 * History Service
 * Stores only demonstration metadata (label, timestamp, mode, feedback).
 * NEVER stores webcam frames or video.
 */
export const historyService = {
  getAll(): HistoryEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    } catch {
      return [];
    }
  },

  add(entry: HistoryEntry): void {
    try {
      const current = this.getAll();
      const updated = [entry, ...current].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage unavailable — silently ignore
    }
  },

  updateFeedback(
    id: string,
    feedback: 'correct' | 'incorrect',
    correctedLabel?: string
  ): void {
    try {
      const current = this.getAll();
      const updated = current.map(e =>
        e.id === id
          ? { ...e, userFeedback: feedback, correctedLabel }
          : e
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage unavailable — silently ignore
    }
  },

  remove(id: string): void {
    this.setAll(this.getAll().filter(e => e.id !== id));
  },

  /** Replace the whole list (used by Undo to put back removed entries). */
  setAll(entries: HistoryEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
    } catch {
      // Storage unavailable — silently ignore
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable — silently ignore
    }
  },
};
