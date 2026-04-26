from math import sqrt
from typing import List, Optional, Tuple

from app.core.config import settings


def euclidean_distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    return sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)


def polyline_distance(points: List[Tuple[float, float]]) -> float:
    if len(points) < 2:
        raise ValueError("At least two points are required for a curved line.")
    total = 0.0
    for i in range(len(points) - 1):
        total += euclidean_distance(points[i], points[i + 1])
    return total


def pixels_to_mm(length_px: float, pixels_per_mm: Optional[float] = None) -> float:
    ppm = pixels_per_mm if pixels_per_mm is not None else settings.PIXELS_PER_MM
    return length_px / ppm


def compute_measurement(
    point_8: Tuple[float, float],
    point_13: Tuple[float, float],
    intermediate_points: Optional[List[Tuple[float, float]]] = None,
    pixels_per_mm: Optional[float] = None,
) -> dict:
    """Compute straight and/or curved measurement."""
    ppm = pixels_per_mm if pixels_per_mm is not None else settings.PIXELS_PER_MM

    # Always compute straight-line measurement
    straight_px = euclidean_distance(point_8, point_13)
    straight_mm = pixels_to_mm(straight_px, ppm)

    result = {
        "length_px": round(straight_px, 4),
        "length_mm": round(straight_mm, 6),
        "pixels_per_mm": ppm,
    }

    # If intermediate points are provided, compute curved measurement
    if intermediate_points:
        full_path = [point_8] + intermediate_points + [point_13]
        curved_px = polyline_distance(full_path)
        curved_mm = pixels_to_mm(curved_px, ppm)
        result["curved_length_px"] = round(curved_px, 4)
        result["curved_length_mm"] = round(curved_mm, 6)

    return result
