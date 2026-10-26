# ML pipeline (reproduce the model)

```bash
cd ml
python3.12 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
mkdir -p data
curl -L -o data/isl.parquet https://huggingface.co/datasets/Hemg/Indian_sign_language_dataset/resolve/main/data/train-00000-of-00001-a1731e778755d263.parquet
curl -L -o hand_landmarker.task https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
python extract_landmarks.py      # ~12 min on 2 CPU cores -> data/landmarks.npz
python train.py                  # ~2 min -> results/*, ../public/model/isl_mlp.json
cd .. && npm run check:model     # browser maths == sklearn on 20 held-out rows
```

`train.py` writes `results/parity_rows.json` next to itself; copy it to `scripts/` before `npm run check:model` if you retrain.
Results of the committed model are in `results/metrics.json`, `results/per_class.csv`, `results/confusion_matrix.png`.
