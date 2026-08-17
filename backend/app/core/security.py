from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock
from time import monotonic

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import HTTPException, Request, status
import httpx
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from jwt import InvalidTokenError, decode as decode_jwt

from app.core.config import get_settings

_hasher = PasswordHasher()
_attempts: dict[str, deque[float]] = defaultdict(deque)
_attempts_lock = Lock()
LOGIN_WINDOW_SECONDS = 15 * 60
LOGIN_MAX_ATTEMPTS = 5


@dataclass(frozen=True)
class AuthenticatedUser:
    id: str
    email: str | None
    token: str


def password_hasher() -> PasswordHasher:
    return _hasher


def verify_password(password: str) -> bool:
    configured_hash = get_settings().admin_password_hash
    if not configured_hash:
        return False
    try:
        return _hasher.verify(configured_hash, password)
    except (VerificationError, InvalidHashError):
        return False


SESSION_MAX_AGE_SECONDS = 8 * 60 * 60


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(get_settings().secret_key, salt="comunidade-admin-session")


def create_session() -> str:
    return _serializer().dumps({"role": "admin", "issued_at": datetime.now(timezone.utc).isoformat()})


def _bearer_token(request: Request) -> str | None:
    bearer = request.headers.get("authorization", "")
    return bearer[7:].strip() if bearer.lower().startswith("bearer ") else None


def authenticate_user(request: Request) -> AuthenticatedUser | None:
    token = _bearer_token(request)
    if not token:
        return None
    jwt_secret = get_settings().supabase_jwt_secret
    settings = get_settings()
    if jwt_secret:
        try:
            payload = decode_jwt(token, jwt_secret, algorithms=["HS256"], audience="authenticated")
            email = str(payload.get("email", "")).lower()
            user_id = str(payload.get("sub", ""))
            if payload.get("role") == "authenticated" and user_id:
                return AuthenticatedUser(id=user_id, email=email or None, token=token)
        except InvalidTokenError:
            pass
    if settings.supabase_url and settings.supabase_publishable_key:
        try:
            response = httpx.get(
                f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
                headers={"apikey": settings.supabase_publishable_key, "Authorization": f"Bearer {token}"},
                timeout=5,
            )
            if response.is_success:
                data = response.json()
                user_id = str(data.get("id", ""))
                if user_id:
                    return AuthenticatedUser(id=user_id, email=str(data.get("email", "")).lower() or None, token=token)
        except (httpx.HTTPError, ValueError):
            pass

    return None


def require_user(request: Request) -> AuthenticatedUser:
    user = authenticate_user(request)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Entre para continuar.")
    return user


def require_admin(request: Request) -> None:
    user = authenticate_user(request)
    settings = get_settings()
    if user and user.email and user.email in settings.admin_emails:
        return
    token = request.cookies.get("cc_admin")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Autenticação administrativa necessária.")
    try:
        payload = _serializer().loads(token, max_age=SESSION_MAX_AGE_SECONDS)
    except (BadSignature, SignatureExpired) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão inválida.") from exc
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão inválida.")


def check_login_rate_limit(client_id: str) -> None:
    now = monotonic()
    with _attempts_lock:
        attempts = _attempts[client_id]
        while attempts and now - attempts[0] >= LOGIN_WINDOW_SECONDS:
            attempts.popleft()
        if len(attempts) >= LOGIN_MAX_ATTEMPTS:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Muitas tentativas. Tente novamente mais tarde.")
        attempts.append(now)


def clear_login_attempts(client_id: str) -> None:
    with _attempts_lock:
        _attempts.pop(client_id, None)


def verify_origin(request: Request) -> None:
    """Reject cross-origin browser mutations. Non-browser requests have no Origin header."""
    origin = request.headers.get("origin")
    if origin and origin.rstrip("/") not in get_settings().origins:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Origem não permitida.")
