import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AnnouncementCategory(str, enum.Enum):
    donation = "donation"
    event = "event"
    opportunity = "opportunity"
    service = "service"


class AnnouncementStatus(str, enum.Enum):
    pending = "pending"
    published = "published"
    closed = "closed"
    rejected = "rejected"


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[AnnouncementCategory] = mapped_column(Enum(AnnouncementCategory), nullable=False, index=True)
    neighborhood: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    contact_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[AnnouncementStatus] = mapped_column(
        Enum(AnnouncementStatus), nullable=False, default=AnnouncementStatus.pending, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
