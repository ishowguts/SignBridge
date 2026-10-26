import React, { useEffect } from 'react';
import { CheckCircle, Undo2, X } from 'lucide-react';

export interface ToastData {
  id: number;
  message: string;
  /** Optional undo (Golden Rule 6). */
  onUndo?: () => void;
  /** Optional follow-up link, e.g. "View in History" (Golden Rule 4: closure). */
  action?: { label: string; onClick: () => void };
}

const TIMEOUT_MS = 7000;

export const Toast: React.FC<{ toast: ToastData | null; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 animate-fade-in"
    >
      <CheckCircle className="w-4 h-4 text-green-400 dark:text-green-600 shrink-0" aria-hidden="true" />
      <span className="text-sm flex-1">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick();
            onDismiss();
          }}
          className="text-sm font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded"
        >
          {toast.action.label}
        </button>
      )}
      {toast.onUndo && (
        <button
          onClick={() => {
            toast.onUndo!();
            onDismiss();
          }}
          className="flex items-center gap-1 text-sm font-semibold text-amber-300 dark:text-amber-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
          aria-label="Undo last action (shortcut U)"
        >
          <Undo2 className="w-4 h-4" aria-hidden="true" />
          Undo <kbd className="hidden sm:inline text-[10px] opacity-70">U</kbd>
        </button>
      )}
      <button onClick={onDismiss} aria-label="Dismiss notification" className="opacity-60 hover:opacity-100">
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};

/** Small keyboard hint shown on buttons. */
export const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="ml-1.5 hidden sm:inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded border border-current/30 text-[10px] font-mono opacity-60">
    {children}
  </kbd>
);
