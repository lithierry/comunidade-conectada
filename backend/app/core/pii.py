import hashlib
import hmac
import re


def digits_only(value: str) -> str:
    return re.sub(r"\D", "", value)


def normalize_cpf(value: str) -> str:
    cpf = digits_only(value)
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        raise ValueError("Informe um CPF válido.")

    for digit_index in (9, 10):
        factor = digit_index + 1
        total = sum(int(cpf[index]) * (factor - index) for index in range(digit_index))
        remainder = (total * 10) % 11
        expected = 0 if remainder == 10 else remainder
        if int(cpf[digit_index]) != expected:
            raise ValueError("Informe um CPF válido.")
    return cpf


def format_cpf(value: str) -> str:
    cpf = digits_only(value)[:11]
    if len(cpf) <= 3:
        return cpf
    if len(cpf) <= 6:
        return f"{cpf[:3]}.{cpf[3:]}"
    if len(cpf) <= 9:
        return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:]}"
    return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}"


def normalize_phone(value: str) -> str:
    phone = digits_only(value)
    if phone.startswith("55") and len(phone) in {12, 13}:
        phone = phone[2:]
    if len(phone) not in {10, 11}:
        raise ValueError("Informe um telefone brasileiro válido com DDD.")

    area_code = int(phone[:2])
    subscriber = phone[2:]
    if not 11 <= area_code <= 99:
        raise ValueError("Informe um telefone brasileiro válido com DDD.")
    if len(phone) == 11 and not subscriber.startswith("9"):
        raise ValueError("Informe um celular válido com DDD.")
    if len(phone) == 10 and subscriber[0] not in "2345":
        raise ValueError("Informe um telefone fixo válido com DDD.")
    return f"+55{phone}"


def format_phone(value: str) -> str:
    phone = digits_only(value)
    if phone.startswith("55") and len(phone) > 11:
        phone = phone[2:]
    phone = phone[:11]
    if len(phone) <= 2:
        return f"({phone}" if phone else ""
    area = phone[:2]
    subscriber = phone[2:]
    if len(subscriber) <= 4:
        return f"({area}) {subscriber}"
    split = 5 if len(phone) == 11 else 4
    return f"({area}) {subscriber[:split]}-{subscriber[split:]}".rstrip("-")


def pii_fingerprint(value: str, secret: str, namespace: str) -> str:
    payload = f"comunidade-conectada:{namespace}:{value}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
