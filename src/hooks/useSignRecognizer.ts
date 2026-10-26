import { useCallback, useEffect, useRef, useState } from 'react';
import { classify, detectHands, features, HAND_CONNECTIONS, loadModels, type Point, type Prediction } from '../ml/model';

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

const WINDOW = 12; // frames kept for smoothing (~1 s at the detection rate below)
const AGREE = 9; // frames in the window that must agree before a sign is "locked"
const FRAME_MS = 80; // ~12 detections per second keeps laptops cool
const GIVE_UP_MS = 3500; // hands visible this long without a confident lock -> show the uncertain state
export const CONFIDENCE_THRESHOLD = 0.6;

/**
 * Runs hand detection + classification on the live camera feed.
 * When the same sign is held steady (AGREE of the last WINDOW frames, mean confidence >= threshold)
 * it calls onStable once and stops, so the user can confirm, correct or retry.
 */
export function useSignRecognizer(
  videoRef: React.RefObject<HTMLVideoElement>,
  onStable: (p: Prediction) => void
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle');
  const [testAccuracy, setTestAccuracy] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [live, setLive] = useState<Prediction | null>(null);
  const [handCount, setHandCount] = useState(0);
  const buffer = useRef<Prediction[]>([]);
  const handSince = useRef<number | null>(null); // time the first hand was seen since Start
  const raf = useRef<number>();
  const last = useRef(0);
  const onStableRef = useRef(onStable);
  onStableRef.current = onStable;

  const ensureModel = useCallback(async () => {
    if (modelStatus === 'ready') return true;
    setModelStatus('loading');
    try {
      const { testAccuracy } = await loadModels();
      setTestAccuracy(testAccuracy);
      setModelStatus('ready');
      return true;
    } catch {
      setModelStatus('error');
      return false;
    }
  }, [modelStatus]);

  const smoothed = (): Prediction | null => {
    const buf = buffer.current;
    if (!buf.length) return null;
    const counts = new Map<string, Prediction[]>();
    buf.forEach(p => counts.set(p.label, [...(counts.get(p.label) ?? []), p]));
    const [label, ps] = [...counts.entries()].sort((a, b) => b[1].length - a[1].length)[0];
    const confidence = ps.reduce((s, p) => s + p.confidence, 0) / buf.length; // penalises flicker
    return { label, confidence, top: buf[buf.length - 1].top, known: ps.filter(p => p.known).length * 2 >= ps.length };
  };

  const draw = (hands: Point[][]) => {
    const c = canvasRef.current;
    const v = videoRef.current;
    if (!c || !v) return;
    if (c.width !== v.videoWidth) {
      c.width = v.videoWidth;
      c.height = v.videoHeight;
    }
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.lineWidth = Math.max(2, c.width / 320);
    hands.forEach((hand, i) => {
      ctx.strokeStyle = i === 0 ? '#22d3ee' : '#a78bfa';
      ctx.fillStyle = '#ffffff';
      HAND_CONNECTIONS.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(hand[a][0], hand[a][1]);
        ctx.lineTo(hand[b][0], hand[b][1]);
        ctx.stroke();
      });
      hand.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, ctx.lineWidth * 1.6, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  };

  const stop = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = undefined;
    const c = canvasRef.current;
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    setRunning(false);
    setLive(null);
    setHandCount(0);
  }, []);

  const tick = useCallback(
    (now: number) => {
      raf.current = requestAnimationFrame(tick);
      if (now - last.current < FRAME_MS) return;
      last.current = now;
      const video = videoRef.current;
      if (!video) return;
      let hands: Point[][] = [];
      try {
        hands = detectHands(video, now);
      } catch {
        return; // a dropped frame is not worth surfacing
      }
      draw(hands);
      setHandCount(hands.length);
      if (!hands.length) {
        buffer.current = [];
        setLive(null);
        return;
      }
      buffer.current = [...buffer.current.slice(-(WINDOW - 1)), classify(features(hands))];
      handSince.current ??= now;
      const s = smoothed();
      setLive(s);
      // Survey F5: never leave the user waiting or guess silently; after ~3 s report "uncertain" with top guesses.
      if (s && now - handSince.current >= GIVE_UP_MS && (s.confidence < CONFIDENCE_THRESHOLD || !s.known)) {
        stop();
        buffer.current = [];
        onStableRef.current(s);
        return;
      }
      const agree = buffer.current.filter(p => p.label === s?.label).length;
      if (s && s.known && buffer.current.length === WINDOW && agree >= AGREE && s.confidence >= CONFIDENCE_THRESHOLD) {
        stop();
        buffer.current = [];
        onStableRef.current(s);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [videoRef, stop]
  );

  const start = useCallback(async () => {
    if (!(await ensureModel())) return false;
    buffer.current = [];
    handSince.current = null;
    setRunning(true);
    if (!raf.current) raf.current = requestAnimationFrame(tick);
    return true;
  }, [ensureModel, tick]);

  /** Manual capture: returns the current smoothed prediction (may be low-confidence) and stops. */
  const capture = useCallback(() => {
    const s = smoothed();
    stop();
    buffer.current = [];
    return s;
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { canvasRef, modelStatus, testAccuracy, running, live, handCount, start, stop, capture, ensureModel };
}
