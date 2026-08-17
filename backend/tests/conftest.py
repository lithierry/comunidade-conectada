import os
import tempfile
from pathlib import Path

_runtime_dir = Path(tempfile.mkdtemp(prefix="comunidade-api-tests-"))
os.environ["DATABASE_URL"] = f"sqlite:///{(_runtime_dir / 'test.db').as_posix()}"
os.environ["SUPABASE_DATABASE_URL"] = ""
os.environ["SUPABASE_URL"] = ""
os.environ["SUPABASE_PUBLISHABLE_KEY"] = ""
os.environ["UPLOAD_DIR"] = str(_runtime_dir / "uploads")
os.environ["SECRET_KEY"] = "test-secret-key-with-enough-length"
# Hash for the test-only password "senha-de-teste"; no deployable secret is stored here.
os.environ["ADMIN_PASSWORD_HASH"] = "$argon2id$v=19$m=65536,t=3,p=4$rDDLVZeVud/lQlR7ZJ6Gkg$GjN56KBV87AQe6utEW4Qt9qnNHnxHMn8v1Gw/fL1Rus"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"
os.environ["SUPABASE_JWT_SECRET"] = "supabase-test-jwt-secret-with-32-plus-bytes"
os.environ["SUPABASE_SECRET_KEY"] = "supabase-test-secret-key"
os.environ["PII_HMAC_KEY"] = "test-pii-hmac-key-with-at-least-32-characters"
os.environ["PRIVACY_NOTICE_VERSION"] = "test-version"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture(autouse=True)
def clean_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def admin_client(client):
    response = client.post("/api/admin/login", json={"password": "senha-de-teste"}, headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 204
    return client
