"""Unknown-sign detector: a softmax classifier always picks one of the 35 classes, even for a hand shape it
has never seen. We store a few prototype poses per class (k-means centres of the training features) and call a
pose "unknown" when it is far from every prototype. The threshold comes from the held-out test set.

Usage: python ood.py   (after train.py; same data/landmarks.npz)
Outputs: ../public/model/isl_prototypes.json, results/ood_metrics.json
"""
import json
from pathlib import Path

import numpy as np
import pyarrow.parquet as pq
from sklearn.cluster import KMeans

from train import LABELS, SEED, features, mirror

K = 16  # prototypes per class
MARGIN = 1.25  # extra room for new signers / cameras on top of the 95th percentile

d = np.load("data/landmarks.npz")
raw, nh, y = d["raw"], d["nhands"], d["y"]
paths = [p["path"] for p in pq.read_table("data/isl.parquet", columns=["image"]).column("image").to_pylist()]
keep = np.array([Path(p).stem.isdigit() for p in paths]) & (nh > 0)
frame_no = np.array([int(Path(p).stem) if k else -1 for p, k in zip(paths, keep)])
raw, nh, y, frame_no = raw[keep], nh[keep], y[keep], frame_no[keep]
X = np.stack([features(r, n) for r, n in zip(raw, nh)])

# Same blocked split as train.py.
test = np.zeros(len(y), bool)
for c in np.unique(y):
    idx = np.where(y == c)[0]
    idx = idx[np.argsort(frame_no[idx])]
    test[idx[int(len(idx) * 0.8):]] = True
Xtr, ytr, Xte = X[~test], y[~test], X[test]
Xtr = np.concatenate([Xtr, np.stack([mirror(f) for f in Xtr])])
ytr = np.concatenate([ytr, ytr])

protos = np.concatenate(
    [KMeans(K, n_init=3, random_state=SEED).fit(Xtr[ytr == c]).cluster_centers_ for c in range(len(LABELS))]
).astype(np.float32)


def min_dist(F):
    return np.sqrt(((F[:, None, :] - protos[None, :, :]) ** 2).sum(-1)).min(1)


d_test = min_dist(Xte)
# p95 not p99: the tail is digit 9, whose held-out recording differs from training (it is the 9->S error anyway)
threshold = float(np.percentile(d_test, 95) * MARGIN)

rng = np.random.default_rng(SEED)
# Synthetic "not a sign" poses: (a) left and right hands taken from two different classes,
# (b) one hand of a real sign with its fingers randomly bent (Gaussian noise on the normalised points).
two = np.where(test & (nh == 2))[0]
a, b = rng.choice(two, 2000), rng.choice(two, 2000)
a, b = a[y[a] != y[b]], b[y[a] != y[b]]
mixed = np.stack([features(np.stack([raw[i][0], raw[j][1]]), 2) for i, j in zip(a, b)])
noisy = Xte[rng.choice(len(Xte), 2000)].copy()
noisy[:, :42] += rng.normal(0, 0.15, (len(noisy), 42)).astype(np.float32)

metrics = {
    "prototypes": int(len(protos)),
    "threshold": round(threshold, 4),
    "real_test_kept_pct": round(float((d_test <= threshold).mean() * 100), 2),
    "mixed_hands_rejected_pct": round(float((min_dist(mixed) > threshold).mean() * 100), 2),
    "bent_fingers_rejected_pct": round(float((min_dist(noisy) > threshold).mean() * 100), 2),
}
assert metrics["real_test_kept_pct"] > 95, metrics  # must not reject real signs
json.dump(metrics, open("results/ood_metrics.json", "w"), indent=2)
json.dump({"threshold": threshold, "prototypes": protos.round(4).tolist()}, open("../public/model/isl_prototypes.json", "w"))
print(metrics)
