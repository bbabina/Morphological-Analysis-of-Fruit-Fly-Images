from pathlib import Path
from ultralytics import YOLO
from app.core.config import settings


class WingPosePredictor:
    def __init__(self, model_path: Path | None = None):
        path = model_path or settings.model_path
        self.model = YOLO(str(path))
        self.model_name = Path(path).name

    def predict(self, image_path: str):
        results = self.model.predict(source=image_path, conf=settings.CONFIDENCE_THRESHOLD, verbose=False)
        if not results:
            raise ValueError("No prediction result returned by model")

        result = results[0]
        if result.keypoints is None or result.keypoints.xy is None or len(result.keypoints.xy) == 0:
            raise ValueError("No keypoints detected")

        kpts = result.keypoints.data[0].tolist()
        if len(kpts) < 2:
            raise ValueError("Expected 2 keypoints, got fewer")

        point_8 = {"x": float(kpts[0][0]), "y": float(kpts[0][1]), "confidence": float(kpts[0][2]) if len(kpts[0]) > 2 else None}
        point_13 = {"x": float(kpts[1][0]), "y": float(kpts[1][1]), "confidence": float(kpts[1][2]) if len(kpts[1]) > 2 else None}
        return {
            "point_8": point_8,
            "point_13": point_13,
            "model_version": self.model_name,
        }
