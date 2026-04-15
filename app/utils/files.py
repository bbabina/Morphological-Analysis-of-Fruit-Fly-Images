import uuid
from pathlib import Path
import aiofiles
from fastapi import HTTPException, UploadFile
from app.core.config import settings


async def save_upload_file(upload_file: UploadFile) -> tuple[str, Path]:
    suffix = Path(upload_file.filename).suffix.lower()
    if suffix not in settings.allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {suffix}")

    file_id = str(uuid.uuid4())
    safe_name = f"{file_id}{suffix}"
    out_path = settings.upload_dir / safe_name

    async with aiofiles.open(out_path, "wb") as f:
        while chunk := await upload_file.read(1024 * 1024):
            await f.write(chunk)

    await upload_file.close()
    return file_id, out_path
