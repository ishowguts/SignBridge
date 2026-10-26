import React from 'react';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Volume2,
  Clock,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import type { RecognitionResult as RecognitionResultType, RecognitionStatus } from '../types/recognition';
import { DEMO_SIGNS, findSign } from '../data/demoSigns';
import { Kbd } from './Toast';
import { Link } from 'react-router-dom';

interface RecognitionResultProps {
  result: RecognitionResultType | null;
  status: RecognitionStatus;
  speechEnabled: boolean;
  onConfirm: () => void;
  onMarkIncorrect: (correctedLabel?: string) => void;
  onTryAgain: () => void;
  onClear: () => void;
  onSpeak: (text: string) => void;
  /** Live camera readout shown while the ML model is recognising (replaces the spinner). */
  recognizingContent?: React.ReactNode;
}

export const RecognitionResult: React.FC<RecognitionResultProps> = ({
  result,
  status,
  speechEnabled,
  onConfirm,
  onMarkIncorrect,
  onTryAgain,
  onClear,
  onSpeak,
  recognizingContent,
}) => {
  const [showCorrection, setShowCorrection] = React.useState(false);
  const [correctionLabel, setCorrectionLabel] = React.useState('');
  const [typedMessage, setTypedMessage] = React.useState('');

  const handleMarkIncorrect = () => {
    setShowCorrection(true);
  };

  const handleSubmitCorrection = () => {
    onMarkIncorrect(correctionLabel || undefined);
    setShowCorrection(false);
    setCorrectionLabel('');
  };

  const handleSkipCorrection = () => {
    onMarkIncorrect(undefined);
    setShowCorrection(false);
    setCorrectionLabel('');
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // Idle / Waiting state
  if (status === 'idle' || status === 'camera_active' || status === 'requesting_permission') {
    return (
      <div className="h-full flex flex-col gap-4">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 min-h-[300px]">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm mb-4">
            <Eye className="w-8 h-8 text-gray-300 dark:text-gray-600" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Waiting for a sign
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
            Start the camera and press Start Recognition (Space), then hold one sign steady for about a second.
          </p>
        </div>
      </div>
    );
  }

  // Paused state
  if (status === 'paused') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800 min-h-[300px] text-center">
        <StatusBadge variant="warning">Recognition Paused</StatusBadge>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Recognition is paused. Resume when ready.</p>
      </div>
    );
  }

  // Recognizing / loading
  if (status === 'recognizing' && recognizingContent) return <>{recognizingContent}</>;
  if (status === 'recognizing') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 min-h-[300px] text-center gap-4 animate-fade-in">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900" />
          <div className="absolute inset-0 rounded-full border-4 border-brand-600 border-t-transparent animate-spin" aria-label="Processing" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Running demo recognition…</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Simulating recognition pipeline</p>
        </div>
        <StatusBadge variant="demo" pulse>Simulated · Processing</StatusBadge>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-800 min-h-[300px] text-center gap-4 animate-fade-in">
        <AlertCircle className="w-10 h-10 text-red-400" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">Recognition error</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">An error occurred during demonstration.</p>
        </div>
        <Button variant="secondary" onClick={onTryAgain} icon={<RefreshCw className="w-4 h-4" />} id="result-retry-error-btn">
          Try Again
        </Button>
      </div>
    );
  }

  // Uncertain state
  if (status === 'uncertain' || result?.status === 'uncertain') {
    return (
      <div className="flex flex-col gap-4 animate-fade-in">
        <div className="flex flex-col items-center p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800 text-center gap-3">
          <AlertCircle className="w-8 h-8 text-amber-500" aria-hidden="true" />
          <div>
            <StatusBadge variant="warning" className="mb-2">Uncertain Result</StatusBadge>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
              Unable to identify this sign confidently.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {result?.isSimulated
                ? 'The simulated engine could not produce a high-confidence match.'
                : 'This hand shape is not one the model knows well. Copy the reference photo, keep both hands fully in view, and try again.'}
            </p>
            {!!result?.alternatives?.length && (
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                Closest guesses:{' '}
                {result.alternatives.map(a => a.label).join(', ')}
              </p>
            )}
          </div>
          {result?.timestamp && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-3 h-3" aria-hidden="true" />
              <span>{formatTime(result.timestamp)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={onTryAgain} icon={<RefreshCw className="w-4 h-4" />} id="uncertain-retry-btn">
            Try Again <Kbd>R</Kbd>
          </Button>
          <Button variant="secondary" onClick={onClear} id="uncertain-clear-btn">
            Dismiss
          </Button>
          <Link to="/signs">
            <Button variant="ghost" size="sm" id="uncertain-signs-btn">
              View Supported Signs
            </Button>
          </Link>
        </div>

        {/* Survey finding: 3 of 10 respondents want to type the message when the app is unsure */}
        <form
          className="flex gap-2"
          onSubmit={e => {
            e.preventDefault();
            if (typedMessage.trim()) onSpeak(typedMessage.trim());
          }}
        >
          <label htmlFor="typed-message" className="sr-only">Type the intended message</label>
          <input
            id="typed-message"
            value={typedMessage}
            onChange={e => setTypedMessage(e.target.value)}
            placeholder="Or type the message instead…"
            className="flex-1 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Button variant="secondary" type="submit" icon={<Volume2 className="w-4 h-4" />} disabled={!typedMessage.trim()} id="typed-speak-btn">
            Speak
          </Button>
        </form>
      </div>
    );
  }

  // Recognized state
  if (result && status === 'recognized') {
    return (
      <div className="flex flex-col gap-4 animate-fade-in">
        {/* Result card */}
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              {result.isSimulated ? (
                <StatusBadge variant="simulated" className="mb-2">Simulated demonstration result</StatusBadge>
              ) : (
                <StatusBadge variant="success" className="mb-2">Recognised by on-device model</StatusBadge>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Predicted Sign</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{formatTime(result.timestamp)}</span>
            </div>
          </div>

          {/* Large result label + reference photo so the user can compare without leaving the page (Rule 8) */}
          <div className="py-6 flex items-center justify-center gap-6">
            <span
              className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight"
              aria-live="polite"
              aria-label={`Predicted sign: ${result.label}`}
            >
              {result.label}
            </span>
            {findSign(result.label)?.image && (
              <figure className="text-center">
                <img
                  src={findSign(result.label)!.image}
                  alt={`Reference hand shape for ${result.label}`}
                  className="w-24 h-24 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                />
                <figcaption className="text-[10px] text-gray-400 mt-1">Reference</figcaption>
              </figure>
            )}
          </div>

          {/* Confidence indicator */}
          <div className="mt-4">
            <ConfidenceIndicator value={result.confidence} simulated={result.isSimulated} />
            {!result.isSimulated && !!result.alternatives?.length && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Other candidates:{' '}
                {result.alternatives
                  .filter(a => a.label !== result.label)
                  .map(a => `${a.label} ${Math.round(a.confidence * 100)}%`)
                  .join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* Correction form */}
        {showCorrection && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800 animate-fade-in">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What was the intended sign? (optional)
            </p>
            <select
              value={correctionLabel}
              onChange={e => setCorrectionLabel(e.target.value)}
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Select intended sign"
              id="correction-select"
            >
              <option value="">— I'd prefer not to specify —</option>
              {DEMO_SIGNS.map(s => (
                <option key={s.id} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSubmitCorrection}
                id="correction-submit-btn"
              >
                Submit Feedback
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipCorrection}
                id="correction-skip-btn"
              >
                Skip
              </Button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Your correction is saved with the history entry so errors can be reviewed later. It does not retrain the model.
            </p>
          </div>
        )}

        {/* Actions */}
        {!showCorrection && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="success"
              onClick={onConfirm}
              icon={<CheckCircle className="w-4 h-4" />}
              id="result-confirm-btn"
            >
              Confirm <Kbd>C</Kbd>
            </Button>
            <Button
              variant="danger"
              onClick={handleMarkIncorrect}
              icon={<XCircle className="w-4 h-4" />}
              id="result-incorrect-btn"
            >
              Incorrect <Kbd>X</Kbd>
            </Button>
            {speechEnabled && window.speechSynthesis && (
              <Button
                variant="secondary"
                onClick={() => onSpeak(result.label)}
                icon={<Volume2 className="w-4 h-4" />}
                id="result-speak-btn"
              >
                Speak <Kbd>S</Kbd>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onTryAgain}
              icon={<RefreshCw className="w-4 h-4" />}
              id="result-retry-btn"
            >
              Try Again <Kbd>R</Kbd>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              icon={<Trash2 className="w-4 h-4" />}
              id="result-clear-btn"
            >
              Clear
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
};
