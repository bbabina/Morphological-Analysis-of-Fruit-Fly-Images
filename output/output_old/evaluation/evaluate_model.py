import math
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from ultralytics import YOLO

MODEL_PATH = Path("models/best.pt")
GROUND_TRUTH_CSV = Path("data/processed/ground_truth.csv")

IMAGE_DIRS = [
    Path("data/annotations/images/val"),
    Path("data/annotations/images/train"),
    Path("data/raw/images"),
]

OUTPUT_DIR = Path("output/evaluation")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

PIXELS_PER_MM = 808.0
CONF_THRESHOLD = 0.25


def normalize_stem(name: str) -> str:
    stem = Path(name).stem.lower()
    if stem.endswith("_png"):
        stem = stem[:-4]
    return stem


def find_image(filename: str) -> Path | None:
    target_key = normalize_stem(filename)
    for image_dir in IMAGE_DIRS:
        if not image_dir.exists():
            continue
        for image_path in image_dir.iterdir():
            if image_path.is_file() and normalize_stem(image_path.name) == target_key:
                return image_path
    return None


def euclidean_distance(p1, p2):
    return math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)


def px_to_mm(length_px: float, pixels_per_mm: float) -> float:
    return length_px / pixels_per_mm


def mae(y_true, y_pred):
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    return float(np.mean(np.abs(y_true - y_pred)))


def rmse(y_true, y_pred):
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def mape(y_true, y_pred):
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    mask = y_true != 0
    if mask.sum() == 0:
        return float("nan")
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def r2_score(y_true, y_pred):
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    if ss_tot == 0:
        return float("nan")
    return float(1 - ss_res / ss_tot)


def pearson_r(y_true, y_pred):
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    if len(y_true) < 2:
        return float("nan")
    return float(np.corrcoef(y_true, y_pred)[0, 1])


def plot_pred_vs_true(df: pd.DataFrame, output_path: Path):
    plt.figure(figsize=(7, 7))
    plt.scatter(df["ground_truth_mm"], df["predicted_mm"], alpha=0.8)
    min_val = min(df["ground_truth_mm"].min(), df["predicted_mm"].min())
    max_val = max(df["ground_truth_mm"].max(), df["predicted_mm"].max())
    plt.plot([min_val, max_val], [min_val, max_val], linestyle="--")
    plt.xlabel("Ground truth length (mm)")
    plt.ylabel("Predicted length (mm)")
    plt.title("Predicted vs Ground Truth Wing Length")
    plt.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close()


def plot_abs_error_hist(df: pd.DataFrame, output_path: Path):
    plt.figure(figsize=(8, 5))
    plt.hist(df["abs_error_mm"], bins=15)
    plt.xlabel("Absolute error (mm)")
    plt.ylabel("Count")
    plt.title("Absolute Error Distribution")
    plt.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close()


def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

    if not GROUND_TRUTH_CSV.exists():
        raise FileNotFoundError(f"Ground truth CSV not found: {GROUND_TRUTH_CSV}")

    gt = pd.read_csv(GROUND_TRUTH_CSV)
    gt.columns = gt.columns.map(lambda c: c.strip() if isinstance(c, str) else c)

    required_cols = {"Name of the Image", "wing vein [mm]"}
    if not required_cols.issubset(gt.columns):
        raise ValueError(f"CSV must contain columns: {required_cols}")

    gt = gt.rename(columns={
        "Name of the Image": "filename",
        "wing vein [mm]": "ground_truth_mm",
    })

    gt["filename"] = gt["filename"].astype(str).str.strip()
    gt["ground_truth_mm"] = pd.to_numeric(gt["ground_truth_mm"], errors="coerce")
    gt = gt.dropna(subset=["filename", "ground_truth_mm"]).copy()

    model = YOLO(str(MODEL_PATH))

    rows = []
    missing_images = []
    failed_predictions = []

    for _, row in gt.iterrows():
        filename = row["filename"]
        gt_mm = float(row["ground_truth_mm"])

        image_path = find_image(filename)
        if image_path is None:
            missing_images.append(filename)
            continue

        try:
            results = model.predict(
                source=str(image_path),
                conf=CONF_THRESHOLD,
                verbose=False
            )
            result = results[0]

            if result.keypoints is None or len(result.keypoints.data) == 0:
                failed_predictions.append(filename)
                continue

            keypoints = result.keypoints.data[0].cpu().numpy()

            if len(keypoints) < 2:
                failed_predictions.append(filename)
                continue

            p8 = (float(keypoints[0][0]), float(keypoints[0][1]))
            p13 = (float(keypoints[1][0]), float(keypoints[1][1]))

            p8_conf = float(keypoints[0][2]) if keypoints.shape[1] > 2 else np.nan
            p13_conf = float(keypoints[1][2]) if keypoints.shape[1] > 2 else np.nan

            length_px = euclidean_distance(p8, p13)
            predicted_mm = px_to_mm(length_px, PIXELS_PER_MM)

            rows.append({
                "filename": filename,
                "image_path": str(image_path),
                "ground_truth_mm": gt_mm,
                "predicted_mm": predicted_mm,
                "predicted_px": length_px,
                "abs_error_mm": abs(predicted_mm - gt_mm),
                "signed_error_mm": predicted_mm - gt_mm,
                "point_8_x": p8[0],
                "point_8_y": p8[1],
                "point_8_conf": p8_conf,
                "point_13_x": p13[0],
                "point_13_y": p13[1],
                "point_13_conf": p13_conf,
            })

        except Exception:
            failed_predictions.append(filename)

    if not rows:
        raise RuntimeError("No successful predictions were generated.")

    results_df = pd.DataFrame(rows)
    results_df = results_df.sort_values("abs_error_mm", ascending=False)
    results_df.to_csv(OUTPUT_DIR / "evaluation_results.csv", index=False)

    metrics = {
        "n_evaluated": int(len(results_df)),
        "n_missing_images": int(len(missing_images)),
        "n_failed_predictions": int(len(failed_predictions)),
        "mae_mm": mae(results_df["ground_truth_mm"], results_df["predicted_mm"]),
        "rmse_mm": rmse(results_df["ground_truth_mm"], results_df["predicted_mm"]),
        "mape_percent": mape(results_df["ground_truth_mm"], results_df["predicted_mm"]),
        "r2": r2_score(results_df["ground_truth_mm"], results_df["predicted_mm"]),
        "pearson_r": pearson_r(results_df["ground_truth_mm"], results_df["predicted_mm"]),
        "mean_point8_conf": float(results_df["point_8_conf"].mean()),
        "mean_point13_conf": float(results_df["point_13_conf"].mean()),
        "pixels_per_mm": PIXELS_PER_MM,
        "confidence_threshold": CONF_THRESHOLD,
    }

    pd.DataFrame([metrics]).to_csv(OUTPUT_DIR / "evaluation_metrics.csv", index=False)

    if missing_images:
        pd.DataFrame({"missing_image": missing_images}).to_csv(
            OUTPUT_DIR / "missing_images.csv", index=False
        )

    if failed_predictions:
        pd.DataFrame({"failed_prediction": failed_predictions}).to_csv(
            OUTPUT_DIR / "failed_predictions.csv", index=False
        )

    plot_pred_vs_true(results_df, OUTPUT_DIR / "pred_vs_true.png")
    plot_abs_error_hist(results_df, OUTPUT_DIR / "abs_error_hist.png")

    print("Evaluation complete.")
    print(f"Saved results to: {OUTPUT_DIR}")
    print(f"Evaluated: {len(results_df)}")
    print(f"Missing images: {len(missing_images)}")
    print(f"Failed predictions: {len(failed_predictions)}")


if __name__ == "__main__":
    main()