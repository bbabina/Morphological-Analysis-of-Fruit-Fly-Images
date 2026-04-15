from ultralytics import YOLO

model = YOLO("models/best.pt")
metrics = model.val()
print(metrics)