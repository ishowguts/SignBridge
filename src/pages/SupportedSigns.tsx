import React, { useState, useMemo, useRef } from 'react';
import { useShortcuts } from '../hooks/useShortcuts';
import { Search, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { DEMO_SIGNS, DEMO_CATEGORIES } from '../data/demoSigns';
import type { DemoSign } from '../types/recognition';

const SignCard: React.FC<{ sign: DemoSign; onTry: (sign: DemoSign) => void }> = ({ sign, onTry }) => (
  <article
    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex flex-col gap-3 hover:border-brand-200 dark:hover:border-brand-800 transition-colors group"
    aria-label={`Sign card: ${sign.label}`}
  >
    {/* Reference photo */}
    {sign.image ? (
      <img
        src={sign.image}
        alt={`Reference photo of the ISL sign for ${sign.label}`}
        loading="lazy"
        className="aspect-square w-full rounded-lg object-cover border border-gray-100 dark:border-gray-800"
      />
    ) : (
    <div className="aspect-square rounded-lg bg-gradient-to-br from-brand-50 to-blue-50 dark:from-brand-900/20 dark:to-blue-900/20 flex items-center justify-center border border-brand-100/50 dark:border-brand-800/50">
      <div className="flex flex-col items-center gap-1">
        <span className="text-3xl font-black text-brand-600/20 dark:text-brand-400/20">
          {sign.label.charAt(0)}
        </span>
        <span className="text-[9px] text-brand-400/50 dark:text-brand-600/50 uppercase tracking-widest font-medium">Placeholder</span>
      </div>
    </div>
    )}

    <div className="flex-1">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-bold text-gray-900 dark:text-white">{sign.label}</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">{sign.category}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{sign.description}</p>
    </div>

    <div className="flex gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={() => onTry(sign)}
        className="flex-1 justify-center"
        id={`try-sign-${sign.id}-btn`}
      >
        Practise
      </Button>
    </div>

    <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center italic">{sign.notes}</p>
  </article>
);

const SignDetailModal: React.FC<{ sign: DemoSign; onClose: () => void; onTry: () => void }> = ({
  sign,
  onClose,
  onTry,
}) => {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-in">
        <button
          onClick={onClose}
          aria-label="Close sign detail"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {sign.image && (
          <img
            src={sign.image}
            alt={`Reference photo of the ISL sign for ${sign.label}`}
            className="w-full aspect-square rounded-xl object-cover mb-4 border border-gray-100 dark:border-gray-800"
          />
        )}

        <div className="flex items-center gap-2 mb-1">
          <h2 id="sign-detail-title" className="text-xl font-bold text-gray-900 dark:text-white">{sign.label}</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">{sign.category}</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{sign.description}</p>
        <StatusBadge variant="info" className="mb-4">{sign.hands === 2 ? 'Two-handed sign' : 'One-handed sign'}</StatusBadge>

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-5 italic">{sign.notes}</p>

        <div className="flex gap-3">
          <Button variant="primary" onClick={onTry} icon={<ExternalLink className="w-4 h-4" />} id="modal-try-btn" className="flex-1">
            Practise on camera
          </Button>
          <Button variant="secondary" onClick={onClose} id="modal-close-btn">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export const SupportedSigns: React.FC<{ shortcutsEnabled?: boolean }> = ({ shortcutsEnabled = true }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedSign, setSelectedSign] = useState<DemoSign | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useShortcuts({ '/': () => searchRef.current?.focus() }, shortcutsEnabled);

  const filtered = useMemo(() => {
    return DEMO_SIGNS.filter(s => {
      const matchSearch =
        !search ||
        s.label.toLowerCase() === search.trim().toLowerCase() ||
        s.category.toLowerCase().startsWith(search.trim().toLowerCase());
      const matchCat = category === 'All' || s.category === category;
      return matchSearch && matchCat;
    });
  }, [search, category]);

  const handleTry = (sign: DemoSign) => {
    // Navigate to recognition page with pre-selected sign
    // We store it in sessionStorage for the recognition page to pick up
    sessionStorage.setItem('signbridge_preset_sign', sign.label);
    navigate('/recognition');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Disclaimer */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl">
        <StatusBadge variant="info" className="mb-2">Recognised vocabulary · 35 signs</StatusBadge>
        <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
          The model recognises the static ISL fingerspelling alphabet (A–Z) and numbers 1–9. Photos are reference frames from the public training dataset. Signs that need movement or facial expression are out of scope.
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Type a letter or number…  ( / )"
            aria-label="Search signs by letter or number"
            id="signs-search"
            ref={searchRef}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['All', ...DEMO_CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              id={`filter-${cat.toLowerCase()}-btn`}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                category === cat
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Showing {filtered.length} of {DEMO_SIGNS.length} signs
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map(sign => (
            <SignCard
              key={sign.id}
              sign={sign}
              onTry={s => setSelectedSign(s)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search className="w-8 h-8" />}
          title="No signs found"
          description={`No signs match "${search}". Try a different search term.`}
          action={
            <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setCategory('All'); }} id="clear-search-btn">
              Clear Search
            </Button>
          }
        />
      )}

      {/* Detail modal */}
      {selectedSign && (
        <SignDetailModal
          sign={selectedSign}
          onClose={() => setSelectedSign(null)}
          onTry={() => {
            handleTry(selectedSign);
            setSelectedSign(null);
          }}
        />
      )}
    </div>
  );
};
