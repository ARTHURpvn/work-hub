import pytest

from app.services import crypto_service


def test_encrypt_decrypt_roundtrip():
    plain = "minha-senha-secreta-123"
    token = crypto_service.encrypt(plain)
    assert token != plain
    assert crypto_service.decrypt(token) == plain


def test_encrypt_gera_tokens_diferentes_para_mesma_senha():
    # Fernet inclui timestamp/IV — tokens diferentes, mas decifram no mesmo valor.
    a = crypto_service.encrypt("igual")
    b = crypto_service.encrypt("igual")
    assert a != b
    assert crypto_service.decrypt(a) == crypto_service.decrypt(b) == "igual"


def test_decrypt_token_invalido_levanta_valueerror():
    with pytest.raises(ValueError):
        crypto_service.decrypt("isto-nao-e-um-token-fernet")
