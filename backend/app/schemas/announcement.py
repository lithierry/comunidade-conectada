from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.announcement import AnnouncementCategory, AnnouncementStatus


class AnnouncementUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=120)
    description: str | None = Field(default=None, min_length=10, max_length=3000)
    category: AnnouncementCategory | None = None
    neighborhood: str | None = Field(default=None, min_length=2, max_length=100)
    contact_name: str | None = Field(default=None, min_length=2, max_length=100)
    contact_phone: str | None = Field(default=None, max_length=20)

    @model_validator(mode="after")
    def reject_null_required_fields(self):
        required_fields = ("title", "description", "category", "neighborhood")
        invalid = [field for field in required_fields if field in self.model_fields_set and getattr(self, field) is None]
        if invalid:
            raise ValueError("Campos obrigatórios não podem ser nulos.")
        return self

    @field_validator("title", "description", "neighborhood", "contact_name")
    @classmethod
    def strip_required_text(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Este campo não pode ficar vazio.")
        return value.strip() if value is not None else value

    @field_validator("contact_phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value is None or value == "":
            return None
        digits = "".join(char for char in value if char.isdigit())
        if not 10 <= len(digits) <= 15:
            raise ValueError("Informe um WhatsApp válido.")
        return digits


class AnnouncementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    category: AnnouncementCategory
    neighborhood: str
    contact_name: str | None
    contact_phone: str | None
    image_url: str | None
    status: AnnouncementStatus
    created_at: datetime
    updated_at: datetime


class AdminSummary(BaseModel):
    pending: int
    published: int
    closed: int
    rejected: int


class LoginInput(BaseModel):
    password: str = Field(min_length=1, max_length=256)
