from pathlib import Path

LABEL_DIRS = [
    Path("data/annotations/labels/train"),
    Path("data/annotations/labels/val"),
]

MARGIN = 0.05

def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))

for label_dir in LABEL_DIRS:
    if not label_dir.exists():
        continue

    for txt_path in label_dir.glob("*.txt"):
        lines_out = []

        with open(txt_path, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]

        for line in lines:
            parts = line.split()

            if len(parts) == 7:
                cls_id = parts[0]
                x1, y1, v1 = map(float, parts[1:4])
                x2, y2, v2 = map(float, parts[4:7])

                x_min = clamp(min(x1, x2) - MARGIN)
                y_min = clamp(min(y1, y2) - MARGIN)
                x_max = clamp(max(x1, x2) + MARGIN)
                y_max = clamp(max(y1, y2) + MARGIN)

                xc = (x_min + x_max) / 2
                yc = (y_min + y_max) / 2
                w = x_max - x_min
                h = y_max - y_min

                # convert visible points to 2
                v1 = 2 if v1 > 0 else 0
                v2 = 2 if v2 > 0 else 0

                new_line = f"{cls_id} {xc:.6f} {yc:.6f} {w:.6f} {h:.6f} {x1:.6f} {y1:.6f} {int(v1)} {x2:.6f} {y2:.6f} {int(v2)}"
                lines_out.append(new_line)

            elif len(parts) == 11:
                lines_out.append(line)

            else:
                print(f"Skipping unexpected format in {txt_path.name}: {line}")

        with open(txt_path, "w", encoding="utf-8") as f:
            for out_line in lines_out:
                f.write(out_line + "\n")

