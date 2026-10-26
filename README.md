# SignBridge — Real-Time Indian Sign Language Recognition

A web app that recognises the 35 static Indian Sign Language (ISL) fingerspelling signs (A–Z, 1–9) from your webcam and shows them as large text and speech. Recognition runs entirely in the browser: no video leaves your device.

HCI + ML course project — IIIT Pune. Team: Bittu Mandal, Chinmay Ghule, Dev Krishan, Himanshu Raj.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

Open **Live Recognition**, press **Space** (or Start Recognition), allow the camera, and hold one sign still for about a second. Good light and a plain background help. Press **?** to see all shortcuts.

## How it works

1. **Camera** — getUserMedia, mirrored preview, ~12 frames/s analysed, nothing stored.
2. **Hand landmarks** — MediaPipe Hand Landmarker (WebAssembly, GPU with CPU fallback): up to 2 hands × 21 points.
3. **Features** — hands ordered left-to-right, centred and scaled → 84 coordinates + two-hand flag = 85 features.
4. **Classifier** — MLP 85-128-64-35 trained with scikit-learn, weights in `public/model/isl_mlp.json`, forward pass in TypeScript.
5. **Decision** — a sign locks when 9 of the last 12 frames agree with ≥ 60% confidence; otherwise the user sees an *uncertain* state with the top-3 guesses.
6. **Review** — Confirm, mark Incorrect (pick the intended sign), Speak, Try again; every save or delete can be undone.

## Model results (`ml/results/metrics.json`)

| Model | Test accuracy | Macro-F1 |
|---|---|---|
| kNN (k=5) | 97.79% | 97.32% |
| Random Forest | 97.88% | 97.46% |
| SVM (RBF) | 97.88% | 97.43% |
| **MLP 128-64 (used)** | **97.86%** | **97.42%** |

Dataset: 42,745 images, 35 classes (Hugging Face `Hemg/Indian_sign_language_dataset`); 358 duplicate "copy" files removed; hands found in 98.79%.
Test set: the last 20% of frames of each class (8,377 images), so near-duplicate video frames cannot leak between train and test. A random split would report 99.95%.
Known weakness: digit **9** is often predicted as **S**. Real-world accuracy on new signers, lighting and backgrounds will be lower than these figures.

Reproduce: see `ml/README.md`. Check the browser maths equals scikit-learn: `npm run check:model`.

## HCI: Shneiderman's Eight Golden Rules

| Rule | In the app |
|---|---|
| Consistency | Same layout, buttons and colour meanings on every page; one result card for both modes |
| Shortcuts | Space, Enter, C, X, S, R, K, U, /, ? (hints on buttons, toggle in Settings) |
| Informative feedback | Hand skeleton on video, hands-detected badge, live guess + confidence, model-ready badge |
| Closure | Locked result card; "saved" notice with View history |
| Error prevention / handling | 9-of-12 agreement, 60% threshold, uncertain state, clear camera errors, Demo-mode fallback |
| Easy reversal | Undo after confirm, incorrect, delete, clear history |
| Internal locus of control | Camera and recognition only on command; Capture now; manual-confirm vs auto-save setting |
| Reduce memory load | Reference photo next to every result; Supported Signs with photos; shortcut list |

## Project layout

```
src/ml/            model.ts (MediaPipe), classifier.ts (features + MLP)
src/hooks/         useSignRecognizer, useCamera, useShortcuts, usePreferences, useRecognitionDemo
src/pages/         Dashboard, LiveRecognition, SupportedSigns, History, HowItWorks, Settings
public/model/      hand_landmarker.task, isl_mlp.json      public/signs/  reference photos
public/mediapipe/  WebAssembly runtime
ml/                extract_landmarks.py, train.py, results/
docs/              questionnaire, interviews, literature, wireframes, screenshots, poster prompt
report/            report.html → node scripts/build-report.cjs → SignBridge_Project_Report.pdf
scripts/           parity check, UI tests, camera e2e test, screenshots
```

## Privacy

The camera starts only when you ask. Frames are processed in memory on your device and never uploaded or saved. History stores only label, confidence, time and your feedback in this browser's localStorage.

## Limitations

Static fingerspelling only (no movement-based word signs, no facial expressions, no sentences). Trained on a dataset from few signers against a dark background. Not a replacement for a qualified interpreter.
