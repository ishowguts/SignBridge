import React, { useState, useMemo, useRef } from 'react';
import { useShortcuts } from '../hooks/useShortcuts';
import { Search, Trash2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { HistoryEntry } from '../types/recognition';

interface HistoryPageProps {
  history: HistoryEntry[];
  onClear: () => void;
  onDelete: (id: string) => void;
  shortcutsEnabled: boolean;
  onUpdateFeedback: (id: string, feedback: 'correct' | 'incorrect', correctedLabel?: string) => void;
}

type FeedbackFilter = 'all' | 'correct' | 'incorrect' | 'pending';

export const HistoryPage: React.FC<HistoryPageProps> = ({ history, onClear, onDelete, shortcutsEnabled }) => {
  const [search, setSearch] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackFilter>('all');
  const [confirmClear, setConfirmClear] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useShortcuts({ '/': () => searchRef.current?.focus() }, shortcutsEnabled);

  const filtered = useMemo(() => {
    return history.filter(e => {
      const matchSearch = !search || e.label.toLowerCase().includes(search.toLowerCase());
      const matchFeedback =
        feedbackFilter === 'all' ||
        (feedbackFilter === 'pending' && (e.userFeedback === 'pending' || e.userFeedback === null)) ||
        e.userFeedback === feedbackFilter;
      return matchSearch && matchFeedback;
    });
  }, [history, search, feedbackFilter]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const FeedbackIcon: React.FC<{ feedback: HistoryEntry['userFeedback'] }> = ({ feedback }) => {
    if (feedback === 'correct') return <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />;
    if (feedback === 'incorrect') return <XCircle className="w-4 h-4 text-red-500" aria-hidden="true" />;
    return <AlertCircle className="w-4 h-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Info banner */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl">
        <StatusBadge variant="demo" className="mb-2">Recognition History</StatusBadge>
        <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
          Only metadata (label, confidence, time, feedback) is stored in this browser. No video or images are saved. Deleting is undoable for a few seconds.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by label…  ( / )"
              aria-label="Search history by label"
              id="history-search"
              ref={searchRef}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Feedback filter */}
          <div className="flex gap-1.5">
            {(['all', 'correct', 'incorrect', 'pending'] as FeedbackFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFeedbackFilter(f)}
                aria-pressed={feedbackFilter === f}
                id={`filter-${f}-btn`}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  feedbackFilter === f
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-brand-300'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {history.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmClear(true)}
            icon={<Trash2 className="w-4 h-4" />}
            id="clear-history-btn"
          >
            Clear History
          </Button>
        )}
      </div>

      {/* Count */}
      {history.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Showing {filtered.length} of {history.length} sessions
        </p>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        history.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-8 h-8" />}
            title="No history yet"
            description="Recognise a sign on the Live Recognition page and confirm or correct it to see it here."
          />
        ) : (
          <EmptyState
            icon={<Search className="w-8 h-8" />}
            title="No matches"
            description="Try adjusting your search or filters."
            action={
              <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setFeedbackFilter('all'); }} id="clear-filters-btn">
                Clear Filters
              </Button>
            }
          />
        )
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm" aria-label="Recognition history">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sign</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Date & Time</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Mode</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Feedback</th>
                <th className="px-3 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400 shrink-0">
                        {entry.label.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{entry.label}</p>
                        {entry.correctedLabel && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Corrected: {entry.correctedLabel}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 sm:hidden">
                          {formatDate(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {formatDate(entry.timestamp)}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {entry.isSimulated ? (
                      <StatusBadge variant="simulated">Demo</StatusBadge>
                    ) : (
                      <StatusBadge variant="success">
                        ML{typeof entry.confidence === 'number' ? ` · ${Math.round(entry.confidence * 100)}%` : ''}
                      </StatusBadge>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <FeedbackIcon feedback={entry.userFeedback} />
                      <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {entry.userFeedback ?? 'pending'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-right">
                    <button
                      onClick={() => onDelete(entry.id)}
                      aria-label={`Delete entry ${entry.label}`}
                      title="Delete (undoable)"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm clear dialog */}
      <ConfirmDialog
        open={confirmClear}
        title="Clear all history?"
        description="This removes all recognition records from this browser. You can undo it for a few seconds afterwards."
        confirmLabel="Clear History"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          onClear();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
};
