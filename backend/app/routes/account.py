from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import AuthenticatedUser, check_login_rate_limit, require_user, verify_origin
from app.database import get_db
from app.repositories.account_profiles import AccountProfileRepository
from app.schemas.account import AccountOut, ProfileCompletionInput, RegistrationInput, RegistrationOut
from app.services.registration import RegistrationService

router = APIRouter(tags=["account"])
service = RegistrationService()
repository = AccountProfileRepository()
Db = Annotated[Session, Depends(get_db)]


def _client_id(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post("/auth/register", response_model=RegistrationOut, status_code=status.HTTP_201_CREATED)
def register_account(payload: RegistrationInput, request: Request, db: Db):
    verify_origin(request)
    check_login_rate_limit(f"registration:{_client_id(request)}")
    settings = get_settings()
    origin = (request.headers.get("origin") or settings.origins[0]).rstrip("/")
    return service.register(db, payload, redirect_to=f"{origin}/login")


@router.get("/account/me", response_model=AccountOut)
def get_my_account(db: Db, user: Annotated[AuthenticatedUser, Depends(require_user)]):
    return service.account(repository.get(db, user.id), user.email)


@router.post("/account/complete", response_model=AccountOut)
def complete_my_account(
    payload: ProfileCompletionInput,
    request: Request,
    db: Db,
    user: Annotated[AuthenticatedUser, Depends(require_user)],
):
    verify_origin(request)
    return service.complete(db, user.id, payload)
