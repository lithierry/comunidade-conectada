from collections.abc import Mapping, Sequence
from typing import Any


FIELD_LABELS = {
    "title": "O título",
    "description": "A descrição",
    "category": "A categoria",
    "neighborhood": "O bairro",
    "publication_consent": "A autorização de publicação",
    "contact_name": "O nome para contato",
    "contact_phone": "O WhatsApp",
    "image": "A imagem",
    "password": "A senha",
    "full_name": "O nome",
    "email": "O e-mail",
    "cpf": "O CPF",
    "phone": "O telefone",
    "privacy_acknowledged": "A ciência do aviso de privacidade",
    "search": "A busca",
    "announcement_id": "A publicação",
}


def _field_name(location: object) -> str | None:
    if not isinstance(location, (list, tuple)):
        return None
    ignored = {"body", "path", "query", "header", "cookie"}
    for part in reversed(location):
        if isinstance(part, str) and part not in ignored:
            return part
    return None


def _context_number(context: object, key: str) -> int | None:
    if not isinstance(context, Mapping):
        return None
    value = context.get(key)
    return value if isinstance(value, int) else None


def _message_for_error(error: Mapping[str, Any]) -> str:
    field = _field_name(error.get("loc"))
    label = FIELD_LABELS.get(field or "", "O campo informado")
    error_type = str(error.get("type") or "")
    context = error.get("ctx")

    if error_type == "missing":
        return f"{label} é um campo obrigatório."
    if error_type == "string_too_short":
        minimum = _context_number(context, "min_length")
        return f"{label} deve ter pelo menos {minimum} caracteres." if minimum else f"{label} está muito curto."
    if error_type == "string_too_long":
        maximum = _context_number(context, "max_length")
        return f"{label} deve ter no máximo {maximum} caracteres." if maximum else f"{label} está muito longo."
    if error_type in {"enum", "literal_error"}:
        return "Selecione uma categoria válida." if field == "category" else f"{label} não é válido."
    if error_type in {"bool_parsing", "bool_type"}:
        return "Confirme a autorização para publicar os dados informados." if field == "publication_consent" else f"{label} não é válido."
    if error_type in {"int_parsing", "int_type"} and field == "announcement_id":
        return "A publicação informada não é válida."
    if error_type == "value_error":
        raw_message = error.get("msg")
        if isinstance(raw_message, str):
            message = raw_message.removeprefix("Value error, ").strip()
            if message == "Este campo não pode ficar vazio.":
                return f"{label} não pode ficar vazio."
            if message.startswith(("Campos ", "Informe ", "Confirme ")):
                return message

    return f"Revise {label.lower()}." if field else "Revise os dados informados e tente novamente."


def validation_error_message(errors: Sequence[Mapping[str, Any]]) -> str:
    messages: list[str] = []
    for error in errors:
        message = _message_for_error(error)
        if message not in messages:
            messages.append(message)
    return " ".join(messages) or "Revise os dados informados e tente novamente."
