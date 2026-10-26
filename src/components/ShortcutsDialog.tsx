import React, { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

const GROUPS: { title: string; keys: [string, string][] }[] = [
  {
    title: 'Live Recognition',
    keys: [
      ['Space', 'Start / stop recognising'],
      ['Enter', 'Capture the current sign now'],
      ['C', 'Confirm result'],
      ['X', 'Mark result incorrect'],
      ['S', 'Speak result aloud'],
      ['R', 'Reset / try again'],
      ['K', 'Start or stop the camera'],
    ],
  },
  {
    title: 'Anywhere',
    keys: [
      ['U', 'Undo the last action (while the notice is shown)'],
      ['/', 'Search (Supported Signs, History)'],
      ['?', 'Show this list'],
      ['Esc', 'Close dialogs'],
    ],
  },
];

export const ShortcutsDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="shortcuts-title" className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
            <Keyboard className="w-5 h-5 text-brand-600" aria-hidden="true" /> Keyboard shortcuts
          </h2>
          <button onClick={onClose} aria-label="Close shortcuts" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        {GROUPS.map(g => (
          <div key={g.title} className="mb-4 last:mb-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{g.title}</p>
            <ul className="space-y-1.5">
              {g.keys.map(([k, d]) => (
                <li key={k} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>{d}</span>
                  <kbd className="min-w-[2rem] text-center px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono text-xs">
                    {k}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="text-xs text-gray-400 mt-4">Shortcuts can be turned off in Settings. They never fire while you type in a field.</p>
      </div>
    </div>
  );
};
