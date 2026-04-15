import pandas as pd
import cv2
import shutil
import os

df = pd.read_csv("landmark_distances.csv")

os.makedirs("yolo_keypoints_new/images/train", exist_ok=True)
os.makedirs("yolo_keypoints_new/labels/train", exist_ok=True)

for idx, row in df.iterrows():
    full_filename = row['filename']  
    clean_name = full_filename.rsplit('.', 1)[0] + '.png'  # Remove query params
    
    possible_paths = [
        f"data/wing_data_new/{full_filename}",
        f"data/wing_data_new/{clean_name}",
        f"data/wing_data_new/TE11_Zi85_18C_Wing_F_01241022_001_line.png"
    ]
    
    img_path = None
    for path in possible_paths:
        if os.path.exists(path):
            img_path = path
            break
    
    if img_path is None:
        print(f" MISSING: {full_filename}")
        continue
    
    print(f"FOUND: {img_path}")
    
    # Copy image
    shutil.copy(img_path, f"yolo_keypoints_new/images/train/{clean_name}")

    # Get dimensions
    img = cv2.imread(img_path)
    if img is None:
        print(f"Cannot read: {img_path}")
        continue
        
    h, w = img.shape[:2]
    
    # Normalize coordinates
    x1, y1 = row['start_x']/w, row['start_y']/h
    x2, y2 = row['end_x']/w, row['end_y']/h
    
    # Write label (ONE file per image)
    label_path = f"yolo_keypoints_new/labels/train/{clean_name.rsplit('.', 1)[0]}.txt"
    with open(label_path, 'w') as f:
        f.write(f"0 {x1:.6f} {y1:.6f} 1 {x2:.6f} {y2:.6f} 1\n")
    
    print(f"Created: {clean_name}")

