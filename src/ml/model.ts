/**
 * In-browser ISL classifier.
 * 1. MediaPipe HandLandmarker finds up to 2 hands (21 landmarks each) in a video frame.
 * 2. features() normalises them exactly like ml/train.py (keep the two in sync).
 * 3. A small MLP (weights exported from scikit-learn to public/model/isl_mlp.json) gives class probabilities.
 */
import { FilesetResolver, HandLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';

import { mean, setModel, setPrototypes, type MlpJson, type Point } from './classifier';
export { features, classify, type Point, type Prediction } from './classifier';

const BASE = import.meta.env.BASE_URL;
let landmarker: HandLandmarker | null = null;
let mlp: MlpJson | null = null;

export async function loadModels(): Promise<{ testAccuracy: number }> {
  if (!mlp) {
    const res = await fetch(`${BASE}model/isl_mlp.json`);
    if (!res.ok) throw new Error('Classifier weights not found');
    mlp = (await res.json()) as MlpJson;
    setModel(mlp);
    // Optional: without it every pose counts as "known" (old behaviour).
    const pr = await fetch(`${BASE}model/isl_prototypes.json`).catch(() => null);
    if (pr?.ok) setPrototypes(await pr.json());
  }
  if (!landmarker) {
    const vision = await FilesetResolver.forVisionTasks(`${BASE}mediapipe`);
    const make = (delegate: 'GPU' | 'CPU') =>
      HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: `${BASE}model/hand_landmarker.task`, delegate },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
      });
    // GPU is faster but not available everywhere (old drivers, some VMs); CPU always works.
    landmarker = await make('GPU').catch(() => make('CPU'));
  }
  return { testAccuracy: mlp.test_accuracy };
}

/** Returns hands in pixel coords, sorted left-to-right in the raw (un-mirrored) frame. */
export function detectHands(video: HTMLVideoElement, ts: number): Point[][] {
  if (!landmarker || video.readyState < 2) return [];
  const w = video.videoWidth;
  const h = video.videoHeight;
  const res = landmarker.detectForVideo(video, ts);
  return res.landmarks
    .slice(0, 2)
    .map((hand: NormalizedLandmark[]) => hand.map(p => [p.x * w, p.y * h] as Point))
    .sort((a, b) => mean(a, 0) - mean(b, 0));
}

/** MediaPipe hand skeleton for the overlay. */
export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];
