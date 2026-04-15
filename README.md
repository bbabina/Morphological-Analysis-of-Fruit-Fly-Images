# Fly Wing Measurement API

A system for automated Drosophila wing L3 vein measurement using a 2-keypoint model (points 8 and 13).

## What this system does

- Accepts wing image upload
- Runs keypoint inference for point 8 and point 13
- Computes straight-line L3 length in pixels and mm
- Saves overlay image and JSON result
- Supports human review by allowing corrected points
- Exports FAIR-style CSV/JSON metadata

## Install

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.api.main:app --reload
```

## Train model

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


<img width="1360" height="1024" alt="image" src="https://github.com/user-attachments/assets/cf2c8a3f-b83f-40f4-b7bc-3c9322fe4f3b" />

