from getpass import getpass

from app.core.security import password_hasher


def main() -> None:
    password = getpass("Senha do administrador: ")
    confirmation = getpass("Confirme a senha: ")
    if not password or password != confirmation:
        raise SystemExit("As senhas não conferem.")
    print(password_hasher().hash(password))


if __name__ == "__main__":
    main()
