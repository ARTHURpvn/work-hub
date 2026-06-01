from argon2 import PasswordHasher
from unittest.mock import patch

from app.services.auth_service import verify_password, verify_totp, totp_required


def make_hash(password: str) -> str:
    return PasswordHasher().hash(password)


def test_verify_password_correto():
    h = make_hash("minha_senha_forte")
    with patch("app.services.auth_service.settings") as mock:
        mock.admin_password_hash = h
        assert verify_password("minha_senha_forte") is True


def test_verify_password_incorreto():
    h = make_hash("correta")
    with patch("app.services.auth_service.settings") as mock:
        mock.admin_password_hash = h
        assert verify_password("errada") is False


def test_totp_nao_obrigatorio_sem_secret():
    with patch("app.services.auth_service.settings") as mock:
        mock.totp_secret = ""
        assert totp_required() is False


def test_totp_obrigatorio_com_secret():
    with patch("app.services.auth_service.settings") as mock:
        mock.totp_secret = "JBSWY3DPEHPK3PXP"
        assert totp_required() is True


def test_verify_totp_sem_secret_sempre_true():
    with patch("app.services.auth_service.settings") as mock:
        mock.totp_secret = ""
        assert verify_totp("000000") is True
