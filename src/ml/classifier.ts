/** Pure feature + MLP code, shared by the browser and the parity test (no MediaPipe import). */
export type Point = [number, number];
export interface Prediction {
  label: string;
  confidence: number;
  top: { label: string; confidence: number }[];
  /** false = pose is far from every training example, so the label is not trustworthy */
  known: boolean;
}
export interface MlpJson {
  labels: string[];
  layers: { W: number[][]; b: number[] }[];
  test_accuracy: number;
}
let mlp: MlpJson | null = null;
export const setModel = (m: MlpJson) => {
  mlp = m;
};

// Unknown-sign check (ml/ood.py): a softmax always picks some class, so we also need the distance to the
// nearest training prototype. Beyond the threshold the pose is unlike anything seen in training.
let protos: { threshold: number; prototypes: number[][] } | null = null;
export const setPrototypes = (p: { threshold: number; prototypes: number[][] }) => {
  protos = p;
};
const UNKNOWN_CONFIDENCE_CAP = 0.3; // well below the 60% lock threshold

function nearestDistance(x: number[]): number {
  let best = Infinity;
  for (const p of protos!.prototypes) {
    let d = 0;
    for (let i = 0; i < p.length && d < best; i++) d += (x[i] - p[i]) ** 2;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

export const mean = (pts: Point[], i: 0 | 1) => pts.reduce((s, p) => s + p[i], 0) / pts.length;

/** Same as features() in ml/train.py: centre on all points, scale by max distance, 84 coords + two-hand flag. */
export function features(hands: Point[][]): number[] {
  const pts = hands.flat();
  const cx = mean(pts, 0);
  const cy = mean(pts, 1);
  const s = Math.max(...pts.map(([x, y]) => Math.hypot(x - cx, y - cy))) || 1;
  const out = new Array(85).fill(0);
  hands.forEach((hand, hi) =>
    hand.forEach(([x, y], pi) => {
      out[hi * 42 + pi * 2] = (x - cx) / s;
      out[hi * 42 + pi * 2 + 1] = (y - cy) / s;
    })
  );
  out[84] = hands.length === 2 ? 1 : 0;
  return out;
}

export function classify(x: number[]): Prediction {
  if (!mlp) throw new Error('Model not loaded');
  let a = x;
  mlp.layers.forEach((layer, li) => {
    const z = layer.W.map((row, j) => row.reduce((s, w, k) => s + w * a[k], layer.b[j]));
    a = li < mlp!.layers.length - 1 ? z.map(v => Math.max(0, v)) : z;
  });
  const m = Math.max(...a);
  const e = a.map(v => Math.exp(v - m));
  const sum = e.reduce((s, v) => s + v, 0);
  const probs = e.map(v => v / sum);
  const top = probs
    .map((p, i) => ({ label: mlp!.labels[i], confidence: p }))
    .sort((p, q) => q.confidence - p.confidence)
    .slice(0, 3);
  const known = !protos || nearestDistance(x) <= protos.threshold;
  const confidence = known ? top[0].confidence : Math.min(top[0].confidence, UNKNOWN_CONFIDENCE_CAP);
  return { label: top[0].label, confidence, top, known };
}

