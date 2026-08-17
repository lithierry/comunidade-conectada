from datetime import datetime, timezone
from io import BytesIO

from jwt import encode
from PIL import Image

from app.core.config import get_settings
from app.core.pii import normalize_cpf, normalize_phone, pii_fingerprint
from app.database import SessionLocal
from app.models.account_profile import AccountProfile

TEST_JWT_SECRET = "supabase-test-jwt-secret-with-32-plus-bytes"
OWNER_ID = "11111111-1111-4111-8111-111111111111"
OTHER_OWNER_ID = "22222222-2222-4222-8222-222222222222"


def create_account_profile(
    user_id=OWNER_ID,
    full_name="Pessoa de teste",
    cpf="529.982.247-25",
    phone="(11) 98765-4321",
):
    settings = get_settings()
    normalized_cpf = normalize_cpf(cpf)
    normalized_phone = normalize_phone(phone)
    with SessionLocal() as db:
        if db.get(AccountProfile, user_id):
            return
        db.add(
            AccountProfile(
                user_id=user_id,
                full_name=full_name,
                cpf_fingerprint=pii_fingerprint(normalized_cpf, settings.pii_hmac_key, "cpf"),
                cpf_last4=normalized_cpf[-4:],
                phone_fingerprint=pii_fingerprint(normalized_phone, settings.pii_hmac_key, "phone"),
                phone_last4=normalized_phone[-4:],
                privacy_notice_version=settings.privacy_notice_version,
                privacy_acknowledged_at=datetime.now(timezone.utc),
            )
        )
        db.commit()


def user_headers(user_id=OWNER_ID, email="morador@example.com", origin="http://localhost:3000"):
    token = encode(
        {"role": "authenticated", "aud": "authenticated", "sub": user_id, "email": email},
        TEST_JWT_SECRET,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}", "Origin": origin}


def valid_form(**overrides):
    data = {
        "title": "Doação de livros",
        "description": "Livros infantis em ótimo estado para retirada no bairro.",
        "category": "donation",
        "neighborhood": "Centro",
        "publication_consent": "true",
        "contact_name": "Pessoa responsável",
        "contact_phone": "(11) 99999-1234",
    }
    data.update(overrides)
    return data


def create_published(client, **overrides):
    create_account_profile()
    return client.post("/api/announcements", data=valid_form(**overrides), headers=user_headers())


def test_health_and_public_visibility(client):
    assert client.get("/api/health").json() == {"status": "ok"}
    created = create_published(client)
    assert created.status_code == 201
    item = created.json()
    assert item["status"] == "published"
    assert [public["id"] for public in client.get("/api/announcements").json()] == [item["id"]]
    assert client.get(f"/api/announcements/{item['id']}").status_code == 200
    assert "owner_id" not in item


def test_admin_moderation_flow_and_summary(client, admin_client):
    created = create_published(client).json()
    item_id = created["id"]
    assert admin_client.get("/api/admin/announcements?status=published").json()[0]["id"] == item_id
    assert admin_client.patch(f"/api/admin/announcements/{item_id}/close", headers={"Origin": "http://localhost:3000"}).json()["status"] == "closed"
    summary = admin_client.get("/api/admin/summary").json()
    assert summary == {"pending": 0, "published": 0, "closed": 1, "rejected": 0}
    assert client.get(f"/api/announcements/{item_id}").status_code == 404


def test_admin_can_close_but_cannot_edit_or_moderate(client, admin_client):
    item_id = create_published(client).json()["id"]
    assert admin_client.put(
        f"/api/admin/announcements/{item_id}",
        json={"title": "Edição administrativa não permitida"},
        headers={"Origin": "http://localhost:3000"},
    ).status_code == 405
    assert admin_client.patch(f"/api/admin/announcements/{item_id}/approve", headers={"Origin": "http://localhost:3000"}).status_code == 404
    assert admin_client.patch(f"/api/admin/announcements/{item_id}/reject", headers={"Origin": "http://localhost:3000"}).status_code == 404
    assert admin_client.patch(f"/api/admin/announcements/{item_id}/close", headers={"Origin": "http://localhost:3000"}).status_code == 200


def test_admin_endpoints_require_a_session(client):
    assert client.get("/api/admin/summary").status_code == 401


def test_only_configured_supabase_admin_is_accepted(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "supabase_admin_emails", "admin@example.com")
    response = client.get("/api/admin/summary", headers=user_headers(email="admin@example.com"))
    assert response.status_code == 200
    assert client.get("/api/admin/summary", headers=user_headers(email="morador@example.com")).status_code == 401


def test_admin_delete_and_filters(client, admin_client):
    item_id = create_published(client, title="Serviço de costura", category="service").json()["id"]
    assert len(admin_client.get("/api/admin/announcements?category=service").json()) == 1
    assert len(admin_client.get("/api/admin/announcements?neighborhood=Centro").json()) == 1
    assert len(admin_client.get("/api/admin/announcements?neighborhood=Vila").json()) == 0
    assert admin_client.delete(f"/api/admin/announcements/{item_id}", headers={"Origin": "http://localhost:3000"}).status_code == 204
    assert admin_client.get(f"/api/admin/announcements/{item_id}").status_code == 404


def test_public_neighborhood_filter(client, admin_client):
    first = create_published(client, neighborhood="Centro").json()["id"]
    second = create_published(client, neighborhood="Vila Nova").json()["id"]
    response = client.get("/api/announcements?neighborhood=cent")
    assert [item["id"] for item in response.json()] == [first]


def test_owner_update_rejects_null_required_fields(client):
    item_id = create_published(client).json()["id"]
    response = client.put(
        f"/api/announcements/{item_id}",
        json={"title": None},
        headers=user_headers(),
    )
    assert response.status_code == 422
    assert client.get(f"/api/announcements/mine/{item_id}", headers=user_headers()).json()["title"] == "Doação de livros"


def test_upload_is_normalized_to_webp(client, admin_client):
    create_account_profile()
    image = Image.new("RGBA", (4, 4), color=(10, 20, 30, 128))
    raw = BytesIO()
    image.save(raw, format="PNG")
    response = client.post(
        "/api/announcements", data=valid_form(), files={"image": ("photo.png", raw.getvalue(), "image/png")},
        headers=user_headers(),
    )
    assert response.status_code == 201
    url = response.json()["image_url"]
    assert url and url.endswith(".webp")
    item_id = response.json()["id"]
    served = client.get(url)
    assert served.status_code == 200
    assert served.headers["content-type"] == "image/webp"


def test_rejects_bad_origin_phone_and_file(client):
    short_description = create_published(client, description="Curta")
    assert short_description.status_code == 422
    assert short_description.json() == {"detail": "A descrição deve ter pelo menos 10 caracteres."}
    without_consent = valid_form()
    without_consent.pop("publication_consent")
    missing_consent = client.post("/api/announcements", data=without_consent, headers=user_headers())
    assert missing_consent.status_code == 422
    assert missing_consent.json() == {"detail": "A autorização de publicação é um campo obrigatório."}
    assert create_published(client, contact_phone="123").status_code == 422
    assert client.post("/api/announcements", data=valid_form(), headers=user_headers(origin="https://attacker.example")).status_code == 403
    invalid = client.post(
        "/api/announcements", data=valid_form(), files={"image": ("bad.jpg", b"not-an-image", "image/jpeg")},
        headers=user_headers(),
    )
    assert invalid.status_code == 422


def test_optional_contact_session_and_multipart_owner_update(client, admin_client):
    created = create_published(client, contact_name="", contact_phone="").json()
    assert created["contact_name"] is None
    assert created["contact_phone"] is None
    assert admin_client.get("/api/admin/session").json() == {"authenticated": True}

    image = Image.new("RGB", (8, 8), color=(20, 80, 160))
    raw = BytesIO()
    image.save(raw, format="PNG")
    update_data = {
        "title": "Doação de livros revisada",
        "description": "Livros infantis revisados e disponíveis para retirada.",
        "category": "donation",
        "neighborhood": "Centro",
        "contact_name": "",
        "contact_phone": "",
    }
    updated = client.put(
        f"/api/announcements/{created['id']}",
        data=update_data,
        files={"image": ("nova.png", raw.getvalue(), "image/png")},
        headers=user_headers(),
    )
    assert updated.status_code == 200
    assert updated.json()["contact_name"] is None
    assert updated.json()["image_url"].endswith(".webp")

    removed = client.put(
        f"/api/announcements/{created['id']}",
        data={**update_data, "remove_image": "true"},
        headers=user_headers(),
    )
    assert removed.status_code == 200
    assert removed.json()["image_url"] is None


def test_rejects_image_dimensions_over_limit(client):
    create_account_profile()
    image = Image.new("RGB", (4097, 1), color=(1, 2, 3))
    raw = BytesIO()
    image.save(raw, format="PNG")
    response = client.post(
        "/api/announcements",
        data=valid_form(),
        files={"image": ("wide.png", raw.getvalue(), "image/png")},
        headers=user_headers(),
    )
    assert response.status_code == 422


def test_decompression_bomb_is_reported_as_validation_error(client, monkeypatch):
    create_account_profile()
    def raise_decompression_bomb(*_args, **_kwargs):
        raise Image.DecompressionBombError("test image is too large")

    monkeypatch.setattr("app.services.storage.Image.open", raise_decompression_bomb)
    response = client.post(
        "/api/announcements",
        data=valid_form(),
        files={"image": ("bomb.png", b"small-test-payload", "image/png")},
        headers=user_headers(),
    )
    assert response.status_code == 422


def test_owner_can_manage_only_own_announcements(client):
    created = create_published(client).json()
    item_id = created["id"]
    create_account_profile(user_id=OTHER_OWNER_ID, full_name="Outra pessoa", cpf="111.444.777-35", phone="(21) 98765-4321")
    other_user = user_headers(user_id=OTHER_OWNER_ID, email="outra@example.com")

    assert client.get(f"/api/announcements/mine/{item_id}", headers=user_headers()).status_code == 200
    assert client.get(f"/api/announcements/mine/{item_id}", headers=other_user).status_code == 403
    assert client.put(f"/api/announcements/{item_id}", json={"title": "Tentativa indevida"}, headers=other_user).status_code == 403
    assert client.delete(f"/api/announcements/{item_id}", headers=other_user).status_code == 403

    updated = client.put(f"/api/announcements/{item_id}", json={"title": "Doação atualizada"}, headers=user_headers())
    assert updated.status_code == 200
    assert updated.json()["title"] == "Doação atualizada"
    assert client.delete(f"/api/announcements/{item_id}", headers=user_headers()).status_code == 204


def test_owner_edit_preserves_published_status(client):
    item_id = create_published(client).json()["id"]
    updated = client.put(
        f"/api/announcements/{item_id}",
        json={"description": "Descrição corrigida para uma nova análise da equipe."},
        headers=user_headers(),
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "published"


def test_resident_without_account_profile_cannot_mutate(client):
    unregistered_id = "33333333-3333-4333-8333-333333333333"
    headers = user_headers(user_id=unregistered_id, email="sem-perfil@example.com")
    response = client.post("/api/announcements", data=valid_form(), headers=headers)
    assert response.status_code == 403
    assert response.json() == {"detail": "Complete seu cadastro com CPF e telefone para continuar."}
