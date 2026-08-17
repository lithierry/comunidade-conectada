from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.account_profile import AccountProfile


class AccountProfileRepository:
    def get(self, db: Session, user_id: str) -> AccountProfile | None:
        return db.get(AccountProfile, user_id)

    def identity_conflict(self, db: Session, cpf_fingerprint: str, phone_fingerprint: str) -> str | None:
        cpf_query = select(AccountProfile.user_id).where(AccountProfile.cpf_fingerprint == cpf_fingerprint)
        if db.scalar(cpf_query) is not None:
            return "cpf"
        phone_query = select(AccountProfile.user_id).where(AccountProfile.phone_fingerprint == phone_fingerprint)
        if db.scalar(phone_query) is not None:
            return "phone"
        return None

    def create(self, db: Session, profile: AccountProfile) -> AccountProfile:
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile
