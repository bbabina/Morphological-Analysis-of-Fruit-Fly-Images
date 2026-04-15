import csv
import json
from pathlib import Path


def export_json(data: dict, out_path: Path):
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def export_csv(data: dict, out_path: Path):
    flat = {
        "analysis_id": data["metadata"]["analysis_id"],
        "original_filename": data["metadata"]["original_filename"],
        "saved_filename": data["metadata"]["saved_filename"],
        "timestamp_utc": data["metadata"]["timestamp_utc"],
        "model_version": data["metadata"]["model_version"],
        "task": data["metadata"]["task"],
        "method": data["metadata"]["method"],
        "width": data["metadata"]["width"],
        "height": data["metadata"]["height"],
        "point_8_x": data["point_8"]["x"],
        "point_8_y": data["point_8"]["y"],
        "point_13_x": data["point_13"]["x"],
        "point_13_y": data["point_13"]["y"],
        "length_px": data["measurement"]["length_px"],
        "length_mm": data["measurement"]["length_mm"],
        "pixels_per_mm": data["measurement"]["pixels_per_mm"],
        "reviewer_status": data.get("reviewer_status", "pending"),
        "overlay_path": data["overlay_path"],
    }
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(flat.keys()))
        writer.writeheader()
        writer.writerow(flat)
