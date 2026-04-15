from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Fly Wing Measurement API"
    APP_VERSION: str = "0.1.0"
    MODEL_PATH: str = "models/best.pt"
    UPLOAD_DIR: str = "storage/uploads"
    RESULTS_DIR: str = "storage/results"
    ALLOWED_EXTENSIONS: str = ".jpg,.jpeg,.png,.tif,.tiff"
    PIXELS_PER_MM: float = 808.0
    CONFIDENCE_THRESHOLD: float = 0.25

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_extensions(self) -> set[str]:
        return {x.strip().lower() for x in self.ALLOWED_EXTENSIONS.split(",") if x.strip()}

    @property
    def model_path(self) -> Path:
        return Path(self.MODEL_PATH)

    @property
    def upload_dir(self) -> Path:
        p = Path(self.UPLOAD_DIR)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def results_dir(self) -> Path:
        p = Path(self.RESULTS_DIR)
        p.mkdir(parents=True, exist_ok=True)
        return p


settings = Settings()
