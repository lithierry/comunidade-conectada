import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.core.pii import normalize_cpf, normalize_phone


class RegistrationInput(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=6, max_length=128)
    cpf: str = Field(min_length=11, max_length=14)
    phone: str = Field(min_length=10, max_length=20)
    privacy_acknowledged: bool

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if len(normalized) < 2:
            raise ValueError("Informe seu nome completo.")
        return normalized

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("Informe um e-mail válido.")
        return normalized

    @field_validator("cpf")
    @classmethod
    def validate_cpf(cls, value: str) -> str:
        return normalize_cpf(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_phone(value)

    @field_validator("privacy_acknowledged")
    @classmethod
    def validate_privacy(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Confirme que você leu o aviso de privacidade.")
        return value


class ProfileCompletionInput(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    cpf: str = Field(min_length=11, max_length=14)
    phone: str = Field(min_length=10, max_length=20)
    privacy_acknowledged: bool

    _validate_name = field_validator("full_name")(RegistrationInput.validate_name.__func__)
    _validate_cpf = field_validator("cpf")(RegistrationInput.validate_cpf.__func__)
    _validate_phone = field_validator("phone")(RegistrationInput.validate_phone.__func__)
    _validate_privacy = field_validator("privacy_acknowledged")(RegistrationInput.validate_privacy.__func__)


class RegistrationOut(BaseModel):
    message: str


class AccountOut(BaseModel):
    registration_complete: bool
    full_name: str | None = None
    email: str | None = None
    cpf_last4: str | None = None
    phone_last4: str | None = None
    privacy_acknowledged_at: datetime | None = None
