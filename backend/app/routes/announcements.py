from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.security import require_admin, verify_origin
from app.database import get_db
from app.models.announcement import AnnouncementCategory, AnnouncementStatus
from app.schemas.announcement import AnnouncementOut, AnnouncementUpdate, AdminSummary
from app.services.announcements import AnnouncementService

router = APIRouter(prefix="/announcements", tags=["announcements"])
service = AnnouncementService()
Db = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[AnnouncementOut])
def list_announcements(
    db: Db,
    category: AnnouncementCategory | None = None,
    search: str | None = Query(default=None, max_length=100),
    neighborhood: str | None = Query(default=None, max_length=100),
):
    return service.list_public(db, category, search, neighborhood)


@router.get("/{announcement_id}", response_model=AnnouncementOut)
def get_announcement(announcement_id: int, db: Db):
    return service.get_public(db, announcement_id)


@router.post("", response_model=AnnouncementOut, status_code=status.HTTP_201_CREATED)
def create_announcement(
    request: Request, db: Db,
    title: Annotated[str, Form(min_length=3, max_length=120)],
    description: Annotated[str, Form(min_length=10, max_length=3000)],
    category: Annotated[AnnouncementCategory, Form()],
    neighborhood: Annotated[str, Form(min_length=2, max_length=100)],
    contact_name: Annotated[str | None, Form(max_length=100)] = None,
    contact_phone: Annotated[str | None, Form(max_length=20)] = None,
    image: Annotated[UploadFile | None, File()] = None,
):
    verify_origin(request)
    if any(not value.strip() for value in (title, description, neighborhood)):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Campos de texto não podem conter apenas espaços.")
    # Reuse the schema validation for optional phone normalization.
    try:
        normalized_phone = AnnouncementUpdate(contact_phone=contact_phone).contact_phone
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Informe um WhatsApp válido.") from exc
    return service.create_pending(
        db, title=title, description=description, category=category, neighborhood=neighborhood,
        contact_name=contact_name.strip() if contact_name and contact_name.strip() else None,
        contact_phone=normalized_phone, image=image,
    )


admin_router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@admin_router.get("/announcements", response_model=list[AnnouncementOut])
def list_admin_announcements(
    db: Db, status_filter: AnnouncementStatus | None = Query(default=None, alias="status"),
    category: AnnouncementCategory | None = None,
    search: str | None = Query(default=None, max_length=100),
    neighborhood: str | None = Query(default=None, max_length=100),
):
    return service.list_admin(db, status_filter, category, search, neighborhood)


@admin_router.get("/announcements/{announcement_id}", response_model=AnnouncementOut)
def get_admin_announcement(announcement_id: int, db: Db):
    return service.get_admin(db, announcement_id)


@admin_router.get("/summary", response_model=AdminSummary)
def admin_summary(db: Db):
    return service.repository.summary(db)


@admin_router.put("/announcements/{announcement_id}", response_model=AnnouncementOut)
async def update_announcement(announcement_id: int, request: Request, db: Db):
    verify_origin(request)
    content_type = request.headers.get("content-type", "")
    image: UploadFile | None = None
    remove_image = False
    if content_type.startswith(("multipart/form-data", "application/x-www-form-urlencoded")):
        form = await request.form()
        values = {
            key: form.get(key)
            for key in ("title", "description", "category", "neighborhood", "contact_name", "contact_phone")
        }
        payload_data = {key: value for key, value in values.items() if value is not None}
        if payload_data.get("contact_name") == "":
            payload_data["contact_name"] = None
        image_value = form.get("image")
        image = image_value if getattr(image_value, "filename", None) else None
        remove_image = str(form.get("remove_image", "false")).lower() in {"1", "true", "on", "yes"}
    else:
        payload_data = await request.json()
        remove_image = bool(payload_data.pop("remove_image", False))
    try:
        payload = AnnouncementUpdate.model_validate(payload_data)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(include_context=False),
        ) from exc
    return service.update(db, announcement_id, payload, image=image, remove_image=remove_image)


@admin_router.delete("/announcements/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_announcement(announcement_id: int, request: Request, db: Db):
    verify_origin(request)
    service.delete(db, announcement_id)


@admin_router.patch("/announcements/{announcement_id}/approve", response_model=AnnouncementOut)
def approve_announcement(announcement_id: int, request: Request, db: Db):
    verify_origin(request)
    return service.transition(db, announcement_id, AnnouncementStatus.published)


@admin_router.patch("/announcements/{announcement_id}/reject", response_model=AnnouncementOut)
def reject_announcement(announcement_id: int, request: Request, db: Db):
    verify_origin(request)
    return service.transition(db, announcement_id, AnnouncementStatus.rejected)


@admin_router.patch("/announcements/{announcement_id}/close", response_model=AnnouncementOut)
def close_announcement(announcement_id: int, request: Request, db: Db):
    verify_origin(request)
    return service.transition(db, announcement_id, AnnouncementStatus.closed)
