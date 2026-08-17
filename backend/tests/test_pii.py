import pytest

from app.core.pii import normalize_cpf, normalize_phone, pii_fingerprint


def test_normalize_cpf_accepts_formatted_test_value_and_rejects_invalid_value():
    assert normalize_cpf("529.982.247-25") == "52998224725"
    with pytest.raises(ValueError, match="Informe um CPF válido"):
        normalize_cpf("529.982.247-24")


def test_normalize_phone_accepts_brazilian_test_numbers():
    assert normalize_phone("(11) 98765-4321") == "+5511987654321"
    assert normalize_phone("+55 21 2345-6789") == "+552123456789"
    with pytest.raises(ValueError, match="telefone brasileiro válido"):
        normalize_phone("(01) 98765-4321")


def test_pii_fingerprint_is_deterministic_scoped_and_one_way():
    value = "52998224725"
    secret = "test-pii-hmac-key-with-at-least-32-characters"
    fingerprint = pii_fingerprint(value, secret, "cpf")

    assert fingerprint == pii_fingerprint(value, secret, "cpf")
    assert len(fingerprint) == 64
    assert fingerprint != value
    assert fingerprint != pii_fingerprint(value, secret, "phone")
    assert fingerprint != pii_fingerprint(value, "another-test-secret", "cpf")
