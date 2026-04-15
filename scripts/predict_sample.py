from app.models.predictor import WingPosePredictor
from app.services.measurement_service import compute_measurement


if __name__ == "__main__":
    predictor = WingPosePredictor()
    image_path = "/Users/babina/Downloads/output/fly-wing-api/data/annotations/images/train/TE14_zi134_25_18C_F_wing_MK_1_250912_001_png.rf.GOWAO67GDAfffKuZ35eq.png"
    pred = predictor.predict(image_path)
    measurement = compute_measurement(
        (pred["point_8"]["x"], pred["point_8"]["y"]),
        (pred["point_13"]["x"], pred["point_13"]["y"]),
    )
    print({**pred, "measurement": measurement})
