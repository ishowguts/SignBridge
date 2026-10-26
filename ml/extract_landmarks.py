"""Extract MediaPipe hand landmarks from the ISL image dataset.

Output: data/landmarks.npz with
  raw:    (N, 2, 21, 2) pixel-space x,y for up to 2 hands, sorted left-to-right; zeros if missing
  nhands: (N,) number of detected hands (0 rows are kept so we can report detection rate)
  y:      (N,) class index
The same normalisation (features.py) is re-implemented in the browser (src/ml/features.ts).
"""
import io
import sys
from multiprocessing import Pool

import numpy as np
import pyarrow.parquet as pq
from PIL import Image

MODEL = "hand_landmarker.task"
UPSCALE = 256  # dataset images are 128x128; MediaPipe detects better a bit larger
_det = None


def _init():
    global _det
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions, vision

    _det = vision.HandLandmarker.create_from_options(
        vision.HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=MODEL),
            num_hands=2,
            min_hand_detection_confidence=0.3,
            min_hand_presence_confidence=0.3,
        )
    )
    globals()["mp"] = mp


def _one(img_bytes):
    im = Image.open(io.BytesIO(img_bytes)).convert("RGB").resize((UPSCALE, UPSCALE))
    arr = np.asarray(im)
    res = _det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=arr))
    out = np.zeros((2, 21, 2), np.float32)
    hands = [np.array([[p.x * UPSCALE, p.y * UPSCALE] for p in h], np.float32) for h in res.hand_landmarks]
    hands.sort(key=lambda h: h[:, 0].mean())  # left-most hand first (handedness labels are unreliable)
    for i, h in enumerate(hands[:2]):
        out[i] = h
    return out, len(hands[:2])


def main():
    t = pq.read_table("data/isl.parquet")
    names = t.schema.metadata  # class names live in HF metadata; we hard-code the known order below
    labels = np.array(t.column("label").to_pylist())
    imgs = [d["bytes"] for d in t.column("image").to_pylist()]
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
    if limit:  # per-class cap for a quick run
        idx = np.concatenate([np.where(labels == c)[0][:limit] for c in np.unique(labels)])
        imgs, labels = [imgs[i] for i in idx], labels[idx]
    with Pool(2, initializer=_init) as pool:
        res = pool.map(_one, imgs, chunksize=64)
    raw = np.stack([r[0] for r in res])
    nh = np.array([r[1] for r in res])
    np.savez_compressed("data/landmarks.npz", raw=raw, nhands=nh, y=labels)
    print("done", raw.shape, "detected:", (nh > 0).mean().round(4), "two hands:", (nh == 2).mean().round(4))


if __name__ == "__main__":
    main()
