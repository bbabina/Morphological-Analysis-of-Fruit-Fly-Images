from pathlib import Path

import cv2
import pandas as pd
from ultralytics import YOLO

EVAL_RESULTS = Path("output/evaluation/evaluation_results.csv")
MODEL_PATH = Path("models/best.pt")
OUT_DIR = Path("output/debug_overlays")
OUT_DIR.mkdir(parents=True, exist_ok=True)

TOP_N = 10
CONF_THRESHOLD = 0.25


def draw_overlay(image, p8, p13, pred_mm, gt_mm, abs_err, filename):
    img = image.copy()

    p8i = (int(round(p8[0])), int(round(p8[1])))
    p13i = (int(round(p13[0])), int(round(p13[1])))

    cv2.circle(img, p8i, 10, (0, 0, 255), -1)
    cv2.circle(img, p13i, 10, (255, 0, 0), -1)
    cv2.line(img, p8i, p13i, (0, 255, 255), 3)

    cv2.putText(
        img, "P8",
        (p8i[0] + 12, p8i[1] - 12),
        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2
    )
    cv2.putText(
        img, "P13",
        (p13i[0] + 12, p13i[1] - 12),
        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2
    )

    panel_height = 120
    overlay = img.copy()
    cv2.rectangle(overlay, (0, 0), (img.shape[1], panel_height), (0, 0, 0), -1)
    img = cv2.addWeighted(overlay, 0.45, img, 0.55, 0)

    lines = [
        f"{filename}",
        f"Predicted: {pred_mm:.4f} mm   Ground truth: {gt_mm:.4f} mm",
        f"Absolute error: {abs_err:.4f} mm",
    ]

    y = 35
    for line in lines:
        cv2.putText(
            img, line, (20, y),
            cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2
        )
        y += 32

    return img


def main():
    if not EVAL_RESULTS.exists():
        raise FileNotFoundError(f"Missing evaluation file: {EVAL_RESULTS}")

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Missing model file: {MODEL_PATH}")

    df = pd.read_csv(EVAL_RESULTS)

    required_cols = {
        "filename",
        "image_path",
        "ground_truth_mm",
        "predicted_mm",
        "abs_error_mm",
    }
    if not required_cols.issubset(df.columns):
        raise ValueError(f"evaluation_results.csv must contain columns: {required_cols}")

    worst_df = df.sort_values("abs_error_mm", ascending=False).head(TOP_N).copy()

    model = YOLO(str(MODEL_PATH))
    summary_rows = []

    for idx, row in worst_df.iterrows():
        image_path = Path(row["image_path"])
        if not image_path.exists():
            print(f"Skipping missing image: {image_path}")
            continue

        try:
            results = model.predict(
                source=str(image_path),
                conf=CONF_THRESHOLD,
                verbose=False
            )
            result = results[0]

            if result.keypoints is None or len(result.keypoints.data) == 0:
                print(f"No keypoints detected for: {image_path.name}")
                continue

            keypoints = result.keypoints.data[0].cpu().numpy()

            if len(keypoints) < 2:
                print(f"Less than 2 keypoints for: {image_path.name}")
                continue

            p8 = (float(keypoints[0][0]), float(keypoints[0][1]))
            p13 = (float(keypoints[1][0]), float(keypoints[1][1]))

            image = cv2.imread(str(image_path))
            if image is None:
                print(f"Could not read image: {image_path}")
                continue

            vis = draw_overlay(
                image=image,
                p8=p8,
                p13=p13,
                pred_mm=float(row["predicted_mm"]),
                gt_mm=float(row["ground_truth_mm"]),
                abs_err=float(row["abs_error_mm"]),
                filename=str(row["filename"]),
            )

            out_name = f"worst_{len(summary_rows)+1:02d}_{image_path.stem}.jpg"
            out_path = OUT_DIR / out_name
            cv2.imwrite(str(out_path), vis)

            summary_rows.append({
                "rank": len(summary_rows) + 1,
                "filename": row["filename"],
                "image_path": str(image_path),
                "predicted_mm": float(row["predicted_mm"]),
                "ground_truth_mm": float(row["ground_truth_mm"]),
                "abs_error_mm": float(row["abs_error_mm"]),
                "point_8_x": p8[0],
                "point_8_y": p8[1],
                "point_13_x": p13[0],
                "point_13_y": p13[1],
                "overlay_path": str(out_path),
            })

        except Exception as e:
            print(f"Failed on {image_path.name}: {e}")

    if not summary_rows:
        raise RuntimeError("No overlays were created.")

    summary_df = pd.DataFrame(summary_rows)
    summary_df.to_csv(OUT_DIR / "worst_predictions_summary.csv", index=False)

    print(f"Saved overlays and summary to: {OUT_DIR}")


if __name__ == "__main__":
    main()