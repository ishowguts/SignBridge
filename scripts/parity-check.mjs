// Self-check: the browser classifier (src/ml/classifier.ts) must match scikit-learn on 20 held-out rows.
// Run: npm run check:model
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
const out = await build({ entryPoints: ['src/ml/classifier.ts'], bundle: true, format: 'esm', write: false });
const mod = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
mod.setModel(JSON.parse(readFileSync('public/model/isl_mlp.json', 'utf8')));
const rows = JSON.parse(readFileSync('scripts/parity_rows.json', 'utf8'));
let worst = 0, sameClass = 0;
for (const r of rows) {
  const hands = r.raw.slice(0, r.nh);
  const p = mod.classify(mod.features(hands));
  const skTop = r.proba.indexOf(Math.max(...r.proba));
  const tsIdx = JSON.parse(readFileSync('public/model/isl_mlp.json', 'utf8')).labels.indexOf(p.label);
  if (tsIdx === skTop) sameClass++;
  worst = Math.max(worst, Math.abs(p.confidence - r.proba[skTop]));
}
console.log(`same top class: ${sameClass}/${rows.length}, max |prob diff|: ${worst.toExponential(2)}`);
if (sameClass !== rows.length || worst > 1e-3) process.exit(1);
