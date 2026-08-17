from io import BytesIO
from pathlib import Path
from uuid import uuid4

import httpx
from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config import get_settings

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


class ImageStorage:
    def save(self, file: UploadFile | None, auth_token: str | None = None, owner_id: str | None = None) -> str | None:
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
        filename = f"{owner_id or 'admin'}/{uuid4().hex}.webp"
        settings = get_settings()
        if settings.supabase_url and settings.supabase_publishable_key:
            credential = auth_token or settings.supabase_secret_key or settings.supabase_publishable_key
            api_key = settings.supabase_publishable_key if auth_token else settings.supabase_secret_key or settings.supabase_publishable_key
            try:
                response = httpx.post(
                    f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{settings.supabase_storage_bucket}/{filename}",
                    content=output.getvalue(),
                    headers={
                        "apikey": api_key,
                        "Authorization": f"Bearer {credential}",
                        "Content-Type": "image/webp",
                        "x-upsert": "false",
                    },
                    timeout=15,
                )
            except httpx.HTTPError as exc:
                raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="O armazenamento de imagens está indisponível.") from exc
            if response.is_error:
                raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Não foi possível salvar a imagem no Supabase.")
            return f"{settings.supabase_url.rstrip('/')}/storage/v1/object/public/{settings.supabase_storage_bucket}/{filename}"

        local_path = upload_dir / filename
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(output.getvalue())
        return f"/uploads/{filename}"

    def delete(self, image_url: str | None, auth_token: str | None = None) -> None:
        settings = get_settings()
        if image_url and settings.supabase_url and settings.supabase_publishable_key and "/storage/v1/object/public/" in image_url:
            prefix = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/public/{settings.supabase_storage_bucket}/"
            if image_url.startswith(prefix):
                path = image_url[len(prefix):]
                credential = auth_token or settings.supabase_secret_key or settings.supabase_publishable_key
                api_key = settings.supabase_publishable_key if auth_token else settings.supabase_secret_key or settings.supabase_publishable_key
                try:
                    httpx.delete(
                        f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{settings.supabase_storage_bucket}/{path}",
                        headers={"apikey": api_key, "Authorization": f"Bearer {credential}"},
                        timeout=15,
                    )
                except httpx.HTTPError:
                    pass
                return
        if image_url and image_url.startswith("/uploads/"):
            upload_dir = Path(settings.upload_dir).resolve()
            path = (upload_dir / image_url.removeprefix("/uploads/")).resolve()
            if upload_dir in path.parents:
                path.unlink(missing_ok=True)
