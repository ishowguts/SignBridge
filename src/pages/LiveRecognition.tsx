import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Square, RotateCcw, AlertTriangle, Camera, FlaskConical, Hand, Aperture, Loader2 } from 'lucide-react';
import { CameraPanel } from '../components/CameraPanel';
import { RecognitionResult } from '../components/RecognitionResult';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Kbd, type ToastData } from '../components/Toast';
import { useCamera } from '../hooks/useCamera';
import { useRecognitionDemo } from '../hooks/useRecognitionDemo';
import { useSignRecognizer, CONFIDENCE_THRESHOLD } from '../hooks/useSignRecognizer';
import { useShortcuts } from '../hooks/useShortcuts';
import { historyService } from '../services/historyService';
import { DEMO_SIGNS, findSign } from '../data/demoSigns';
import type { Prediction } from '../ml/model';
import type { AppPreferences, HistoryEntry, RecognitionResult as Result } from '../types/recognition';

interface LiveRecognitionProps {
  preferences: AppPreferences;
  onHistoryUpdate: () => void;
  onCameraStatusChange: (active: boolean) => void;
  stopCameraRef: React.MutableRefObject<(() => void) | null>;
  notify: (t: Omit<ToastData, 'id'>) => void;
  onViewHistory: () => void;
}

type Mode = 'ml' | 'demo';

const toResult = (p: Prediction | null): Result => ({
  id: `result-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  label: p && p.known && p.confidence >= CONFIDENCE_THRESHOLD ? p.label : 'Unknown',
  confidence: p?.confidence ?? null,
  alternatives: p?.top,
  mode: 'ml',
  status: p && p.known && p.confidence >= CONFIDENCE_THRESHOLD ? 'recognized' : 'uncertain',
  timestamp: new Date().toISOString(),
  isSimulated: false,
});

const click = (id: string) => (document.getElementById(id) as HTMLButtonElement | null)?.click();

export const LiveRecognition: React.FC<LiveRecognitionProps> = ({
  preferences,
  onHistoryUpdate,
  onCameraStatusChange,
  stopCameraRef,
  notify,
  onViewHistory,
}) => {
  const [mode, setMode] = useState<Mode>('ml');
  const [target, setTarget] = useState<string | null>(null); // sign chosen on Supported Signs to practise
  const { state: cameraState, videoRef, startCamera, stopCamera, switchCamera } = useCamera();
  const demo = useRecognitionDemo();
  const { status, result, selectedSign, setSelectedSign } = demo;

  // ---- history (with undo) -------------------------------------------------
  const save = useCallback(
    (r: Result, userFeedback: HistoryEntry['userFeedback'], correctedLabel?: string) => {
      historyService.add({
        id: r.id,
        label: r.label,
        timestamp: r.timestamp,
        mode: r.mode,
        status: r.status,
        confidence: r.confidence,
        userFeedback,
        correctedLabel,
        isSimulated: r.isSimulated,
      });
      onHistoryUpdate();
      const what =
        userFeedback === 'correct' ? 'confirmed and saved' : userFeedback === 'incorrect' ? 'marked incorrect' : 'saved';
      notify({
        message: `"${r.label}" ${what}.`,
        onUndo: () => {
          historyService.remove(r.id);
          onHistoryUpdate();
          demo.showResult(r); // put the result back on screen so the user can choose again
        },
        action: { label: 'View history', onClick: onViewHistory },
      });
    },
    [notify, onHistoryUpdate, onViewHistory, demo]
  );

  // ---- real ML pipeline ----------------------------------------------------
  const onStable = useCallback(
    (p: Prediction) => {
      const r = toResult(p);
      demo.showResult(r);
      if (!preferences.requireManualConfirm && r.status === 'recognized') {
        // Auto-save mode: store it (undoable) and keep recognising so the user can fingerspell continuously.
        save(r, 'pending');
        demo.startExternal();
        setTimeout(() => resumeRef.current?.(), 1200);
      }
    },
    [demo, preferences.requireManualConfirm, save]
  );
  const resumeRef = useRef<() => void>();
  const rec = useSignRecognizer(videoRef as React.RefObject<HTMLVideoElement>, onStable);
  resumeRef.current = () => {
    if (cameraState.isActive) rec.start();
  };

  // Load the model in the background as soon as the page opens (so Start is instant).
  useEffect(() => {
    if (mode === 'ml') rec.ensureModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const startRecognition = async () => {
    if (!cameraState.isActive) await startCamera();
    demo.startExternal();
    const ok = await rec.start();
    if (!ok) demo.clearResult();
  };
  const stopRecognition = () => {
    rec.stop();
    demo.clearResult();
  };
  const captureNow = () => {
    if (!rec.running) return;
    demo.showResult(toResult(rec.capture()));
  };

  // ---- shared actions ------------------------------------------------------
  useEffect(() => {
    stopCameraRef.current = () => {
      rec.stop();
      stopCamera();
    };
    return () => {
      stopCameraRef.current = null;
    };
  }, [stopCamera, stopCameraRef, rec]);

  useEffect(() => {
    onCameraStatusChange(cameraState.isActive);
    if (!cameraState.isActive && rec.running) stopRecognition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraState.isActive, onCameraStatusChange]);

  // Preset from the Supported Signs page ("Practise this sign").
  useEffect(() => {
    const preset = sessionStorage.getItem('signbridge_preset_sign');
    if (preset) {
      setSelectedSign(preset);
      setTarget(preset);
      sessionStorage.removeItem('signbridge_preset_sign');
    }
  }, [setSelectedSign]);

  const handleConfirm = () => {
    if (!result) return;
    demo.confirmResult();
    save(result, 'correct');
  };
  const handleMarkIncorrect = (correctedLabel?: string) => {
    if (!result) return;
    demo.markIncorrect(correctedLabel);
    save(result, 'incorrect', correctedLabel);
  };
  const handleTryAgain = () => {
    demo.clearResult();
    if (mode === 'ml') startRecognition();
    else demo.runDemoRecognition(selectedSign);
  };
  const switchMode = (m: Mode) => {
    if (m === mode) return;
    stopRecognition();
    setMode(m);
  };

  const isBusy = status === 'recognizing';
  useShortcuts(
    {
      ' ': () => (mode === 'ml' ? (rec.running ? stopRecognition() : startRecognition()) : !isBusy && demo.runDemoRecognition(selectedSign)),
      enter: captureNow,
      c: () => click('result-confirm-btn'),
      x: () => click('result-incorrect-btn'),
      s: () => click('result-speak-btn'),
      r: () => (result ? handleTryAgain() : stopRecognition()),
      k: () => (cameraState.isActive ? stopCamera() : startCamera()),
    },
    preferences.shortcutsEnabled
  );

  // ---- live readout while recognising ----------------------------------------
  const live = rec.live;
  const liveReadout = (
    <div className="flex flex-col gap-4 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 min-h-[300px] animate-fade-in" aria-live="polite">
      <div className="flex items-center justify-between">
        <StatusBadge variant={rec.handCount ? 'success' : 'warning'} pulse>
          {rec.handCount ? `${rec.handCount} hand${rec.handCount > 1 ? 's' : ''} detected` : 'No hand detected'}
        </StatusBadge>
        <span className="text-xs text-gray-500 dark:text-gray-400">Hold the sign still ~1 s</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {live ? (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400">{live.known ? 'Current guess' : 'Not a sign shape the model knows'}</p>
            <p className={`text-6xl font-bold ${live.known ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
              {live.known ? live.label : '?'}
            </p>
            <div className="w-full max-w-xs h-2 mt-3 rounded-full bg-white dark:bg-gray-800 overflow-hidden" role="progressbar" aria-valuenow={Math.round(live.confidence * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Live confidence">
              <div
                className={`h-full transition-all duration-150 ${live.confidence >= CONFIDENCE_THRESHOLD ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.round(live.confidence * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(live.confidence * 100)}% · locks automatically at {Math.round(CONFIDENCE_THRESHOLD * 100)}%+ when steady
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {live.known
                ? `Top 3: ${live.top.map(t => `${t.label} ${Math.round(t.confidence * 100)}%`).join(' · ')}`
                : `Closest: ${live.top.map(t => t.label).join(' · ')}. Match a reference photo in Supported Signs.`}
            </p>
          </>
        ) : (
          <>
            <Hand className="w-10 h-10 text-blue-300" aria-hidden="true" />
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Show a letter or number sign to the camera.</p>
            <p className="text-xs text-gray-400 mt-1">Good light, plain background, whole hand in view.</p>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={captureNow} icon={<Aperture className="w-4 h-4" />} id="capture-btn" disabled={!live}>
          Capture now <Kbd>Enter</Kbd>
        </Button>
        <Button variant="secondary" onClick={stopRecognition} icon={<Square className="w-4 h-4" />} id="stop-recognition-btn">
          Stop <Kbd>Space</Kbd>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Mode switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Recognition mode" className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
          {(
            [
              ['ml', 'Camera (ML model)', <Camera key="c" className="w-4 h-4" />],
              ['demo', 'Demo (no camera)', <FlaskConical key="f" className="w-4 h-4" />],
            ] as const
          ).map(([m, label, icon]) => (
            <button
              key={m}
              role="radio"
              aria-checked={mode === m}
              onClick={() => switchMode(m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                mode === m ? 'bg-white dark:bg-gray-900 shadow-sm font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
        {mode === 'ml' ? (
          <StatusBadge variant={rec.modelStatus === 'ready' ? 'success' : rec.modelStatus === 'error' ? 'error' : 'info'}>
            {rec.modelStatus === 'ready'
              ? `Model ready · ${rec.testAccuracy ?? '–'}% test accuracy`
              : rec.modelStatus === 'error'
              ? 'Model failed to load'
              : 'Loading model…'}
          </StatusBadge>
        ) : (
          <StatusBadge variant="demo" pulse>DEMO MODE — SIMULATED RECOGNITION</StatusBadge>
        )}
      </div>

      {mode === 'ml' && rec.modelStatus === 'error' && (
        <div role="alert" className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 text-sm text-red-800 dark:text-red-300">
          <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <div className="flex-1">
            The recognition model could not be loaded (it needs WebAssembly and about 17 MB). Reload the page, or use Demo mode to try the interface.
          </div>
          <Button variant="secondary" size="sm" onClick={() => switchMode('demo')}>
            Use Demo mode
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Camera */}
        <section aria-label="Camera panel">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Camera Preview</h2>
              {cameraState.isActive && <StatusBadge variant="success" pulse>Live</StatusBadge>}
            </div>
            <CameraPanel
              cameraState={cameraState}
              videoRef={videoRef as React.RefObject<HTMLVideoElement>}
              canvasRef={rec.canvasRef}
              onStart={() => startCamera()}
              onStop={stopCamera}
              onSwitch={switchCamera}
              overlay={
                rec.running && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                    <Hand className="w-3.5 h-3.5" aria-hidden="true" />
                    {rec.handCount ? `${rec.handCount} hand${rec.handCount > 1 ? 's' : ''}` : 'No hand'}
                    {live && ` · ${live.label} ${Math.round(live.confidence * 100)}%`}
                  </div>
                )
              }
            />
          </div>
        </section>

        {/* RIGHT — Recognition */}
        <section aria-label="Recognition controls and results">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 space-y-5">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Recognition</h2>

            {mode === 'ml' && target && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-brand-100 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/10">
                <img src={findSign(target)?.image} alt={`Reference for ${target}`} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                  Practising <strong>{target}</strong>
                  {result?.status === 'recognized' && (
                    <span className={`ml-2 font-semibold ${result.label === target ? 'text-green-600' : 'text-amber-600'}`}>
                      {result.label === target ? '✓ match' : `got ${result.label}, try again`}
                    </span>
                  )}
                </div>
                <button onClick={() => setTarget(null)} className="text-xs text-gray-500 hover:underline" aria-label="Stop practising this sign">
                  Clear
                </button>
              </div>
            )}

            {mode === 'ml' ? (
              <div className="flex flex-wrap items-center gap-2">
                {!rec.running ? (
                  <Button
                    variant="primary"
                    onClick={startRecognition}
                    disabled={rec.modelStatus === 'loading' || rec.modelStatus === 'error'}
                    icon={rec.modelStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    id="run-recognition-btn"
                  >
                    {rec.modelStatus === 'loading' ? 'Loading model…' : 'Start Recognition'} <Kbd>Space</Kbd>
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={stopRecognition} icon={<Square className="w-4 h-4" />} id="pause-recognition-btn">
                    Stop <Kbd>Space</Kbd>
                  </Button>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {preferences.requireManualConfirm
                    ? 'Each recognised sign waits for your confirmation.'
                    : 'Auto-save is on: signs are saved as you go (change in Settings).'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label htmlFor="sign-selector" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Sign to simulate
                  </label>
                  <select
                    id="sign-selector"
                    value={selectedSign}
                    onChange={e => setSelectedSign(e.target.value)}
                    className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    aria-describedby="sign-selector-desc"
                  >
                    {DEMO_SIGNS.map(sign => (
                      <option key={sign.id} value={sign.label}>
                        {sign.label}
                      </option>
                    ))}
                  </select>
                  <p id="sign-selector-desc" className="text-xs text-gray-400 dark:text-gray-500">
                    Demo mode shows the interface without a camera. The chosen label is returned; no gesture is analysed.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    onClick={() => demo.runDemoRecognition(selectedSign)}
                    disabled={isBusy}
                    loading={isBusy}
                    icon={!isBusy ? <Play className="w-4 h-4" /> : undefined}
                    id="run-recognition-btn"
                  >
                    {isBusy ? 'Running…' : 'Run Demo'} <Kbd>Space</Kbd>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={demo.simulateUncertain} disabled={isBusy} icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />} id="simulate-uncertain-btn">
                    Simulate uncertain result
                  </Button>
                  <Button variant="ghost" size="sm" onClick={demo.clearResult} icon={<RotateCcw className="w-4 h-4" />} id="reset-recognition-btn">
                    Reset
                  </Button>
                </div>
              </>
            )}

            <div className="border-t border-gray-50 dark:border-gray-800 pt-4">
              <RecognitionResult
                result={result}
                status={status}
                speechEnabled={preferences.speechEnabled}
                onConfirm={handleConfirm}
                onMarkIncorrect={handleMarkIncorrect}
                onTryAgain={handleTryAgain}
                onClear={demo.clearResult}
                onSpeak={demo.speakResult}
                recognizingContent={mode === 'ml' && rec.running ? liveReadout : undefined}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
