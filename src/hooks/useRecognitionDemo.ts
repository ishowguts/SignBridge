import { useState, useCallback } from 'react';
import type { RecognitionResult, RecognitionStatus } from '../types/recognition';
import { recognitionService } from '../services/recognitionService';
import { UNCERTAIN_LABEL } from '../data/demoSigns';

export function useRecognitionDemo() {
  const [status, setStatus] = useState<RecognitionStatus>('idle');
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [selectedSign, setSelectedSign] = useState<string>('A');

  const runDemoRecognition = useCallback(async (label: string) => {
    setStatus('recognizing');
    setResult(null);

    try {
      const res = await recognitionService.recognize(label);
      setResult(res);
      setStatus(res.status === 'uncertain' ? 'uncertain' : 'recognized');
    } catch {
      setStatus('error');
      setResult({
        id: `err-${Date.now()}`,
        label: 'Error',
        confidence: null,
        mode: 'simulated',
        status: 'error',
        timestamp: new Date().toISOString(),
        isSimulated: true,
      });
    }
  }, []);

  const simulateUncertain = useCallback(async () => {
    await runDemoRecognition(UNCERTAIN_LABEL);
  }, [runDemoRecognition]);

  const confirmResult = useCallback(() => {
    setStatus('idle');
    setResult(null);
  }, []);

  const markIncorrect = useCallback((_correctedLabel?: string) => {
    setStatus('idle');
    setResult(null);
  }, []);

  /** Used by the real ML pipeline: show a model result in the same result card. */
  const showResult = useCallback((res: RecognitionResult) => {
    setResult(res);
    setStatus(res.status === 'uncertain' ? 'uncertain' : 'recognized');
  }, []);

  const startExternal = useCallback(() => {
    setResult(null);
    setStatus('recognizing');
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setStatus('idle');
  }, []);

  const pause = useCallback(() => {
    if (status === 'recognizing') {
      setStatus('paused');
    }
  }, [status]);

  const speakResult = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  return {
    status,
    result,
    selectedSign,
    setSelectedSign,
    runDemoRecognition,
    simulateUncertain,
    confirmResult,
    markIncorrect,
    clearResult,
    showResult,
    startExternal,
    pause,
    speakResult,
  };
}
