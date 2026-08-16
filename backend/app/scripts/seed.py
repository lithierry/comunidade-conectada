from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models.announcement import Announcement, AnnouncementCategory, AnnouncementStatus

SEED_DATA = [
    ("Cadeiras para doação", "Duas cadeiras em bom estado disponíveis para retirada no bairro.", AnnouncementCategory.donation, "Centro", "Equipe do mural", "5511999990001"),
    ("Feira comunitária", "Encontro comunitário com troca de livros e alimentos.", AnnouncementCategory.event, "Vila Nova", "Equipe do mural", "5511999990002"),
    ("Vaga de auxiliar", "Pequeno comércio busca auxiliar para período parcial.", AnnouncementCategory.opportunity, "Jardim", "Equipe do mural", "5511999990003"),
]


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if db.scalar(select(Announcement.id).limit(1)):
            print("Banco já possui anúncios; seed ignorado.")
            return
        for title, description, category, neighborhood, name, phone in SEED_DATA:
            db.add(Announcement(title=title, description=description, category=category, neighborhood=neighborhood,
                                contact_name=name, contact_phone=phone, status=AnnouncementStatus.published))
        db.commit()
    print("3 anúncios iniciais incluídos.")


if __name__ == "__main__":
    main()
