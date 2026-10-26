"""Train and compare ISL classifiers on MediaPipe hand landmarks; export the MLP for the browser.

Usage: python train.py            (needs data/landmarks.npz from extract_landmarks.py)
Outputs: results/metrics.json, results/confusion_matrix.png, results/per_class.csv,
         ../app/public/model/isl_mlp.json (weights + labels), results/parity_rows.json (for the TS self-check)
"""
import json
import time
from pathlib import Path

import matplotlib
import numpy as np
import pyarrow.parquet as pq
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

LABELS = [str(i) for i in range(1, 10)] + [chr(c) for c in range(ord("A"), ord("Z") + 1)]
OUT = Path("results")
EXPORT = Path("../public/model/isl_mlp.json")
SEED = 42


def features(raw, nh):
    """raw: (2,21,2) pixel coords, hands sorted left-to-right; nh: hands present (1 or 2).
    Must stay identical to src/ml/features.ts."""
    pts = raw[:nh].reshape(-1, 2)
    c = pts.mean(0)
    s = np.linalg.norm(pts - c, axis=1).max() or 1.0
    out = np.zeros((2, 21, 2), np.float32)
    out[:nh] = (raw[:nh] - c) / s
    return np.concatenate([out.ravel(), [1.0 if nh == 2 else 0.0]]).astype(np.float32)


def mirror(f):
    """Horizontal flip in normalised space (for left-handed signers / mirrored cameras)."""
    h = f[:84].reshape(2, 21, 2).copy()
    h[..., 0] *= -1
    if f[84] == 1.0:
        h = h[::-1]  # after flipping, the right hand becomes the left-most
    return np.concatenate([h.ravel(), f[84:]]).astype(np.float32)


def main():
    OUT.mkdir(exist_ok=True)
    d = np.load("data/landmarks.npz")
    raw, nh, y = d["raw"], d["nhands"], d["y"]
    paths = [p["path"] for p in pq.read_table("data/isl.parquet", columns=["image"]).column("image").to_pylist()]
    assert len(paths) == len(y), "landmarks.npz must come from a full (no-limit) extraction run"
    # 358 files are named "<n> copy.jpg" (re-saved duplicates of other frames); drop them so they cannot leak across the split.
    keep = np.array([Path(p).stem.isdigit() for p in paths])
    frame_no = np.array([int(Path(p).stem) if k else -1 for p, k in zip(paths, keep)])
    raw, nh, y, frame_no = raw[keep], nh[keep], y[keep], frame_no[keep]

    det = nh > 0
    stats = {
        "images_total": int(len(keep)),
        "duplicate_copy_files_removed": int((~keep).sum()),
        "images_used": int(len(y)),
        "hands_detected_pct": round(float(det.mean() * 100), 2),
        "per_class_detected_pct": {LABELS[c]: round(float(det[y == c].mean() * 100), 1) for c in range(len(LABELS))},
        "per_class_two_hand_pct": {LABELS[c]: round(float((nh[(y == c) & det] == 2).mean() * 100), 1) for c in range(len(LABELS))},
    }
    raw, nh, y, frame_no = raw[det], nh[det], y[det], frame_no[det]
    X = np.stack([features(r, n) for r, n in zip(raw, nh)])

    # Blocked split: images are frames from a few recordings per class, so neighbouring frames are near-duplicates.
    # Per class, the last 20% of frames (by file number) go to test; a random split would leak and inflate accuracy.
    test = np.zeros(len(y), bool)
    for c in np.unique(y):
        idx = np.where(y == c)[0]
        idx = idx[np.argsort(frame_no[idx])]
        test[idx[int(len(idx) * 0.8):]] = True
    Xtr, ytr, Xte, yte = X[~test], y[~test], X[test], y[test]
    Xtr_aug = np.concatenate([Xtr, np.stack([mirror(f) for f in Xtr])])
    ytr_aug = np.concatenate([ytr, ytr])
    stats.update(train_size=int(len(ytr)), train_size_with_mirror=int(len(ytr_aug)), test_size=int(len(yte)), features=int(X.shape[1]))

    models = {
        "kNN (k=5)": KNeighborsClassifier(5),
        "Random Forest": RandomForestClassifier(300, n_jobs=-1, random_state=SEED),
        "SVM (RBF)": SVC(C=10, gamma="scale", random_state=SEED),
        "MLP (128-64)": MLPClassifier((128, 64), max_iter=300, early_stopping=True, random_state=SEED),
    }
    results = {}
    for name, m in models.items():
        t0 = time.time()
        m.fit(Xtr_aug, ytr_aug)
        fit_s = time.time() - t0
        t0 = time.time()
        p = m.predict(Xte)
        ms = (time.time() - t0) / len(Xte) * 1000
        mirrored_acc = accuracy_score(yte, m.predict(np.stack([mirror(f) for f in Xte])))
        results[name] = {
            "accuracy": round(accuracy_score(yte, p) * 100, 2),
            "macro_f1": round(f1_score(yte, p, average="macro") * 100, 2),
            "mirrored_test_accuracy": round(mirrored_acc * 100, 2),
            "train_seconds": round(fit_s, 1),
            "ms_per_sample": round(ms, 3),
        }
        print(name, results[name], flush=True)

    # Random split for comparison only (shows leakage effect).
    rng = np.random.default_rng(SEED)
    perm = rng.permutation(len(y))
    cut = int(len(y) * 0.8)
    mlp_r = MLPClassifier((128, 64), max_iter=300, early_stopping=True, random_state=SEED).fit(X[perm[:cut]], y[perm[:cut]])
    results["MLP (128-64), random split (leaky, reference only)"] = {
        "accuracy": round(accuracy_score(y[perm[cut:]], mlp_r.predict(X[perm[cut:]])) * 100, 2)
    }

    mlp = models["MLP (128-64)"]
    p = mlp.predict(Xte)
    cm = confusion_matrix(yte, p, labels=range(len(LABELS)))
    fig, ax = plt.subplots(figsize=(11, 10))
    ax.imshow(cm / cm.sum(1, keepdims=True).clip(1), cmap="Blues")
    ax.set_xticks(range(len(LABELS)), LABELS)
    ax.set_yticks(range(len(LABELS)), LABELS)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True")
    ax.set_title("MLP confusion matrix (blocked test split, row-normalised)")
    fig.tight_layout()
    fig.savefig(OUT / "confusion_matrix.png", dpi=130)

    rep = classification_report(yte, p, labels=range(len(LABELS)), target_names=LABELS, output_dict=True, zero_division=0)
    with open(OUT / "per_class.csv", "w") as f:
        f.write("label,precision,recall,f1,support\n")
        for lab in LABELS:
            r = rep[lab]
            f.write(f"{lab},{r['precision']:.3f},{r['recall']:.3f},{r['f1-score']:.3f},{int(r['support'])}\n")
    off = np.argwhere((cm - np.diag(np.diag(cm))) > 0)
    top_conf = sorted(((int(cm[i, j]), LABELS[i], LABELS[j]) for i, j in off), reverse=True)[:8]

    json.dump({"dataset": stats, "models": results, "top_confusions_true_pred": top_conf}, open(OUT / "metrics.json", "w"), indent=2)

    EXPORT.parent.mkdir(parents=True, exist_ok=True)
    json.dump(
        {
            "labels": LABELS,
            "activation": "relu",
            "layers": [{"W": w.T.round(6).tolist(), "b": b.round(6).tolist()} for w, b in zip(mlp.coefs_, mlp.intercepts_)],
            "test_accuracy": results["MLP (128-64)"]["accuracy"],
        },
        open(EXPORT, "w"),
    )
    # Rows for the TypeScript parity check: raw landmarks + nhands + sklearn probabilities.
    pick = rng.choice(len(yte), 20, replace=False)
    rows = [
        {"raw": raw[test][i].tolist(), "nh": int(nh[test][i]), "proba": mlp.predict_proba(Xte[i : i + 1])[0].round(6).tolist()}
        for i in pick
    ]
    json.dump(rows, open(OUT / "parity_rows.json", "w"))
    print("exported", EXPORT)


if __name__ == "__main__":
    main()
