from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config import get_settings

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


class ImageStorage:
    def save(self, file: UploadFile | None) -> str | None:
        if file is None or not file.filename:
            return None
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Envie uma imagem JPEG, PNG ou WebP.")
        content = file.file.read(get_settings().max_upload_bytes + 1)
        if len(content) > get_settings().max_upload_bytes:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="A imagem deve ter no máximo 5 MB.")
        try:
            with Image.open(BytesIO(content)) as source:
                source.verify()
            with Image.open(BytesIO(content)) as source:
                if source.width > 4096 or source.height > 4096:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="A imagem deve ter no máximo 4096 por 4096 pixels.",
                    )
                image = source.convert("RGB")
                output = BytesIO()
                image.save(output, format="WEBP", quality=85, method=6)
        except HTTPException:
            raise
        except (Image.DecompressionBombError, UnidentifiedImageError, OSError, ValueError) as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="O arquivo de imagem é inválido.") from exc

        upload_dir = Path(get_settings().upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid4().hex}.webp"
        (upload_dir / filename).write_bytes(output.getvalue())
        return f"/uploads/{filename}"

    def delete(self, image_url: str | None) -> None:
        if image_url and image_url.startswith("/uploads/"):
            path = Path(get_settings().upload_dir) / Path(image_url).name
            path.unlink(missing_ok=True)
