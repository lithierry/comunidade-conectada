from datetime import datetime

from sqlalchemy import DateTime, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AccountProfile(Base):
    __tablename__ = "account_profiles"

    user_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    cpf_fingerprint: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    cpf_last4: Mapped[str] = mapped_column(String(4), nullable=False)
    phone_fingerprint: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    phone_last4: Mapped[str] = mapped_column(String(4), nullable=False)
    privacy_notice_version: Mapped[str] = mapped_column(String(30), nullable=False)
    privacy_acknowledged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
