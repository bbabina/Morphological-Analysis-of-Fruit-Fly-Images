from math import sqrt
from app.core.config import settings


def euclidean_distance(p1: tuple[float, float], p2: tuple[float, float]) -> float:
    return sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)


def pixels_to_mm(length_px: float, pixels_per_mm: float | None = None) -> float:
    ppm = pixels_per_mm or settings.PIXELS_PER_MM
    return length_px / ppm


def compute_measurement(point_8: tuple[float, float], point_13: tuple[float, float], pixels_per_mm: float | None = None):
    ppm = pixels_per_mm or settings.PIXELS_PER_MM
    length_px = euclidean_distance(point_8, point_13)
    length_mm = pixels_to_mm(length_px, ppm)
    return {
        "length_px": round(length_px, 4),
        "length_mm": round(length_mm, 6),
        "pixels_per_mm": ppm,
    }
