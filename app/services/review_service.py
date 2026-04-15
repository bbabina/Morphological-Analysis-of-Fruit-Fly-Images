import json
from pathlib import Path
from datetime import datetime, timezone
from app.core.config import settings
from app.services.measurement_service import compute_measurement


def save_review(analysis_id: str, point_8: tuple[float, float], point_13: tuple[float, float], reviewer: str, decision: str, comment: str | None, pixels_per_mm: float):
    review = {
        "analysis_id": analysis_id,
        "reviewer": reviewer,
        "decision": decision,
        "comment": comment,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "point_8": {"x": point_8[0], "y": point_8[1]},
        "point_13": {"x": point_13[0], "y": point_13[1]},
        "measurement": compute_measurement(point_8, point_13, pixels_per_mm),
    }
    out_path = settings.results_dir / f"{analysis_id}_review.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(review, f, indent=2)
    return review, out_path
