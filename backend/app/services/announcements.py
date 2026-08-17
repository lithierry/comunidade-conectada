from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.announcement import Announcement, AnnouncementCategory, AnnouncementStatus
from app.repositories.announcements import AnnouncementRepository
from app.schemas.announcement import AnnouncementUpdate
from app.services.storage import ImageStorage


class AnnouncementService:
    def __init__(self, repository: AnnouncementRepository | None = None, storage: ImageStorage | None = None):
        self.repository = repository or AnnouncementRepository()
        self.storage = storage or ImageStorage()

    def list_public(self, db: Session, category: AnnouncementCategory | None, search: str | None, neighborhood: str | None = None) -> list[Announcement]:
        return self.repository.list(db, status=AnnouncementStatus.published, category=category, search=search, neighborhood=neighborhood)

    def get_public(self, db: Session, announcement_id: int) -> Announcement:
        item = self.repository.get(db, announcement_id)
        if not item or item.status != AnnouncementStatus.published:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicação não encontrada.")
        return item

    def list_admin(self, db: Session, status_filter: AnnouncementStatus | None, category: AnnouncementCategory | None, search: str | None, neighborhood: str | None = None) -> list[Announcement]:
        return self.repository.list(db, status=status_filter, category=category, search=search, neighborhood=neighborhood)

    def get_admin(self, db: Session, announcement_id: int) -> Announcement:
        item = self.repository.get(db, announcement_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicação não encontrada.")
        return item

    def create_published(
        self, db: Session, *, title: str, description: str, category: AnnouncementCategory, neighborhood: str,
        contact_name: str | None, contact_phone: str | None, image: UploadFile | None, owner_id: str, auth_token: str | None = None,
    ) -> Announcement:
        image_url = self.storage.save(image, auth_token, owner_id)
        announcement = Announcement(
            title=title.strip(), description=description.strip(), category=category, neighborhood=neighborhood.strip(),
            owner_id=owner_id, contact_name=contact_name, contact_phone=contact_phone, image_url=image_url,
            status=AnnouncementStatus.published,
        )
        try:
            return self.repository.create(db, announcement)
        except Exception:
            self.storage.delete(image_url, auth_token)
            raise

    def update(
        self,
        db: Session,
        announcement_id: int,
        payload: AnnouncementUpdate,
        *,
        image: UploadFile | None = None,
        remove_image: bool = False,
        owner_id: str | None = None,
        auth_token: str | None = None,
    ) -> Announcement:
        item = self.get_admin(db, announcement_id)
        if owner_id and item.owner_id != owner_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você só pode editar seus próprios anúncios.")
        if owner_id and item.status == AnnouncementStatus.closed:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Esta publicação foi encerrada pela equipe e não pode ser reativada por edição.",
            )
        old_image_url = item.image_url
        new_image_url = self.storage.save(image, auth_token, owner_id or item.owner_id) if image else None
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        if new_image_url:
            item.image_url = new_image_url
        elif remove_image:
            item.image_url = None
        if owner_id and item.status in {AnnouncementStatus.pending, AnnouncementStatus.rejected}:
            item.status = AnnouncementStatus.published
        try:
            saved = self.repository.save(db, item)
        except Exception:
            self.storage.delete(new_image_url, auth_token)
            raise
        if old_image_url and (new_image_url or remove_image):
            self.storage.delete(old_image_url, auth_token)
        return saved

    def transition(self, db: Session, announcement_id: int, new_status: AnnouncementStatus) -> Announcement:
        item = self.get_admin(db, announcement_id)
        if item.status != AnnouncementStatus.published or new_status != AnnouncementStatus.closed:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Essa transição de status não é permitida.")
        item.status = new_status
        return self.repository.save(db, item)

    def delete(self, db: Session, announcement_id: int, *, owner_id: str | None = None, auth_token: str | None = None) -> None:
        item = self.get_admin(db, announcement_id)
        if owner_id and item.owner_id != owner_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você só pode excluir seus próprios anúncios.")
        image_url = item.image_url
        self.repository.delete(db, item)
        self.storage.delete(image_url, auth_token)

    def list_owner(self, db: Session, owner_id: str) -> list[Announcement]:
        return self.repository.list_owned(db, owner_id)
