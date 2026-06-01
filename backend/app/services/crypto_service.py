"""Cifragem simétrica de segredos em repouso (Fernet/AES-128)."""
from cryptography.fernet import Fernet, InvalidToken

from app.config import settings

_fernet = Fernet(settings.encryption_key.encode())


def encrypt(plain: str) -> str:
    """Cifra um texto e devolve o token Fernet (base64)."""
    return _fernet.encrypt(plain.encode()).decode()


def decrypt(token: str) -> str:
    """Decifra um token Fernet. Levanta ValueError se o token for inválido."""
    try:
        return _fernet.decrypt(token.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("Token cifrado inválido ou ENCRYPTION_KEY incorreta") from exc
