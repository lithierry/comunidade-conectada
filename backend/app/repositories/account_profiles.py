from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.account_profile import AccountProfile


class AccountProfileRepository:
    def get(self, db: Session, user_id: str) -> AccountProfile | None:
        return db.get(AccountProfile, user_id)

    def has_identity_conflict(self, db: Session, cpf_fingerprint: str, phone_fingerprint: str) -> bool:
        query = select(AccountProfile.user_id).where(
            or_(
                AccountProfile.cpf_fingerprint == cpf_fingerprint,
                AccountProfile.phone_fingerprint == phone_fingerprint,
            )
        )
        return db.scalar(query) is not None

    def create(self, db: Session, profile: AccountProfile) -> AccountProfile:
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile
