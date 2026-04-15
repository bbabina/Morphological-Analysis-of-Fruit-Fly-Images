from pathlib import Path
import cv2
import numpy as np


def load_image(path: Path):
    img = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Could not load image: {path}")
    return img


def get_image_size(image) -> tuple[int, int]:
    h, w = image.shape[:2]
    return w, h


def draw_overlay(image, p8: tuple[float, float], p13: tuple[float, float], out_path: Path):
    canvas = image.copy()
    p8_i = (int(round(p8[0])), int(round(p8[1])))
    p13_i = (int(round(p13[0])), int(round(p13[1])))
    cv2.circle(canvas, p8_i, 8, (0, 255, 0), -1)
    cv2.circle(canvas, p13_i, 8, (0, 0, 255), -1)
    cv2.line(canvas, p8_i, p13_i, (255, 0, 0), 3)
    cv2.putText(canvas, "point_8", (p8_i[0] + 10, p8_i[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)
    cv2.putText(canvas, "point_13", (p13_i[0] + 10, p13_i[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2)
    cv2.imwrite(str(out_path), canvas)


def maybe_convert_bgr_to_rgb(image):
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
