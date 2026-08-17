from datetime import datetime, timezone

from fastapi import HTTPException
from jwt import encode
import pytest

from app.core.config import get_settings
from app.core.pii import normalize_cpf, normalize_phone, pii_fingerprint
from app.database import SessionLocal
from app.models.account_profile import AccountProfile
from app.schemas.account import ProfileCompletionInput, RegistrationInput
from app.services.registration import (
    IDENTITY_CONFLICT_MESSAGE,
    RegistrationService,
    SupabaseSignupResult,
)


TEST_USER_ID = "44444444-4444-4444-8444-444444444444"
TEST_SECRET = "supabase-test-jwt-secret-with-32-plus-bytes"


class FakeAuthGateway:
    def __init__(self, user_id=TEST_USER_ID, requires_email_confirmation=False):
        self.user_id = user_id
        self.requires_email_confirmation = requires_email_confirmation
        self.sign_up_calls = []
        self.deleted_users = []
        self.updated_names = []

    def sign_up(self, **kwargs):
        self.sign_up_calls.append(kwargs)
        return SupabaseSignupResult(
            user_id=self.user_id,
            requires_email_confirmation=self.requires_email_confirmation,
        )

    def delete_user(self, user_id):
        self.deleted_users.append(user_id)

    def update_name(self, user_id, full_name):
        self.updated_names.append((user_id, full_name))


def registration_payload(**overrides):
    values = {
        "full_name": "Pessoa cadastrada",
        "email": "pessoa@example.com",
        "password": "senha-segura",
        "cpf": "529.982.247-25",
        "phone": "(11) 98765-4321",
        "privacy_acknowledged": True,
    }
    values.update(overrides)
    return RegistrationInput(**values)


def profile_headers(user_id=TEST_USER_ID, email="pessoa@example.com"):
    token = encode(
        {"role": "authenticated", "aud": "authenticated", "sub": user_id, "email": email},
        TEST_SECRET,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}", "Origin": "http://localhost:3000"}


def test_registration_service_creates_profile_without_raw_pii():
    gateway = FakeAuthGateway(requires_email_confirmation=True)
    service = RegistrationService(auth=gateway)

    with SessionLocal() as db:
        result = service.register(db, registration_payload(), "http://localhost:3000/login")
        profile = db.get(AccountProfile, TEST_USER_ID)

    assert result.requires_email_confirmation is True
    assert "link de confirmação" in result.message
    assert gateway.sign_up_calls[0]["full_name"] == "Pessoa cadastrada"
    assert profile is not None
    assert profile.cpf_last4 == "4725"
    assert profile.phone_last4 == "4321"
    assert profile.cpf_fingerprint == pii_fingerprint("52998224725", get_settings().pii_hmac_key, "cpf")
    assert profile.phone_fingerprint == pii_fingerprint("+5511987654321", get_settings().pii_hmac_key, "phone")
    assert "52998224725" not in profile.cpf_fingerprint
    assert "+5511987654321" not in profile.phone_fingerprint
    assert not hasattr(profile, "cpf")
    assert not hasattr(profile, "phone")


def test_registration_identity_conflict_is_generic_and_does_not_call_gateway_twice():
    gateway = FakeAuthGateway()
    service = RegistrationService(auth=gateway)

    with SessionLocal() as db:
        service.register(db, registration_payload(), "http://localhost:3000/login")
        with pytest.raises(HTTPException) as caught:
            service.register(
                db,
                registration_payload(email="outra@example.com", full_name="Outra pessoa"),
                "http://localhost:3000/login",
            )

    assert caught.value.status_code == 409
    assert caught.value.detail == IDENTITY_CONFLICT_MESSAGE
    assert "52998224725" not in caught.value.detail
    assert "98765" not in caught.value.detail
    assert len(gateway.sign_up_calls) == 1


def test_registration_service_completes_profile_and_updates_auth_name():
    user_id = "55555555-5555-4555-8555-555555555555"
    gateway = FakeAuthGateway(user_id=user_id)
    service = RegistrationService(auth=gateway)
    payload = ProfileCompletionInput(
        full_name="Perfil completado",
        cpf="935.411.347-80",
        phone="(21) 98765-4321",
        privacy_acknowledged=True,
    )

    with SessionLocal() as db:
        account = service.complete(db, user_id, payload)
        profile = db.get(AccountProfile, user_id)

    assert account.registration_complete is True
    assert account.full_name == "Perfil completado"
    assert account.cpf_last4 == "4780"
    assert account.phone_last4 == "4321"
    assert gateway.updated_names == [(user_id, "Perfil completado")]
    assert profile is not None
    assert profile.cpf_last4 == "4780"
    assert profile.phone_last4 == "4321"


def test_account_me_returns_profile_summary_without_raw_pii(client):
    user_id = "66666666-6666-4666-8666-666666666666"
    settings = get_settings()
    cpf = normalize_cpf("111.444.777-35")
    phone = normalize_phone("(31) 98765-4321")
    with SessionLocal() as db:
        db.add(
            AccountProfile(
                user_id=user_id,
                full_name="Morador da conta",
                cpf_fingerprint=pii_fingerprint(cpf, settings.pii_hmac_key, "cpf"),
                cpf_last4=cpf[-4:],
                phone_fingerprint=pii_fingerprint(phone, settings.pii_hmac_key, "phone"),
                phone_last4=phone[-4:],
                privacy_notice_version=settings.privacy_notice_version,
                privacy_acknowledged_at=datetime.now(timezone.utc),
            )
        )
        db.commit()

    response = client.get("/api/account/me", headers=profile_headers(user_id, "morador@example.com"))

    assert response.status_code == 200
    body = response.json()
    assert body == {
        "registration_complete": True,
        "full_name": "Morador da conta",
        "email": "morador@example.com",
        "cpf_last4": "7735",
        "phone_last4": "4321",
        "privacy_acknowledged_at": body["privacy_acknowledged_at"],
    }
    assert "11144477735" not in response.text
    assert "+5531987654321" not in response.text
