from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import AuthenticatedUser
from app.models.account_profile import AccountProfile


def ensure_complete_profile(db: Session, user: AuthenticatedUser) -> AccountProfile:
    profile = db.get(AccountProfile, user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Complete seu cadastro com CPF e telefone para continuar.",
        )
    return profile
