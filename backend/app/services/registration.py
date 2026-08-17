from dataclasses import dataclass
from datetime import datetime, timezone

from fastapi import HTTPException, status
import httpx
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.pii import pii_fingerprint
from app.models.account_profile import AccountProfile
from app.repositories.account_profiles import AccountProfileRepository
from app.schemas.account import AccountOut, ProfileCompletionInput, RegistrationInput, RegistrationOut


IDENTITY_CONFLICT_MESSAGE = "Não foi possível vincular esses dados. Já pode existir uma conta com o e-mail, CPF ou telefone informado."


class SupabaseRegistrationError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class SupabaseSignupResult:
    user_id: str
    requires_email_confirmation: bool


class SupabaseAuthGateway:
    def _settings(self):
        settings = get_settings()
        if not settings.supabase_url or not settings.supabase_publishable_key or not settings.supabase_secret_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="O cadastro está temporariamente indisponível.",
            )
        return settings

    @staticmethod
    def _error_message(response: httpx.Response) -> str:
        try:
            data = response.json()
        except ValueError:
            return "Falha no serviço de autenticação."
        if isinstance(data, dict):
            for key in ("msg", "message", "error_description", "error"):
                value = data.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()
        return "Falha no serviço de autenticação."

    def sign_up(self, *, email: str, password: str, full_name: str, redirect_to: str) -> SupabaseSignupResult:
        settings = self._settings()
        try:
            response = httpx.post(
                f"{settings.supabase_url.rstrip('/')}/auth/v1/signup",
                params={"redirect_to": redirect_to},
                headers={
                    "apikey": settings.supabase_publishable_key,
                    "Authorization": f"Bearer {settings.supabase_publishable_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "email": email,
                    "password": password,
                    "data": {"name": full_name, "full_name": full_name},
                },
                timeout=10,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="O serviço de autenticação não respondeu. Tente novamente.",
            ) from exc
        if not response.is_success:
            raise SupabaseRegistrationError(self._error_message(response), response.status_code)

        data = response.json()
        user = data.get("user") if isinstance(data, dict) and isinstance(data.get("user"), dict) else data
        if not isinstance(user, dict):
            raise SupabaseRegistrationError("Resposta inválida do serviço de autenticação.", 502)
        if user.get("identities") == []:
            raise SupabaseRegistrationError("User already registered", 409)
        user_id = user.get("id")
        if not isinstance(user_id, str) or not user_id:
            raise SupabaseRegistrationError("Resposta inválida do serviço de autenticação.", 502)
        return SupabaseSignupResult(
            user_id=user_id,
            requires_email_confirmation=not bool(data.get("session")) if isinstance(data, dict) else True,
        )

    def delete_user(self, user_id: str) -> None:
        settings = self._settings()
        try:
            httpx.delete(
                f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users/{user_id}",
                headers={
                    "apikey": settings.supabase_secret_key,
                    "Authorization": f"Bearer {settings.supabase_secret_key}",
                },
                timeout=10,
            )
        except httpx.HTTPError:
            pass

    def update_name(self, user_id: str, full_name: str) -> None:
        settings = self._settings()
        try:
            response = httpx.put(
                f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users/{user_id}",
                headers={
                    "apikey": settings.supabase_secret_key,
                    "Authorization": f"Bearer {settings.supabase_secret_key}",
                    "Content-Type": "application/json",
                },
                json={"user_metadata": {"name": full_name, "full_name": full_name}},
                timeout=10,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Não foi possível atualizar o cadastro.") from exc
        if not response.is_success:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Não foi possível atualizar o cadastro.")


class RegistrationService:
    def __init__(self, repository: AccountProfileRepository | None = None, auth: SupabaseAuthGateway | None = None):
        self.repository = repository or AccountProfileRepository()
        self.auth = auth or SupabaseAuthGateway()

    @staticmethod
    def _fingerprints(cpf: str, phone: str) -> tuple[str, str]:
        secret = get_settings().pii_hmac_key
        return pii_fingerprint(cpf, secret, "cpf"), pii_fingerprint(phone, secret, "phone")

    def _profile(self, *, user_id: str, full_name: str, cpf: str, phone: str) -> AccountProfile:
        cpf_fingerprint, phone_fingerprint = self._fingerprints(cpf, phone)
        settings = get_settings()
        return AccountProfile(
            user_id=user_id,
            full_name=full_name,
            cpf_fingerprint=cpf_fingerprint,
            cpf_last4=cpf[-4:],
            phone_fingerprint=phone_fingerprint,
            phone_last4=phone[-4:],
            privacy_notice_version=settings.privacy_notice_version,
            privacy_acknowledged_at=datetime.now(timezone.utc),
        )

    def register(self, db: Session, payload: RegistrationInput, redirect_to: str) -> RegistrationOut:
        cpf_fingerprint, phone_fingerprint = self._fingerprints(payload.cpf, payload.phone)
        if self.repository.has_identity_conflict(db, cpf_fingerprint, phone_fingerprint):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=IDENTITY_CONFLICT_MESSAGE)
        try:
            signup = self.auth.sign_up(
                email=payload.email,
                password=payload.password,
                full_name=payload.full_name,
                redirect_to=redirect_to,
            )
        except SupabaseRegistrationError as exc:
            message = str(exc)
            if "already" in message.lower() or exc.status_code == 409:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=IDENTITY_CONFLICT_MESSAGE) from exc
            if "rate" in message.lower() or exc.status_code == 429:
                raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Muitas tentativas. Aguarde e tente novamente.") from exc
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não foi possível criar a conta com os dados informados.") from exc

        profile = self._profile(
            user_id=signup.user_id,
            full_name=payload.full_name,
            cpf=payload.cpf,
            phone=payload.phone,
        )
        try:
            self.repository.create(db, profile)
        except IntegrityError as exc:
            db.rollback()
            self.auth.delete_user(signup.user_id)
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=IDENTITY_CONFLICT_MESSAGE) from exc
        except Exception:
            db.rollback()
            self.auth.delete_user(signup.user_id)
            raise

        return RegistrationOut(
            requires_email_confirmation=signup.requires_email_confirmation,
            message=(
                "Conta criada. Enviamos um link de confirmação para o seu e-mail."
                if signup.requires_email_confirmation
                else "Conta criada. Você já pode entrar."
            ),
        )

    def complete(self, db: Session, user_id: str, payload: ProfileCompletionInput) -> AccountOut:
        existing = self.repository.get(db, user_id)
        if existing:
            return self.account(existing, None)
        cpf_fingerprint, phone_fingerprint = self._fingerprints(payload.cpf, payload.phone)
        if self.repository.has_identity_conflict(db, cpf_fingerprint, phone_fingerprint):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=IDENTITY_CONFLICT_MESSAGE)
        self.auth.update_name(user_id, payload.full_name)
        try:
            profile = self.repository.create(
                db,
                self._profile(
                    user_id=user_id,
                    full_name=payload.full_name,
                    cpf=payload.cpf,
                    phone=payload.phone,
                ),
            )
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=IDENTITY_CONFLICT_MESSAGE) from exc
        return self.account(profile, None)

    @staticmethod
    def account(profile: AccountProfile | None, email: str | None) -> AccountOut:
        if not profile:
            return AccountOut(registration_complete=False, email=email)
        return AccountOut(
            registration_complete=True,
            full_name=profile.full_name,
            email=email,
            cpf_last4=profile.cpf_last4,
            phone_last4=profile.phone_last4,
            privacy_acknowledged_at=profile.privacy_acknowledged_at,
        )
