import torch
from ultralytics import YOLO

if __name__ == "__main__":
    if torch.backends.mps.is_available():
        device = "mps"
    else:
        device = "cpu"

    print(f"Using device: {device}")

    model = YOLO("yolov8n-pose.pt")
    model.train(
        data="data/processed/wing_pose_dataset.yaml",
        epochs=100,
        imgsz=1024,
        batch=4,
        device=device,
        project="runs",
        name="wing_pose",
        workers=0,
        cache=False,
    )