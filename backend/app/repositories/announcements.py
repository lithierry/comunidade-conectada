from __future__ import annotations

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.announcement import Announcement, AnnouncementCategory, AnnouncementStatus


class AnnouncementRepository:
    def list(
        self,
        db: Session,
        *,
        status: AnnouncementStatus | None = None,
        category: AnnouncementCategory | None = None,
        search: str | None = None,
        neighborhood: str | None = None,
    ) -> list[Announcement]:
        query: Select = select(Announcement).order_by(Announcement.created_at.desc(), Announcement.id.desc())
        if status is not None:
            query = query.where(Announcement.status == status)
        if category is not None:
            query = query.where(Announcement.category == category)
        if search:
            escaped = search.strip().replace("%", r"\%").replace("_", r"\_")
            pattern = f"%{escaped}%"
            query = query.where((Announcement.title.ilike(pattern)) | (Announcement.description.ilike(pattern)))
        if neighborhood:
            neighborhood_pattern = f"%{neighborhood.strip()}%"
            query = query.where(Announcement.neighborhood.ilike(neighborhood_pattern))
        return list(db.scalars(query).all())

    def get(self, db: Session, announcement_id: int) -> Announcement | None:
        return db.get(Announcement, announcement_id)

    def list_owned(self, db: Session, owner_id: str) -> list[Announcement]:
        query = select(Announcement).where(Announcement.owner_id == owner_id).order_by(Announcement.created_at.desc(), Announcement.id.desc())
        return list(db.scalars(query).all())

    def create(self, db: Session, announcement: Announcement) -> Announcement:
        db.add(announcement)
        db.commit()
        db.refresh(announcement)
        return announcement

    def save(self, db: Session, announcement: Announcement) -> Announcement:
        db.add(announcement)
        db.commit()
        db.refresh(announcement)
        return announcement

    def delete(self, db: Session, announcement: Announcement) -> None:
        db.delete(announcement)
        db.commit()

    def summary(self, db: Session) -> dict[str, int]:
        rows = db.execute(select(Announcement.status, func.count(Announcement.id)).group_by(Announcement.status)).all()
        counts = {status.value: 0 for status in AnnouncementStatus}
        counts.update({status.value: total for status, total in rows})
        return counts
