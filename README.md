# Fly Wing Measurement API

A system for automated Drosophila wing L3 vein measurement using a 2-keypoint model (points 8 and 13).

## What this system does

- Accepts wing image upload
- Runs keypoint inference for point 8 and point 13
- Computes straight-line L3 length in pixels and mm
- Saves overlay image and JSON result
- Supports human review by allowing corrected points
- Exports FAIR-style CSV/JSON metadata

## Inference
#### For Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

##### Run

```bash
uvicorn app.api.main:app --reload
```
#### For UI

```bash
cd fly-ai-UI
```

##### Run

```bash
npm run dev
```

## Model Training

1. Annotate each wing image with exactly 2 keypoints: point_8 and point_13.
2. Put YOLO pose labels in `data/annotations/labels/...` and images in `data/raw/images/...`.
3. Create dataset yaml:

```bash
python scripts/make_dataset_yaml.py
```

4. Train:

```bash
python scripts/train_pose.py
```

<img width="1396" height="1366" alt="image" src="https://github.com/user-attachments/assets/9d2293a6-d13d-4a1c-978f-d527a6db61c7" />


