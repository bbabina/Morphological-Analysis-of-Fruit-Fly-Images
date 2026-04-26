import json
from pathlib import Path
from datetime import datetime, timezone

from app.core.config import settings
from app.services.measurement_service import compute_measurement


def save_review(
    analysis_id: str,
    point_8: tuple,
    point_13: tuple,
    intermediate_points: list = None,
    reviewer: str = "anonymous",
    decision: str = "adjusted",
    comment: str = None,
    pixels_per_mm: float = None,
):
    if intermediate_points is None:
        intermediate_points = []
    
    # Compute measurement (handles both straight and curved)
    measurement = compute_measurement(point_8, point_13, intermediate_points, pixels_per_mm)
    
    review = {
        "analysis_id": analysis_id,
        "reviewer": reviewer,
        "decision": decision,
        "comment": comment,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "point_8": {"x": point_8[0], "y": point_8[1]},
        "point_13": {"x": point_13[0], "y": point_13[1]},
        "intermediate_points": [{"x": p[0], "y": p[1]} for p in intermediate_points],
        "measurement": measurement,
    }
    
    out_path = settings.results_dir / f"{analysis_id}_review.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(review, f, indent=2)
    
    return review, out_path
