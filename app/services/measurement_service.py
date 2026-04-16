from math import sqrt
from typing import List, Tuple, Optional
from app.core.config import settings


def euclidean_distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    return sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)


def polyline_distance(points: List[Tuple[float, float]]) -> float:
    
    if len(points) < 2:
        raise ValueError("At least two points are required for a curved line.")
    total = 0.0
    for i in range(len(points) - 1):
        total += euclidean_distance(points[i], points[i+1])
    return total


def pixels_to_mm(length_px: float, pixels_per_mm: Optional[float] = None) -> float:
    ppm = pixels_per_mm or settings.PIXELS_PER_MM
    return length_px / ppm


def compute_measurement(
    point_8: Tuple[float, float],
    point_13: Tuple[float, float],
    curved_path: Optional[List[Tuple[float, float]]] = None,
    pixels_per_mm: Optional[float] = None
):

    ppm = pixels_per_mm or settings.PIXELS_PER_MM

    straight_px = euclidean_distance(point_8, point_13)
    straight_mm = pixels_to_mm(straight_px, ppm)

    result = {
        "straight": {
            "length_px": round(straight_px, 4),
            "length_mm": round(straight_mm, 6),
            "pixels_per_mm": ppm,
        }
    }

    if curved_path is not None:
        if len(curved_path) < 2:
            raise ValueError("curved_path must contain at least two points")
        curved_px = polyline_distance(curved_path)
        curved_mm = pixels_to_mm(curved_px, ppm)
        result["curved"] = {
            "length_px": round(curved_px, 4),
            "length_mm": round(curved_mm, 6),
            "pixels_per_mm": ppm,
            "num_points": len(curved_path),
            "points": curved_path,
        }

    return result
