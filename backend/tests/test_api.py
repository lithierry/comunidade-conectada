from io import BytesIO

from jwt import encode
from PIL import Image

from app.core.config import get_settings


def valid_form(**overrides):
    data = {
        "title": "Doação de livros",
        "description": "Livros infantis em ótimo estado para retirada no bairro.",
        "category": "donation",
        "neighborhood": "Centro",
        "contact_name": "Pessoa responsável",
        "contact_phone": "(11) 99999-1234",
    }
    data.update(overrides)
    return data


def create_pending(client, **overrides):
    return client.post("/api/announcements", data=valid_form(**overrides), headers={"Origin": "http://localhost:3000"})


def test_health_and_public_visibility(client):
    assert client.get("/api/health").json() == {"status": "ok"}
    created = create_pending(client)
    assert created.status_code == 201
    item = created.json()
    assert item["status"] == "pending"
    assert client.get("/api/announcements").json() == []
    assert client.get(f"/api/announcements/{item['id']}").status_code == 404


def test_admin_moderation_flow_and_summary(client, admin_client):
    created = create_pending(client).json()
    item_id = created["id"]
    assert admin_client.get("/api/admin/announcements?status=pending").json()[0]["id"] == item_id
    assert admin_client.patch(f"/api/admin/announcements/{item_id}/approve", headers={"Origin": "http://localhost:3000"}).status_code == 200
    assert client.get(f"/api/announcements/{item_id}").status_code == 200
    assert admin_client.patch(f"/api/admin/announcements/{item_id}/close", headers={"Origin": "http://localhost:3000"}).json()["status"] == "closed"
    summary = admin_client.get("/api/admin/summary").json()
    assert summary == {"pending": 0, "published": 0, "closed": 1, "rejected": 0}
    assert client.get(f"/api/announcements/{item_id}").status_code == 404


def test_admin_is_protected_and_invalid_transition_fails(client, admin_client):
    item_id = create_pending(client).json()["id"]
    response = admin_client.patch(f"/api/admin/announcements/{item_id}/close", headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 409
    assert admin_client.patch(f"/api/admin/announcements/{item_id}/reject", headers={"Origin": "http://localhost:3000"}).status_code == 200
    assert admin_client.patch(f"/api/admin/announcements/{item_id}/approve", headers={"Origin": "http://localhost:3000"}).status_code == 409


def test_admin_endpoints_require_a_session(client):
    assert client.get("/api/admin/summary").status_code == 401


def test_supabase_bearer_session_is_accepted(client, monkeypatch):
    secret = "supabase-test-jwt-secret-with-32-plus-bytes"
    monkeypatch.setattr(get_settings(), "supabase_jwt_secret", secret)
    token = encode({"role": "authenticated", "aud": "authenticated", "sub": "user-1"}, secret, algorithm="HS256")
    response = client.get("/api/admin/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_admin_update_delete_and_filters(client, admin_client):
    item_id = create_pending(client, title="Serviço de costura", category="service").json()["id"]
    update = admin_client.put(
        f"/api/admin/announcements/{item_id}",
        json={"title": "Serviço de costura ajustado", "contact_phone": "11988887777"},
        headers={"Origin": "http://localhost:3000"},
    )
    assert update.status_code == 200
    assert update.json()["contact_phone"] == "11988887777"
    assert len(admin_client.get("/api/admin/announcements?category=service").json()) == 1
    assert len(admin_client.get("/api/admin/announcements?neighborhood=Centro").json()) == 1
    assert len(admin_client.get("/api/admin/announcements?neighborhood=Vila").json()) == 0
    assert admin_client.delete(f"/api/admin/announcements/{item_id}", headers={"Origin": "http://localhost:3000"}).status_code == 204
    assert admin_client.get(f"/api/admin/announcements/{item_id}").status_code == 404


def test_public_neighborhood_filter(client, admin_client):
    first = create_pending(client, neighborhood="Centro").json()["id"]
    second = create_pending(client, neighborhood="Vila Nova").json()["id"]
    for item_id in (first, second):
        assert admin_client.patch(f"/api/admin/announcements/{item_id}/approve", headers={"Origin": "http://localhost:3000"}).status_code == 200
    response = client.get("/api/announcements?neighborhood=cent")
    assert [item["id"] for item in response.json()] == [first]


def test_admin_update_rejects_null_required_fields(client, admin_client):
    item_id = create_pending(client).json()["id"]
    response = admin_client.put(
        f"/api/admin/announcements/{item_id}",
        json={"title": None},
        headers={"Origin": "http://localhost:3000"},
    )
    assert response.status_code == 422
    assert admin_client.get(f"/api/admin/announcements/{item_id}").json()["title"] == "Doação de livros"


def test_upload_is_normalized_to_webp(client, admin_client):
    image = Image.new("RGBA", (4, 4), color=(10, 20, 30, 128))
    raw = BytesIO()
    image.save(raw, format="PNG")
    response = client.post(
        "/api/announcements", data=valid_form(), files={"image": ("photo.png", raw.getvalue(), "image/png")},
        headers={"Origin": "http://localhost:3000"},
    )
    assert response.status_code == 201
    url = response.json()["image_url"]
    assert url and url.endswith(".webp")
    item_id = response.json()["id"]
    assert admin_client.patch(f"/api/admin/announcements/{item_id}/approve", headers={"Origin": "http://localhost:3000"}).status_code == 200
    served = client.get(url)
    assert served.status_code == 200
    assert served.headers["content-type"] == "image/webp"


def test_rejects_bad_origin_phone_and_file(client):
    assert create_pending(client, contact_phone="123").status_code == 422
    assert client.post("/api/announcements", data=valid_form(), headers={"Origin": "https://attacker.example"}).status_code == 403
    invalid = client.post(
        "/api/announcements", data=valid_form(), files={"image": ("bad.jpg", b"not-an-image", "image/jpeg")},
        headers={"Origin": "http://localhost:3000"},
    )
    assert invalid.status_code == 422


def test_optional_contact_session_and_multipart_admin_update(client, admin_client):
    created = create_pending(client, contact_name="", contact_phone="").json()
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
    updated = admin_client.put(
        f"/api/admin/announcements/{created['id']}",
        data=update_data,
        files={"image": ("nova.png", raw.getvalue(), "image/png")},
        headers={"Origin": "http://localhost:3000"},
    )
    assert updated.status_code == 200
    assert updated.json()["contact_name"] is None
    assert updated.json()["image_url"].endswith(".webp")

    removed = admin_client.put(
        f"/api/admin/announcements/{created['id']}",
        data={**update_data, "remove_image": "true"},
        headers={"Origin": "http://localhost:3000"},
    )
    assert removed.status_code == 200
    assert removed.json()["image_url"] is None


def test_rejects_image_dimensions_over_limit(client):
    image = Image.new("RGB", (4097, 1), color=(1, 2, 3))
    raw = BytesIO()
    image.save(raw, format="PNG")
    response = client.post(
        "/api/announcements",
        data=valid_form(),
        files={"image": ("wide.png", raw.getvalue(), "image/png")},
        headers={"Origin": "http://localhost:3000"},
    )
    assert response.status_code == 422


def test_decompression_bomb_is_reported_as_validation_error(client, monkeypatch):
    def raise_decompression_bomb(*_args, **_kwargs):
        raise Image.DecompressionBombError("test image is too large")

    monkeypatch.setattr("app.services.storage.Image.open", raise_decompression_bomb)
    response = client.post(
        "/api/announcements",
        data=valid_form(),
        files={"image": ("bomb.png", b"small-test-payload", "image/png")},
        headers={"Origin": "http://localhost:3000"},
    )
    assert response.status_code == 422
