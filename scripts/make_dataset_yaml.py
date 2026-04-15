from pathlib import Path


if __name__ == "__main__":
    out = Path("data/processed/wing_pose_dataset.yaml")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        """path: data/annotations\ntrain: images/train\nval: images/val\n\nkpt_shape: [2, 3]\nflip_idx: [0, 1]\n\nnames:\n  0: wing\n""",
        encoding="utf-8",
    )
    print(f"Wrote {out}")
